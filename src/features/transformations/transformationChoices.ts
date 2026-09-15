import type { Catalog } from "../../domain/catalog";
import type { Character, DefinitionChoiceDefinition, DefinitionRestAction, FeatureDefinition, TransformationDefinition } from "../../domain/types";
import type { DefinitionRestMoveChoice } from "../rest/restRules";

export type ActiveDefinitionRestAction = {
  source: TransformationDefinition;
  action: DefinitionRestAction;
};

export function getActiveDefinitionRestAction(character: Character, catalog: Catalog): ActiveDefinitionRestAction | undefined {
  const source = catalog.transformations.find((entry) => entry.id === character.identity.transformationId);
  const action = source?.restActions?.find((entry) => entry.timing === "any-rest");
  return source && action ? { source, action } : undefined;
}

export function createDefinitionRestMoveChoice(character: Character, catalog: Catalog, active: ActiveDefinitionRestAction): DefinitionRestMoveChoice {
  const previous = character.definitionSelections?.find((entry) => entry.sourceDefinitionId === active.source.id)?.values ?? {};
  const values = resolveChoiceDefaults(active.source, active.action, previous, catalog);
  return { id: "definition-action", sourceDefinitionId: active.source.id, actionId: active.action.id, values };
}

export function updateDefinitionRestMoveChoice(choice: DefinitionRestMoveChoice, choiceId: string, value: string, source: TransformationDefinition, catalog: Catalog): DefinitionRestMoveChoice {
  return { ...choice, values: resolveChoiceDefaults(source, source.restActions?.find((entry) => entry.id === choice.actionId), { ...choice.values, [choiceId]: value }, catalog, choiceId) };
}

export function applyDefinitionRestMoveChoice(character: Character, choice: DefinitionRestMoveChoice): Character {
  const selections = character.definitionSelections ?? [];
  const next = { sourceDefinitionId: choice.sourceDefinitionId, values: choice.values };
  return {
    ...character,
    definitionSelections: [...selections.filter((entry) => entry.sourceDefinitionId !== choice.sourceDefinitionId), next]
  };
}

export function isDefinitionRestMoveChoiceComplete(choice: DefinitionRestMoveChoice, source: TransformationDefinition | undefined): boolean {
  const action = source?.restActions?.find((entry) => entry.id === choice.actionId);
  return Boolean(action && action.choiceIds.every((choiceId) => choice.values[choiceId]));
}

export function getDefinitionChoiceOptions(definition: DefinitionChoiceDefinition, values: Record<string, string>, catalog: Catalog): Array<{ id: string; label: string; description: string }> {
  if (definition.kind === "definition") {
    return catalog.ancestries.map((entry) => ({ id: entry.id, label: entry.name, description: entry.summary }));
  }
  const sourceId = values[definition.sourceChoiceId];
  const ancestry = catalog.ancestries.find((entry) => entry.id === sourceId);
  if (!ancestry) return [];
  const featureIds = [...new Set([ancestry.topFeatureId, ancestry.bottomFeatureId])];
  return featureIds.flatMap((id) => {
    const feature = catalog.features.find((entry) => entry.id === id);
    return feature ? [{ id: feature.id, label: feature.name, description: feature.summary }] : [];
  });
}

export function getTransformationSelection(character: Character, transformation: TransformationDefinition): Record<string, string> {
  return character.definitionSelections?.find((entry) => entry.sourceDefinitionId === transformation.id)?.values ?? {};
}

export function getSelectedTransformationFeature(character: Character, transformation: TransformationDefinition, catalog: Catalog): FeatureDefinition | undefined {
  const values = getTransformationSelection(character, transformation);
  const featureChoice = transformation.choices?.find((entry) => entry.kind === "feature-from-definition");
  return featureChoice ? catalog.features.find((entry) => entry.id === values[featureChoice.id]) : undefined;
}

function resolveChoiceDefaults(source: TransformationDefinition, action: DefinitionRestAction | undefined, requested: Record<string, string>, catalog: Catalog, changedChoiceId?: string): Record<string, string> {
  if (!action) return requested;
  const values = { ...requested };
  for (const choiceId of action.choiceIds) {
    const definition = source.choices?.find((entry) => entry.id === choiceId);
    if (!definition) continue;
    const options = getDefinitionChoiceOptions(definition, values, catalog);
    const dependsOnChangedChoice = definition.kind === "feature-from-definition" && definition.sourceChoiceId === changedChoiceId;
    if (dependsOnChangedChoice || !options.some((entry) => entry.id === values[choiceId])) values[choiceId] = options[0]?.id ?? "";
  }
  return values;
}
