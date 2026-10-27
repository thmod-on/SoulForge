import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character, Definition } from "../domain/types";
import type { CardMarkerOverride } from "../storage/compendiumRepository";
import {
  listQueuedSyncChanges,
  listSyncConflicts,
  loadSyncIdentity,
  loadSyncCursor,
  saveSyncConflicts,
  saveSyncCursor,
  setRemoteMetadata
} from "../storage/syncRepository";
import type { SyncCoordinatorDependencies } from "./syncCoordinator";
import type { CloudSession, SyncConflict, SyncEnvelope, SyncPushChange } from "./types";

const cloudClient = vi.hoisted(() => ({
  deleteCloudAccount: vi.fn(),
  downloadCloudMedia: vi.fn(),
  getCloudConfig: vi.fn(),
  getCloudSession: vi.fn(),
  pullCloudChanges: vi.fn(),
  pullCloudSnapshot: vi.fn(),
  pushCloudChanges: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutCloud: vi.fn(),
  uploadCloudMedia: vi.fn()
}));

vi.mock("./cloudClient", () => cloudClient);

type Coordinator = typeof import("./syncCoordinator");
type TimerEntry = { listener: () => void; delay: number; cleared: boolean };

beforeEach(async () => {
  await deleteSoulForgeDatabase();
  localStorage.clear();
  vi.resetAllMocks();
  vi.resetModules();
});

