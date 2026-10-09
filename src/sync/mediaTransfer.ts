import type { CloudMediaReference } from "./types";

const dataUrlPattern = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export type UploadMedia = (media: { bytes: Uint8Array; mimeType: string; checksum: string }) => Promise<{ id: string }>;
export type DownloadMedia = (id: string) => Promise<{ bytes: ArrayBuffer; mimeType: string }>;

export async function replaceDataUrlsWithMedia(value: unknown, upload: UploadMedia): Promise<unknown> {
  if (typeof value === "string") {
    const match = dataUrlPattern.exec(value);
    if (!match) return value;
    const bytes = decodeBase64(match[2]);
    const checksum = await sha256Hex(bytes);
    const uploaded = await upload({ bytes, mimeType: match[1], checksum });
    return { $soulforgeMedia: uploaded.id, mimeType: match[1], size: bytes.byteLength, checksum } satisfies CloudMediaReference;
  }
  if (Array.isArray(value)) return Promise.all(value.map((entry) => replaceDataUrlsWithMedia(entry, upload)));
  if (!value || typeof value !== "object") return value;
  const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await replaceDataUrlsWithMedia(entry, upload)] as const));
  return Object.fromEntries(entries);
}

export async function replaceMediaWithDataUrls(value: unknown, download: DownloadMedia): Promise<unknown> {
  if (isCloudMediaReference(value)) {
    const media = await download(value.$soulforgeMedia);
    return `data:${media.mimeType};base64,${encodeBase64(new Uint8Array(media.bytes))}`;
  }
  if (Array.isArray(value)) return Promise.all(value.map((entry) => replaceMediaWithDataUrls(entry, download)));
  if (!value || typeof value !== "object") return value;
  const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await replaceMediaWithDataUrls(entry, download)] as const));
  return Object.fromEntries(entries);
}

export function isCloudMediaReference(value: unknown): value is CloudMediaReference {
  return Boolean(value && typeof value === "object" && "$soulforgeMedia" in value && typeof (value as CloudMediaReference).$soulforgeMedia === "string");
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < value.length; offset += 0x8000) {
    binary += String.fromCharCode(...value.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
