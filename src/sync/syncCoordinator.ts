import type { Character, Definition } from "../domain/types";
import type { CardMarkerOverride } from "../storage/compendiumRepository";
import {
  acceptAppliedSync,
  applyRemoteSyncPage,
  beginSyncSnapshot,
  commitSyncSnapshot,
  enqueueSyncChange,
  listQueuedSyncChanges,
  listSyncConflicts,
  loadSyncIdentity,
  removeSyncConflict,
  resetSyncTracking,
  saveSyncConflicts,
  stageSyncSnapshot,
  setRemoteMetadata
} from "../storage/syncRepository";
import {
  deleteCloudAccount,
  downloadCloudMedia,
  getAccessGrants,
  getCloudConfig,
  getCloudSession,
  grantAccess as grantCloudAccess,
  pullCloudChanges,
  pullCloudSnapshot,
  pushCloudChanges,
  signInWithGoogle,
  signOutCloud,
  revokeAccess as revokeCloudAccess,
  uploadCloudMedia
} from "./cloudClient";
import { replaceDataUrlsWithMedia, replaceMediaWithDataUrls } from "./mediaTransfer";
import type { CloudAccessGrant, CloudSession, SyncConflict, SyncEnvelope, SyncPushChange, SyncResourceType, SyncStatus } from "./types";

export type SyncCoordinatorDependencies = {
  snapshot(): Promise<{ characters: Character[]; definitions: Definition[]; overrides: CardMarkerOverride[] }>;
  saveCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
  saveDefinition(definition: Definition): Promise<void>;
  deleteDefinition(id: string): Promise<void>;
  saveOverride(override: CardMarkerOverride): Promise<void>;
  deleteOverride(id: string): Promise<void>;
  afterRemoteChange(): Promise<void>;
  /** Executado quando uma sessão autorizada fica disponível no boot ou após login. */
  afterAuthenticated?(): Promise<void>;
  stateChanged(): void;
};

export type SyncViewModel = {
  session: CloudSession;
  status: SyncStatus;
  message?: string;
  conflicts: SyncConflict[];
  googleClientId?: string;
  syncEnabled: boolean;
  accessGrants?: CloudAccessGrant[];
  accessLoading?: boolean;
  accessError?: string;
};

const view: SyncViewModel = { session: { authenticated: false }, status: navigator.onLine ? "local-only" : "offline", conflicts: [], syncEnabled: false };
let dependencies: SyncCoordinatorDependencies | undefined;
let syncTimer: number | undefined;
let running: Promise<void> | undefined;
let retryCount = 0;
const maxSyncPushChanges = 100;
const maxSyncPushBytes = 2_000_000;

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
    if (session.authenticated) {
      if (session.isAccessAdmin) void refreshAccessGrants();
      await dependencies.afterAuthenticated?.();
      scheduleSync(0);
    }
  } catch (error) {
    updateView({ status: navigator.onLine ? "error" : "offline", message: errorMessage(error) });
  }
}

export async function markForSync(type: SyncResourceType, id: string, payload?: unknown, deleted = false): Promise<void> {
  await enqueueSyncChange(type, id, payload, deleted);
  updateView({ status: view.session.authenticated ? (navigator.onLine ? "pending" : "offline") : "local-only", message: view.session.authenticated ? "Alterações aguardando sincronização." : undefined });
  if (view.session.authenticated) scheduleSync(900);
}