describe("local-first sync lifecycle", () => {
  it("keeps offline edits queued and resumes them on the online event", async () => {
    const harness = createHarness(false, authenticatedSession());
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    harness.timers.length = 0;

    await coordinator.markForSync("character", "hero", { id: "hero" });
    expect(harness.cloud.push).not.toHaveBeenCalled();
    expect(await listQueuedSyncChanges()).toHaveLength(1);
    expect(coordinator.getSyncViewModel().status).toBe("offline");

    harness.setOnline(true);
    harness.fire("online");
    expect(harness.timers.at(-1)?.delay).toBe(0);
    harness.runLastTimer();
    await coordinator.runSync();
    expect(harness.cloud.push).toHaveBeenCalledOnce();
    expect(await listQueuedSyncChanges()).toHaveLength(0);
    expect(coordinator.getSyncViewModel().status).toBe("synced");
  });

  it("schedules synchronization when the app opens authenticated and after login", async () => {
    const authenticated = createHarness(true, authenticatedSession());
    let coordinator = await loadCoordinator();
    const authenticatedDependencies = createDependencies();
    authenticatedDependencies.afterAuthenticated = vi.fn(async () => undefined);
    await coordinator.initializeSyncCoordinator(authenticatedDependencies);
    expect(authenticated.timers.at(-1)?.delay).toBe(0);
    expect(authenticatedDependencies.afterAuthenticated).toHaveBeenCalledOnce();

    const signedOut = createHarness(true, { authenticated: false });
    coordinator = await loadCoordinator();
    const signedOutDependencies = createDependencies();
    signedOutDependencies.afterAuthenticated = vi.fn(async () => undefined);
    await coordinator.initializeSyncCoordinator(signedOutDependencies);
    signedOut.timers.length = 0;
    await coordinator.signIn("test-credential");
    expect(signedOut.cloud.signIn).toHaveBeenCalledWith("test-credential");
    expect(signedOutDependencies.afterAuthenticated).toHaveBeenCalledOnce();
    expect(signedOut.timers.at(-1)?.delay).toBe(0);
  });

  it("confirma conectividade pelo Worker mesmo quando o navegador reporta offline", async () => {
    const harness = createHarness(false, authenticatedSession());
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());

    await coordinator.runSync();

    expect(harness.cloud.pull).toHaveBeenCalled();
    expect(coordinator.getSyncViewModel().status).toBe("synced");
  });

  it("preserves the queue and caps exponential retries when the backend is unavailable", async () => {
    const harness = createHarness(true, authenticatedSession());
    harness.cloud.push.mockRejectedValue(new Error("backend unavailable"));
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.markForSync("character", "hero", { id: "hero" });
    harness.timers.length = 0;

    for (let attempt = 0; attempt < 6; attempt += 1) await coordinator.runSync();

    expect(harness.timers.map((timer) => timer.delay)).toEqual([2_000, 4_000, 8_000, 16_000, 30_000]);
    expect(await listQueuedSyncChanges()).toHaveLength(1);
    expect(coordinator.getSyncViewModel()).toMatchObject({ status: "error", message: "backend unavailable" });
  });

  it("does not discard a newer local edit acknowledged after an earlier send", async () => {
    const harness = createHarness(true, authenticatedSession());
    let releasePush: ((value: { applied: SyncEnvelope[]; conflicts: SyncConflict[] }) => void) | undefined;
    harness.cloud.push.mockImplementation((changes: SyncPushChange[]) => new Promise((resolve) => {
      releasePush = resolve;
      harness.lastPushed = changes;
    }));
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.markForSync("character", "hero", { version: 1 });

    const syncing = coordinator.runSync();
    await vi.waitFor(() => expect(harness.cloud.push).toHaveBeenCalledOnce());
    const sent = harness.lastPushed[0];
    await coordinator.markForSync("character", "hero", { version: 2 });
    releasePush?.({ applied: [{ type: "character", id: "hero", revision: 1, updatedAt: "2026-10-10T12:00:00.000Z", payload: sent.payload }], conflicts: [] });
    await syncing;

    const queued = await listQueuedSyncChanges();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ id: "hero", expectedRevision: 1, payload: { version: 2 } });
    expect(queued[0].mutationId).not.toBe(sent.mutationId);
  });

  it("splits pushes by count and UTF-8 body size", async () => {
    createHarness(true, authenticatedSession());
    const coordinator = await loadCoordinator();
    const small = Array.from({ length: 101 }, (_, index) => syncChange(`hero-${index}`, { name: `Hero ${index}` }));
    expect(coordinator.splitSyncPushBatches(small).map((batch) => batch.length)).toEqual([100, 1]);

    const large = [syncChange("large-a", { text: "á".repeat(600_000) }), syncChange("large-b", { text: "á".repeat(600_000) })];
    expect(coordinator.splitSyncPushBatches(large).map((batch) => batch.length)).toEqual([1, 1]);
  });

  it("acknowledges each batch before sending the next one", async () => {
    const harness = createHarness(true, authenticatedSession());
    let call = 0;
    harness.cloud.push.mockImplementation(async (changes: SyncPushChange[]) => {
      call += 1;
      if (call === 2) throw new Error("second batch unavailable");
      return {
        applied: changes.map((change) => ({ type: change.type, id: change.id, revision: 1, updatedAt: "2026-10-13T12:00:00.000Z", payload: change.payload })),
        conflicts: []
      };
    });
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.markForSync("character", "large-a", { text: "á".repeat(600_000) });
    await coordinator.markForSync("character", "large-b", { text: "á".repeat(600_000) });

    await coordinator.runSync();

    expect(harness.cloud.push).toHaveBeenCalledTimes(2);
    expect((await listQueuedSyncChanges()).map((change) => change.id)).toEqual(["large-b"]);
    expect(coordinator.getSyncViewModel()).toMatchObject({ status: "error", message: "second batch unavailable" });
  });

  it("applies a remote tombstone locally", async () => {
    const harness = createHarness(true, authenticatedSession());
    harness.cloud.pull.mockResolvedValue({ mode: "incremental", cursor: 4, hasMore: false, changes: [{ type: "character", id: "hero", revision: 2, updatedAt: "2026-10-10T12:00:00.000Z", deletedAt: "2026-10-10T12:00:00.000Z" }] });
    const dependencies = createDependencies();
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.runSync();

    expect(await getLocalRecord("characters", "hero")).toBeUndefined();
    expect(await loadSyncCursor()).toBe(4);
  });
});

