import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { AncestryDefinition, FeatureDefinition, TransformationDefinition } from "../../domain/types";
import { renderCharacterTransformationDialogs, renderCharacterTransformationPanel } from "./characterTransformations";
import { applyDefinitionRestMoveChoice, createDefinitionRestMoveChoice, getActiveDefinitionRestAction, updateDefinitionRestMoveChoice } from "./transformationChoices";

const feature = (id: string, name: string, sourceId: string, tier: "top" | "bottom"): FeatureDefinition => ({ id, type: "feature", packId: "test", name, summary: `${name} em detalhe.`, sourceType: "ancestry", sourceId, tier });
const ancestry = (id: string, name: string, topFeatureId: string, bottomFeatureId: string): AncestryDefinition => ({ id, type: "ancestry", packId: "test", name, summary: `${name} de teste.`, topFeatureId, bottomFeatureId });
const transformation: TransformationDefinition = {
  id: "transformation.test.shapeshifter", type: "transformation", packId: "test", name: "Metamorfo", summary: "Muda de forma.", benefit: "Escolhe uma ancestralidade.", drawback: "Recebe uma Feature.", narrativeQuestions: ["Quem?"],
  choices: [
    { id: "assumed-ancestry", kind: "definition", label: "Ancestralidade assumida", definitionType: "ancestry" },
    { id: "assumed-feature", kind: "feature-from-definition", label: "Feature assumida", sourceChoiceId: "assumed-ancestry", application: "reference" }
  ],
  restActions: [{ id: "change-form", label: "Mudar de forma", description: "Escolha uma forma.", timing: "any-rest", choiceIds: ["assumed-ancestry", "assumed-feature"] }]
};
const clankTop = feature("feature.test.clank.top", "Corpo de Metal", "ancestry.test.clank", "top");
const clankBottom = feature("feature.test.clank.bottom", "Propósito", "ancestry.test.clank", "bottom");
const elfTop = feature("feature.test.elf.top", "Graça", "ancestry.test.elf", "top");
const elfBottom = feature("feature.test.elf.bottom", "Transe", "ancestry.test.elf", "bottom");
const catalog = createCatalog([], [
  transformation,
  ancestry("ancestry.test.clank", "Clank", clankTop.id, clankBottom.id),
  ancestry("ancestry.test.elf", "Elfo", elfTop.id, elfBottom.id),
  clankTop, clankBottom, elfTop, elfBottom
]);

describe("escolhas declarativas de transformação", () => {
  it("cria a ação a partir da Definition ativa e recalcula a Feature ao trocar a ancestralidade", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    const active = getActiveDefinitionRestAction(character, catalog)!;
    const initial = createDefinitionRestMoveChoice(character, catalog, active);
    const changed = updateDefinitionRestMoveChoice(initial, "assumed-ancestry", "ancestry.test.elf", transformation, catalog);

    expect(initial.values).toEqual({ "assumed-ancestry": "ancestry.test.clank", "assumed-feature": clankTop.id });
    expect(changed.values).toEqual({ "assumed-ancestry": "ancestry.test.elf", "assumed-feature": elfTop.id });
  });

  it("persiste referências por fonte sem alterar a ancestralidade mecânica da ficha", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    const choice = { id: "definition-action" as const, sourceDefinitionId: transformation.id, actionId: "change-form", values: { "assumed-ancestry": "ancestry.test.elf", "assumed-feature": elfBottom.id } };
    const updated = applyDefinitionRestMoveChoice(character, choice);

    expect(updated.definitionSelections).toEqual([{ sourceDefinitionId: transformation.id, values: choice.values }]);
    expect(updated.identity.ancestry).toBe(character.identity.ancestry);
    expect(updated.identity.ancestryFeatureIds).toEqual(character.identity.ancestryFeatureIds);
  });

  it("exibe a forma escolhida na transformação sem oferecer uma ação fora do descanso", () => {
    const character = {
      ...demoCharacter,
      identity: { ...demoCharacter.identity, transformationId: transformation.id },
      definitionSelections: [{ sourceDefinitionId: transformation.id, values: { "assumed-ancestry": "ancestry.test.elf", "assumed-feature": elfBottom.id } }]
    };
    const escapeHtml = (value: string) => value;
    const panel = renderCharacterTransformationPanel(character, catalog, escapeHtml);
    const detail = renderCharacterTransformationDialogs({
      state: { characterTransformationPickerOpen: false, characterTransformationDetailOpen: true, characterTransformationRemoveOpen: false },
      character, catalog, escapeHtml, saveCharacter: async () => undefined, render: () => undefined
    });

    expect(panel).toContain("Forma: <strong>Elfo</strong> · Transe");
    expect(panel).not.toContain("não ocupa o Loadout");
    expect(detail).toContain("Feature assumida");
    expect(detail).toContain('<div class="transformation-choice-feature">');
    expect(detail).toContain("Esta forma pode ser alterada durante um descanso.");
    expect(`${panel}${detail}`).not.toContain("change-form");
  });
});
