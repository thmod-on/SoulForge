import type { Character, Definition } from "../domain/types";
import type { CardMarkerOverride } from "../storage/compendiumRepository";
import {
  acceptAppliedSync,
  enqueueSyncChange,
  listQueuedSyncChanges,
  listSyncConflicts,
  loadSyncCursor,
  removeSyncConflict,
  resetSyncTracking,
  saveSyncConflicts,
  saveSyncCursor,
  setRemoteMetadata
} from "../storage/syncRepository";
import {
  deleteCloudAccount,
  downloadCloudMedia,
  getCloudConfig,
  getCloudSession,
  pullCloudChanges,
  pushCloudChanges,
  signInWithGoogle,
  signOutCloud,
  uploadCloudMedia
} from "./cloudClient";
import { replaceDataUrlsWithMedia, replaceMediaWithDataUrls } from "./mediaTransfer";
import type { CloudSession, SyncConflict, SyncEnvelope, SyncPushChange, SyncResourceType, SyncStatus } from "./types";

export type SyncCoordinatorDependencies = {
  demoCharacterId: string;
  snapshot(): Promise<{ characters: Character[]; definitions: Definition[]; overrides: CardMarkerOverride[] }>;
  saveCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
  saveDefinition(definition: Definition): Promise<void>;
  deleteDefinition(id: string): Promise<void>;
  saveOverride(override: CardMarkerOverride): Promise<void>;
  deleteOverride(id: string): Promise<void>;
  afterRemoteChange(): Promise<void>;
  stateChanged(): void;
};

export type SyncViewModel = {
  session: CloudSession;
  status: SyncStatus;
  message?: string;
  conflicts: SyncConflict[];
  googleClientId?: string;
  syncEnabled: boolean;
};

const view: SyncViewModel = { session: { authenticated: false }, status: navigator.onLine ? "local-only" : "offline", conflicts: [], syncEnabled: false };
let dependencies: SyncCoordinatorDependencies | undefined;
let syncTimer: number | undefined;
let running: Promise<void> | undefined;
let retryCount = 0;

