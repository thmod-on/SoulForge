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

export function parseCreationAttributeValue(value: string): number {
  return value === "" ? Number.NaN : Number(value);
}
