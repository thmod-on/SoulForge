import { describe, expect, it } from "vitest";
import { getLibraryUpdates, getMissingLibraryEntries, validatePrivateLibraryCatalog } from "./privateLibrary";

const catalog = validatePrivateLibraryCatalog({
  format: "soulforge-private-library-v1",
  publishedAt: "2026-10-25T12:00:00.000Z",
  packs: [
    { id: "pack.core", name: "Core", version: "2.0.0", checksum: "a".repeat(64), changes: "Revisão.", definitionCount: 3 },
    { id: "pack.hope", name: "Hope", version: "1.0.0", checksum: "b".repeat(64), changes: "Inicial.", definitionCount: 2 }
  ]
});

describe("biblioteca privada de Packs", () => {
  it("rejeita catálogo sem checksum, nota ou IDs únicos", () => {
    expect(() => validatePrivateLibraryCatalog({ ...catalog, packs: [{ ...catalog.packs[0], checksum: "ruim" }] })).toThrow("inválido");
    expect(() => validatePrivateLibraryCatalog({ ...catalog, packs: [catalog.packs[0], catalog.packs[0]] })).toThrow("inválido");
  });

  it("instala apenas os Packs ausentes e nunca trata arquivo local como atualização automática", () => {
    const installed = [
      { id: "pack.core", name: "Core", version: "1.0.0", description: "", installationSource: "local" as const },
      { id: "pack.hope", name: "Hope", version: "0.9.0", description: "", installationSource: "library" as const, libraryChecksum: "old" }
    ];
    expect(getMissingLibraryEntries(catalog, installed).map((entry) => entry.id)).toEqual([]);
    expect(getLibraryUpdates(catalog, installed).map((entry) => entry.id)).toEqual(["pack.hope"]);
  });
});