export async function queueLocalSnapshot(): Promise<void> {
  if (!dependencies) return;
  const snapshot = await dependencies.snapshot();
  await Promise.all([
    ...snapshot.characters.map((character) => enqueueSyncChange("character", character.id, character)),
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
  updateView({ status: "syncing", message: "Enviando alterações e verificando a nuvem…" });
  try {
    await seedFirstSync();
    let changed = await receiveRemoteChanges();
    const conflictKeys = new Set((await listSyncConflicts()).map((conflict) => conflict.key));
    const queued = (await listQueuedSyncChanges()).filter((change) => !conflictKeys.has(change.key));
    if (queued.length) {
      const prepared: SyncPushChange[] = [];
      for (const change of queued) {
        prepared.push({
          mutationId: change.mutationId,
          type: change.type,
          id: change.id,
          expectedRevision: change.expectedRevision,
          deleted: change.deleted,
          ...(change.payload === undefined ? {} : { payload: await replaceDataUrlsWithMedia(change.payload, uploadCloudMedia) })
        });
      }
      for (const batch of splitSyncPushBatches(prepared)) {
        const identity = await loadSyncIdentity();
        const pushed = await pushCloudChanges(batch, identity.deviceId, identity.cursor);
        await acceptAppliedSync(pushed.applied, new Map(batch.map((change) => [`${change.type}:${change.id}`, change.mutationId])));
        await saveSyncConflicts(pushed.conflicts);
      }
    }
    changed = await receiveRemoteChanges() || changed;
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

async function receiveRemoteChanges(): Promise<boolean> {
  let changed = false;
  while (true) {
    const identity = await loadSyncIdentity();
    const pulled = await pullCloudChanges(identity.cursor, identity.deviceId);
    if (pulled.mode === "reset-required") {
      changed = await rebuildFromSnapshot(pulled.snapshotId, pulled.baselineCursor) || changed;
      continue;
    }
    const prepared: SyncEnvelope[] = [];
    for (const envelope of pulled.changes) {
      prepared.push(envelope.deletedAt ? envelope : { ...envelope, payload: await replaceMediaWithDataUrls(envelope.payload, downloadCloudMedia) });
    }
    changed = (await applyRemoteSyncPage(prepared, pulled.cursor)).changed || changed;
    if (!pulled.hasMore) return changed;
  }
}

async function rebuildFromSnapshot(snapshotId: string, baselineCursor: number): Promise<boolean> {
  updateView({ status: "syncing", message: "Atualizando dados da nuvem…" });
  await beginSyncSnapshot(snapshotId, baselineCursor);
  let after: string | undefined;
  while (true) {
    const page = await pullCloudSnapshot(snapshotId, after);
    const prepared: SyncEnvelope[] = [];
    for (const envelope of page.changes) {
      prepared.push(envelope.deletedAt ? envelope : { ...envelope, payload: await replaceMediaWithDataUrls(envelope.payload, downloadCloudMedia) });
    }
    await stageSyncSnapshot(prepared);
    if (page.done) break;
    if (!page.nextCursor) throw new Error("A reconstrução da nuvem retornou uma página incompleta.");
    after = page.nextCursor;
  }
  return (await commitSyncSnapshot(baselineCursor)).changed;
}

export function splitSyncPushBatches(changes: SyncPushChange[]): SyncPushChange[][] {
  const batches: SyncPushChange[][] = [];
  let current: SyncPushChange[] = [];
  for (const change of changes) {
    const candidate = [...current, change];
    if (candidate.length > maxSyncPushChanges || syncPushBodySize(candidate) > maxSyncPushBytes) {
      if (!current.length) throw new Error("Uma alteração local excede o limite de sincronização de 2 MB.");
      batches.push(current);
      current = [change];
      if (syncPushBodySize(current) > maxSyncPushBytes) throw new Error("Uma alteração local excede o limite de sincronização de 2 MB.");
    } else current = candidate;
  }
  if (current.length) batches.push(current);
  return batches;
}

function syncPushBodySize(changes: SyncPushChange[]): number {
  return new TextEncoder().encode(JSON.stringify({ changes })).byteLength;
}

async function seedFirstSync(): Promise<void> {
  if (!dependencies || (await loadSyncIdentity()).cursor !== 0 || (await listQueuedSyncChanges()).length) return;
  const snapshot = await dependencies.snapshot();
  await Promise.all([
    ...snapshot.characters.map((character) => enqueueSyncChange("character", character.id, character)),
    ...snapshot.definitions.filter((definition) => definition.packId === "local").map((definition) => enqueueSyncChange("definition", definition.id, definition)),
    ...snapshot.overrides.map((override) => enqueueSyncChange("override", override.id, override))
  ]);
}

async function applyRemoteEnvelope(envelope: SyncEnvelope): Promise<void> {
  if (!dependencies) return;
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
  let session: CloudSession;
  try {
    session = await signInWithGoogle(credential);
    if (!session.authenticated || !session.user) throw new Error("O login não retornou uma sessão válida.");
  } catch (error) {
    updateView({ session: { authenticated: false }, status: "error", message: errorMessage(error) });
    throw error;
  }
  if (session.user) await prepareAccountTracking(session.user.id);
  updateView({ session, status: "pending", message: "Conta conectada. Preparando a primeira sincronização…" });
  if (session.authenticated) {
    if (session.isAccessAdmin) void refreshAccessGrants();
    try {
      await dependencies?.afterAuthenticated?.();
    } catch (error) {
      console.warn("A preparação da biblioteca privada falhou após o login.", error instanceof Error ? error.name : "UnknownError");
    }
  }
  scheduleSync(0);
}

export async function signOut(): Promise<void> {
  await signOutCloud();
  updateView({ session: { authenticated: false }, accessGrants: undefined, accessLoading: false, accessError: undefined, status: navigator.onLine ? "local-only" : "offline", message: "Os dados locais foram preservados." });
}

export async function refreshAccessGrants(): Promise<void> {
  if (!view.session.authenticated || !view.session.isAccessAdmin) return;
  updateView({ accessLoading: true, accessError: undefined });
  try {
    const result = await getAccessGrants();
    updateView({ accessGrants: result.grants, accessLoading: false });
  } catch (error) {
    updateView({ accessLoading: false, accessError: errorMessage(error) });
  }
}

export async function grantPrivateAccess(email: string): Promise<void> {
  try {
    await grantCloudAccess(email);
    await refreshAccessGrants();
  } catch (error) {
    updateView({ accessError: errorMessage(error) });
    throw error;
  }
}

export async function revokePrivateAccess(email: string): Promise<void> {
  try {
    await revokeCloudAccess(email);
    await refreshAccessGrants();
  } catch (error) {
    updateView({ accessError: errorMessage(error) });
    throw error;
  }
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
  try {
    await loadGoogleScript();
    if (!window.google) throw new Error("Não foi possível iniciar o login do Google.");
    window.google.accounts.id.initialize({ client_id: view.googleClientId, callback: (response) => { void signIn(response.credential).catch(() => undefined); } });
    window.google.accounts.id.renderButton(target, { theme: "filled_black", size: "large", text: "continue_with", shape: "rectangular", width: 280 });
  } catch (error) {
    updateView({ status: "error", message: errorMessage(error) });
  }
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
