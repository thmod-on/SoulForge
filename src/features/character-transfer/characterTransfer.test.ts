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

  it("preserva a transformação referenciada na exportação", () => {
    const transformed = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: "transformation.test.vampire" } };
    const result = parseCharacterImport(JSON.stringify({ format: characterExportFormat, exportedAt: "2026-09-10T00:00:00.000Z", character: transformed }), new Set());
    expect(result.identity.transformationId).toBe("transformation.test.vampire");
  });

  it("preserva cartas indisponíveis e sua forma de reativação", () => {
    const character = { ...demoCharacter, deck: { ...demoCharacter.deck, unavailableCards: [{ cardId: demoCharacter.deck.activeCardIds[0], reactivation: "manual" as const, deactivatedAt: "2026-09-13T12:00:00.000Z" }] } };
    const result = parseCharacterImport(JSON.stringify(character), new Set());

    expect(result.deck.unavailableCards).toEqual(character.deck.unavailableCards);
  });

  it("preserva Cicatrizes narrativas na portabilidade da ficha", () => {
    const scars = [{ id: "scar.1", narrative: "Teme o som de correntes.", createdAt: "2026-09-15T12:00:00.000Z" }];
    const result = parseCharacterImport(JSON.stringify({ ...demoCharacter, scars }), new Set());
    expect(result.scars).toEqual(scars);
  });

  it("migra anotações Item de arquivos antigos para Lore", () => {
    const legacy = JSON.parse(JSON.stringify(demoCharacter));
    legacy.notes = [{ id: "note.legacy", title: "Relíquia", content: "Texto preservado", category: "item", createdAt: "2026-08-01T10:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" }];

    const result = parseCharacterImport(JSON.stringify(legacy), new Set());

    expect(result.notes[0]).toEqual({ ...legacy.notes[0], category: "lore" });
  });

  it("preserva e identifica recursos customizados de exportações antigas", () => {
    const legacy = JSON.parse(JSON.stringify(demoCharacter));
    legacy.resources.push({ id: "resource.550e8400-e29b-41d4-a716-446655440000", label: "Ímpeto", value: 1, max: 3, tone: "focus" });

    const result = parseCharacterImport(JSON.stringify(legacy), new Set());

    expect(result.resources.at(-1)).toMatchObject({ label: "Ímpeto", source: "custom" });
  });

  it("rejeita arquivos que não representam uma ficha", () => {
    expect(() => parseCharacterImport(JSON.stringify({ format: characterExportFormat, character: { name: "incompleto" } }), new Set())).toThrow("ficha compatível");
  });
});
