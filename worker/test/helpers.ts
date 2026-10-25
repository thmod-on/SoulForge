import { env } from "cloudflare:workers";
import type { Env } from "../index";
import worker from "../index";

export const testOrigin = "https://soulforge.test";
export const testClientId = "soulforge-worker-tests.apps.googleusercontent.com";
export const testDeviceId = "00000000-0000-4000-8000-000000000001";

type TestClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  iss: string;
  aud: string;
  exp: number;
};

export async function resetCloudStorage(): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM authorized_emails"),
    env.DB.prepare("DELETE FROM media_cleanup_queue"),
    env.DB.prepare("DELETE FROM media_references"),
    env.DB.prepare("DELETE FROM media_assets"),
    env.DB.prepare("DELETE FROM sync_changes"),
    env.DB.prepare("DELETE FROM definition_overrides"),
    env.DB.prepare("DELETE FROM definitions"),
    env.DB.prepare("DELETE FROM characters"),
    env.DB.prepare("DELETE FROM sessions"),
    env.DB.prepare("DELETE FROM users")
  ]);
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA.list({ cursor });
    if (page.objects.length) await env.MEDIA.delete(page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  cursor = undefined;
  do {
    const page = await env.PACK_LIBRARY.list({ cursor });
    if (page.objects.length) await env.PACK_LIBRARY.delete(page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export async function createSigningKey(kid = "soulforge-test-key"): Promise<{ privateKey: CryptoKey; publicJwk: JsonWebKey & { kid: string; alg: string; use: string } }> {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { privateKey: pair.privateKey, publicJwk: { ...publicJwk, kid, alg: "RS256", use: "sig" } };
}

export async function signGoogleToken(privateKey: CryptoKey, overrides: Partial<TestClaims> = {}, kid = "soulforge-test-key"): Promise<string> {
  const claims: TestClaims = {
    sub: "test-user-a",
    email: "user-a@example.invalid",
    email_verified: true,
    name: "Test User A",
    iss: "https://accounts.google.com",
    aud: testClientId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  };
  const header = encodeJson({ alg: "RS256", typ: "JWT", kid });
  const payload = encodeJson(claims);
  const message = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(message));
  return `${message}.${base64Url(new Uint8Array(signature))}`;
}

export async function request(path: string, init: RequestInit = {}, cookie?: string, workerEnv: Env = env as Env): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET" && !headers.has("Origin")) headers.set("Origin", testOrigin);
  if (path.startsWith("/api/sync/") && !path.startsWith("/api/sync/snapshot/")) {
    if (!headers.has("X-SoulForge-Device-Id")) headers.set("X-SoulForge-Device-Id", testDeviceId);
    if (!headers.has("X-SoulForge-Sync-Cursor")) headers.set("X-SoulForge-Sync-Cursor", new URL(`${testOrigin}${path}`).searchParams.get("cursor") ?? "0");
  }
  if (cookie) headers.set("Cookie", cookie);
  return worker.fetch(new Request(`${testOrigin}${path}`, { ...init, headers }), workerEnv);
}

export async function login(privateKey: CryptoKey, claims: Partial<TestClaims> = {}): Promise<{ cookie: string; response: Response }> {
  const email = (claims.email ?? "user-a@example.invalid").trim().toLowerCase();
  await env.DB.prepare("INSERT INTO authorized_emails (email, created_at) VALUES (?, ?)").bind(email, new Date().toISOString()).run();
  const credential = await signGoogleToken(privateKey, { ...claims, email });
  const response = await request("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential })
  });
  const setCookie = response.headers.get("Set-Cookie") ?? "";
  return { cookie: setCookie.split(";")[0], response };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", source);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function pngBytes(size = 12): Uint8Array {
  const bytes = new Uint8Array(Math.max(size, 4));
  bytes.set([0x89, 0x50, 0x4e, 0x47]);
  return bytes;
}

function encodeJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
