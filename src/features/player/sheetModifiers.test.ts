import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { CardDefinition, Character, FeatureDefinition, ItemDefinition } from "../../domain/types";
import { getActiveSheetModifierEffects, synchronizeCharacterSheetModifiers } from "./sheetModifiers";

const humanFeature: FeatureDefinition = { id: "feature.human.top", type: "feature", packId: "test", name: "Alta Resistência", summary: "", sourceType: "ancestry", sourceId: "ancestry.human", tier: "top", sheetModifiers: [{ kind: "resource-max", resourceId: "stress", amount: 1 }] };
const giantFeature: FeatureDefinition = { id: "feature.giant.top", type: "feature", packId: "test", name: "Resistência", summary: "", sourceType: "ancestry", sourceId: "ancestry.giant", tier: "top", sheetModifiers: [{ kind: "resource-max", resourceId: "hp", amount: 1 }] };
const galapaFeature: FeatureDefinition = { id: "feature.galapa.top", type: "feature", packId: "test", name: "Casco", summary: "", sourceType: "ancestry", sourceId: "ancestry.galapa", tier: "top", sheetModifiers: [{ kind: "defense-per-proficiency", field: "minor", amount: 1 }, { kind: "defense-per-proficiency", field: "major", amount: 1 }] };
const simiahFeature: FeatureDefinition = { id: "feature.simiah.bottom", type: "feature", packId: "test", name: "Ágil", summary: "", sourceType: "ancestry", sourceId: "ancestry.simiah", tier: "bottom", sheetModifiers: [{ kind: "defense", field: "evasion", amount: 1 }] };
const earthkinFeature: FeatureDefinition = { id: "feature.earthkin.top", type: "feature", packId: "test", name: "Pele de Pedra", summary: "", sourceType: "ancestry", sourceId: "ancestry.earthkin", tier: "top", sheetModifiers: [{ kind: "defense", field: "armor", amount: 1 }, { kind: "defense", field: "minor", amount: 1 }, { kind: "defense", field: "major", amount: 1 }] };
const guardianFeature: FeatureDefinition = { id: "feature.guardian.foundation", type: "feature", packId: "test", name: "Inabalável", summary: "", sourceType: "subclass", sourceId: "subclass.guardian", tier: "foundation", sheetModifiers: [{ kind: "defense", field: "minor", amount: 1 }, { kind: "defense", field: "major", amount: 1 }] };
const multiclassFeature: FeatureDefinition = { id: "feature.multiclass.foundation", type: "feature", packId: "test", name: "Fundação extra", summary: "", sourceType: "subclass", sourceId: "subclass.multiclass", tier: "foundation", sheetModifiers: [{ kind: "defense", field: "major", amount: 2 }] };
const guardianSubclass = { id: "subclass.guardian", type: "subclass" as const, packId: "test", name: "Baluarte", summary: "", classId: "class.guardian", foundationFeatureIds: [guardianFeature.id], specializationFeatureIds: [], masteryFeatureIds: [] };
const guardianClass = { id: "class.guardian", type: "class" as const, packId: "test", name: "Guardião", summary: "", domainIds: ["domain.a", "domain.b"] as [string, string], startingEvasion: 9, startingHitPoints: 7, featureIds: [], hopeFeatureId: "", subclassIds: [guardianSubclass.id, guardianSubclass.id] as [string, string] };
const warlockClass = { ...guardianClass, id: "class.warlock", name: "Bruxo", startingHitPoints: 5 };
const catalog = createCatalog([], [humanFeature, giantFeature, galapaFeature, simiahFeature, earthkinFeature, guardianFeature, multiclassFeature, guardianSubclass, guardianClass, warlockClass]);
const untouchable: CardDefinition = { id: "card.bone.untouchable", type: "card", packId: "test", name: "Intocável", summary: "", domainId: "domain.bone", tier: 1, cardType: "passiva", effect: "", sheetModifiers: [{ kind: "defense-per-attribute", field: "evasion", attributeId: "dex", divisor: 2 }] };
const sharpenedReflexes: CardDefinition = { id: "card.test.reflexes", type: "card", packId: "test", name: "Reflexos aguçados", summary: "", domainId: "domain.bone", tier: 1, cardType: "passiva", effect: "", sheetModifiers: [{ kind: "attribute", attributeId: "dex", amount: 1 }] };
const fortifiedArmor: CardDefinition = { id: "card.test.fortified", type: "card", packId: "test", name: "Armadura Fortificada", summary: "", domainId: "domain.blade", tier: 4, cardType: "passiva", effect: "", sheetModifiers: [{ kind: "defense", field: "minor", amount: 2, condition: { kind: "equipped-armor" } }, { kind: "defense", field: "major", amount: 2, condition: { kind: "equipped-armor" } }] };
const boneTouched: CardDefinition = { id: "card.test.bone-touched", type: "card", packId: "test", name: "Tocado pelo Osso", summary: "", domainId: "domain.bone", tier: 7, cardType: "passiva", effect: "", sheetModifiers: [{ kind: "attribute", attributeId: "dex", amount: 1, condition: { kind: "active-domain-cards", domainId: "domain.bone", minimum: 4 } }] };
const armor: ItemDefinition = { id: "item.test.armor", type: "item", packId: "test", name: "Armadura", summary: "", category: "armadura", weight: 1 };
const shield: ItemDefinition = { id: "item.test.shield", type: "item", packId: "test", name: "Escudo", summary: "", category: "equipamento", weight: 1, combatModifiers: { armor: 1 } };
const cardCatalog = createCatalog([], [humanFeature, giantFeature, galapaFeature, simiahFeature, earthkinFeature, guardianFeature, multiclassFeature, guardianSubclass, guardianClass, warlockClass, untouchable, sharpenedReflexes, fortifiedArmor, boneTouched, armor, shield]);

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

  it("aplica os bônus permanentes de Simiah e Earthkin somente às Features escolhidas", () => {
    const simiah = synchronizeCharacterSheetModifiers(character(undefined, "feature.simiah.bottom"), catalog);
    const earthkin = synchronizeCharacterSheetModifiers(character("feature.earthkin.top"), catalog);
    expect(simiah.defense).toEqual({ evasion: 11, armor: 0, minor: 5, major: 10 });
    expect(earthkin.defense).toEqual({ evasion: 10, armor: 1, minor: 6, major: 11 });
  });

  it("aplica modificador permanente da subclasse desbloqueada", () => {
    const base = character();
    const updated = synchronizeCharacterSheetModifiers({ ...base, identity: { ...base.identity, primaryClassId: guardianClass.id, primarySubclassId: guardianSubclass.id } }, catalog);
    expect(updated.defense).toEqual({ evasion: 10, armor: 0, minor: 6, major: 11 });
  });

  it("aplica a carta passiva apenas enquanto ela está no Loadout e arredonda frações para cima", () => {
    const base = { ...character(), attributes: [{ id: "dex" as const, label: "AGI", value: 3 }] };
    const active = synchronizeCharacterSheetModifiers({ ...base, deck: { activeCardIds: [untouchable.id], learnedCardIds: [untouchable.id] } }, cardCatalog);
    const stored = synchronizeCharacterSheetModifiers({ ...base, deck: { activeCardIds: [], learnedCardIds: [untouchable.id] } }, cardCatalog);
    expect(active.defense.evasion).toBe(12);
    expect(stored.defense.evasion).toBe(10);
  });

  it("recalcula atributos de cartas ativas a partir do valor-base, sem duplicar o bônus", () => {
    const base = { ...character(), attributes: [{ id: "dex" as const, label: "AGI", value: 1 }] , deck: { activeCardIds: [sharpenedReflexes.id], learnedCardIds: [sharpenedReflexes.id] } };
    const once = synchronizeCharacterSheetModifiers(base, cardCatalog);
    const twice = synchronizeCharacterSheetModifiers(once, cardCatalog);
    expect(once.attributes[0]).toMatchObject({ baseValue: 1, value: 2 });
    expect(twice.attributes[0]).toEqual(once.attributes[0]);
  });

  it("aplica e explica Armadura Fortificada apenas com uma armadura equipada", () => {
    const base = { ...character(), deck: { activeCardIds: [fortifiedArmor.id], learnedCardIds: [fortifiedArmor.id] } };
    const withShield = { ...base, inventory: { ...base.inventory, entries: [{ definitionId: shield.id, quantity: 1, compartmentId: "equipped" }] } };
    const withArmor = { ...base, inventory: { ...base.inventory, entries: [{ definitionId: armor.id, quantity: 1, compartmentId: "equipped" }] } };
    expect(synchronizeCharacterSheetModifiers(withShield, cardCatalog).defense).toMatchObject({ minor: 5, major: 10 });
    expect(synchronizeCharacterSheetModifiers(withArmor, cardCatalog).defense).toMatchObject({ minor: 7, major: 12 });
    expect(getActiveSheetModifierEffects(withArmor, cardCatalog)).toHaveLength(1);
  });

  it("aplica e explica Tocado pelo Osso somente com quatro cartas de Osso no Loadout", () => {
    const fillers = ["card.test.bone-1", "card.test.bone-2", "card.test.bone-3"];
    const fillerCards: CardDefinition[] = fillers.map((id) => ({ id, type: "card", packId: "test", name: id, summary: "", domainId: "domain.bone", tier: 1, cardType: "passiva", effect: "" }));
    const catalogWithFillers = createCatalog([], [...cardCatalog.definitions, ...fillerCards]);
    const base = { ...character(), attributes: [{ id: "dex" as const, label: "AGI", value: 1 }], deck: { activeCardIds: [boneTouched.id], learnedCardIds: [boneTouched.id] } };
    const active = { ...base, deck: { activeCardIds: [boneTouched.id, ...fillers], learnedCardIds: [boneTouched.id, ...fillers] } };
    expect(synchronizeCharacterSheetModifiers(base, catalogWithFillers).attributes[0]?.value).toBe(1);
    expect(synchronizeCharacterSheetModifiers(active, catalogWithFillers).attributes[0]?.value).toBe(2);
    expect(getActiveSheetModifierEffects(active, catalogWithFillers)).toHaveLength(1);
  });

  it("reconstroi os avanços de Evasão já registrados a partir da defesa-base", () => {
    const progressed = { ...character(), baseDefense: { evasion: 10, armor: 0, minor: 5, major: 10 }, defense: { evasion: 10, armor: 0, minor: 5, major: 10 }, progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation" as const], advancementSelections: [{ kind: "evasion" as const, tier: 1 as const, level: 2 }, { kind: "evasion" as const, tier: 2 as const, level: 5 }], history: [] } };
    const once = synchronizeCharacterSheetModifiers(progressed, catalog);
    const twice = synchronizeCharacterSheetModifiers(once, catalog);
    expect(once.defense.evasion).toBe(12);
    expect(twice.defense.evasion).toBe(12);
  });

  it("inclui a Feature e a Fundação recebidas por Multiclasse", () => {
    const base = { ...character(), progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation" as const], advancementSelections: [], history: [], multiclass: { classId: "class.multiclass", className: "Outra", domainId: "domain.a", domainName: "A", featureId: "feature.unknown", featureName: "Classe", subclassId: "subclass.multiclass", subclassName: "Outra", foundationFeatureId: multiclassFeature.id, foundationFeatureName: multiclassFeature.name } } };
    const updated = synchronizeCharacterSheetModifiers(base, catalog);
    expect(updated.defense.major).toBe(12);
  });
});
