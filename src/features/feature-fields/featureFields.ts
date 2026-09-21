import type { Catalog } from "../../domain/catalog";
import type { Character, CharacterDefinitionSelection, ClassDefinition, FeatureCharacterFieldDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";

export type CharacterFieldSource = {
  feature: FeatureDefinition;
  originLabel: string;
};

export function getCreationCharacterFieldSources(characterClass: ClassDefinition | undefined, subclass: SubclassDefinition | undefined, catalog: Catalog): CharacterFieldSource[] {
  if (!characterClass) return [];
  return getFieldSources([
    ...characterClass.featureIds,
    ...(subclass?.foundationFeatureIds ?? [])
  ], catalog);
}

export function getCharacterFieldSources(character: Character, catalog: Catalog): CharacterFieldSource[] {
  const characterClass = catalog.classes.find((entry) => entry.id === character.identity.primaryClassId);
  const primarySubclass = catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId);
  const featureIds = [
    ...(characterClass?.featureIds ?? []),
    ...(primarySubclass?.foundationFeatureIds ?? []),
    ...character.skills.filter((skill) => skill.source === "class").map((skill) => skill.id),
    ...(character.progression?.multiclass ? [character.progression.multiclass.featureId, character.progression.multiclass.foundationFeatureId] : [])
  ];
  return getFieldSources(featureIds, catalog);
}

export function getDefinitionSelectionValues(selections: CharacterDefinitionSelection[] | undefined, sourceDefinitionId: string): Record<string, string> {
  return selections?.find((entry) => entry.sourceDefinitionId === sourceDefinitionId)?.values ?? {};
}

export function setDefinitionSelectionValues(character: Character, feature: FeatureDefinition, requested: Record<string, string>): Character | Error {
  const values = normalizeCharacterFieldValues(feature, requested);
  const error = validateCharacterFieldValues(feature, values);
  if (error) return new Error(error);
  const selections = character.definitionSelections ?? [];
  const next = { sourceDefinitionId: feature.id, values };
  return {
    ...character,
    definitionSelections: [...selections.filter((entry) => entry.sourceDefinitionId !== feature.id), next]
  };
}

export function normalizeCharacterFieldValues(feature: FeatureDefinition, requested: Record<string, string>): Record<string, string> {
  return Object.fromEntries((feature.characterFields ?? []).flatMap((field) => {
    const value = String(requested[field.id] ?? "").trim();
    return value ? [[field.id, value]] : [];
  }));
}

export function validateCharacterFieldValues(feature: FeatureDefinition, values: Record<string, string>): string | undefined {
  for (const field of feature.characterFields ?? []) {
    const value = values[field.id]?.trim() ?? "";
    if (field.required && !value) return `Preencha “${field.label}”.`;
    if (!value) continue;
    if (field.kind === "text" && field.maxLength && value.length > field.maxLength) return `“${field.label}” aceita no máximo ${field.maxLength} caracteres.`;
    if (field.kind === "select" && !field.options.some((option) => option.value === value)) return `Escolha uma opção válida para “${field.label}”.`;
  }
  return undefined;
}

export function getCharacterFieldDisplayValue(field: FeatureCharacterFieldDefinition, value: string | undefined): string {
  if (!value) return "Não definido";
  if (field.kind === "select") return field.options.find((option) => option.value === value)?.label ?? value;
  return value;
}

function getFieldSources(featureIds: string[], catalog: Catalog): CharacterFieldSource[] {
  return [...new Set(featureIds)].flatMap((id) => {
    const feature = catalog.features.find((entry) => entry.id === id);
    if (!feature?.characterFields?.length) return [];
    const source = feature.sourceType === "class"
      ? catalog.classes.find((entry) => entry.id === feature.sourceId)
      : feature.sourceType === "subclass"
        ? catalog.subclasses.find((entry) => entry.id === feature.sourceId)
        : undefined;
    const sourceKind = feature.sourceType === "class" ? "Classe" : feature.sourceType === "subclass" ? "Subclasse" : "Feature";
    return [{ feature, originLabel: `${sourceKind} · ${source?.name ?? feature.name}` }];
  });
}
