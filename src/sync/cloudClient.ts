import type { CloudAccessGrant, CloudSession, SyncPullResponse, SyncPushChange, SyncPushResponse, SyncSnapshotResponse } from "./types";

// `pnpm dev` prioriza a UI local. A integração real continua disponível em
// `pnpm dev:full` e nos builds de produção.
const localUiDevelopment = import.meta.env.MODE === "development";

export const cloudSessionInvalidEvent = "soulforge:cloud-session-invalid";

export class CloudApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "CloudApiError";
  }
}

export function isCloudAuthenticationError(error: unknown): error is CloudApiError {
  return error instanceof CloudApiError && error.status === 401;
}

export async function readCloudApiError(response: Response, fallback: string): Promise<CloudApiError> {
  const body = await response.json().catch(() => undefined) as { error?: string; code?: string } | undefined;
  const error = new CloudApiError(body?.error ?? fallback, response.status, body?.code);
  if (response.status === 401 && typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof Event !== "undefined") {
    window.dispatchEvent(new Event(cloudSessionInvalidEvent));
  }
  return error;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin", ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  if (!response.ok) {
    throw await readCloudApiError(response, `A nuvem respondeu com ${response.status}.`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export function getCloudSession(): Promise<CloudSession> {
  if (localUiDevelopment) return Promise.resolve({ authenticated: false });
  return api<CloudSession>("/session");
}

export function getCloudConfig(): Promise<{ googleClientId?: string; syncEnabled: boolean }> {
  if (localUiDevelopment || location.hostname.endsWith(".github.io")) return Promise.resolve({ syncEnabled: false });
  return api("/config");
}

export function signInWithGoogle(credential: string): Promise<CloudSession> {
  return api("/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
}

export function signOutCloud(): Promise<void> {
  return api("/auth/logout", { method: "POST", body: "{}" });
}

export function deleteCloudAccount(): Promise<void> {
  return api("/account", { method: "DELETE", body: "{}" });
}

export function getAccessGrants(): Promise<{ grants: CloudAccessGrant[] }> {
  return api("/access/grants");
}

export function grantAccess(email: string): Promise<void> {
  return api("/access/grants", { method: "POST", body: JSON.stringify({ email }) });
}

export function revokeAccess(email: string): Promise<void> {
  return api(`/access/grants/${encodeURIComponent(email)}`, { method: "DELETE", body: "{}" });
}

export function pushCloudChanges(changes: SyncPushChange[], deviceId: string, cursor: number): Promise<SyncPushResponse> {
  return api("/sync/push", { method: "POST", headers: syncHeaders(deviceId, cursor), body: JSON.stringify({ changes }) });
}

export function pullCloudChanges(cursor: number, deviceId: string): Promise<SyncPullResponse> {
  return api(`/sync/pull?cursor=${encodeURIComponent(String(cursor))}`, { headers: syncHeaders(deviceId, cursor) });
}

export function pullCloudSnapshot(snapshotId: string, after?: string): Promise<SyncSnapshotResponse> {
  const query = after ? `?after=${encodeURIComponent(after)}` : "";
  return api(`/sync/snapshot/${encodeURIComponent(snapshotId)}${query}`);
}

function syncHeaders(deviceId: string, cursor: number): HeadersInit {
  return { "X-SoulForge-Device-Id": deviceId, "X-SoulForge-Sync-Cursor": String(cursor) };
}

export async function uploadCloudMedia(media: { bytes: Uint8Array; mimeType: string; checksum: string }): Promise<{ id: string }> {
  const body = media.bytes.buffer.slice(media.bytes.byteOffset, media.bytes.byteOffset + media.bytes.byteLength) as ArrayBuffer;
  const response = await fetch("/api/media", { method: "POST", credentials: "same-origin", headers: { "Content-Type": media.mimeType, "X-Media-Checksum": media.checksum }, body });
  if (!response.ok) throw await readCloudApiError(response, "Não foi possível enviar a imagem.");
  return response.json() as Promise<{ id: string }>;
}

export async function downloadCloudMedia(id: string): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  const response = await fetch(`/api/media/${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (!response.ok) throw await readCloudApiError(response, "Não foi possível baixar uma imagem sincronizada.");
  return { bytes: await response.arrayBuffer(), mimeType: response.headers.get("Content-Type") ?? "image/webp" };
}
