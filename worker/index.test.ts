import { env } from "cloudflare:workers";
import { createExecutionContext, createScheduledController, waitOnExecutionContext } from "cloudflare:test";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpResponse, http } from "msw";
import { setupNetwork } from "@msw/cloudflare";
import type { SyncPushChange } from "../src/sync/types";
import worker, { type Env } from "./index";
import { createSigningKey, login, pngBytes, request, resetCloudStorage, sha256Hex, signGoogleToken, testDeviceId, testOrigin } from "./test/helpers";

const network = setupNetwork();
let signingKey: Awaited<ReturnType<typeof createSigningKey>>;

beforeAll(async () => {
  signingKey = await createSigningKey();
  network.enable();
});

beforeEach(async () => {
  await resetCloudStorage();
  network.use(http.get("https://www.googleapis.com/oauth2/v3/certs", () => HttpResponse.json({ keys: [signingKey.publicJwk] }, { headers: { "Cache-Control": "public, max-age=3600" } })));
});

afterEach(() => network.resetHandlers());
afterAll(() => network.disable());

describe("public response hardening", () => {
  it("adds security headers to static assets, API responses and errors", async () => {
    const assets = { fetch: vi.fn(async () => new Response("<!doctype html><title>SoulForge</title>", { headers: { "Content-Type": "text/html" } })) } as unknown as Fetcher;
    const workerEnv = { ...env, ASSETS: assets } as Env;
    const staticResponse = await request("/", {}, undefined, workerEnv);
    const configResponse = await request("/api/config");
    const notFound = await request("/api/not-found");

    for (const response of [staticResponse, configResponse, notFound]) assertSecurityHeaders(response);
    expect(notFound.status).toBe(404);
    const csp = staticResponse.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("script-src 'self' https://accounts.google.com/gsi/client");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style");
    expect(csp).toContain("connect-src 'self' https://accounts.google.com/gsi/");
    expect(csp).toContain("frame-src https://accounts.google.com/gsi/");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/(?:^|\s)\*(?:;|\s|$)/);
    expect(configResponse.headers.get("Cache-Control")).toBe("no-store");
  });

  it("requires the exact request origin for mutations", async () => {
    expect((await request("/api/auth/logout", { method: "POST" })).status).toBe(204);
    expect((await request("/api/auth/logout", { method: "POST", headers: { Origin: "https://example.invalid" } })).status).toBe(403);
    expect((await request("/api/auth/logout", { method: "POST", headers: { Origin: "null" } })).status).toBe(403);
    const missingOrigin = await worker.fetch(new Request(`${testOrigin}/api/auth/logout`, { method: "POST" }), env as Env);
    expect(missingOrigin.status).toBe(403);
    assertSecurityHeaders(missingOrigin);
  });

  it("validates JSON media type, syntax and login body size before parsing", async () => {
    const unsupported = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" });
    expect(unsupported.status).toBe(415);
    const malformed = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    expect(malformed.status).toBe(400);
    const loginOverhead = new TextEncoder().encode(JSON.stringify({ credential: "" })).byteLength;
    const exactBody = JSON.stringify({ credential: "x".repeat(32 * 1024 - loginOverhead) });
    expect(new TextEncoder().encode(exactBody)).toHaveLength(32 * 1024);
    expect((await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: exactBody })).status).toBe(401);
    const oversized = `${exactBody} `;
    expect(new TextEncoder().encode(oversized)).toHaveLength(32 * 1024 + 1);
    expect((await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: oversized })).status).toBe(413);
    const declaredOversized = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": String(32 * 1024 + 1) }, body: "{}" });
    expect(declaredOversized.status).toBe(413);
  });
});

