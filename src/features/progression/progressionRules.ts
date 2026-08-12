import type { ProgressionAdvanceKind } from "../../domain/types";
import type { ProgressionTierNumber } from "../../app/types";

export const progressionTiers = [
  {
    tier: 2,
    levels: "2-4",
    headline: "Ao nivel 2, ganhe uma Experiencia adicional em +2 e +1 em Proficiencia.",
    choices: 2,
    footer: "Atualize seu nivel e ajuste os limiares de dano quando aplicar a evolucao."
  },
  {
    tier: 3,
    levels: "5-7",
    headline: "Ao nivel 5, ganhe uma Experiencia adicional em +2, limpe marcacoes de atributos e ganhe +1 em Proficiencia.",
    choices: 2,
    footer: "Opcoes de subclasse e multiclasse aparecem aqui como estrutura visual."
  },
  {
    tier: 4,
    levels: "8-10",
    headline: "Ao nivel 8, ganhe uma Experiencia adicional em +2, limpe marcacoes de atributos e ganhe +1 em Proficiencia.",
    choices: 2,
    footer: "Esta area sera ligada futuramente as configuracoes de progressao."
  }
] as const;

export const progressionAdvanceLabels: Record<ProgressionAdvanceKind, string> = {
  attributes: "Dois atributos +1",
  hp: "Slot de PV +1",
  stress: "Slot de Estresse +1",
  experiences: "Duas Experiencias +1",
  domain: "Carta adicional de Dominio",
  evasion: "Evasao +1",
  subclass: "Carta aprimorada da subclasse",
  proficiency: "Proficiencia +1",
  multiclass: "Multiclasse"
};

export const progressionAdvanceRules: Record<ProgressionAdvanceKind, { minimumTier: ProgressionTierNumber; slotCount: Record<ProgressionTierNumber, number> }> = {
  attributes: { minimumTier: 2, slotCount: { 2: 3, 3: 3, 4: 3 } },
  hp: { minimumTier: 2, slotCount: { 2: 2, 3: 2, 4: 2 } },
  stress: { minimumTier: 2, slotCount: { 2: 2, 3: 2, 4: 2 } },
  experiences: { minimumTier: 2, slotCount: { 2: 1, 3: 1, 4: 1 } },
  domain: { minimumTier: 2, slotCount: { 2: 1, 3: 1, 4: 1 } },
  evasion: { minimumTier: 2, slotCount: { 2: 1, 3: 1, 4: 1 } },
  subclass: { minimumTier: 3, slotCount: { 2: 0, 3: 1, 4: 1 } },
  proficiency: { minimumTier: 3, slotCount: { 2: 0, 3: 1, 4: 1 } },
  multiclass: { minimumTier: 3, slotCount: { 2: 0, 3: 1, 4: 1 } }
};

export function getProgressionChoiceCost(kind: ProgressionAdvanceKind): number {
  return kind === "proficiency" || kind === "multiclass" ? 2 : 1;
}

export function getTierForLevel(level: number): ProgressionTierNumber {
  return level >= 8 ? 4 : level >= 5 ? 3 : 2;
}
