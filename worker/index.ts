import type { SyncEnvelope, SyncPushChange, SyncResourceType } from "../src/sync/types";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  GOOGLE_CLIENT_ID?: string;
  SYNC_ENABLED?: string;
}

type AuthenticatedRequest = { userId: string; sessionId: string };
type GoogleClaims = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string; iss: string; aud: string; exp: number };

const maxImageBytes = 1_500_000;
const maxGoogleLoginBytes = 32 * 1024;
const maxSyncPushBytes = 2_000_000;
const accountMediaQuota = 100_000_000;
const sessionCookie = "soulforge_session";
const allowedMediaTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const resourceTables: Record<SyncResourceType, string> = { character: "characters", definition: "definitions", override: "definition_overrides" };
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "connect-src 'self' https://accounts.google.com/gsi/",
  "frame-src https://accounts.google.com/gsi/",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");
let googleKeys: { expiresAt: number; keys: JsonWebKey[] } | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;
    try {
      response = url.pathname.startsWith("/api/")
        ? await handleApiRequest(request, url, env)
        : await env.ASSETS.fetch(request);
    } catch (error) {
      if (isHttpError(error)) response = json({ error: error.message }, error.status);
      else {
        console.error({ event: "worker_error", errorName: error instanceof Error ? error.name : "UnknownError" });
        response = json({ error: "Falha interna do SoulForge." }, 500);
      }
    }
    return withSecurityHeaders(response);
  }
} satisfies ExportedHandler<Env>;

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  if (mutatingMethods.has(request.method)) assertSameOrigin(request);
  if (url.pathname === "/api/config" && request.method === "GET") return json({ googleClientId: env.GOOGLE_CLIENT_ID, syncEnabled: env.SYNC_ENABLED !== "false" && Boolean(env.GOOGLE_CLIENT_ID) });
  if (url.pathname === "/api/session" && request.method === "GET") return sessionResponse(request, env);
  if (url.pathname === "/api/auth/google" && request.method === "POST") return googleLogin(request, env);
  if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
  const auth = await requireSession(request, env);
  if (url.pathname === "/api/account" && request.method === "DELETE") return deleteAccount(auth, env);
  if (url.pathname === "/api/sync/push" && request.method === "POST") return pushChanges(request, auth, env);
  if (url.pathname === "/api/sync/pull" && request.method === "GET") return pullChanges(url, auth, env);
  if (url.pathname === "/api/media" && request.method === "POST") return uploadMedia(request, auth, env);
  if (url.pathname.startsWith("/api/media/") && request.method === "GET") return downloadMedia(decodeURIComponent(url.pathname.slice("/api/media/".length)), auth, env);
  return json({ error: "Rota não encontrada." }, 404);
}

async function sessionResponse(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireSession(request, env);
    const user = await env.DB.prepare("SELECT id, email, name, picture FROM users WHERE id = ?").bind(auth.userId).first<{ id: string; email: string; name: string; picture?: string }>();
    return json(user ? { authenticated: true, user } : { authenticated: false });
  } catch (error) {
    if (isHttpError(error) && error.status === 401) return json({ authenticated: false });
    throw error;
  }
}

async function googleLogin(request: Request, env: Env): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, "Login Google ainda não foi configurado.");
  const body = await readJsonBody<{ credential?: string }>(request, maxGoogleLoginBytes);
  if (!body.credential) throw new HttpError(400, "Credencial do Google ausente.");
  const claims = await verifyGoogleCredential(body.credential, env.GOOGLE_CLIENT_ID);
  const userId = await sha256Hex(`google:${claims.sub}`);
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_login_at = excluded.last_login_at")
    .bind(userId, claims.sub, claims.email, claims.name ?? claims.email, claims.picture ?? null, now, now).run();
  const token = randomToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").bind(sessionId, userId, await sha256Hex(token), expiresAt, now).run();
  return json({ authenticated: true, user: { id: userId, email: claims.email, name: claims.name ?? claims.email, picture: claims.picture } }, 200, { "Set-Cookie": cookie(token, expiresAt) });
}

async function logout(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request, sessionCookie);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearCookie() } });
}

