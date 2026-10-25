import type { SyncEnvelope, SyncPushChange, SyncResourceType } from "../src/sync/types";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  PACK_LIBRARY: R2Bucket;
  GOOGLE_CLIENT_ID?: string;
  SYNC_ENABLED?: string;
}

type AuthenticatedRequest = { userId: string; sessionId: string };
type GoogleClaims = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string; iss: string; aud: string; exp: number };

const maxImageBytes = 1_500_000;
const maxGoogleLoginBytes = 32 * 1024;
const maxSyncPushBytes = 2_000_000;
const maxLibraryCatalogBytes = 200_000;
const accountMediaQuota = 100_000_000;
const orphanGraceMs = 24 * 60 * 60 * 1000;
const cleanupBatchLimit = 100;
const maxCleanupBatches = 5;
const syncRetentionMs = 90 * 24 * 60 * 60 * 1000;
const snapshotTtlMs = 60 * 60 * 1000;
const syncCompactionLimit = 500;
const tombstoneCompactionLimit = 100;
const syncPullLimit = 20;
const snapshotQueryLimit = 21;
const snapshotResponseBytes = 1_800_000;
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

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;
    try {
      response = url.pathname.startsWith("/api/")
        ? await handleApiRequest(request, url, env)
        : await env.ASSETS.fetch(request);
    } catch (error) {
      if (isHttpError(error)) response = json({ error: error.message, ...(error.code ? { code: error.code } : {}) }, error.status);
      else {
        console.error({ event: "worker_error", errorName: error instanceof Error ? error.name : "UnknownError" });
        response = json({ error: "Falha interna do SoulForge." }, 500);
      }
    }
    return withSecurityHeaders(response);
  },
  async scheduled(controller: ScheduledController, env: Env, _context: ExecutionContext): Promise<void> {
    const startedAt = Date.now();
    try {
      const result = await performCloudMaintenance(controller.scheduledTime, env);
      console.info({ event: "cloud_maintenance_completed", ...result, durationMs: Date.now() - startedAt });
    } catch (error) {
      console.error({ event: "cloud_maintenance_failed", errorName: error instanceof Error ? error.name : "UnknownError", durationMs: Date.now() - startedAt });
      throw error;
    }
  }
} satisfies ExportedHandler<Env>;

export default worker;

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  if (mutatingMethods.has(request.method)) assertSameOrigin(request);
  if (url.pathname === "/api/config" && request.method === "GET") return json({ googleClientId: env.GOOGLE_CLIENT_ID, syncEnabled: isSyncEnabled(env) });
  if (url.pathname === "/api/session" && request.method === "GET") return sessionResponse(request, env);
  if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
  const isGoogleLogin = url.pathname === "/api/auth/google" && request.method === "POST";
  const isAccountDeletion = url.pathname === "/api/account" && request.method === "DELETE";
  const isSyncPush = url.pathname === "/api/sync/push" && request.method === "POST";
  const isSyncPull = url.pathname === "/api/sync/pull" && request.method === "GET";
  const isSyncSnapshot = url.pathname.startsWith("/api/sync/snapshot/") && request.method === "GET";
  const isMediaUpload = url.pathname === "/api/media" && request.method === "POST";
  const isMediaDownload = url.pathname.startsWith("/api/media/") && request.method === "GET";
  const isLibraryCatalog = url.pathname === "/api/library/catalog" && request.method === "GET";
  const isLibraryPack = url.pathname.startsWith("/api/library/packs/") && request.method === "GET";
  if (!isGoogleLogin && !isAccountDeletion && !isSyncPush && !isSyncPull && !isSyncSnapshot && !isMediaUpload && !isMediaDownload && !isLibraryCatalog && !isLibraryPack) return json({ error: "Rota não encontrada." }, 404);
  if (!isSyncEnabled(env)) throw new HttpError(503, "A sincronização está temporariamente indisponível.");
  if (isGoogleLogin) return googleLogin(request, env);
  const auth = await requireSession(request, env);
  if (isAccountDeletion) return deleteAccount(auth, env);
  if (isSyncPush) return pushChanges(request, auth, env);
  if (isSyncPull) return pullChanges(request, auth, env);
  if (isSyncSnapshot) return pullSnapshot(url, auth, env);
  if (isMediaUpload) return uploadMedia(request, auth, env);
  if (isLibraryCatalog) return privateLibraryCatalog(auth, env);
  if (isLibraryPack) return privateLibraryPack(url, auth, env);
  return downloadMedia(decodeURIComponent(url.pathname.slice("/api/media/".length)), auth, env);
}

