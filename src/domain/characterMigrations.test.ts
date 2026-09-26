import { describe, expect, it } from "vitest";
import { demoCharacter } from "./demoCharacter";
import { migrateCharacter, migrateLegacyCharacterNotes } from "./characterMigrations";
import type { Character } from "./types";

describe("migrações da ficha", () => {
  it("migra Item para Lore sem alterar os dados da anotação", () => {
    const legacy = { ...demoCharacter, notes: [{ id: "note.item", title: "Relíquia", content: "Inscrição antiga.", category: "item", createdAt: "2026-08-01T10:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" }] } as unknown as Character;
    const migrated = migrateLegacyCharacterNotes(legacy);

    expect(migrated.notes[0]).toEqual({ ...legacy.notes[0], category: "lore" });
    expect(migrated).not.toBe(legacy);
  });

  it("preserva a ficha por referência quando nenhuma migração é necessária", () => {
    expect(migrateLegacyCharacterNotes(demoCharacter)).toBe(demoCharacter);
  });

  it("marca recursos customizados antigos sem confundi-los com recursos do sistema", () => {
    const legacy = { ...demoCharacter, resources: [...demoCharacter.resources, { id: "resource.550e8400-e29b-41d4-a716-446655440000", label: "Ímpeto", value: 1, max: 3, tone: "focus" as const }] };
    const migrated = migrateCharacter(legacy);

    expect(migrated.resources.at(-1)).toMatchObject({ label: "Ímpeto", source: "custom" });
    expect(migrated.resources.find((resource) => resource.id === "hp")?.source).toBeUndefined();
  });
});
