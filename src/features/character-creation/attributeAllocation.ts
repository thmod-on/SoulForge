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
export type CreationAttributeTokenAssignments = Partial<Record<Attribute["id"], string>>;

const tokens: CreationAttributeToken[] = allocation.map((value, index) => ({ id: `attribute-token-${index}`, value }));

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
  const remaining = tokens.map((token) => ({ ...token }));
  used.forEach((value) => {
    const index = remaining.findIndex((token) => token.value === value);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
}

/**
 * Reconstrói apenas identidades ausentes ou inválidas. O mapa é transitório,
 * mas impede que a segunda pedra 0 ou +1 mude de identidade após um repaint.
 */
export function normalizeCreationAttributeTokenAssignments(values: Record<Attribute["id"], number>, assignments: CreationAttributeTokenAssignments = {}): CreationAttributeTokenAssignments {
  const normalized: CreationAttributeTokenAssignments = {};
  const usedTokenIds = new Set<string>();

  characterCreationAttributes.forEach(({ id }) => {
    const value = values[id];
    if (!Number.isInteger(value)) return;
    const assignedToken = tokens.find((token) => token.id === assignments[id] && token.value === value && !usedTokenIds.has(token.id));
    const token = assignedToken ?? tokens.find((candidate) => candidate.value === value && !usedTokenIds.has(candidate.id));
    if (!token) return;
    normalized[id] = token.id;
    usedTokenIds.add(token.id);
  });

  return normalized;
}

export function getCreationAttributeTokens(): CreationAttributeToken[] {
  return tokens.map((token) => ({ ...token }));
}

export function formatCreationAttributeValue(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function assignCreationAttributeValue(values: Record<Attribute["id"], number>, attributeId: Attribute["id"], selectedValue?: number): { values: Record<Attribute["id"], number>; error?: string } {
  if (!Number.isInteger(selectedValue)) return { values, error: "Escolha um valor disponível para este atributo." };
  const value = selectedValue as number;
  if (!getRemainingCreationAttributeValues(values, attributeId).includes(value)) return { values, error: "Esse valor não está mais disponível." };
  return { values: { ...values, [attributeId]: value } };
}

function findAttributeId(value?: string): Attribute["id"] | undefined {
  return characterCreationAttributes.find((attribute) => attribute.id === value)?.id;
}

export function handleCreationAttributeAllocation(input: {
  values: Record<Attribute["id"], number>;
  activeAttributeId?: Attribute["id"];
  assignedTokenIds?: CreationAttributeTokenAssignments;
  action?: string;
  attributeId?: string;
  tokenId?: string;
}): {
  values: Record<Attribute["id"], number>;
  activeAttributeId?: Attribute["id"];
  assignedTokenIds: CreationAttributeTokenAssignments;
  error?: string;
} {
  const assignedTokenIds = normalizeCreationAttributeTokenAssignments(input.values, input.assignedTokenIds);

  if (input.action === "reset") return { values: createEmptyCreationAttributeValues(), assignedTokenIds: {} };
  if (input.action === "close") return { values: input.values, assignedTokenIds };
  if (input.action === "activate") {
    const activeAttributeId = findAttributeId(input.attributeId);
    return activeAttributeId
      ? { values: input.values, assignedTokenIds, activeAttributeId }
      : { values: input.values, assignedTokenIds, activeAttributeId: input.activeAttributeId };
  }

  const activeAttributeId = findAttributeId(input.activeAttributeId);
  if (!activeAttributeId) return { values: input.values, assignedTokenIds, error: "Escolha primeiro o atributo que deseja preencher." };

  if (input.action === "release") {
    const nextAssignments = { ...assignedTokenIds };
    delete nextAssignments[activeAttributeId];
    return {
      values: { ...input.values, [activeAttributeId]: Number.NaN },
      activeAttributeId,
      assignedTokenIds: nextAssignments
    };
  }

  if (input.action === "assign-token") {
    const token = tokens.find((candidate) => candidate.id === input.tokenId);
    if (!token) return { values: input.values, assignedTokenIds, activeAttributeId, error: "Essa pedra não está disponível." };
    const owner = characterCreationAttributes.find(({ id }) => assignedTokenIds[id] === token.id)?.id;
    if (owner && owner !== activeAttributeId) {
      return { values: input.values, assignedTokenIds, activeAttributeId, error: "Essa pedra já está encaixada em outro atributo." };
    }
    return {
      values: { ...input.values, [activeAttributeId]: token.value },
      activeAttributeId,
      assignedTokenIds: { ...assignedTokenIds, [activeAttributeId]: token.id }
    };
  }

  return { values: input.values, assignedTokenIds, activeAttributeId };
}