async function sessionResponse(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireSession(request, env);
    const user = await env.DB.prepare("SELECT id, email, name, picture FROM users WHERE id = ?").bind(auth.userId).first<{ id: string; email: string; name: string; picture?: string }>();
    return json(user ? { authenticated: true, user } : { authenticated: false });
  } catch (error) {
    if (isHttpError(error) && (error.status === 401 || error.status === 403)) return json({ authenticated: false });
    throw error;
  }
}

async function googleLogin(request: Request, env: Env): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, "Login Google ainda não foi configurado.");
  const body = await readJsonBody<{ credential?: string }>(request, maxGoogleLoginBytes);
  if (!body.credential) throw new HttpError(400, "Credencial do Google ausente.");
  const claims = await verifyGoogleCredential(body.credential, env.GOOGLE_CLIENT_ID);
  const email = normalizeEmail(claims.email);
  if (!await isAuthorizedEmail(email, env)) throw new HttpError(403, "Esta conta não está autorizada para o período privado de testes.");
  const userId = await sha256Hex(`google:${claims.sub}`);
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_login_at = excluded.last_login_at")
    .bind(userId, claims.sub, email, claims.name ?? email, claims.picture ?? null, now, now).run();
  const token = randomToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").bind(sessionId, userId, await sha256Hex(token), expiresAt, now).run();
  return json({ authenticated: true, user: { id: userId, email, name: claims.name ?? email, picture: claims.picture } }, 200, { "Set-Cookie": cookie(token, expiresAt) });
}

async function logout(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request, sessionCookie);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearCookie() } });
}

async function requireSession(request: Request, env: Env): Promise<AuthenticatedRequest> {
  const token = readCookie(request, sessionCookie);
  if (!token) throw new HttpError(401, "Entre com Google para usar a nuvem.");
  const session = await env.DB.prepare("SELECT sessions.id, sessions.user_id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?").bind(await sha256Hex(token), new Date().toISOString()).first<{ id: string; user_id: string; email: string }>();
  if (!session) throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  if (!await isAuthorizedEmail(session.email, env)) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session.id).run();
    throw new HttpError(403, "Esta conta não está autorizada para o período privado de testes.");
  }
  return { userId: session.user_id, sessionId: session.id };
}

async function privateLibraryCatalog(_auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const object = await env.PACK_LIBRARY.get("catalog.json");
  if (!object) throw new HttpError(404, "A biblioteca privada ainda não foi publicada.");
  const bytes = await readLimitedR2Object(object, maxLibraryCatalogBytes);
  const catalog = validatePrivateLibraryCatalog(JSON.parse(new TextDecoder().decode(bytes)));
  return json(catalog, 200, { "Cache-Control": "private, no-store" });
}

