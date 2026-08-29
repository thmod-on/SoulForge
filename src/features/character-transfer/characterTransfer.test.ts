import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { characterExportFormat, parseCharacterImport } from "./characterTransfer";

describe("transferência de personagem", () => {
  it("aceita o envelope de exportação e mantém o id quando não há conflito", () => {
    const result = parseCharacterImport(JSON.stringify({ format: characterExportFormat, exportedAt: "2026-08-29T00:00:00.000Z", character: demoCharacter }), new Set());
    expect(result).toEqual(demoCharacter);
  });

  it("gera outro id para não sobrescrever uma ficha já existente", () => {
    const result = parseCharacterImport(JSON.stringify(demoCharacter), new Set([demoCharacter.id]));
    expect(result.id).not.toBe(demoCharacter.id);
    expect(result.identity.name).toBe(demoCharacter.identity.name);
  });

  it("rejeita arquivos que não representam uma ficha", () => {
    expect(() => parseCharacterImport(JSON.stringify({ format: characterExportFormat, character: { name: "incompleto" } }), new Set())).toThrow("ficha compatível");
  });
});