describe("conflict resolution", () => {
  it.each(["remote", "local", "copy"] as const)("resolves a character conflict by choosing %s", async (choice) => {
    const harness = createHarness(true, authenticatedSession());
    const dependencies = createDependencies();
    const local = character("hero", "Local");
    const remote = character("hero", "Remote");
    harness.cloud.push.mockImplementation(async (changes: SyncPushChange[]) => ({
      applied: [],
      conflicts: [{ key: "character:hero", local: changes[0], remote: { type: "character", id: "hero", revision: 3, updatedAt: "2026-10-10T12:00:00.000Z", payload: remote } }]
    }));
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.markForSync("character", "hero", local);
    await coordinator.runSync();
    expect(await listSyncConflicts()).toHaveLength(1);

    await coordinator.resolveConflict("character:hero", choice);

    expect(await listSyncConflicts()).toHaveLength(0);
    if (choice === "remote") {
      expect(dependencies.saveCharacter).toHaveBeenCalledWith(remote);
      expect(await listQueuedSyncChanges()).toHaveLength(0);
    } else if (choice === "local") {
      expect(await listQueuedSyncChanges()).toEqual([expect.objectContaining({ id: "hero", expectedRevision: 3, payload: local })]);
    } else {
      const saved = dependencies.saveCharacter.mock.calls.map(([value]) => value);
      expect(saved).toContainEqual(remote);
      expect(saved).toContainEqual(expect.objectContaining({ id: expect.not.stringMatching(/^hero$/), identity: { name: "Local (cópia)" } }));
      expect(await listQueuedSyncChanges()).toEqual([expect.objectContaining({ id: expect.not.stringMatching(/^hero$/) })]);
    }
  });
});

describe("media, logout and account removal", () => {
  it("uploads local data URLs before push and restores remote media before saving", async () => {
    const harness = createHarness(true, authenticatedSession());
    const dependencies = createDependencies();
    const localImage = "data:image/png;base64,iVBORw==";
    harness.cloud.pull.mockResolvedValue({
      mode: "incremental",
      cursor: 2,
      hasMore: false,
      changes: [{
        type: "character",
        id: "remote",
        revision: 1,
        updatedAt: "2026-10-10T12:00:00.000Z",
        payload: { id: "remote", portrait: { $soulforgeMedia: "remote-media", mimeType: "image/png", size: 4, checksum: "checksum" } }
      }]
    });
    harness.cloud.downloadMedia.mockResolvedValue({ bytes: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]).buffer, mimeType: "image/png" });
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.markForSync("character", "local", { id: "local", portrait: localImage });
    await coordinator.runSync();

    expect(harness.cloud.uploadMedia).toHaveBeenCalledOnce();
    expect(harness.cloud.uploadMedia.mock.invocationCallOrder[0]).toBeLessThan(harness.cloud.push.mock.invocationCallOrder[0]);
    expect(harness.lastPushed[0].payload).toEqual({ id: "local", portrait: expect.objectContaining({ $soulforgeMedia: "uploaded-media" }) });
    expect(harness.cloud.downloadMedia).toHaveBeenCalledWith("remote-media");
    expect(await getLocalRecord("characters", "remote")).toEqual({ id: "remote", portrait: "data:image/png;base64,iVBORw==" });
  });

  it("preserves local data and queue on logout", async () => {
    const harness = createHarness(true, authenticatedSession());
    const dependencies = createDependencies();
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.markForSync("character", "hero", { id: "hero" });
    await putLocalRecord("characters", { id: "hero", identity: { name: "Local Hero" } });
    await coordinator.signOut();

    expect(harness.cloud.signOut).toHaveBeenCalledOnce();
    expect(await listQueuedSyncChanges()).toHaveLength(1);
    expect(await getLocalRecord("characters", "hero")).toEqual({ id: "hero", identity: { name: "Local Hero" } });
    expect(dependencies.deleteCharacter).not.toHaveBeenCalled();
    expect(coordinator.getSyncViewModel().status).toBe("local-only");
  });

  it("clears sync tracking but preserves local records when cloud data is deleted", async () => {
    const harness = createHarness(true, authenticatedSession());
    const dependencies = createDependencies();
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.markForSync("character", "hero", { id: "hero" });
    await putLocalRecord("characters", { id: "hero", identity: { name: "Local Hero" } });
    await saveSyncConflicts([{
      key: "character:hero",
      local: { mutationId: "local-mutation", type: "character", id: "hero", expectedRevision: 0, deleted: false, payload: { id: "hero" } },
      remote: { type: "character", id: "hero", revision: 1, updatedAt: "2026-10-10T12:00:00.000Z", payload: { id: "hero" } }
    }]);
    await saveSyncCursor(12);
    localStorage.setItem("soulforge.sync.user", "account-a");

    await coordinator.removeCloudAccount();

    expect(harness.cloud.deleteAccount).toHaveBeenCalledOnce();
    expect(await listQueuedSyncChanges()).toHaveLength(0);
    expect(await listSyncConflicts()).toHaveLength(0);
    expect(await loadSyncCursor()).toBe(0);
    expect(localStorage.getItem("soulforge.sync.user")).toBeNull();
    expect(dependencies.deleteCharacter).not.toHaveBeenCalled();
    expect(await getLocalRecord("characters", "hero")).toEqual({ id: "hero", identity: { name: "Local Hero" } });
    expect(coordinator.getSyncViewModel()).toMatchObject({ session: { authenticated: false }, status: "local-only", conflicts: [] });
  });

  it("queues every ficha local e exclui Definitions de Packs importados", async () => {
    createHarness(true, { authenticated: false });
    const dependencies = createDependencies({
      characters: [character("kael", "Kael II"), character("hero", "Hero")],
      definitions: [definition("local-definition", "local"), definition("pack-definition", "core-pack")],
      overrides: [{ id: "override", marker: "custom" } as unknown as CardMarkerOverride]
    });
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(dependencies);
    await coordinator.queueLocalSnapshot();

    expect((await listQueuedSyncChanges()).map((change) => `${change.type}:${change.id}`).sort()).toEqual([
      "character:hero",
      "character:kael",
      "definition:local-definition",
      "override:override"
    ]);
  });
});

