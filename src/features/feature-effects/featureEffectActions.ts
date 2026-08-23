import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { getGameMarkerKey, synchronizeGameMarkers } from "../game-markers/gameMarkerSync";
import { getFeatureActivationForCharacter } from "./featureEffects";

export type FeatureEffectActionDependencies = {
  state: { character?: Character; featureActivationError?: string };
  catalog: Catalog;
  saveCharacter(character: Character): Promise<void>;
  render(): void;
};

export async function activateFeatureEffect(featureId: string | undefined, deps: FeatureEffectActionDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character || !featureId) return;
  const activation = getFeatureActivationForCharacter(character, deps.catalog, featureId);
  if (!activation) return showError("Esta Feature não está disponível para ativação na ficha atual.", deps);
  if ((character.activeFeatureEffects ?? []).some((effect) => effect.featureId === featureId)) return showError("Este efeito já está ativo.", deps);

  const synchronizedCharacter = synchronizeGameMarkers(character, deps.catalog);
  const resourceCosts = new Map<string, number>();
  const markerCosts = new Map<string, number>();
  for (const cost of activation.costs) {
    if (cost.kind === "resource") resourceCosts.set(cost.resourceId, (resourceCosts.get(cost.resourceId) ?? 0) + cost.amount);
    else {
      const markerKey = getGameMarkerKey(cost.sourceDefinitionId, cost.markerId);
      markerCosts.set(markerKey, (markerCosts.get(markerKey) ?? 0) + cost.amount);
    }
  }

  for (const [resourceId, amount] of resourceCosts) {
    const resource = synchronizedCharacter.resources.find((entry) => entry.id === resourceId);
    if (!resource || resource.value < amount) return showError("Não há recurso suficiente para ativar esta Feature.", deps);
  }
  for (const [markerKey, amount] of markerCosts) {
    const marker = synchronizedCharacter.gameMarkers?.find((entry) => entry.key === markerKey && entry.kind === "counter");
    if (!marker || marker.kind !== "counter" || marker.value < amount) return showError("Não há marcadores suficientes para ativar esta Feature.", deps);
  }

  const updatedCharacter: Character = {
    ...synchronizedCharacter,
    resources: synchronizedCharacter.resources.map((resource) => resourceCosts.has(resource.id) ? { ...resource, value: resource.value - (resourceCosts.get(resource.id) ?? 0) } : resource),
    gameMarkers: synchronizedCharacter.gameMarkers?.map((marker) => {
      if (marker.kind !== "counter" || !markerCosts.has(marker.key)) return marker;
      return { ...marker, value: marker.value - (markerCosts.get(marker.key) ?? 0) };
    }),
    activeFeatureEffects: [...(synchronizedCharacter.activeFeatureEffects ?? []), { featureId, activatedAt: new Date().toISOString() }]
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