describe("Google authentication and sessions", () => {
  it("rejects malformed and invalid Google credentials", async () => {
    const malformed = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: "invalid" }) });
    expect(malformed.status).toBe(401);

    const otherKey = await createSigningKey();
    const cases = [
      await signGoogleToken(otherKey.privateKey),
      await signGoogleToken(signingKey.privateKey, { exp: Math.floor(Date.now() / 1000) - 1 }),
      await signGoogleToken(signingKey.privateKey, { aud: "another-client.apps.googleusercontent.com" }),
      await signGoogleToken(signingKey.privateKey, { iss: "https://example.invalid" }),
      await signGoogleToken(signingKey.privateKey, { email_verified: false })
    ];
    for (const credential of cases) {
      const response = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
      expect(response.status).toBe(401);
    }
  });

  it("creates an opaque secure session and updates the same Google account", async () => {
    const first = await login(signingKey.privateKey);
    expect(first.response.status).toBe(200);
    const setCookie = first.response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    const rawToken = first.cookie.split("=")[1];
    const stored = await env.DB.prepare("SELECT token_hash FROM sessions").first<{ token_hash: string }>();
    expect(stored?.token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.token_hash).not.toBe(rawToken);

    const second = await login(signingKey.privateKey, { email: "renamed@example.invalid", name: "Renamed Test User" });
    expect(second.response.status).toBe(200);
    const users = await env.DB.prepare("SELECT email, name FROM users").all<{ email: string; name: string }>();
    expect(users.results).toEqual([{ email: "renamed@example.invalid", name: "Renamed Test User" }]);
  });

  it("invalidates the server session on logout", async () => {
    const { cookie } = await login(signingKey.privateKey);
    expect((await request("/api/session", {}, cookie)).status).toBe(200);
    const logout = await request("/api/auth/logout", { method: "POST", body: "{}" }, cookie);
    expect(logout.status).toBe(204);
    expect(logout.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sessions").first<{ count: number }>()).toEqual({ count: 0 });
    await expect((await request("/api/session", {}, cookie)).json()).resolves.toEqual({ authenticated: false });
  });

  it("rejects a valid Google identity that is not in the private allowlist", async () => {
    const credential = await signGoogleToken(signingKey.privateKey, { email: "blocked@example.invalid" });
    const response = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
    expect(response.status).toBe(403);
    expect(await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind("blocked@example.invalid").first()).toBeNull();
  });

  it("invalidates the session when an authorized email is revoked", async () => {
    const { cookie } = await login(signingKey.privateKey);
    await env.DB.prepare("DELETE FROM authorized_emails WHERE email = ?").bind("user-a@example.invalid").run();
    await expect((await request("/api/session", {}, cookie)).json()).resolves.toEqual({ authenticated: false });
    expect(await env.DB.prepare("SELECT id FROM sessions").first()).toBeNull();
  });
});

