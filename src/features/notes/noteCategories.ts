import type { CharacterNoteCategory } from "../../domain/types";

export const noteCategoryLabels: Record<CharacterNoteCategory, string> = {
  session: "Sessao",
  npc: "NPC",
  place: "Local",
  quest: "Missao",
  item: "Item",
  free: "Livre"
};

export function isCharacterNoteCategory(value: string | undefined): value is CharacterNoteCategory {
  return Boolean(value && Object.hasOwn(noteCategoryLabels, value));
}
