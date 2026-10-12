import type { Definition, FeatureActivationDefinition, GameMarkerDefinition } from "./types";

type MarkerOverrideLike = { gameMarkers: GameMarkerDefinition[] };

/** Converte o antigo `short-rest`, que significava qualquer descanso, sem tocar em fichas. */
export function normalizeDefinitionRestTimings(definition: Definition): Definition {
  const sourceWithMarkers = definition as Definition & { gameMarkers?: GameMarkerDefinition[] };
  const normalizedMarkers = sourceWithMarkers.gameMarkers?.map(normalizeGameMarker);
  const gameMarkers = normalizedMarkers?.every((marker, index) => marker === sourceWithMarkers.gameMarkers?.[index]) ? sourceWithMarkers.gameMarkers : normalizedMarkers;
  const activation = definition.type === "feature" && definition.activation ? normalizeFeatureActivation(definition.activation) : undefined;
  if (gameMarkers === sourceWithMarkers.gameMarkers && activation === (definition.type === "feature" ? definition.activation : undefined)) return definition;
  return { ...definition, ...(gameMarkers ? { gameMarkers } : {}), ...(definition.type === "feature" && activation ? { activation } : {}) };
}

export function normalizeCardMarkerOverride<T extends MarkerOverrideLike>(override: T): T {
  const gameMarkers = override.gameMarkers.map(normalizeGameMarker);
  return gameMarkers.every((marker, index) => marker === override.gameMarkers[index]) ? override : { ...override, gameMarkers };
}

function normalizeGameMarker(marker: GameMarkerDefinition): GameMarkerDefinition {
  if (marker.kind !== "counter") return marker;
  const reset = marker.reset === "short-rest" ? "any-rest" : marker.reset;
  const eventChanges = marker.eventChanges
    ? marker.eventChanges.map((change) => change.event === "short-rest" ? { ...change, event: "any-rest" as const } : change)
    : undefined;
  if (reset === marker.reset && eventChanges === undefined) return marker;
  return { ...marker, ...(reset ? { reset } : {}), ...(eventChanges ? { eventChanges } : {}) };
}

function normalizeFeatureActivation(activation: FeatureActivationDefinition): FeatureActivationDefinition {
  const converted = activation.endsOn.map((condition) => condition === "short-rest" ? "any-rest" as const : condition);
  const endsOn = [...new Set(converted)].filter((condition) => condition !== "long-rest" || !converted.includes("any-rest"));
  return endsOn.length === activation.endsOn.length && endsOn.every((condition, index) => condition === activation.endsOn[index]) ? activation : { ...activation, endsOn };
}