async function privateLibraryPack(url: URL, _auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const match = /^\/api\/library\/packs\/([^/]+)\/([^/]+)$/.exec(url.pathname);
  if (!match) throw new HttpError(404, "Pack não encontrado.");
  const id = decodeURIComponent(match[1]);
  const version = decodeURIComponent(match[2]);
  const catalogObject = await env.PACK_LIBRARY.get("catalog.json");
  if (!catalogObject) throw new HttpError(404, "A biblioteca privada ainda não foi publicada.");
  const catalog = validatePrivateLibraryCatalog(JSON.parse(new TextDecoder().decode(await readLimitedR2Object(catalogObject, maxLibraryCatalogBytes))));
  if (!catalog.packs.some((entry) => entry.id === id && entry.version === version)) throw new HttpError(404, "Pack não encontrado.");
  const object = await env.PACK_LIBRARY.get(`packs/${id}/${version}.soulforge-pack.json`);
  if (!object) throw new HttpError(404, "Pack não encontrado.");
  return new Response(object.body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "Content-Disposition": "attachment; filename=pack.soulforge-pack.json", "X-Content-Type-Options": "nosniff" } });
}

type PrivateLibraryCatalog = { format: "soulforge-private-library-v1"; publishedAt: string; packs: Array<{ id: string; name: string; version: string; checksum: string; changes: string; definitionCount: number }> };

function validatePrivateLibraryCatalog(value: unknown): PrivateLibraryCatalog {
  if (!value || typeof value !== "object") throw new HttpError(503, "O catálogo privado está inválido.");
  const catalog = value as Partial<PrivateLibraryCatalog>;
  if (catalog.format !== "soulforge-private-library-v1" || typeof catalog.publishedAt !== "string" || !Array.isArray(catalog.packs) || !catalog.packs.length) throw new HttpError(503, "O catálogo privado está inválido.");
  const ids = new Set<string>();
  const packs = catalog.packs.map((entry) => {
    if (!entry || typeof entry !== "object") throw new HttpError(503, "O catálogo privado está inválido.");
    const pack = entry as Partial<PrivateLibraryCatalog["packs"][number]>;
    if (typeof pack.id !== "string" || !/^[a-z0-9][a-z0-9.-]{1,150}$/i.test(pack.id) || ids.has(pack.id) || typeof pack.name !== "string" || !pack.name || typeof pack.version !== "string" || !/^[a-z0-9][a-z0-9.+-]{0,80}$/i.test(pack.version) || typeof pack.checksum !== "string" || !/^[a-f0-9]{64}$/i.test(pack.checksum) || typeof pack.changes !== "string" || !pack.changes.trim() || !Number.isInteger(pack.definitionCount) || Number(pack.definitionCount) < 1) throw new HttpError(503, "O catálogo privado está inválido.");
    const id = pack.id as string;
    const name = pack.name as string;
    const version = pack.version as string;
    const checksum = pack.checksum as string;
    const changes = pack.changes as string;
    const definitionCount = pack.definitionCount as number;
    ids.add(id);
    return { id, name, version, checksum, changes, definitionCount };
  });
  return { format: "soulforge-private-library-v1", publishedAt: catalog.publishedAt, packs };
}

