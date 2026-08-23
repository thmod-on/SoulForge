import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { endFeatureEffectsForCondition, getActiveFeatureEffectDefenseModifiers, getCharacterTier } from "./featureEffects";

const mantle: FeatureDefinition = {
  id: "feature.test.mantle", type: "feature", packId: "test", name: "Manto", summary: "", sourceType: "subclass", sourceId: "subclass.test", tier: "foundation",
  activation: { label: "Ativar", costs: [], endsOn: ["scene-end"], modifiers: [{ kind: "defense-per-tier", fields: ["minor", "major"] }] }
};
const subclass: SubclassDefinition = { id: "subclass.test", type: "subclass", packId: "test", name: "Eterno", summary: "", classId: "class.test", foundationFeatureIds: [mantle.id], specializationFeatureIds: [], masteryFeatureIds: [] };
const characterClass: ClassDefinition = { id: "class.test", type: "class", packId: "test", name: "Bruxo", summary: "", domainIds: ["domain.a", "domain.b"], startingEvasion: 10, startingHitPoints: 5, featureIds: [], hopeFeatureId: "", subclassIds: [subclass.id, subclass.id] };

describe("efeitos ativos de Feature", () => {
  it("aplica bônus de limiar igual ao tier sem alterar a defesa-base", () => {
    const catalog = createCatalog([], [mantle, subclass, characterClass]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, level: 5, primaryClassId: characterClass.id, primarySubclassId: subclass.id }, activeFeatureEffects: [{ featureId: mantle.id, activatedAt: "2026-08-23T00:00:00.000Z" }] };
    expect(getActiveFeatureEffectDefenseModifiers(character, catalog)).toEqual({ minor: 3, major: 3 });
    expect(character.defense).toEqual(demoCharacter.defense);
  });

  it("calcula corretamente o Tier 1 antes do nível 2", () => {
    expect(getCharacterTier(1)).toBe(1);
    expect(getCharacterTier(4)).toBe(2);
    expect(getCharacterTier(7)).toBe(3);
    expect(getCharacterTier(10)).toBe(4);
  });

  it("remove o efeito quando a condição declarada ocorre", () => {
    const catalog = createCatalog([], [mantle, subclass, characterClass]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id, primarySubclassId: subclass.id }, activeFeatureEffects: [{ featureId: mantle.id, activatedAt: "2026-08-23T00:00:00.000Z" }] };
    const effectThatEndsOnSevere: FeatureDefinition = { ...mantle, activation: { ...mantle.activation!, endsOn: ["severe-damage"] } };
    const updatedCatalog = createCatalog([], [effectThatEndsOnSevere, subclass, characterClass]);
    expect(endFeatureEffectsForCondition(character, updatedCatalog, "severe-damage").activeFeatureEffects).toEqual([]);
    expect(endFeatureEffectsForCondition(character, catalog, "severe-damage").activeFeatureEffects).toHaveLength(1);
  });

  it("aplica bônus fixo e o encerra no descanso declarado", () => {
    const evasion: FeatureDefinition = { ...mantle, activation: { label: "Esquiva", costs: [], endsOn: ["long-rest"], modifiers: [{ kind: "defense", fields: ["evasion"], amount: 2 }] } };
    const catalog = createCatalog([], [evasion, subclass, characterClass]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id, primarySubclassId: subclass.id }, activeFeatureEffects: [{ featureId: evasion.id, activatedAt: "2026-08-23T00:00:00.000Z" }] };
    expect(getActiveFeatureEffectDefenseModifiers(character, catalog)).toEqual({ evasion: 2 });
    expect(endFeatureEffectsForCondition(character, catalog, "long-rest").activeFeatureEffects).toEqual([]);
  });
});