describe("retention recovery", () => {
  it("migrates the legacy cursor and keeps a stable anonymous device id", async () => {
    localStorage.setItem("soulforge.sync.cursor", "37");
    const first = await loadSyncIdentity();
    const second = await loadSyncIdentity();
    expect(first).toEqual({ deviceId: expect.stringMatching(/^[0-9a-f-]{36}$/i), cursor: 37 });
    expect(second).toEqual(first);
    expect(localStorage.getItem("soulforge.sync.cursor")).toBeNull();
  });

  it("consumes every incremental page and commits each cursor with the records", async () => {
    const harness = createHarness(true, authenticatedSession());
    harness.cloud.pull
      .mockResolvedValueOnce({ mode: "incremental", cursor: 1, hasMore: true, changes: [{ type: "character", id: "page-a", revision: 1, updatedAt: "2026-10-18T00:00:00.000Z", payload: { id: "page-a" } }] })
      .mockResolvedValueOnce({ mode: "incremental", cursor: 2, hasMore: false, changes: [{ type: "character", id: "page-b", revision: 1, updatedAt: "2026-10-18T00:01:00.000Z", payload: { id: "page-b" } }] })
      .mockImplementation(async (cursor: number) => ({ mode: "incremental", cursor, hasMore: false, changes: [] }));
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.runSync();
    expect(await getLocalRecord("characters", "page-a")).toEqual({ id: "page-a" });
    expect(await getLocalRecord("characters", "page-b")).toEqual({ id: "page-b" });
    expect(await loadSyncCursor()).toBe(2);
  });

  it("rebuilds automatically while preserving new work and turning a missing edited record into conflict", async () => {
    const harness = createHarness(true, authenticatedSession());
    await loadSyncIdentity();
    await putLocalRecord("characters", { id: "edited-old", identity: { name: "Edited" } });
    await putLocalRecord("characters", { id: "new-local", identity: { name: "New" } });
    await setRemoteMetadata({ type: "character", id: "edited-old", revision: 3, updatedAt: "2026-01-01T00:00:00.000Z", payload: { id: "edited-old" } });
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.markForSync("character", "edited-old", { id: "edited-old", identity: { name: "Edited" } });
    await coordinator.markForSync("character", "new-local", { id: "new-local", identity: { name: "New" } });
    harness.cloud.pull
      .mockResolvedValueOnce({ mode: "reset-required", snapshotId: "snapshot-a", baselineCursor: 42 })
      .mockImplementation(async (cursor: number) => ({ mode: "incremental", cursor, hasMore: false, changes: [] }));
    harness.cloud.pullSnapshot.mockResolvedValue({ snapshotId: "snapshot-a", baselineCursor: 42, done: true, changes: [{ type: "character", id: "remote-live", revision: 2, updatedAt: "2026-10-18T00:00:00.000Z", payload: { id: "remote-live", identity: { name: "Remote" } } }] });

    await coordinator.runSync();

    expect(await getLocalRecord("characters", "remote-live")).toEqual({ id: "remote-live", identity: { name: "Remote" } });
    expect(await getLocalRecord("characters", "edited-old")).toBeTruthy();
    expect(await getLocalRecord("characters", "new-local")).toBeTruthy();
    expect(await listSyncConflicts()).toEqual([expect.objectContaining({ key: "character:edited-old", remote: expect.objectContaining({ deletedAt: expect.any(String), revision: 0 }) })]);
    expect(harness.lastPushed.map((entry) => entry.id)).toContain("new-local");
    expect((await listQueuedSyncChanges()).map((entry) => entry.id)).toEqual(["edited-old"]);
    expect(await loadSyncCursor()).toBe(42);
  });

  it("does not expose a partially downloaded snapshot", async () => {
    const harness = createHarness(true, authenticatedSession());
    harness.cloud.pull.mockResolvedValueOnce({ mode: "reset-required", snapshotId: "snapshot-b", baselineCursor: 50 });
    harness.cloud.pullSnapshot
      .mockResolvedValueOnce({ snapshotId: "snapshot-b", baselineCursor: 50, done: false, nextCursor: "next", changes: [{ type: "character", id: "staged-only", revision: 1, updatedAt: "2026-10-18T00:00:00.000Z", payload: { id: "staged-only" } }] })
      .mockRejectedValueOnce(new Error("snapshot unavailable"));
    const coordinator = await loadCoordinator();
    await coordinator.initializeSyncCoordinator(createDependencies());
    await coordinator.runSync();
    expect(await getLocalRecord("characters", "staged-only")).toBeUndefined();
    expect(await loadSyncCursor()).toBe(0);
    expect(coordinator.getSyncViewModel()).toMatchObject({ status: "error", message: "snapshot unavailable" });
  });
});

