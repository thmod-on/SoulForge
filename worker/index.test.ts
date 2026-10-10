import { env } from "cloudflare:workers";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpResponse, http } from "msw";
import { setupNetwork } from "@msw/cloudflare";
import type { SyncPushChange } from "../src/sync/types";
import type { Env } from "./index";
import { createSigningKey, login, pngBytes, request, resetCloudStorage, sha256Hex, signGoogleToken } from "./test/helpers";

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
});

describe("sync revisions and account isolation", () => {
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
    const duplicate = await request("/api/media", mediaBody(bytes, checksum), accountA.cookie);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ id: firstId });
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
    const bytes = pngBytes();
    const upload = await request("/api/media", mediaBody(bytes, await sha256Hex(bytes)), cookie);
    const mediaId = ((await upload.json()) as { id: string }).id;
    const objectKey = (await env.DB.prepare("SELECT object_key FROM media_assets WHERE id = ?").bind(mediaId).first<{ object_key: string }>())?.object_key;
    expect(objectKey && await env.MEDIA.head(objectKey)).not.toBeNull();

    expect((await request("/api/account", { method: "DELETE", body: "{}" }, cookie)).status).toBe(204);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first()).toEqual({ count: 0 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM sessions").first()).toEqual({ count: 0 });
    expect(objectKey && await env.MEDIA.head(objectKey)).toBeNull();
    await expect((await request("/api/session", {}, cookie)).json()).resolves.toEqual({ authenticated: false });
  });
});

describe("unexpected failures", () => {
  it("returns a generic error without exposing internal details", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const brokenDb = new Proxy(env.DB, { get() { throw new Error("private database detail"); } });
    const response = await request("/api/session", { headers: { Cookie: "soulforge_session=test" } }, undefined, { ...env, DB: brokenDb } as Env);
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Falha interna do SoulForge");
    expect(text).not.toContain("private database detail");
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("private database detail");
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