async function readLimitedR2Object(object: R2ObjectBody, maxBytes: number): Promise<Uint8Array> {
  if (object.size > maxBytes) throw new HttpError(503, "O catálogo privado excede o limite permitido.");
  return new Uint8Array(await object.arrayBuffer());
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function isAuthorizedEmail(email: string, env: Env): Promise<boolean> {
  return Boolean(await env.DB.prepare("SELECT email FROM authorized_emails WHERE email = ?").bind(normalizeEmail(email)).first());
}

async function pushChanges(request: Request, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const { deviceId, cursor } = readSyncIdentity(request, auth.sessionId);
  await assertCursorRetained(auth.userId, cursor, env);
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
    const mediaIds = change.deleted ? [] : [...collectMediaIds(change.payload)];
    for (const mediaId of mediaIds) {
      const owned = await env.DB.prepare("SELECT id FROM media_assets WHERE id = ? AND user_id = ?").bind(mediaId, auth.userId).first();
      if (!owned) throw new HttpError(400, "Uma imagem referenciada não pertence à conta atual.");
    }
    const mutationApplied = `EXISTS (SELECT 1 FROM ${table} WHERE user_id = ? AND resource_id = ? AND last_mutation_id = ? AND updated_at = ?)`;
    const statements = [
      env.DB.prepare(`INSERT INTO ${table} (user_id, resource_id, revision, payload_json, updated_at, deleted_at, last_mutation_id) SELECT ?, ?, ?, ?, ?, ?, ? WHERE COALESCE((SELECT compacted_through_seq FROM sync_retention_state WHERE user_id = ?), 0) <= ? ON CONFLICT(user_id, resource_id) DO UPDATE SET revision = excluded.revision, payload_json = excluded.payload_json, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, last_mutation_id = excluded.last_mutation_id WHERE ${table}.revision = ? RETURNING revision`)
        .bind(auth.userId, change.id, revision, payloadJson, updatedAt, deletedAt, change.mutationId, auth.userId, cursor, currentRevision),
      env.DB.prepare(`DELETE FROM media_references WHERE user_id = ? AND resource_type = ? AND resource_id = ? AND ${mutationApplied}`)
        .bind(auth.userId, change.type, change.id, auth.userId, change.id, change.mutationId, updatedAt)
    ];
    mediaIds.forEach((mediaId) => statements.push(env.DB.prepare(`INSERT INTO media_references (user_id, resource_type, resource_id, media_id) SELECT ?, ?, ?, ? WHERE ${mutationApplied}`)
      .bind(auth.userId, change.type, change.id, mediaId, auth.userId, change.id, change.mutationId, updatedAt)));
    statements.push(env.DB.prepare(`INSERT INTO sync_changes (user_id, resource_type, resource_id, revision, payload_json, updated_at, deleted_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE ${mutationApplied}`)
      .bind(auth.userId, change.type, change.id, revision, payloadJson, updatedAt, deletedAt, auth.userId, change.id, change.mutationId, updatedAt));
    statements.push(env.DB.prepare(`UPDATE media_assets SET unreferenced_at = NULL WHERE user_id = ? AND EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id) AND ${mutationApplied}`)
      .bind(auth.userId, auth.userId, change.id, change.mutationId, updatedAt));
    statements.push(env.DB.prepare(`UPDATE media_assets SET unreferenced_at = COALESCE(unreferenced_at, ?) WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id) AND ${mutationApplied}`)
      .bind(updatedAt, auth.userId, auth.userId, change.id, change.mutationId, updatedAt));
    const [result] = await env.DB.batch(statements);
    if (!result.results.length) {
      await assertCursorRetained(auth.userId, cursor, env);
      const remote = await env.DB.prepare(`SELECT revision, payload_json, updated_at, deleted_at FROM ${table} WHERE user_id = ? AND resource_id = ?`).bind(auth.userId, change.id).first<StoredRecord>();
      conflicts.push({ key: `${change.type}:${change.id}`, local: change, remote: toEnvelope(change.type, change.id, remote) });
      continue;
    }
    applied.push({ type: change.type, id: change.id, revision, updatedAt, ...(deletedAt ? { deletedAt } : {}), ...(change.deleted ? {} : { payload: change.payload }) });
  }
  await acknowledgeDevice(auth.userId, deviceId, cursor, env);
  return json({ applied, conflicts });
}