function createHarness(initialOnline: boolean, initialSession: CloudSession) {
  let online = initialOnline;
  const listeners: Record<"online" | "offline", Array<() => void>> = { online: [], offline: [] };
  const timers: TimerEntry[] = [];
  let nextTimerId = 1;
  const timerIds = new Map<number, TimerEntry>();
  const harness = {
    timers,
    lastPushed: [] as SyncPushChange[],
    cloud: {
      deleteAccount: cloudClient.deleteCloudAccount,
      downloadMedia: cloudClient.downloadCloudMedia,
      getConfig: cloudClient.getCloudConfig,
      getSession: cloudClient.getCloudSession,
      pull: cloudClient.pullCloudChanges,
      pullSnapshot: cloudClient.pullCloudSnapshot,
      push: cloudClient.pushCloudChanges,
      signIn: cloudClient.signInWithGoogle,
      signOut: cloudClient.signOutCloud,
      uploadMedia: cloudClient.uploadCloudMedia
    },
    setOnline(value: boolean) { online = value; Object.defineProperty(navigator, "onLine", { configurable: true, value }); },
    fire(type: "online" | "offline") { listeners[type].forEach((listener) => listener()); },
    runLastTimer() {
      const timer = [...timers].reverse().find((entry) => !entry.cleared);
      if (!timer) throw new Error("No active sync timer.");
      timer.cleared = true;
      timer.listener();
    }
  };

  vi.stubGlobal("navigator", { onLine: online });
  vi.stubGlobal("window", {
    addEventListener(type: "online" | "offline", listener: () => void) { listeners[type].push(listener); },
    clearTimeout(id: number) { const timer = timerIds.get(id); if (timer) timer.cleared = true; },
    setTimeout(listener: () => void, delay: number) {
      const timer: TimerEntry = { listener, delay, cleared: false };
      const id = nextTimerId++;
      timers.push(timer);
      timerIds.set(id, timer);
      return id;
    }
  });

  cloudClient.deleteCloudAccount.mockResolvedValue(undefined);
  cloudClient.downloadCloudMedia.mockResolvedValue({ bytes: new ArrayBuffer(0), mimeType: "image/png" });
  cloudClient.getCloudConfig.mockResolvedValue({ googleClientId: "test-client", syncEnabled: true });
  cloudClient.getCloudSession.mockResolvedValue(initialSession);
  cloudClient.pullCloudChanges.mockImplementation(async (cursor: number) => ({ mode: "incremental", cursor, changes: [], hasMore: false }));
  cloudClient.pullCloudSnapshot.mockResolvedValue({ snapshotId: "snapshot", baselineCursor: 0, changes: [], done: true });
  cloudClient.pushCloudChanges.mockImplementation(async (changes: SyncPushChange[]) => {
    harness.lastPushed = changes;
    const applied: SyncEnvelope[] = changes.map((change) => ({
      type: change.type,
      id: change.id,
      revision: change.expectedRevision + 1,
      updatedAt: "2026-10-10T12:00:00.000Z",
      ...(change.deleted ? { deletedAt: "2026-10-10T12:00:00.000Z" } : { payload: change.payload })
    }));
    return { applied, conflicts: [] };
  });
  cloudClient.signInWithGoogle.mockResolvedValue(authenticatedSession());
  cloudClient.signOutCloud.mockResolvedValue(undefined);
  cloudClient.uploadCloudMedia.mockResolvedValue({ id: "uploaded-media" });
  return harness;
}

