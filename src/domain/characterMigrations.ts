import type { Character, CharacterNote, CharacterNoteCategory } from "./types";

type LegacyCharacterNote = Omit<CharacterNote, "category"> & { category: CharacterNoteCategory | "item" };

/** Converte categorias retiradas sem alterar conteúdo ou metadados da anotação. */
export function migrateLegacyCharacterNotes(character: Character): Character {
  let changed = false;
  const notes = (character.notes as LegacyCharacterNote[]).map((note): CharacterNote => {
    if (note.category !== "item") return note as CharacterNote;
    changed = true;
    return { ...note, category: "lore" };
  });
  return changed ? { ...character, notes } : character;
}