async function performCloudMaintenance(scheduledTime: number, env: Env): Promise<{ expiredSessions: number; mediaQueued: number; mediaDeleted: number; mediaPendingRetry: number; expiredDevices: number; expiredSnapshots: number; syncChangesCompacted: number; tombstonesCompacted: number }> {
  const now = new Date(scheduledTime).toISOString();
  const cutoff = new Date(scheduledTime - orphanGraceMs).toISOString();
  const retentionCutoff = new Date(scheduledTime - syncRetentionMs).toISOString();
  const sessions = await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
  await env.DB.batch([
    env.DB.prepare("UPDATE media_assets SET unreferenced_at = NULL WHERE EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id)"),
    env.DB.prepare("UPDATE media_assets SET unreferenced_at = COALESCE(unreferenced_at, ?) WHERE NOT EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id)").bind(now)
  ]);

  let mediaQueued = 0;
  let mediaDeleted = 0;
  for (let batchIndex = 0; batchIndex < maxCleanupBatches; batchIndex += 1) {
    const [queued] = await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO media_cleanup_queue (media_id, object_key, queued_at) SELECT id, object_key, ? FROM media_assets WHERE unreferenced_at <= ? AND NOT EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id) ORDER BY unreferenced_at ASC LIMIT ?").bind(now, cutoff, cleanupBatchLimit),
      env.DB.prepare("DELETE FROM media_assets WHERE id IN (SELECT media_id FROM media_cleanup_queue) AND unreferenced_at <= ? AND NOT EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id)").bind(cutoff),
      env.DB.prepare("DELETE FROM media_cleanup_queue WHERE EXISTS (SELECT 1 FROM media_assets WHERE media_assets.id = media_cleanup_queue.media_id)")
    ]);
    mediaQueued += queued.meta.changes ?? 0;
    const pending = await env.DB.prepare("SELECT media_id, object_key FROM media_cleanup_queue ORDER BY queued_at ASC LIMIT ?").bind(cleanupBatchLimit).all<{ media_id: string; object_key: string }>();
    if (!pending.results.length) break;
    await env.MEDIA.delete(pending.results.map((entry) => entry.object_key));
    const placeholders = pending.results.map(() => "?").join(", ");
    await env.DB.prepare(`DELETE FROM media_cleanup_queue WHERE media_id IN (${placeholders})`).bind(...pending.results.map((entry) => entry.media_id)).run();
    mediaDeleted += pending.results.length;
    if (pending.results.length < cleanupBatchLimit) break;
  }
  const retry = await env.DB.prepare("SELECT COUNT(*) AS count FROM media_cleanup_queue").first<{ count: number }>();
  const candidateSql = `SELECT c.user_id, c.seq FROM sync_changes c
    WHERE c.updated_at <= ? AND c.seq <= COALESCE(
      (SELECT MIN(d.acknowledged_seq) FROM sync_devices d WHERE d.user_id = c.user_id AND d.last_ack_at > ?),
      (SELECT MAX(c2.seq) FROM sync_changes c2 WHERE c2.user_id = c.user_id), 0)
    ORDER BY c.seq ASC LIMIT ?`;
  const retention = await env.DB.batch([
    env.DB.prepare("DELETE FROM sync_snapshot_sessions WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM sync_devices WHERE last_ack_at <= ?").bind(retentionCutoff),
    env.DB.prepare(`INSERT INTO sync_retention_state (user_id, compacted_through_seq, last_compacted_at)
      SELECT user_id, MAX(seq), ? FROM (${candidateSql}) GROUP BY user_id
      ON CONFLICT(user_id) DO UPDATE SET compacted_through_seq = MAX(sync_retention_state.compacted_through_seq, excluded.compacted_through_seq), last_compacted_at = excluded.last_compacted_at`)
      .bind(now, retentionCutoff, retentionCutoff, syncCompactionLimit),
    env.DB.prepare(`DELETE FROM sync_changes WHERE seq IN (SELECT seq FROM (${candidateSql}))`)
      .bind(retentionCutoff, retentionCutoff, syncCompactionLimit),
    tombstoneDeleteStatement(env, "characters", "character", retentionCutoff),
    tombstoneDeleteStatement(env, "definitions", "definition", retentionCutoff),
    tombstoneDeleteStatement(env, "definition_overrides", "override", retentionCutoff)
  ]);
  return {
    expiredSessions: sessions.meta.changes ?? 0,
    mediaQueued,
    mediaDeleted,
    mediaPendingRetry: retry?.count ?? 0,
    expiredSnapshots: retention[0].meta.changes ?? 0,
    expiredDevices: retention[1].meta.changes ?? 0,
    syncChangesCompacted: retention[3].meta.changes ?? 0,
    tombstonesCompacted: retention.slice(4).reduce((total, result) => total + (result.meta.changes ?? 0), 0)
  };
}