async function requireSession(request: Request, env: Env): Promise<AuthenticatedRequest> {
  const token = readCookie(request, sessionCookie);
  if (!token) throw new HttpError(401, "Entre com Google para usar a nuvem.");
  const session = await env.DB.prepare("SELECT id, user_id FROM sessions WHERE token_hash = ? AND expires_at > ?").bind(await sha256Hex(token), new Date().toISOString()).first<{ id: string; user_id: string }>();
  if (!session) throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  return { userId: session.user_id, sessionId: session.id };
}

async function pushChanges(request: Request, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const body = await readJsonBody<{ changes?: SyncPushChange[] }>(request, maxSyncPushBytes);
  if (!Array.isArray(body.changes) || body.changes.length > 100) throw new HttpError(400, "Lote de sincronização inválido.");
  const applied: SyncEnvelope[] = [];
  const conflicts: Array<{ key: string; local: SyncPushChange; remote: SyncEnvelope }> = [];
  for (const change of body.changes) {
    validateChange(change);
    const table = resourceTables[change.type];
    const current = await env.DB.prepare(`SELECT revision, payload_json, updated_at, deleted_at FROM ${table} WHERE user_id = ? AND resource_id = ?`).bind(auth.userId, change.id).first<StoredRecord>();
    const currentRevision = current?.revision ?? 0;
    if (currentRevision !== change.expectedRevision) {
      conflicts.push({ key: `${change.type}:${change.id}`, local: change, remote: toEnvelope(change.type, change.id, current) });
      continue;
    }
    const revision = currentRevision + 1;
    const updatedAt = new Date().toISOString();
    const deletedAt = change.deleted ? updatedAt : null;
    const payloadJson = change.deleted ? null : JSON.stringify(change.payload);
    if (payloadJson && byteLength(payloadJson) > 1_500_000) throw new HttpError(413, "Um registro sincronizado excede o limite permitido.");
    const result = await env.DB.prepare(`INSERT INTO ${table} (user_id, resource_id, revision, payload_json, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, resource_id) DO UPDATE SET revision = excluded.revision, payload_json = excluded.payload_json, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at WHERE ${table}.revision = ? RETURNING revision`)
      .bind(auth.userId, change.id, revision, payloadJson, updatedAt, deletedAt, currentRevision).first<{ revision: number }>();
    if (!result) {
      const remote = await env.DB.prepare(`SELECT revision, payload_json, updated_at, deleted_at FROM ${table} WHERE user_id = ? AND resource_id = ?`).bind(auth.userId, change.id).first<StoredRecord>();
      conflicts.push({ key: `${change.type}:${change.id}`, local: change, remote: toEnvelope(change.type, change.id, remote) });
      continue;
    }
    await env.DB.prepare("INSERT INTO sync_changes (user_id, resource_type, resource_id, revision, payload_json, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(auth.userId, change.type, change.id, revision, payloadJson, updatedAt, deletedAt).run();
    await updateMediaReferences(auth.userId, change, env);
    applied.push({ type: change.type, id: change.id, revision, updatedAt, ...(deletedAt ? { deletedAt } : {}), ...(change.deleted ? {} : { payload: change.payload }) });
  }
  await removeUnreferencedMedia(auth.userId, env);
  return json({ applied, conflicts });
}

async function updateMediaReferences(userId: string, change: SyncPushChange, env: Env): Promise<void> {
  const mediaIds = change.deleted ? [] : [...collectMediaIds(change.payload)];
  for (const mediaId of mediaIds) {
    const owned = await env.DB.prepare("SELECT id FROM media_assets WHERE id = ? AND user_id = ?").bind(mediaId, userId).first();
    if (!owned) throw new HttpError(400, "Uma imagem referenciada não pertence à conta atual.");
  }
  const statements = [env.DB.prepare("DELETE FROM media_references WHERE user_id = ? AND resource_type = ? AND resource_id = ?").bind(userId, change.type, change.id)];
  mediaIds.forEach((mediaId) => statements.push(env.DB.prepare("INSERT INTO media_references (user_id, resource_type, resource_id, media_id) VALUES (?, ?, ?, ?)").bind(userId, change.type, change.id, mediaId)));
  await env.DB.batch(statements);
}

async function removeUnreferencedMedia(userId: string, env: Env): Promise<void> {
  const unused = await env.DB.prepare("SELECT id, object_key FROM media_assets WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id)").bind(userId).all<{ id: string; object_key: string }>();
  for (const media of unused.results) {
    await env.MEDIA.delete(media.object_key);
    await env.DB.prepare("DELETE FROM media_assets WHERE id = ? AND user_id = ?").bind(media.id, userId).run();
  }
}

function collectMediaIds(value: unknown, found = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return found;
  if ("$soulforgeMedia" in value && typeof (value as { $soulforgeMedia?: unknown }).$soulforgeMedia === "string") {
    found.add((value as { $soulforgeMedia: string }).$soulforgeMedia);
    return found;
  }
  if (Array.isArray(value)) value.forEach((entry) => collectMediaIds(entry, found));
  else Object.values(value).forEach((entry) => collectMediaIds(entry, found));
  return found;
}

async function pullChanges(url: URL, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const cursor = Math.max(0, Number(url.searchParams.get("cursor") ?? "0") || 0);
  const result = await env.DB.prepare("SELECT seq, resource_type, resource_id, revision, payload_json, updated_at, deleted_at FROM sync_changes WHERE user_id = ? AND seq > ? ORDER BY seq ASC LIMIT 500").bind(auth.userId, cursor).all<ChangeRecord>();
  const changes = result.results.map((record) => ({ type: record.resource_type, id: record.resource_id, revision: record.revision, updatedAt: record.updated_at, ...(record.deleted_at ? { deletedAt: record.deleted_at } : {}), ...(record.payload_json ? { payload: JSON.parse(record.payload_json) as unknown } : {}) } satisfies SyncEnvelope));
  return json({ cursor: result.results.at(-1)?.seq ?? cursor, changes });
}

async function uploadMedia(request: Request, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const mimeType = request.headers.get("Content-Type")?.split(";")[0] ?? "";
  const claimedChecksum = request.headers.get("X-Media-Checksum") ?? "";
  if (!allowedMediaTypes.has(mimeType)) throw new HttpError(415, "Use uma imagem PNG, JPG ou WebP.");
  const bytes = await readLimitedBody(request, maxImageBytes);
  if (!bytes.byteLength || bytes.byteLength > maxImageBytes) throw new HttpError(413, "A imagem deve ter no máximo 1,5 MB.");
  if (!matchesImageSignature(bytes, mimeType)) throw new HttpError(415, "O conteúdo do arquivo não corresponde ao formato informado.");
  const checksum = await sha256Hex(bytes);
  if (claimedChecksum && claimedChecksum !== checksum) throw new HttpError(400, "A imagem foi alterada durante o envio.");
  const existing = await env.DB.prepare("SELECT id FROM media_assets WHERE user_id = ? AND checksum = ?").bind(auth.userId, checksum).first<{ id: string }>();
  if (existing) return json(existing);
  const usage = await env.DB.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media_assets WHERE user_id = ?").bind(auth.userId).first<{ total: number }>();
  if ((usage?.total ?? 0) + bytes.byteLength > accountMediaQuota) throw new HttpError(413, "A conta atingiu o limite de 100 MB de imagens.");
  const id = crypto.randomUUID();
  const objectKey = `users/${auth.userId}/${id}`;
  await env.MEDIA.put(objectKey, bytes, { httpMetadata: { contentType: mimeType }, customMetadata: { checksum } });
  await env.DB.prepare("INSERT INTO media_assets (id, user_id, object_key, checksum, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, auth.userId, objectKey, checksum, mimeType, bytes.byteLength, new Date().toISOString()).run();
  return json({ id }, 201);
}

async function downloadMedia(id: string, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const media = await env.DB.prepare("SELECT object_key, mime_type FROM media_assets WHERE id = ? AND user_id = ?").bind(id, auth.userId).first<{ object_key: string; mime_type: string }>();
  if (!media) throw new HttpError(404, "Imagem não encontrada.");
  const object = await env.MEDIA.get(media.object_key);
  if (!object) throw new HttpError(404, "Imagem não encontrada.");
  return new Response(object.body, { headers: { "Content-Type": media.mime_type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
}

async function deleteAccount(auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const media = await env.DB.prepare("SELECT object_key FROM media_assets WHERE user_id = ?").bind(auth.userId).all<{ object_key: string }>();
  for (const entry of media.results) await env.MEDIA.delete(entry.object_key);
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(auth.userId).run();
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearCookie() } });
}

async function verifyGoogleCredential(token: string, clientId: string): Promise<GoogleClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Credencial do Google inválida.");
  const header = decodeJwtPart<{ alg?: string; kid?: string }>(parts[0]);
  const claims = decodeJwtPart<GoogleClaims>(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new HttpError(401, "Algoritmo de autenticação não permitido.");
  const keys = await getGoogleKeys();
  const jwk = keys.find((key) => (key as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!jwk) throw new HttpError(401, "Chave do Google não reconhecida.");
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signature = base64UrlBytes(parts[2]);
  const signatureBuffer = signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer;
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signatureBuffer, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid || !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) || claims.aud !== clientId || claims.exp * 1000 <= Date.now() || !claims.email_verified || !claims.sub || !claims.email) throw new HttpError(401, "Credencial do Google inválida ou expirada.");
  return claims;
}

async function getGoogleKeys(): Promise<JsonWebKey[]> {
  if (googleKeys && googleKeys.expiresAt > Date.now()) return googleKeys.keys;
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new HttpError(503, "Não foi possível validar o login com o Google.");
  const body = await response.json<{ keys: JsonWebKey[] }>();
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("Cache-Control") ?? "")?.[1] ?? "3600");
  googleKeys = { keys: body.keys, expiresAt: Date.now() + maxAge * 1000 };
  return body.keys;
}

