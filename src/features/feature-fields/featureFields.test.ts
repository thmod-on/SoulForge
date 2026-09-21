import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { Character, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { demoCharacter } from "../../domain/demoCharacter";
import { getCreationCharacterFieldSources, setDefinitionSelectionValues } from "./featureFields";

const packId = "pack.fields";
const classFeature: FeatureDefinition = { id: "feature.fields.class", type: "feature", packId, name: "Pacto", summary: "", sourceType: "class", sourceId: "class.fields", tier: "class", characterFields: [{ id: "patron", kind: "text", label: "Patrono", required: true }] };
const subclassFeature: FeatureDefinition = { id: "feature.fields.subclass", type: "feature", packId, name: "Origem", summary: "", sourceType: "subclass", sourceId: "subclass.fields", tier: "foundation", characterFields: [{ id: "element", kind: "select", label: "Elemento", required: true, options: [{ value: "fire", label: "Fogo" }] }] };
const characterClass: ClassDefinition = { id: "class.fields", type: "class", packId, name: "Classe", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [classFeature.id], hopeFeatureId: "feature.hope", subclassIds: ["subclass.fields", "subclass.other"] };
const subclass: SubclassDefinition = { id: "subclass.fields", type: "subclass", packId, name: "Subclasse", summary: "", classId: characterClass.id, foundationFeatureIds: [subclassFeature.id], specializationFeatureIds: [], masteryFeatureIds: [] };
const catalog = createCatalog([], [characterClass, subclass, classFeature, subclassFeature]);

describe("campos de personagem das Features", () => {
  it("descobre campos de classe e fundação sem conhecer a classe", () => {
    expect(getCreationCharacterFieldSources(characterClass, subclass, catalog).map(({ feature }) => feature.id)).toEqual([classFeature.id, subclassFeature.id]);
  });

  it("persiste a escolha e preserva seleções de outras definições", () => {
    const character = { ...demoCharacter, definitionSelections: [{ sourceDefinitionId: "transformation.test", values: { form: "orc" } }] } satisfies Character;
    const result = setDefinitionSelectionValues(character, classFeature, { patron: "A Tecelã" });
    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;
    expect(result.definitionSelections).toEqual([
      { sourceDefinitionId: "transformation.test", values: { form: "orc" } },
      { sourceDefinitionId: classFeature.id, values: { patron: "A Tecelã" } }
    ]);
  });

  it("rejeita valor que não pertence às opções declaradas", () => {
    expect(setDefinitionSelectionValues(demoCharacter, subclassFeature, { element: "ice" })).toBeInstanceOf(Error);
  });
});
