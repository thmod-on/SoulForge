import { describe, expect, it, vi } from "vitest";
import { replaceDataUrlsWithMedia, replaceMediaWithDataUrls } from "./mediaTransfer";

describe("cloud media transfer", () => {
  it("replaces nested image data URLs without changing ordinary strings", async () => {
    const upload = vi.fn(async ({ bytes, mimeType, checksum }: { bytes: Uint8Array; mimeType: string; checksum: string }) => ({ id: `${mimeType}:${bytes.length}:${checksum.slice(0, 8)}` }));
    const payload = { name: "Lyra", identity: { portraitImage: "data:image/png;base64,iVBORw0KGgo=" }, notes: ["data:text/plain;base64,bm90IGFuIGltYWdl"] };

    const cloud = await replaceDataUrlsWithMedia(payload, upload) as { identity: { portraitImage: { $soulforgeMedia: string; mimeType: string } }; notes: string[] };

    expect(upload).toHaveBeenCalledOnce();
    expect(cloud.identity.portraitImage.$soulforgeMedia).toMatch(/^image\/png:/);
    expect(cloud.identity.portraitImage.mimeType).toBe("image/png");
    expect(cloud.notes[0]).toBe(payload.notes[0]);
  });

  it("restores authenticated media as an offline data URL", async () => {
    const restored = await replaceMediaWithDataUrls({ image: { $soulforgeMedia: "asset-1", mimeType: "image/webp", size: 4, checksum: "abc" } }, async (id) => {
      expect(id).toBe("asset-1");
      return { bytes: Uint8Array.from([82, 73, 70, 70]).buffer, mimeType: "image/webp" };
    }) as { image: string };

    expect(restored.image).toBe("data:image/webp;base64,UklGRg==");
  });
});