describe("private access administration", () => {
  async function loginAsAdmin(): Promise<{ cookie: string; workerEnv: Env }> {
    const workerEnv = { ...env, ACCESS_ADMIN_EMAILS: "admin@example.invalid" } as Env;
    await env.DB.prepare("INSERT INTO authorized_emails (email, created_at) VALUES (?, ?)").bind("admin@example.invalid", new Date().toISOString()).run();
    const credential = await signGoogleToken(signingKey.privateKey, { email: "admin@example.invalid", sub: "access-admin" });
    const response = await request("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) }, undefined, workerEnv);
    expect(response.status).toBe(200);
    return { cookie: (response.headers.get("Set-Cookie") ?? "").split(";")[0], workerEnv };
  }

  it("exposes grants only to the configured administrator and creates normalized entries", async () => {
    const { cookie, workerEnv } = await loginAsAdmin();
    await expect((await request("/api/session", {}, cookie, workerEnv)).json()).resolves.toMatchObject({ authenticated: true, isAccessAdmin: true });
    expect((await request("/api/access/grants", {}, cookie)).status).toBe(403);
    expect((await request("/api/access/grants", {}, cookie, workerEnv)).status).toBe(200);
    expect((await request("/api/access/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "  Friend@Example.Invalid " }) }, cookie, workerEnv)).status).toBe(204);
    expect((await request("/api/access/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "friend@example.invalid" }) }, cookie, workerEnv)).status).toBe(204);
    await expect(env.DB.prepare("SELECT email FROM authorized_emails WHERE email = ?").bind("friend@example.invalid").first()).resolves.toEqual({ email: "friend@example.invalid" });
    await expect(env.DB.prepare("SELECT COUNT(*) AS count FROM authorized_emails WHERE email = ?").bind("friend@example.invalid").first<{ count: number }>()).resolves.toEqual({ count: 1 });
    expect((await request("/api/access/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "not-an-email" }) }, cookie, workerEnv)).status).toBe(400);
  });

  it("revokes an account immediately without allowing the administrator to lock themselves out", async () => {
    const { cookie, workerEnv } = await loginAsAdmin();
    const member = await login(signingKey.privateKey, { email: "member@example.invalid", sub: "access-member" });
    expect((await request("/api/access/grants/member%40example.invalid", { method: "DELETE", body: "{}" }, cookie, workerEnv)).status).toBe(204);
    expect((await request("/api/session", {}, member.cookie)).status).toBe(200);
    await expect((await request("/api/session", {}, member.cookie)).json()).resolves.toEqual({ authenticated: false });
    expect((await request("/api/access/grants/admin%40example.invalid", { method: "DELETE", body: "{}" }, cookie, workerEnv)).status).toBe(400);
  });
});

describe("private Pack library", () => {
  const catalog = {
    format: "soulforge-private-library-v1",
    publishedAt: "2026-10-25T12:00:00.000Z",
    packs: [{ id: "pack.private.core", name: "Core privado", version: "1.0.0", checksum: "a".repeat(64), changes: "Versão inicial.", definitionCount: 1 }]
  } as const;

  it("requires an authorized session and never exposes the R2 object by URL", async () => {
    await env.PACK_LIBRARY.put("catalog.json", JSON.stringify(catalog));
    await env.PACK_LIBRARY.put("packs/pack.private.core/1.0.0.soulforge-pack.json", "{\"format\":\"soulforge-pack-v1\"}");
    expect((await request("/api/library/catalog")).status).toBe(401);
    const { cookie } = await login(signingKey.privateKey);
    await expect((await request("/api/library/catalog", {}, cookie)).json()).resolves.toEqual(catalog);
    const pack = await request("/api/library/packs/pack.private.core/1.0.0", {}, cookie);
    expect(pack.status).toBe(200);
    expect(pack.headers.get("Cache-Control")).toBe("private, no-store");
    expect(pack.headers.get("Content-Type")).toContain("application/json");
  });

  it("rejects unpublished paths and malformed catalog data safely", async () => {
    const { cookie } = await login(signingKey.privateKey);
    await env.PACK_LIBRARY.put("catalog.json", JSON.stringify({ format: "wrong" }));
    expect((await request("/api/library/catalog", {}, cookie)).status).toBe(503);
    await env.PACK_LIBRARY.put("catalog.json", JSON.stringify(catalog));
    expect((await request("/api/library/packs/pack.private.core/9.9.9", {}, cookie)).status).toBe(404);
  });
});

describe("sync revisions and account isolation", () => {
  it("accepts exactly 2 MB and rejects one byte above the sync body limit", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const first = syncChange("exact-a", 0, { text: "a".repeat(900_000) });
    const second = syncChange("exact-b", 0, { text: "" });
    const baseBytes = new TextEncoder().encode(JSON.stringify({ changes: [first, second] })).byteLength;
    const exactBody = JSON.stringify({ changes: [first, { ...second, payload: { text: "b".repeat(2_000_000 - baseBytes) } }] });
    expect(new TextEncoder().encode(exactBody)).toHaveLength(2_000_000);
    expect((await request("/api/sync/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: exactBody }, cookie)).status).toBe(200);
    const pull = await request("/api/sync/pull?cursor=0", {}, cookie);
    const pullBytes = new TextEncoder().encode(await pull.clone().text()).byteLength;
    expect(pullBytes).toBeLessThan(2_000_000);
    await expect(pull.json()).resolves.toMatchObject({ mode: "incremental", hasMore: true });
    expect((await request("/api/sync/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: `${exactBody} ` }, cookie)).status).toBe(413);
  });

  it("isolates records and media between accounts", async () => {
    const accountA = await login(signingKey.privateKey, { sub: "account-a", email: "a@example.invalid", name: "Account A" });
    const accountB = await login(signingKey.privateKey, { sub: "account-b", email: "b@example.invalid", name: "Account B" });
    const change = syncChange("shared-id", 0, { name: "A" });
    expect((await request("/api/sync/push", jsonBody({ changes: [change] }), accountA.cookie)).status).toBe(200);
    await expect((await request("/api/sync/pull?cursor=0", {}, accountB.cookie)).json()).resolves.toMatchObject({ cursor: 0, changes: [] });

    const media = pngBytes();
    const upload = await request("/api/media", mediaBody(media, await sha256Hex(media)), accountA.cookie);
    const mediaId = ((await upload.json()) as { id: string }).id;
    expect((await request(`/api/media/${mediaId}`, {}, accountB.cookie)).status).toBe(404);

    expect((await request("/api/sync/push", jsonBody({ changes: [syncChange("shared-id", 0, { name: "B" })] }), accountB.cookie)).status).toBe(200);
    const records = await env.DB.prepare("SELECT payload_json FROM characters ORDER BY payload_json").all<{ payload_json: string }>();
    expect(records.results.map((record) => JSON.parse(record.payload_json))).toEqual([{ name: "A" }, { name: "B" }]);

    expect((await request("/api/account", { method: "DELETE", body: "{}" }, accountB.cookie)).status).toBe(204);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM characters").first()).toEqual({ count: 1 });
    await expect((await request("/api/sync/pull?cursor=0", {}, accountA.cookie)).json()).resolves.toMatchObject({ changes: [expect.objectContaining({ payload: { name: "A" } })] });
    expect((await request(`/api/media/${mediaId}`, {}, accountA.cookie)).status).toBe(200);
  });

  it("does not persist a resource when its media reference is invalid", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const invalid = syncChange("invalid-media", 0, { portrait: { $soulforgeMedia: "missing-media" } });

    expect((await request("/api/sync/push", jsonBody({ changes: [invalid] }), cookie)).status).toBe(400);
    expect(await env.DB.prepare("SELECT resource_id FROM characters WHERE resource_id = 'invalid-media'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT seq FROM sync_changes WHERE resource_id = 'invalid-media'").first()).toBeNull();
  });

  it("returns conflicts, advances revisions and preserves tombstones", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const created = await request("/api/sync/push", jsonBody({ changes: [syncChange("hero", 0, { name: "Original" })] }), cookie);
    await expect(created.json()).resolves.toMatchObject({ applied: [{ id: "hero", revision: 1 }], conflicts: [] });
    const firstPull = await (await request("/api/sync/pull?cursor=0", {}, cookie)).json<{ cursor: number; changes: unknown[] }>();

    const stale = await request("/api/sync/push", jsonBody({ changes: [syncChange("hero", 0, { name: "Stale" })] }), cookie);
    await expect(stale.json()).resolves.toMatchObject({ applied: [], conflicts: [{ remote: { revision: 1, payload: { name: "Original" } } }] });

    const deleted = await request("/api/sync/push", jsonBody({ changes: [syncChange("hero", 1, undefined, true)] }), cookie);
    await expect(deleted.json()).resolves.toMatchObject({ applied: [{ id: "hero", revision: 2, deletedAt: expect.any(String) }] });
    const afterDelete = await (await request(`/api/sync/pull?cursor=${firstPull.cursor}`, {}, cookie)).json<{ changes: Array<Record<string, unknown>> }>();
    expect(afterDelete.changes).toEqual([expect.objectContaining({ id: "hero", revision: 2, deletedAt: expect.any(String) })]);
    expect(afterDelete.changes[0]).not.toHaveProperty("payload");
    expect(await env.DB.prepare("SELECT revision, payload_json, deleted_at FROM characters WHERE resource_id = 'hero'").first()).toMatchObject({ revision: 2, payload_json: null, deleted_at: expect.any(String) });

    const resurrection = await request("/api/sync/push", jsonBody({ changes: [syncChange("hero", 0, { name: "Resurrected" })] }), cookie);
    await expect(resurrection.json()).resolves.toMatchObject({ applied: [], conflicts: [{ remote: { revision: 2, deletedAt: expect.any(String) } }] });
  });
});

describe("private media", () => {
  it("validates type, signature, checksum and the per-image limit", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const unsupported = await request("/api/media", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "image" }, cookie);
    expect(unsupported.status).toBe(415);

    const invalid = new Uint8Array([1, 2, 3, 4]);
    expect((await request("/api/media", mediaBody(invalid, await sha256Hex(invalid)), cookie)).status).toBe(415);

    const valid = pngBytes();
    expect((await request("/api/media", mediaBody(valid, "0".repeat(64)), cookie)).status).toBe(400);

    const exactLimit = pngBytes(1_500_000);
    expect((await request("/api/media", mediaBody(exactLimit, await sha256Hex(exactLimit)), cookie)).status).toBe(201);
    const tooLarge = pngBytes(1_500_001);
    expect((await request("/api/media", mediaBody(tooLarge, await sha256Hex(tooLarge)), cookie)).status).toBe(413);

    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    expect((await request("/api/media", mediaBody(jpeg, await sha256Hex(jpeg), "image/jpeg"), cookie)).status).toBe(201);
    const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect((await request("/api/media", mediaBody(webp, await sha256Hex(webp), "image/webp"), cookie)).status).toBe(201);
  });

  it("deduplicates within an account, not across accounts, and enforces the account quota", async () => {
    const accountA = await login(signingKey.privateKey, { sub: "media-a", email: "media-a@example.invalid", name: "Media A" });
    const accountB = await login(signingKey.privateKey, { sub: "media-b", email: "media-b@example.invalid", name: "Media B" });
    const bytes = pngBytes();
    const checksum = await sha256Hex(bytes);
    const first = await request("/api/media", mediaBody(bytes, checksum), accountA.cookie);
    const firstId = ((await first.json()) as { id: string }).id;
    await env.DB.prepare("UPDATE media_assets SET unreferenced_at = '2020-01-01T00:00:00.000Z' WHERE id = ?").bind(firstId).run();
    const duplicate = await request("/api/media", mediaBody(bytes, checksum), accountA.cookie);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ id: firstId });
    expect((await env.DB.prepare("SELECT unreferenced_at FROM media_assets WHERE id = ?").bind(firstId).first<{ unreferenced_at: string }>())?.unreferenced_at).not.toBe("2020-01-01T00:00:00.000Z");
    const otherAccount = await request("/api/media", mediaBody(bytes, checksum), accountB.cookie);
    expect(((await otherAccount.json()) as { id: string }).id).not.toBe(firstId);

    const quotaAccount = await login(signingKey.privateKey, { sub: "quota", email: "quota@example.invalid", name: "Quota" });
    const quotaUser = await env.DB.prepare("SELECT id FROM users WHERE google_sub = 'quota'").first<{ id: string }>();
    expect(quotaUser).not.toBeNull();
    await env.DB.prepare("INSERT INTO media_assets (id, user_id, object_key, checksum, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind("quota-existing", quotaUser!.id, "quota/existing", "quota-checksum", "image/png", 99_999_999, new Date().toISOString()).run();
    expect((await request("/api/media", mediaBody(bytes, checksum), quotaAccount.cookie)).status).toBe(413);
  });

  it("removes D1 records, sessions and R2 objects when the account is deleted", async () => {
    const { cookie } = await login(signingKey.privateKey);
    await request("/api/sync/pull?cursor=0", {}, cookie);
    const user = await env.DB.prepare("SELECT id FROM users").first<{ id: string }>();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO sync_retention_state (user_id, compacted_through_seq, last_compacted_at) VALUES (?, 0, ?)").bind(user!.id, new Date().toISOString()),
      env.DB.prepare("INSERT INTO sync_snapshot_sessions (id, user_id, device_id, baseline_seq, created_at, expires_at) VALUES (?, ?, ?, 0, ?, ?)")
        .bind("account-delete-snapshot", user!.id, testDeviceId, new Date().toISOString(), new Date(Date.now() + 60_000).toISOString())
    ]);
    const bytes = pngBytes();
    const upload = await request("/api/media", mediaBody(bytes, await sha256Hex(bytes)), cookie);
    const mediaId = ((await upload.json()) as { id: string }).id;
    const objectKey = (await env.DB.prepare("SELECT object_key FROM media_assets WHERE id = ?").bind(mediaId).first<{ object_key: string }>())?.object_key;
    expect(objectKey && await env.MEDIA.head(objectKey)).not.toBeNull();

    expect((await request("/api/account", { method: "DELETE", body: "{}" }, cookie)).status).toBe(204);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sessions").first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_devices").first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_retention_state").first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_snapshot_sessions").first()).toEqual({ count: 0 });
    expect(objectKey && await env.MEDIA.head(objectKey)).toBeNull();
    await expect((await request("/api/session", {}, cookie)).json()).resolves.toEqual({ authenticated: false });
  });

  it("preserves private media caching and applies the common security headers", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const bytes = pngBytes();
    const upload = await request("/api/media", mediaBody(bytes, await sha256Hex(bytes)), cookie);
    const mediaId = ((await upload.json()) as { id: string }).id;
    const response = await request(`/api/media/${mediaId}`, {}, cookie);

    expect(response.headers.get("Cache-Control")).toBe("private, max-age=86400");
    expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'");
    assertSecurityHeaders(response, false);
  });

  it("compensates the R2 upload when the D1 metadata cannot be stored", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const bytes = pngBytes();
    const failedInsert = {
      prepare(query: string) {
        if (query.startsWith("INSERT INTO media_assets")) return { bind: () => ({ run: async () => { throw new Error("metadata unavailable"); } }) };
        return env.DB.prepare(query);
      }
    } as unknown as D1Database;
    const response = await request("/api/media", mediaBody(bytes, await sha256Hex(bytes)), cookie, { ...env, DB: failedInsert } as Env);

    expect(response.status).toBe(500);
    expect((await env.MEDIA.list()).objects).toHaveLength(0);
  });
});

describe("scheduled cloud maintenance", () => {
  it("removes expired sessions while preserving active sessions", async () => {
    await login(signingKey.privateKey);
    const user = await env.DB.prepare("SELECT id FROM users").first<{ id: string }>();
    expect(user).not.toBeNull();
    await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind("expired-session", user!.id, "expired-token-hash", "2026-01-01T00:00:00.000Z", "2025-12-01T00:00:00.000Z").run();

    await runScheduled(new Date("2026-10-17T03:17:00.000Z"));

    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sessions").first()).toEqual({ count: 1 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sessions WHERE id = 'expired-session'").first()).toEqual({ count: 0 });
  });

  it("waits 24 hours after the last media reference and preserves sync history", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const bytes = pngBytes();
    const upload = await request("/api/media", mediaBody(bytes, await sha256Hex(bytes)), cookie);
    const mediaId = ((await upload.json()) as { id: string }).id;
    const objectKey = (await env.DB.prepare("SELECT object_key FROM media_assets WHERE id = ?").bind(mediaId).first<{ object_key: string }>())!.object_key;
    const withMedia = syncChange("maintenance-hero", 0, { portrait: { $soulforgeMedia: mediaId } });
    expect((await request("/api/sync/push", jsonBody({ changes: [withMedia] }), cookie)).status).toBe(200);
    expect(await env.DB.prepare("SELECT unreferenced_at FROM media_assets WHERE id = ?").bind(mediaId).first()).toEqual({ unreferenced_at: null });

    expect((await request("/api/sync/push", jsonBody({ changes: [syncChange("maintenance-hero", 1, undefined, true)] }), cookie)).status).toBe(200);
    const orphan = await env.DB.prepare("SELECT unreferenced_at FROM media_assets WHERE id = ?").bind(mediaId).first<{ unreferenced_at: string }>();
    expect(orphan?.unreferenced_at).toBeTruthy();
    const historyBefore = await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_changes").first<{ count: number }>();

    await runScheduled(new Date(new Date(orphan!.unreferenced_at).getTime() + 23 * 60 * 60 * 1000));
    expect(await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaId).first()).not.toBeNull();
    expect(await env.MEDIA.head(objectKey)).not.toBeNull();

    await runScheduled(new Date(new Date(orphan!.unreferenced_at).getTime() + 25 * 60 * 60 * 1000));
    expect(await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaId).first()).toBeNull();
    expect(await env.MEDIA.head(objectKey)).toBeNull();
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_changes").first()).toEqual(historyBefore);
    expect(await env.DB.prepare("SELECT deleted_at FROM characters WHERE resource_id = 'maintenance-hero'").first()).toMatchObject({ deleted_at: expect.any(String) });
  });

  it("keeps referenced media and retries a failed R2 deletion without losing the queue", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const user = await env.DB.prepare("SELECT id FROM users").first<{ id: string }>();
    const referencedBytes = pngBytes(13);
    const referencedUpload = await request("/api/media", mediaBody(referencedBytes, await sha256Hex(referencedBytes)), cookie);
    const referencedId = ((await referencedUpload.json()) as { id: string }).id;
    await env.DB.prepare("UPDATE media_assets SET unreferenced_at = ? WHERE id = ?").bind("2026-10-14T00:00:00.000Z", referencedId).run();
    expect((await request("/api/sync/push", jsonBody({ changes: [syncChange("referenced", 0, { art: { $soulforgeMedia: referencedId } })] }), cookie)).status).toBe(200);

    const orphanId = "orphan-for-retry";
    const orphanKey = `users/${user!.id}/${orphanId}`;
    const old = "2026-10-14T00:00:00.000Z";
    await env.MEDIA.put(orphanKey, pngBytes());
    await env.DB.prepare("INSERT INTO media_assets (id, user_id, object_key, checksum, mime_type, size_bytes, created_at, unreferenced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(orphanId, user!.id, orphanKey, "orphan-checksum", "image/png", 12, old, old).run();
    const failingMedia = { delete: vi.fn(async () => { throw new Error("R2 unavailable"); }) } as unknown as R2Bucket;

    await expect(runScheduled(new Date("2026-10-17T03:17:00.000Z"), { ...env, MEDIA: failingMedia } as Env)).rejects.toThrow("R2 unavailable");
    expect(await env.DB.prepare("SELECT media_id FROM media_cleanup_queue WHERE media_id = ?").bind(orphanId).first()).not.toBeNull();
    expect(await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(orphanId).first()).toBeNull();
    expect(await env.MEDIA.head(orphanKey)).not.toBeNull();
    await runScheduled(new Date("2026-10-18T03:17:00.000Z"));
    expect(await env.DB.prepare("SELECT media_id FROM media_cleanup_queue WHERE media_id = ?").bind(orphanId).first()).toBeNull();
    expect(await env.MEDIA.head(orphanKey)).toBeNull();
    expect(await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(referencedId).first()).not.toBeNull();
  });
});

