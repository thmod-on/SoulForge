import type { Catalog } from "../../domain/catalog";
import type { Character, FeatureActivationDefinition } from "../../domain/types";
import { getGameMarkerKey, synchronizeGameMarkers } from "../game-markers/gameMarkerSync";
import { getFeatureActivationForCharacter } from "./featureEffects";

export type FeatureEffectActionDependencies = {
  state: { character?: Character; featureActivationError?: string };
  catalog: Catalog;
  saveCharacter(character: Character): Promise<void>;
  render(): void;
};

export async function activateFeatureEffect(featureId: string | undefined, deps: FeatureEffectActionDependencies, tokenValue?: number, target?: "self" | "ally"): Promise<void> {
  const character = deps.state.character;
  if (!character || !featureId) return;
  const activation = getFeatureActivationForCharacter(character, deps.catalog, featureId);
  if (!activation) return showError("Esta Feature não está disponível para ativação na ficha atual.", deps);
  if (activation.target === "self-or-ally" && !target) return showError("Escolha se o efeito beneficia você ou um aliado.", deps);
  if (target === "ally" && activation.target !== "self-or-ally") return showError("Esta Feature não pode ser aplicada a um aliado.", deps);
  if (!activation.target && (character.activeFeatureEffects ?? []).some((effect) => effect.featureId === featureId)) return showError("Este efeito já está ativo.", deps);

  const synchronizedCharacter = synchronizeGameMarkers(character, deps.catalog);
  const initialTokens = getInitialTokenValue(synchronizedCharacter, deps.catalog, activation, tokenValue);
  if (activation.tokens && (initialTokens === undefined || initialTokens < 0)) return showError("Defina a quantidade de fichas antes de ativar esta Feature.", deps);
  const resourceCosts = new Map<string, number>();
  const markerCosts = new Map<string, number>();
  for (const cost of activation.costs) {
    const amount = cost.amount === "per-token" ? initialTokens ?? 0 : cost.amount;
    if (cost.kind === "resource") resourceCosts.set(cost.resourceId, (resourceCosts.get(cost.resourceId) ?? 0) + amount);
    else {
      const markerKey = getGameMarkerKey(cost.sourceDefinitionId, cost.markerId);
      markerCosts.set(markerKey, (markerCosts.get(markerKey) ?? 0) + amount);
    }
  }

  for (const [resourceId, amount] of resourceCosts) {
    const resource = synchronizedCharacter.resources.find((entry) => entry.id === resourceId);
    if (!resource || resource.value + amount > resource.max) return showError("Não há espaços disponíveis neste recurso para ativar esta Feature.", deps);
  }
  for (const [markerKey, amount] of markerCosts) {
    const marker = synchronizedCharacter.gameMarkers?.find((entry) => entry.key === markerKey && entry.kind === "counter");
    if (!marker || marker.kind !== "counter" || marker.value < amount) return showError("Não há marcadores suficientes para ativar esta Feature.", deps);
  }

  const updatedCharacter: Character = {
    ...synchronizedCharacter,
    resources: synchronizedCharacter.resources.map((resource) => resourceCosts.has(resource.id) ? { ...resource, value: resource.value + (resourceCosts.get(resource.id) ?? 0) } : resource),
    gameMarkers: synchronizedCharacter.gameMarkers?.map((marker) => {
      if (marker.kind !== "counter" || !markerCosts.has(marker.key)) return marker;
      return { ...marker, value: marker.value - (markerCosts.get(marker.key) ?? 0) };
    }),
    activeFeatureEffects: [...(synchronizedCharacter.activeFeatureEffects ?? []).filter((effect) => effect.featureId !== featureId), {
      featureId,
      ...(target ? { target } : {}),
      activatedAt: new Date().toISOString(),
      ...(activation.tokens ? { tokens: { label: activation.tokens.label, value: initialTokens ?? 0 } } : {})
    }]
  };
  deps.state.character = updatedCharacter;
  deps.state.featureActivationError = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

export async function changeFeatureEffectTokens(featureId: string | undefined, delta: number, deps: FeatureEffectActionDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character || !featureId || !Number.isInteger(delta)) return;
  const effect = character.activeFeatureEffects?.find((entry) => entry.featureId === featureId);
  if (!effect?.tokens) return;
  const value = Math.max(0, effect.tokens.value + delta);
  const updatedCharacter = {
    ...character,
    activeFeatureEffects: character.activeFeatureEffects?.map((entry) => entry.featureId === featureId ? { ...entry, tokens: { ...entry.tokens!, value } } : entry)
  };
  deps.state.character = updatedCharacter;
  deps.state.featureActivationError = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

export async function endFeatureEffect(featureId: string | undefined, deps: FeatureEffectActionDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character || !featureId || !(character.activeFeatureEffects ?? []).some((effect) => effect.featureId === featureId)) return;
  const updatedCharacter = { ...character, activeFeatureEffects: character.activeFeatureEffects?.filter((effect) => effect.featureId !== featureId) };
  deps.state.character = updatedCharacter;
  deps.state.featureActivationError = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

function showError(message: string, deps: FeatureEffectActionDependencies): void {
  deps.state.featureActivationError = message;
  deps.render();
}

function getInitialTokenValue(character: Character, catalog: Catalog, activation: FeatureActivationDefinition, selectedValue?: number): number | undefined {
  const initial = activation?.tokens?.initial;
  if (!initial) return undefined;
  if (initial.kind === "fixed") return initial.value;
  if (initial.kind === "manual" || initial.kind === "roll") return selectedValue;
  const subclass = catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId);
  const attributeId = subclass?.spellcastAttributeId;
  return attributeId ? character.attributes.find((attribute) => attribute.id === attributeId)?.value ?? 0 : 0;
}