function tombstoneDeleteStatement(env: Env, table: string, type: SyncResourceType, cutoff: string): D1PreparedStatement {
  return env.DB.prepare(`DELETE FROM ${table} WHERE rowid IN (
    SELECT resource.rowid FROM ${table} resource
    JOIN sync_retention_state state ON state.user_id = resource.user_id
    WHERE resource.deleted_at IS NOT NULL AND resource.deleted_at <= ?
      AND NOT EXISTS (
        SELECT 1 FROM sync_changes change
        WHERE change.user_id = resource.user_id AND change.resource_type = ? AND change.resource_id = resource.resource_id
      )
    ORDER BY resource.deleted_at ASC LIMIT ?
  )`).bind(cutoff, type, tombstoneCompactionLimit);
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

async function pullChanges(request: Request, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const { deviceId, cursor } = readSyncIdentity(request, auth.sessionId, new URL(request.url).searchParams.get("cursor"));
  const floor = await compactedFloor(auth.userId, env);
  if (cursor < floor) {
    const now = new Date();
    const snapshotId = crypto.randomUUID();
    const baseline = await env.DB.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM sync_changes WHERE user_id = ?").bind(auth.userId).first<{ seq: number }>();
    const baselineCursor = Math.max(floor, baseline?.seq ?? 0);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO sync_snapshot_sessions (id, user_id, device_id, baseline_seq, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(snapshotId, auth.userId, deviceId, baselineCursor, now.toISOString(), new Date(now.getTime() + snapshotTtlMs).toISOString()),
      deviceAcknowledgementStatement(env, auth.userId, deviceId, cursor, now.toISOString())
    ]);
    return json({ mode: "reset-required", snapshotId, baselineCursor });
  }
  const result = await env.DB.prepare("SELECT seq, resource_type, resource_id, revision, payload_json, updated_at, deleted_at FROM sync_changes WHERE user_id = ? AND seq > ? ORDER BY seq ASC LIMIT ?").bind(auth.userId, cursor, syncPullLimit + 1).all<ChangeRecord>();
  const changes: SyncEnvelope[] = [];
  let usedBytes = 0;
  let lastSeq = cursor;
  for (const record of result.results.slice(0, syncPullLimit)) {
    const envelope = changeRecordToEnvelope(record);
    const size = byteLength(JSON.stringify(envelope));
    if (changes.length && usedBytes + size > snapshotResponseBytes) break;
    changes.push(envelope);
    usedBytes += size;
    lastSeq = record.seq;
  }
  await acknowledgeDevice(auth.userId, deviceId, cursor, env);
  return json({ mode: "incremental", cursor: lastSeq, changes, hasMore: changes.length < result.results.length || result.results.length > syncPullLimit });
}

