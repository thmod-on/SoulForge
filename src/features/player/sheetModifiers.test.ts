import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { Character, FeatureDefinition } from "../../domain/types";
import { synchronizeCharacterSheetModifiers } from "./sheetModifiers";

const humanFeature: FeatureDefinition = { id: "feature.human.top", type: "feature", packId: "test", name: "Alta Resistência", summary: "", sourceType: "ancestry", sourceId: "ancestry.human", tier: "top", sheetModifiers: [{ kind: "resource-max", resourceId: "stress", amount: 1 }] };
const giantFeature: FeatureDefinition = { id: "feature.giant.top", type: "feature", packId: "test", name: "Resistência", summary: "", sourceType: "ancestry", sourceId: "ancestry.giant", tier: "top", sheetModifiers: [{ kind: "resource-max", resourceId: "hp", amount: 1 }] };
const galapaFeature: FeatureDefinition = { id: "feature.galapa.top", type: "feature", packId: "test", name: "Casco", summary: "", sourceType: "ancestry", sourceId: "ancestry.galapa", tier: "top", sheetModifiers: [{ kind: "defense-per-proficiency", field: "minor", amount: 1 }, { kind: "defense-per-proficiency", field: "major", amount: 1 }] };
const guardianFeature: FeatureDefinition = { id: "feature.guardian.foundation", type: "feature", packId: "test", name: "Inabalável", summary: "", sourceType: "subclass", sourceId: "subclass.guardian", tier: "foundation", sheetModifiers: [{ kind: "defense", field: "minor", amount: 1 }, { kind: "defense", field: "major", amount: 1 }] };
const guardianSubclass = { id: "subclass.guardian", type: "subclass" as const, packId: "test", name: "Baluarte", summary: "", classId: "class.guardian", foundationFeatureIds: [guardianFeature.id], specializationFeatureIds: [], masteryFeatureIds: [] };
const guardianClass = { id: "class.guardian", type: "class" as const, packId: "test", name: "Guardião", summary: "", domainIds: ["domain.a", "domain.b"] as [string, string], startingEvasion: 9, startingHitPoints: 7, featureIds: [], hopeFeatureId: "", subclassIds: [guardianSubclass.id, guardianSubclass.id] as [string, string] };
const warlockClass = { ...guardianClass, id: "class.warlock", name: "Bruxo", startingHitPoints: 5 };
const catalog = createCatalog([], [humanFeature, giantFeature, galapaFeature, guardianFeature, guardianSubclass, guardianClass, warlockClass]);

function character(top?: string, bottom?: string): Character {
  return { id: "test", identity: { name: "Teste", ancestry: "Humano", ancestryFeatureIds: { top, bottom }, className: "Guardião", community: "", level: 1, xp: 0, nextLevelXp: 10, quote: "" }, attributes: [], defense: { evasion: 10, armor: 0, minor: 5, major: 10 }, proficiency: 2, resources: [{ id: "hp", label: "PV", value: 5, max: 6, tone: "hp" }, { id: "stress", label: "Estresse", value: 0, max: 6, tone: "stress" }], skills: [], experiences: [], notes: [], deck: { activeCardIds: [], learnedCardIds: [] }, inventory: { capacity: 0, compartments: [], entries: [] } };
}

describe("modificadores declarativos de ancestralidade", () => {
  it("aplica ao Humano um espaço máximo de Estresse, sem marcar Estresse", () => {
    const updated = synchronizeCharacterSheetModifiers(character("feature.human.top"), catalog);
    expect(updated.resources.find((entry) => entry.id === "stress")).toMatchObject({ value: 0, max: 7, baseMax: 6 });
  });

  it("acumula bônus de PV e preserva o valor atual", () => {
    const updated = synchronizeCharacterSheetModifiers(character("feature.giant.top"), catalog);
    expect(updated.resources.find((entry) => entry.id === "hp")).toMatchObject({ value: 5, max: 7, baseMax: 6 });
  });

  it("reconstrói os máximos de uma personagem humana a partir dos avanços já registrados", () => {
    const progressed = {
      ...character("feature.human.top"),
      identity: { ...character("feature.human.top").identity, primaryClassId: warlockClass.id },
      resources: [{ id: "hp", label: "PV", value: 5, max: 7, baseMax: 7, tone: "hp" as const }, { id: "stress", label: "Estresse", value: 0, max: 8, baseMax: 8, tone: "stress" as const }],
      progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation" as const], advancementSelections: [{ kind: "hp" as const, tier: 2 as const, level: 3 }, { kind: "stress" as const, tier: 2 as const, level: 3 }, { kind: "hp" as const, tier: 2 as const, level: 4 }, { kind: "stress" as const, tier: 2 as const, level: 4 }], history: [] }
    };
    const updated = synchronizeCharacterSheetModifiers(progressed, catalog);
    expect(updated.resources.find((entry) => entry.id === "hp")).toMatchObject({ baseMax: 7, max: 7 });
    expect(updated.resources.find((entry) => entry.id === "stress")).toMatchObject({ baseMax: 8, max: 9 });
  });

  it("recalcula bônus que acompanha a Proficiência sem duplicá-lo", () => {
    const once = synchronizeCharacterSheetModifiers(character("feature.galapa.top"), catalog);
    const twice = synchronizeCharacterSheetModifiers(once, catalog);
    expect(once.defense).toEqual({ evasion: 10, armor: 0, minor: 7, major: 12 });
    expect(twice.defense).toEqual(once.defense);
  });

  it("aplica modificador permanente da subclasse desbloqueada", () => {
    const base = character();
    const updated = synchronizeCharacterSheetModifiers({ ...base, identity: { ...base.identity, primaryClassId: guardianClass.id, primarySubclassId: guardianSubclass.id } }, catalog);
    expect(updated.defense).toEqual({ evasion: 10, armor: 0, minor: 6, major: 11 });
  });
});
