import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { Character, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { activateFeatureEffect } from "./featureEffectActions";

const favor: FeatureDefinition = { id: "feature.test.favor", type: "feature", packId: "test", name: "Favor", summary: "", sourceType: "class", sourceId: "class.test", tier: "class", gameMarkers: [{ id: "favor", kind: "counter", label: "Favor", initialValue: 3 }] };
const mantle: FeatureDefinition = { id: "feature.test.mantle", type: "feature", packId: "test", name: "Manto", summary: "", sourceType: "subclass", sourceId: "subclass.test", tier: "foundation", activation: { label: "Ativar Manto", costs: [{ kind: "game-marker", sourceDefinitionId: favor.id, markerId: "favor", amount: 1 }], endsOn: ["scene-end", "severe-damage"], modifiers: [{ kind: "defense-per-tier", fields: ["minor", "major"] }] } };
const subclass: SubclassDefinition = { id: "subclass.test", type: "subclass", packId: "test", name: "Eterno", summary: "", classId: "class.test", foundationFeatureIds: [mantle.id], specializationFeatureIds: [], masteryFeatureIds: [] };
const characterClass: ClassDefinition = { id: "class.test", type: "class", packId: "test", name: "Bruxo", summary: "", domainIds: ["domain.a", "domain.b"], startingEvasion: 10, startingHitPoints: 5, featureIds: [favor.id], hopeFeatureId: "", subclassIds: [subclass.id, subclass.id] };

describe("ativação de Feature", () => {
  it("consome o contador declarado e persiste o efeito", async () => {
    const catalog = createCatalog([], [favor, mantle, subclass, characterClass]);
    const state: { character: Character } = { character: { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id, primarySubclassId: subclass.id }, gameMarkers: undefined } };
    const saveCharacter = vi.fn(async () => undefined);
    await activateFeatureEffect(mantle.id, { state, catalog, saveCharacter, render: vi.fn() });
    expect(state.character.activeFeatureEffects).toHaveLength(1);
    expect(state.character.gameMarkers?.find((marker) => marker.kind === "counter")).toMatchObject({ kind: "counter", value: 2 });
    expect(saveCharacter).toHaveBeenCalledOnce();
  });
});