describe("sync retention and reconstruction", () => {
  it("keeps cached clients without device headers compatible during the transition", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const legacyPull = await worker.fetch(new Request(`${testOrigin}/api/sync/pull?cursor=0`, {
      headers: { Cookie: cookie }
    }), env as Env);

    expect(legacyPull.status).toBe(200);
    await expect(legacyPull.json()).resolves.toMatchObject({ mode: "incremental", cursor: 0, hasMore: false });

    const legacyPush = await worker.fetch(new Request(`${testOrigin}/api/sync/push`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: testOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ changes: [syncChange("legacy-client-hero", 0, { name: "Legacy" })] })
    }), env as Env);

    expect(legacyPush.status).toBe(200);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_devices WHERE device_id LIKE 'legacy:%'").first()).toEqual({ count: 1 });
  });

  it("paginates more than 500 incremental changes without losing the cursor", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const user = await env.DB.prepare("SELECT id FROM users").first<{ id: string }>();
    await env.DB.prepare(`WITH RECURSIVE counter(value) AS (
      SELECT 1 UNION ALL SELECT value + 1 FROM counter WHERE value < 501
    ) INSERT INTO sync_changes (user_id, resource_type, resource_id, revision, payload_json, updated_at, deleted_at)
      SELECT ?, 'character', 'bulk-' || value, 1, '{"id":"bulk"}', '2026-10-18T00:00:00.000Z', NULL FROM counter`).bind(user!.id).run();

    let cursor = 0;
    let total = 0;
    let pages = 0;
    let hasMore = true;
    while (hasMore) {
      const page = await (await request(`/api/sync/pull?cursor=${cursor}`, {}, cookie)).json<{ mode: string; cursor: number; changes: unknown[]; hasMore: boolean }>();
      expect(page.mode).toBe("incremental");
      expect(new TextEncoder().encode(JSON.stringify(page)).byteLength).toBeLessThan(2_000_000);
      total += page.changes.length;
      pages += 1;
      cursor = page.cursor;
      hasMore = page.hasMore;
    }
    expect(total).toBe(501);
    expect(pages).toBeGreaterThan(1);
  });

  it("lets an active device block pruning, expires it after 90 days and rejects a stale push", async () => {
    const { cookie } = await login(signingKey.privateKey);
    const user = await env.DB.prepare("SELECT id FROM users").first<{ id: string }>();
    expect((await request("/api/sync/push", jsonBody({ changes: [syncChange("retained-hero", 0, { name: "Hero" })] }), cookie)).status).toBe(200);
    expect((await request("/api/sync/push", jsonBody({ changes: [syncChange("retained-hero", 1, undefined, true)] }), cookie)).status).toBe(200);
    await env.DB.batch([
      env.DB.prepare("UPDATE sync_changes SET updated_at = '2026-01-01T00:00:00.000Z' WHERE user_id = ?").bind(user!.id),
      env.DB.prepare("UPDATE characters SET updated_at = '2026-01-01T00:00:00.000Z', deleted_at = '2026-01-01T00:00:00.000Z' WHERE user_id = ?").bind(user!.id),
      env.DB.prepare("UPDATE sync_devices SET acknowledged_seq = 0, last_ack_at = '2026-10-17T00:00:00.000Z' WHERE user_id = ? AND device_id = ?").bind(user!.id, testDeviceId)
    ]);

    await runScheduled(new Date("2026-10-18T03:17:00.000Z"));
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_changes WHERE user_id = ?").bind(user!.id).first()).toEqual({ count: 2 });
    expect(await env.DB.prepare("SELECT resource_id FROM characters WHERE user_id = ?").bind(user!.id).first()).not.toBeNull();

    const secondRun = new Date("2026-10-19T03:17:00.000Z");
    const exactExpiry = new Date(secondRun.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare("UPDATE sync_devices SET last_ack_at = ? WHERE user_id = ?").bind(exactExpiry, user!.id).run();
    await runScheduled(secondRun);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sync_changes WHERE user_id = ?").bind(user!.id).first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT resource_id FROM characters WHERE user_id = ?").bind(user!.id).first()).toBeNull();

    const stale = await request("/api/sync/push", jsonBody({ changes: [syncChange("retained-hero", 0, { name: "Resurrected" })] }), cookie);
    expect(stale.status).toBe(409);
    await expect(stale.json()).resolves.toMatchObject({ code: "sync_reset_required" });
    const reset = await (await request("/api/sync/pull?cursor=0", {}, cookie)).json<{ mode: string; snapshotId: string; baselineCursor: number }>();
    expect(reset).toMatchObject({ mode: "reset-required", baselineCursor: expect.any(Number) });
    const snapshot = await request(`/api/sync/snapshot/${reset.snapshotId}`, {}, cookie);
    await expect(snapshot.json()).resolves.toMatchObject({ done: true, changes: [] });
  });
});