declare global {
  interface Window {
    google?: {
      accounts: { id: { initialize(options: { client_id: string; callback(response: { credential: string }): void }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } };
    };
  }
}

export function getSyncViewModel(): SyncViewModel {
  return view;
}

export async function initializeSyncCoordinator(nextDependencies: SyncCoordinatorDependencies): Promise<void> {
  dependencies = nextDependencies;
  window.addEventListener("online", () => { scheduleSync(0); });
  window.addEventListener("offline", () => updateView({ status: "offline", message: "Alterações continuam salvas neste dispositivo." }));
  try {
    const [config, session] = await Promise.all([getCloudConfig(), getCloudSession()]);
    if (session.user) await prepareAccountTracking(session.user.id);
    const conflicts = await listSyncConflicts();
    Object.assign(view, { googleClientId: config.googleClientId, syncEnabled: config.syncEnabled, session, conflicts });
    updateView({ status: session.authenticated ? "pending" : navigator.onLine ? "local-only" : "offline", message: undefined });
    if (session.authenticated) scheduleSync(0);
  } catch (error) {
    updateView({ status: navigator.onLine ? "error" : "offline", message: errorMessage(error) });
  }
}

export async function markForSync(type: SyncResourceType, id: string, payload?: unknown, deleted = false): Promise<void> {
  if (type === "character" && id === dependencies?.demoCharacterId) return;
  await enqueueSyncChange(type, id, payload, deleted);
  updateView({ status: view.session.authenticated ? (navigator.onLine ? "pending" : "offline") : "local-only", message: view.session.authenticated ? "Alterações aguardando sincronização." : undefined });
  if (view.session.authenticated) scheduleSync(900);
}

export async function queueLocalSnapshot(): Promise<void> {
  if (!dependencies) return;
  const snapshot = await dependencies.snapshot();
  await Promise.all([
    ...snapshot.characters.filter((character) => character.id !== dependencies?.demoCharacterId).map((character) => enqueueSyncChange("character", character.id, character)),
    ...snapshot.definitions.filter((definition) => definition.packId === "local").map((definition) => enqueueSyncChange("definition", definition.id, definition)),
    ...snapshot.overrides.map((override) => enqueueSyncChange("override", override.id, override))
  ]);
  if (view.session.authenticated) scheduleSync(0);
}

export async function runSync(): Promise<void> {
  if (running) return running;
  running = performSync().finally(() => { running = undefined; });
  return running;
}

async function performSync(): Promise<void> {
  if (!dependencies || !view.session.authenticated) return;
  if (!navigator.onLine) { updateView({ status: "offline" }); return; }
  updateView({ status: "syncing", message: "Enviando alterações e verificando a nuvem…" });
  try {
    await seedFirstSync();
    const queued = await listQueuedSyncChanges();
    if (queued.length) {
      const prepared: SyncPushChange[] = [];
      for (const change of queued) {
        prepared.push({ ...change, payload: change.payload === undefined ? undefined : await replaceDataUrlsWithMedia(change.payload, uploadCloudMedia) });
      }
      const pushed = await pushCloudChanges(prepared);
      await acceptAppliedSync(pushed.applied, new Map(queued.map((change) => [change.key, change.mutationId])));
      await saveSyncConflicts(pushed.conflicts);
    }
    const pulled = await pullCloudChanges(loadSyncCursor());
    const pendingKeys = new Set((await listQueuedSyncChanges()).map((change) => change.key));
    const conflictKeys = new Set((await listSyncConflicts()).map((conflict) => conflict.key));
    let changed = false;
    for (const envelope of pulled.changes) {
      const key = `${envelope.type}:${envelope.id}`;
      if (pendingKeys.has(key) || conflictKeys.has(key)) continue;
      await applyRemoteEnvelope(envelope);
      await setRemoteMetadata(envelope);
      changed = true;
    }
    saveSyncCursor(pulled.cursor);
    if (changed) await dependencies.afterRemoteChange();
    view.conflicts = await listSyncConflicts();
    retryCount = 0;
    updateView({ status: view.conflicts.length ? "conflict" : "synced", message: view.conflicts.length ? "Escolha qual versão deve ser mantida." : `Sincronizado às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` });
  } catch (error) {
    retryCount += 1;
    updateView({ status: navigator.onLine ? "error" : "offline", message: errorMessage(error) });
    if (navigator.onLine && retryCount <= 5) scheduleSync(Math.min(30_000, 1_000 * 2 ** retryCount));
  }
}

async function seedFirstSync(): Promise<void> {
  if (!dependencies || loadSyncCursor() !== 0 || (await listQueuedSyncChanges()).length) return;
  const snapshot = await dependencies.snapshot();
  await Promise.all([
    ...snapshot.characters.filter((character) => character.id !== dependencies?.demoCharacterId).map((character) => enqueueSyncChange("character", character.id, character)),
    ...snapshot.definitions.filter((definition) => definition.packId === "local").map((definition) => enqueueSyncChange("definition", definition.id, definition)),
    ...snapshot.overrides.map((override) => enqueueSyncChange("override", override.id, override))
  ]);
}

async function applyRemoteEnvelope(envelope: SyncEnvelope): Promise<void> {
  if (!dependencies || (envelope.type === "character" && envelope.id === dependencies.demoCharacterId)) return;
  if (envelope.deletedAt) {
    if (envelope.type === "character") await dependencies.deleteCharacter(envelope.id);
    if (envelope.type === "definition") await dependencies.deleteDefinition(envelope.id);
    if (envelope.type === "override") await dependencies.deleteOverride(envelope.id);
    return;
  }
  const payload = await replaceMediaWithDataUrls(envelope.payload, downloadCloudMedia);
  if (envelope.type === "character") await dependencies.saveCharacter(payload as Character);
  if (envelope.type === "definition") await dependencies.saveDefinition(payload as Definition);
  if (envelope.type === "override") await dependencies.saveOverride(payload as CardMarkerOverride);
}

export async function signIn(credential: string): Promise<void> {
  const session = await signInWithGoogle(credential);
  if (session.user) await prepareAccountTracking(session.user.id);
  updateView({ session, status: "pending", message: "Conta conectada. Preparando a primeira sincronização…" });
  scheduleSync(0);
}

export async function signOut(): Promise<void> {
  await signOutCloud();
  updateView({ session: { authenticated: false }, status: navigator.onLine ? "local-only" : "offline", message: "Os dados locais foram preservados." });
}

export async function removeCloudAccount(): Promise<void> {
  await deleteCloudAccount();
  await resetSyncTracking();
  localStorage.removeItem("soulforge.sync.user");
  updateView({ session: { authenticated: false }, status: "local-only", conflicts: [], message: "Dados da nuvem excluídos; dados locais preservados." });
}

async function prepareAccountTracking(userId: string): Promise<void> {
  const previousUserId = localStorage.getItem("soulforge.sync.user");
  if (previousUserId && previousUserId !== userId) await resetSyncTracking();
  localStorage.setItem("soulforge.sync.user", userId);
}

export async function resolveConflict(key: string, choice: "local" | "remote" | "copy"): Promise<void> {
  if (!dependencies) return;
  const conflict = view.conflicts.find((entry) => entry.key === key);
  if (!conflict) return;
  if (choice === "remote") {
    await applyRemoteEnvelope(conflict.remote);
    await acceptAppliedSync([conflict.remote]);
  } else if (choice === "copy" && conflict.local.type === "character" && conflict.local.payload) {
    const copy = structuredClone(conflict.local.payload) as Character;
    copy.id = crypto.randomUUID();
    copy.identity.name = `${copy.identity.name} (cópia)`;
    await dependencies.saveCharacter(copy);
    await markForSync("character", copy.id, copy);
    await applyRemoteEnvelope(conflict.remote);
    await acceptAppliedSync([conflict.remote]);
  } else {
    await setRemoteMetadata(conflict.remote);
    await enqueueSyncChange(conflict.local.type, conflict.local.id, conflict.local.payload, conflict.local.deleted);
    await removeSyncConflict(key);
  }
  await dependencies.afterRemoteChange();
  view.conflicts = await listSyncConflicts();
  scheduleSync(0);
}

export async function mountGoogleSignIn(): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-google-signin]");
  if (!target || !view.googleClientId || view.session.authenticated) return;
  await loadGoogleScript();
  window.google?.accounts.id.initialize({ client_id: view.googleClientId, callback: (response) => { void signIn(response.credential); } });
  window.google?.accounts.id.renderButton(target, { theme: "filled_black", size: "large", text: "continue_with", shape: "rectangular", width: 280 });
}

function loadGoogleScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o login do Google."));
    document.head.append(script);
  });
}

function scheduleSync(delay: number): void {
  if (syncTimer !== undefined) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => { syncTimer = undefined; void runSync(); }, delay);
}

function updateView(patch: Partial<SyncViewModel>): void {
  Object.assign(view, patch);
  dependencies?.stateChanged();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível sincronizar agora.";
}
