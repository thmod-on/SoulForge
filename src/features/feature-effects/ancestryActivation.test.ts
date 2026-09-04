import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { Character, FeatureDefinition } from "../../domain/types";
import { activateFeatureEffect, endFeatureEffect } from "./featureEffectActions";
import { getActiveFeatureEffectDefenseModifiers, getActiveFeatureEffects } from "./featureEffects";
import { renderTraits } from "../player/renderTraits";
import { renderActiveFeatureEffects } from "./renderActiveFeatureEffects";

const feature: FeatureDefinition = {
  id: "feature.test.ancestry", type: "feature", packId: "test", name: "Proteção", summary: "Benefício temporário.",
  sourceType: "ancestry", sourceId: "ancestry.test", tier: "bottom",
  activation: { label: "Ativar", costs: [{ kind: "resource", resourceId: "stress", amount: 1 }], endsOn: [], modifiers: [] }
};
function setup(definition = feature) {
  const state: { character: Character; featureActivationError?: string } = { character: {
    ...demoCharacter, identity: { ...demoCharacter.identity, ancestryFeatureIds: { top: "feature.other", bottom: definition.id } },
    resources: demoCharacter.resources.map((resource) => ({ ...resource, value: 0 })), activeFeatureEffects: []
  } };
  return { state, catalog: createCatalog([], [definition]), saveCharacter: vi.fn(async () => undefined), render: vi.fn() };
}

describe("ativações de ancestralidade", () => {
  it("cobra apenas a ativação, preserva o efeito ao renderizar e encerra sem cobrar novamente", async () => {
    const deps = setup();
    await activateFeatureEffect(feature.id, deps);
    await activateFeatureEffect(feature.id, deps);
    expect(deps.state.character.resources.find((r) => r.id === "stress")?.value).toBe(1);
    const effects = getActiveFeatureEffects(deps.state.character, deps.catalog);
    expect(renderActiveFeatureEffects(deps.state.character, effects, [], (s) => s)).toContain("ao encerrar manualmente");
    expect(renderTraits(deps.state.character, { catalog: deps.catalog, escapeHtml: (s) => s, renderEmptyInline: (s) => s })).toContain("Efeito ativo");
    await endFeatureEffect(feature.id, deps);
    expect(deps.state.character.activeFeatureEffects).toEqual([]);
    expect(deps.state.character.resources.find((r) => r.id === "stress")?.value).toBe(1);
  });

  it("voo sem custo não marca recursos nem concede o bônus de uma reação opcional", async () => {
    const deps = setup({ ...feature, activation: { ...feature.activation!, costs: [], reminders: ["Gaste Estresse manualmente na reação."] } });
    const resources = deps.state.character.resources;
    await activateFeatureEffect(feature.id, deps);
    expect(deps.state.character.resources).toEqual(resources);
    expect(getActiveFeatureEffectDefenseModifiers(deps.state.character, deps.catalog)).toEqual({});
  });

  it("respeita a Feature selecionada e impede ativação sem recurso", async () => {
    const deps = setup();
    deps.state.character.identity.ancestryFeatureIds = { top: "other", bottom: "other-bottom" };
    await activateFeatureEffect(feature.id, deps);
    expect(deps.saveCharacter).not.toHaveBeenCalled();
    deps.state.character.identity.ancestryFeatureIds.bottom = feature.id;
    deps.state.character.resources = deps.state.character.resources.map((r) => ({ ...r, value: r.max }));
    await activateFeatureEffect(feature.id, deps);
    expect(deps.saveCharacter).not.toHaveBeenCalled();
  });

  it("troca o alvo sem empilhar bônus e conserva o efeito anterior se faltar recurso", async () => {
    const deps = setup({ ...feature, activation: { ...feature.activation!, target: "self-or-ally", costs: [{ kind: "resource", resourceId: "hope", amount: 2 }], modifiers: [{ kind: "defense", fields: ["evasion"], amount: 1 }] } });
    await activateFeatureEffect(feature.id, deps, undefined, "self");
    expect(getActiveFeatureEffectDefenseModifiers(deps.state.character, deps.catalog)).toEqual({ evasion: 1 });
    await activateFeatureEffect(feature.id, deps, undefined, "ally");
    expect(deps.state.character.activeFeatureEffects).toHaveLength(1);
    expect(getActiveFeatureEffectDefenseModifiers(deps.state.character, deps.catalog)).toEqual({});
    expect(deps.state.character.resources.find((r) => r.id === "hope")?.value).toBe(4);
    await activateFeatureEffect(feature.id, deps, undefined, "self");
    expect(deps.state.character.activeFeatureEffects?.[0].target).toBe("ally");
  });
});
