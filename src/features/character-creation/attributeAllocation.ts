import type { Attribute } from "../../domain/types";

export const characterCreationAttributes: Array<{ id: Attribute["id"]; label: string; description: string; verbs: readonly [string, string, string] }> = [
  { id: "dex", label: "Agilidade", description: "Correr, saltar e manobrar.", verbs: ["Correr", "Saltar", "Manobrar"] },
  { id: "for", label: "Força", description: "Erguer, esmagar e agarrar.", verbs: ["Erguer", "Esmagar", "Agarrar"] },
  { id: "cha", label: "Finesse", description: "Controlar, esconder e operar.", verbs: ["Controlar", "Esconder", "Operar"] },
  { id: "wil", label: "Instinto", description: "Perceber, sentir e navegar.", verbs: ["Perceber", "Sentir", "Navegar"] },
  { id: "con", label: "Presença", description: "Encantar, performar e enganar.", verbs: ["Encantar", "Performar", "Enganar"] },
  { id: "int", label: "Conhecimento", description: "Recordar, analisar e compreender.", verbs: ["Recordar", "Analisar", "Compreender"] }
];

const allocation = [-1, 0, 0, 1, 1, 2] as const;

export type CreationAttributeToken = { id: string; value: number };

export function createEmptyCreationAttributeValues(): Record<Attribute["id"], number> {
  return { dex: Number.NaN, for: Number.NaN, cha: Number.NaN, wil: Number.NaN, con: Number.NaN, int: Number.NaN };
}

export function getRemainingCreationAttributeValues(values: Record<Attribute["id"], number>, excludingAttributeId?: Attribute["id"]): number[] {
  return getRemainingCreationAttributeTokens(values, excludingAttributeId).map((token) => token.value);
}

/**
 * Cada pedra recebe uma identidade estável. Isso é importante para os valores
 * repetidos: as duas pedras +1, por exemplo, precisam continuar clicáveis de
 * forma independente, mesmo tendo o mesmo valor mecânico.
 */
export function getRemainingCreationAttributeTokens(values: Record<Attribute["id"], number>, excludingAttributeId?: Attribute["id"]): CreationAttributeToken[] {
  const used = Object.entries(values)
    .filter(([attributeId, value]) => attributeId !== excludingAttributeId && Number.isInteger(value))
    .map(([, value]) => value);
  const remaining = allocation.map((value, index) => ({ id: `attribute-token-${index}`, value }));
  used.forEach((value) => {
    const index = remaining.findIndex((token) => token.value === value);
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

export function selectCreationAttributeToken(values: Record<Attribute["id"], number>, tokenId?: string): CreationAttributeToken | undefined {
  return getRemainingCreationAttributeTokens(values).find((token) => token.id === tokenId);
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

export function handleCreationAttributeAllocation(input: { values: Record<Attribute["id"], number>; selectedTokenId?: string; action?: string; attributeId?: string; tokenId?: string }): { values: Record<Attribute["id"], number>; selectedTokenId?: string; error?: string } {
  if (input.action === "reset") return { values: createEmptyCreationAttributeValues() };
  if (input.action === "select") {
    const selectedToken = selectCreationAttributeToken(input.values, input.tokenId);
    const nextTokenId = selectedToken?.id;
    return { values: input.values, selectedTokenId: input.selectedTokenId === nextTokenId ? undefined : nextTokenId };
  }
  const attribute = characterCreationAttributes.find((entry) => entry.id === input.attributeId);
  if (!attribute) return { values: input.values, selectedTokenId: input.selectedTokenId };
  const selectedToken = selectCreationAttributeToken(input.values, input.selectedTokenId);
  const result = assignCreationAttributeValue(input.values, attribute.id, selectedToken?.value);
  return { ...result, selectedTokenId: undefined };
}