async function loadCoordinator(): Promise<Coordinator> {
  return import("./syncCoordinator");
}

function createDependencies(snapshot: Partial<Awaited<ReturnType<SyncCoordinatorDependencies["snapshot"]>>> = {}): SyncCoordinatorDependencies & {
  saveCharacter: ReturnType<typeof vi.fn>;
  deleteCharacter: ReturnType<typeof vi.fn>;
} {
  return {
    snapshot: vi.fn(async () => ({ characters: [], definitions: [], overrides: [], ...snapshot })),
    saveCharacter: vi.fn(async () => undefined),
    deleteCharacter: vi.fn(async () => undefined),
    saveDefinition: vi.fn(async () => undefined),
    deleteDefinition: vi.fn(async () => undefined),
    saveOverride: vi.fn(async () => undefined),
    deleteOverride: vi.fn(async () => undefined),
    afterRemoteChange: vi.fn(async () => undefined),
    stateChanged: vi.fn()
  };
}

function authenticatedSession(): CloudSession {
  return { authenticated: true, user: { id: "account-a", email: "account@example.invalid", name: "Test Account" } };
}

function syncChange(id: string, payload: unknown): SyncPushChange {
  return { mutationId: `mutation-${id}`, type: "character", id, expectedRevision: 0, deleted: false, payload };
}

function character(id: string, name: string): Character {
  return { id, identity: { name } } as Character;
}

function definition(id: string, packId: string): Definition {
  return { id, packId, type: "feature", name: id, summary: id } as Definition;
}

function deleteSoulForgeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("soulforge");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("SoulForge IndexedDB remained open between tests."));
  });
}

function putLocalRecord(storeName: string, value: unknown): Promise<void> {
  return withLocalStore(storeName, "readwrite", (store) => store.put(value)).then(() => undefined);
}

function getLocalRecord(storeName: string, key: IDBValidKey): Promise<unknown> {
  return withLocalStore(storeName, "readonly", (store) => store.get(key));
}

function withLocalStore(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("soulforge", 6);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      let result: unknown;
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => { database.close(); resolve(result); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    };
  });
}