type StoredRecord = { revision: number; payload_json: string | null; updated_at: string; deleted_at: string | null };
type ChangeRecord = StoredRecord & { seq: number; resource_type: SyncResourceType; resource_id: string };

function toEnvelope(type: SyncResourceType, id: string, record: StoredRecord | null): SyncEnvelope {
  if (!record) return { type, id, revision: 0, updatedAt: new Date(0).toISOString() };
  return { type, id, revision: record.revision, updatedAt: record.updated_at, ...(record.deleted_at ? { deletedAt: record.deleted_at } : {}), ...(record.payload_json ? { payload: JSON.parse(record.payload_json) as unknown } : {}) };
}

function validateChange(value: SyncPushChange): void {
  if (!value || typeof value.mutationId !== "string" || !value.mutationId || !Object.hasOwn(resourceTables, value.type) || typeof value.id !== "string" || !value.id || value.id.length > 200 || !Number.isInteger(value.expectedRevision) || value.expectedRevision < 0 || typeof value.deleted !== "boolean" || (!value.deleted && (value.payload === undefined || value.payload === null))) throw new HttpError(400, "Alteração de sincronização inválida.");
  if (value.type === "definition" && !value.deleted && (value.payload as { packId?: string }).packId !== "local") throw new HttpError(400, "Somente criações locais podem ser sincronizadas.");
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null" || origin !== new URL(request.url).origin) throw new HttpError(403, "Origem não permitida.");
}