describe("cloud maintenance mode", () => {
  it("blocks cloud routes while keeping config, session and logout available", async () => {
    const disabled = { ...env, SYNC_ENABLED: "false" } as Env;
    await expect((await request("/api/config", {}, undefined, disabled)).json()).resolves.toMatchObject({ syncEnabled: false });
    expect((await request("/api/auth/google", jsonBody({ credential: "unused" }), undefined, disabled)).status).toBe(503);
    expect((await request("/api/sync/pull?cursor=0", {}, undefined, disabled)).status).toBe(503);
    expect((await request("/api/media/example", {}, undefined, disabled)).status).toBe(503);
    expect((await request("/api/auth/logout", { method: "POST" }, undefined, disabled)).status).toBe(204);
    expect((await request("/api/not-found", {}, undefined, disabled)).status).toBe(404);
  });
});

describe("unexpected failures", () => {
  it("returns a generic error without exposing internal details", async () => {
    const brokenDb = new Proxy(env.DB, { get() { throw new Error("private database detail"); } });
    const response = await request("/api/session", { headers: { Cookie: "soulforge_session=test" } }, undefined, { ...env, DB: brokenDb } as Env);
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Falha interna do SoulForge");
    expect(text).not.toContain("private database detail");
  });
});

function syncChange(id: string, expectedRevision: number, payload?: unknown, deleted = false): SyncPushChange {
  return { mutationId: crypto.randomUUID(), type: "character", id, expectedRevision, deleted, ...(payload === undefined ? {} : { payload }) };
}

function jsonBody(value: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

function mediaBody(bytes: Uint8Array, checksum: string, mimeType = "image/png"): RequestInit {
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { method: "POST", headers: { "Content-Type": mimeType, "X-Media-Checksum": checksum }, body };
}

function assertSecurityHeaders(response: Response, expectApplicationCsp = true): void {
  expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin-allow-popups");
  expect(response.headers.get("X-XSS-Protection")).toBe("0");
  expect(response.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()");
  if (expectApplicationCsp) expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
}

async function runScheduled(time: Date, workerEnv: Env = env as Env): Promise<void> {
  const controller = createScheduledController({ scheduledTime: time, cron: "17 3 * * *" });
  const context = createExecutionContext();
  await worker.scheduled(controller, workerEnv, context);
  await waitOnExecutionContext(context);
}
