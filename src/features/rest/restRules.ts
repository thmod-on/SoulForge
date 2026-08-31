import type { Character, ResourceTrack } from "../../domain/types";

export type RestKind = "short" | "long";
export type RestMoveId = "tend-wounds" | "clear-stress" | "repair-armor" | "prepare" | "group-prepare" | "work-project";
export type RestMoveChoice = { id: RestMoveId; roll?: number };

export const restMoveLabels: Record<RestMoveId, string> = { "tend-wounds": "Tratar ferimentos", "clear-stress": "Limpar estresse", "repair-armor": "Reparar armadura", prepare: "Preparar", "group-prepare": "Preparação em grupo", "work-project": "Trabalhar em projeto" };

export function getRestMoves(kind: RestKind): RestMoveId[] { return kind === "short" ? ["tend-wounds", "clear-stress", "repair-armor", "prepare", "group-prepare"] : ["tend-wounds", "clear-stress", "repair-armor", "prepare", "group-prepare", "work-project"]; }
export function restMoveDescription(kind: RestKind, move: RestMoveId): string { if (move === "prepare") return "Recupere 1 Esperança."; if (move === "group-prepare") return "Preparação em grupo: recupere 2 Esperanças."; if (move === "work-project") return "Ação narrativa. Projetos terão acompanhamento em uma etapa futura."; const name = move === "tend-wounds" ? "PV" : move === "clear-stress" ? "Estresse" : "Armadura"; return kind === "short" ? `Limpe 1d4 + Tier de ${name}.` : `Limpe todo ${name}.`; }
export function requiresRestRoll(kind: RestKind, move: RestMoveId): boolean { return kind === "short" && ["tend-wounds", "clear-stress", "repair-armor"].includes(move); }

export function applyRestMoves(character: Character, kind: RestKind, moves: RestMoveChoice[]): Character {
  const tier = getCharacterTier(character.identity.level); let resources = character.resources;
  for (const move of moves) {
    if (move.id === "work-project") continue;
    const resource = getRestResource(resources, move.id); if (!resource) continue;
    const amount = move.id === "prepare" ? 1 : move.id === "group-prepare" ? 2 : kind === "long" ? resource.max : Math.max(0, Math.min(4, move.roll ?? 0)) + tier;
    resources = resources.map((entry) => entry.id === resource.id ? { ...entry, value: Math.max(0, entry.value - amount) } : entry);
  }
  return resources === character.resources ? character : { ...character, resources };
}

export function getCharacterTier(level: number): number { return level >= 8 ? 4 : level >= 5 ? 3 : level >= 2 ? 2 : 1; }
function getRestResource(resources: ResourceTrack[], move: RestMoveId): ResourceTrack | undefined { if (move === "tend-wounds") return resources.find((resource) => resource.tone === "hp"); if (move === "clear-stress") return resources.find((resource) => resource.tone === "stress"); if (move === "repair-armor") return resources.find((resource) => resource.id === "armor" || resource.label.toLocaleLowerCase("pt-BR") === "armadura"); if (move === "prepare" || move === "group-prepare") return resources.find((resource) => resource.tone === "hope"); return undefined; }