async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const mimeType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (mimeType !== "application/json") throw new HttpError(415, "Envie o corpo como application/json.");
  const bytes = await readLimitedBody(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0) throw new HttpError(400, "Content-Length inválido.");
    if (declaredBytes > maxBytes) throw new HttpError(413, "O corpo da requisição excede o limite permitido.");
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("request body limit exceeded");
        throw new HttpError(413, "O corpo da requisição excede o limite permitido.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function matchesImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

function readCookie(request: Request, name: string): string | undefined {
  const match = request.headers.get("Cookie")?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function cookie(token: string, expiresAt: string): string {
  return `${sessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

function clearCookie(): string {
  return `${sessionCookie}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

async function sha256Hex(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decodeJwtPart<T>(value: string): T {
  try { return JSON.parse(new TextDecoder().decode(base64UrlBytes(value))) as T; } catch { throw new HttpError(401, "Credencial do Google inválida."); }
}

function base64UrlBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function json(value: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  secured.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secured.headers.set("X-Frame-Options", "DENY");
  secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()");
  if (!secured.headers.has("Content-Security-Policy")) secured.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return secured;
}

class HttpError extends Error {
  readonly isHttpError = true;
  constructor(readonly status: number, message: string) { super(message); this.name = "HttpError"; }
}

function isHttpError(error: unknown): error is HttpError {
  return Boolean(error && typeof error === "object" && "isHttpError" in error && "status" in error && typeof (error as { status?: unknown }).status === "number");
}
