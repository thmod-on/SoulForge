import type { Attribute } from "../../domain/types";

export const characterCreationAttributes: Array<{ id: Attribute["id"]; label: string; description: string }> = [
  { id: "dex", label: "Agilidade", description: "Correr, saltar e manobrar." },
  { id: "for", label: "Força", description: "Erguer, esmagar e agarrar." },
  { id: "cha", label: "Finesse", description: "Controlar, esconder e operar." },
  { id: "wil", label: "Instinto", description: "Perceber, sentir e navegar." },
  { id: "con", label: "Presença", description: "Encantar, performar e enganar." },
  { id: "int", label: "Conhecimento", description: "Recordar, analisar e compreender." }
];

const allocation = [-1, 0, 0, 1, 1, 2] as const;

export function createEmptyCreationAttributeValues(): Record<Attribute["id"], number> {
  return { dex: Number.NaN, for: Number.NaN, cha: Number.NaN, wil: Number.NaN, con: Number.NaN, int: Number.NaN };
}

export function getRemainingCreationAttributeValues(values: Record<Attribute["id"], number>, excludingAttributeId?: Attribute["id"]): number[] {
  const used = Object.entries(values)
    .filter(([attributeId, value]) => attributeId !== excludingAttributeId && Number.isInteger(value))
    .map(([, value]) => value);
  const remaining = [...allocation];
  used.forEach((value) => {
    const index = remaining.indexOf(value as -1 | 0 | 1 | 2);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
}

export function formatCreationAttributeValue(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function selectCreationAttributeValue(values: Record<Attribute["id"], number>, value: number): number | undefined {
  return getRemainingCreationAttributeValues(values).includes(value) ? value : undefined;
}

export function assignCreationAttributeValue(values: Record<Attribute["id"], number>, attributeId: Attribute["id"], selectedValue?: number): { values: Record<Attribute["id"], number>; error?: string } {
  if (!Number.isInteger(selectedValue)) {
    if (Number.isInteger(values[attributeId])) return { values: { ...values, [attributeId]: Number.NaN } };
    return { values, error: "Escolha um valor disponível antes de selecionar um atributo." };
  }
  const value = selectedValue as number;

  if (!getRemainingCreationAttributeValues(values).includes(value)) {
    return { values, error: "Esse valor não está mais disponível." };
  }

  return { values: { ...values, [attributeId]: value } };
}

export function handleCreationAttributeAllocation(input: { values: Record<Attribute["id"], number>; selectedValue?: number; action?: string; attributeId?: string; value?: number }): { values: Record<Attribute["id"], number>; selectedValue?: number; error?: string } {
  if (input.action === "reset") return { values: createEmptyCreationAttributeValues() };
  if (input.action === "select") {
    const selectedValue = input.value;
    const nextValue = Number.isInteger(selectedValue) ? selectCreationAttributeValue(input.values, selectedValue as number) : undefined;
    return { values: input.values, selectedValue: input.selectedValue === nextValue ? undefined : nextValue };
  }
  const attribute = characterCreationAttributes.find((entry) => entry.id === input.attributeId);
  if (!attribute) return { values: input.values, selectedValue: input.selectedValue };
  const result = assignCreationAttributeValue(input.values, attribute.id, input.selectedValue);
  return { ...result, selectedValue: undefined };
}