async function pullSnapshot(url: URL, auth: AuthenticatedRequest, env: Env): Promise<Response> {
  const snapshotId = url.pathname.slice("/api/sync/snapshot/".length);
  if (!isDeviceId(snapshotId)) throw new HttpError(400, "Identificador de reconstrução inválido.");
  const session = await env.DB.prepare("SELECT baseline_seq, expires_at FROM sync_snapshot_sessions WHERE id = ? AND user_id = ?")
    .bind(snapshotId, auth.userId).first<{ baseline_seq: number; expires_at: string }>();
  if (!session || session.expires_at <= new Date().toISOString()) throw new HttpError(410, "A reconstrução expirou e será reiniciada.", "sync_snapshot_expired");
  const after = decodeSnapshotCursor(url.searchParams.get("after"));
  const rows = await env.DB.prepare(`SELECT resource_type, resource_id, revision, payload_json, updated_at, deleted_at, sort_key FROM (
      SELECT 'character' AS resource_type, resource_id, revision, payload_json, updated_at, deleted_at, 'character:' || resource_id AS sort_key FROM characters WHERE user_id = ? AND deleted_at IS NULL
      UNION ALL
      SELECT 'definition', resource_id, revision, payload_json, updated_at, deleted_at, 'definition:' || resource_id FROM definitions WHERE user_id = ? AND deleted_at IS NULL
      UNION ALL
      SELECT 'override', resource_id, revision, payload_json, updated_at, deleted_at, 'override:' || resource_id FROM definition_overrides WHERE user_id = ? AND deleted_at IS NULL
    ) WHERE sort_key > ? ORDER BY sort_key ASC LIMIT ?`)
    .bind(auth.userId, auth.userId, auth.userId, after, snapshotQueryLimit).all<ResourceRecord & { sort_key: string }>();
  const changes: SyncEnvelope[] = [];
  let usedBytes = 0;
  let nextCursor: string | undefined;
  for (const row of rows.results) {
    const envelope = changeRecordToEnvelope(row);
    const size = byteLength(JSON.stringify(envelope));
    if (changes.length && usedBytes + size > snapshotResponseBytes) break;
    changes.push(envelope);
    usedBytes += size;
    nextCursor = encodeSnapshotCursor(row.sort_key);
  }
  const done = changes.length === rows.results.length && rows.results.length < snapshotQueryLimit;
  return json({ snapshotId, baselineCursor: session.baseline_seq, changes, ...(done ? {} : { nextCursor }), done });
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
  const createdAt = new Date().toISOString();
  const existing = await env.DB.prepare("UPDATE media_assets SET unreferenced_at = CASE WHEN EXISTS (SELECT 1 FROM media_references WHERE media_references.media_id = media_assets.id) THEN NULL ELSE ? END WHERE user_id = ? AND checksum = ? RETURNING id").bind(createdAt, auth.userId, checksum).first<{ id: string }>();
  if (existing) return json(existing);
  const usage = await env.DB.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media_assets WHERE user_id = ?").bind(auth.userId).first<{ total: number }>();
  if ((usage?.total ?? 0) + bytes.byteLength > accountMediaQuota) throw new HttpError(413, "A conta atingiu o limite de 100 MB de imagens.");
  const id = crypto.randomUUID();
  const objectKey = `users/${auth.userId}/${id}`;
  await env.MEDIA.put(objectKey, bytes, { httpMetadata: { contentType: mimeType }, customMetadata: { checksum } });
  try {
    await env.DB.prepare("INSERT INTO media_assets (id, user_id, object_key, checksum, mime_type, size_bytes, created_at, unreferenced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, auth.userId, objectKey, checksum, mimeType, bytes.byteLength, createdAt, createdAt).run();
  } catch (error) {
    try {
      await env.MEDIA.delete(objectKey);
    } catch (cleanupError) {
      console.error({ event: "media_upload_compensation_failed", errorName: cleanupError instanceof Error ? cleanupError.name : "UnknownError" });
    }
    throw error;
  }
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
type ResourceRecord = StoredRecord & { resource_type: SyncResourceType; resource_id: string };
type ChangeRecord = ResourceRecord & { seq: number };

function changeRecordToEnvelope(record: ResourceRecord): SyncEnvelope {
  return { type: record.resource_type, id: record.resource_id, revision: record.revision, updatedAt: record.updated_at, ...(record.deleted_at ? { deletedAt: record.deleted_at } : {}), ...(record.payload_json ? { payload: JSON.parse(record.payload_json) as unknown } : {}) };
}

function readSyncIdentity(request: Request, sessionId: string, fallbackCursor: string | null = null): { deviceId: string; cursor: number } {
  const suppliedDeviceId = request.headers.get("X-SoulForge-Device-Id");
  if (suppliedDeviceId && !isDeviceId(suppliedDeviceId)) throw new HttpError(400, "Identificador de dispositivo inválido.");
  return {
    deviceId: suppliedDeviceId ?? `legacy:${sessionId}`,
    cursor: readCursor(request.headers.get("X-SoulForge-Sync-Cursor") ?? fallbackCursor)
  };
}

function isDeviceId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readCursor(value: string | null): number {
  const cursor = Number(value ?? "0");
  if (!Number.isSafeInteger(cursor) || cursor < 0) throw new HttpError(400, "Cursor de sincronização inválido.");
  return cursor;
}

async function compactedFloor(userId: string, env: Env): Promise<number> {
  const state = await env.DB.prepare("SELECT compacted_through_seq FROM sync_retention_state WHERE user_id = ?").bind(userId).first<{ compacted_through_seq: number }>();
  return state?.compacted_through_seq ?? 0;
}

async function assertCursorRetained(userId: string, cursor: number, env: Env): Promise<void> {
  if (cursor < await compactedFloor(userId, env)) throw new HttpError(409, "Este dispositivo precisa reconstruir os dados da nuvem antes de enviar alterações.", "sync_reset_required");
}

function deviceAcknowledgementStatement(env: Env, userId: string, deviceId: string, cursor: number, now: string): D1PreparedStatement {
  return env.DB.prepare("INSERT INTO sync_devices (user_id, device_id, acknowledged_seq, created_at, last_ack_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, device_id) DO UPDATE SET acknowledged_seq = MAX(sync_devices.acknowledged_seq, excluded.acknowledged_seq), last_ack_at = excluded.last_ack_at")
    .bind(userId, deviceId, cursor, now, now);
}

async function acknowledgeDevice(userId: string, deviceId: string, cursor: number, env: Env): Promise<void> {
  await deviceAcknowledgementStatement(env, userId, deviceId, cursor, new Date().toISOString()).run();
}

function encodeSnapshotCursor(value: string): string {
  return base64Url(new TextEncoder().encode(value));
}

function decodeSnapshotCursor(value: string | null): string {
  if (!value) return "";
  try {
    const decoded = new TextDecoder().decode(base64UrlBytes(value));
    if (!/^(character|definition|override):.{1,200}$/.test(decoded)) throw new Error("invalid cursor");
    return decoded;
  } catch { throw new HttpError(400, "Cursor de reconstrução inválido."); }
}

function toEnvelope(type: SyncResourceType, id: string, record: StoredRecord | null): SyncEnvelope {
  if (!record) return { type, id, revision: 0, updatedAt: new Date(0).toISOString() };
  return { type, id, revision: record.revision, updatedAt: record.updated_at, ...(record.deleted_at ? { deletedAt: record.deleted_at } : {}), ...(record.payload_json ? { payload: JSON.parse(record.payload_json) as unknown } : {}) };
}

function validateChange(value: SyncPushChange): void {
  if (!value || typeof value.mutationId !== "string" || !value.mutationId || !Object.hasOwn(resourceTables, value.type) || typeof value.id !== "string" || !value.id || value.id.length > 200 || !Number.isInteger(value.expectedRevision) || value.expectedRevision < 0 || typeof value.deleted !== "boolean" || (!value.deleted && (value.payload === undefined || value.payload === null))) throw new HttpError(400, "Alteração de sincronização inválida.");
  if (value.type === "definition" && !value.deleted && (value.payload as { packId?: string }).packId !== "local") throw new HttpError(400, "Somente criações locais podem ser sincronizadas.");
}

function isSyncEnabled(env: Env): boolean {
  return env.SYNC_ENABLED !== "false" && Boolean(env.GOOGLE_CLIENT_ID);
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
  secured.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  secured.headers.set("X-XSS-Protection", "0");
  secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()");
  if (!secured.headers.has("Content-Security-Policy")) secured.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return secured;
}

class HttpError extends Error {
  readonly isHttpError = true;
  constructor(readonly status: number, message: string, readonly code?: string) { super(message); this.name = "HttpError"; }
}

function isHttpError(error: unknown): error is HttpError {
  return Boolean(error && typeof error === "object" && "isHttpError" in error && "status" in error && typeof (error as { status?: unknown }).status === "number");
}
