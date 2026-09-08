import type { Character, CharacterNote, CharacterNoteCategory } from "../../domain/types";
import { isCharacterNoteCategory } from "./noteCategories";
import type { NotesRenderState } from "./renderNotes";

export type NoteActionDependencies = {
  state: NotesRenderState;
  saveCharacter(character: Character): Promise<void>;
  render(): void;
};

export function handleNoteAction(target: HTMLElement, deps: NoteActionDependencies): boolean {
  if (target.closest('[data-action="open-note-modal"]')) {
    deps.state.noteModalOpen = true;
    deps.state.editingNoteId = undefined;
    deps.render();
    return true;
  }

  const editButton = target.closest<HTMLElement>('[data-action="edit-note"]');
  if (editButton) {
    deps.state.noteModalOpen = true;
    deps.state.editingNoteId = editButton.dataset.noteId;
    deps.state.viewingNoteId = undefined;
    deps.render();
    return true;
  }

  const categoryButton = target.closest<HTMLElement>("[data-note-category-option]");
  if (categoryButton) {
    const categoryInput = document.querySelector<HTMLInputElement>("[data-note-category]");
    const category = categoryButton.dataset.noteCategoryOption;
    if (categoryInput && isCharacterNoteCategory(category)) categoryInput.value = category;
    document.querySelectorAll("[data-note-category-option]").forEach((button) => button.classList.remove("is-active"));
    categoryButton.classList.add("is-active");
    return true;
  }

  if (target.closest('[data-action="save-note"]')) {
    void saveNoteFromModal(deps);
    return true;
  }

  const deleteButton = target.closest<HTMLElement>('[data-action="delete-note"]');
  if (deleteButton) {
    deps.state.deletingNoteId = deleteButton.dataset.noteId;
    deps.render();
    return true;
  }

  if (target.closest('[data-action="cancel-delete-note"]')) {
    deps.state.deletingNoteId = undefined;
    deps.render();
    return true;
  }

  if (target.closest('[data-action="confirm-delete-note"]')) {
    void deleteNote(deps.state.deletingNoteId, deps);
    return true;
  }

  const viewCard = target.closest<HTMLElement>('[data-action="view-note"]');
  if (viewCard) {
    deps.state.viewingNoteId = viewCard.dataset.noteId;
    deps.render();
    return true;
  }

  return false;
}

export function handleNoteEscape(event: KeyboardEvent, deps: NoteActionDependencies): boolean {
  if (event.key !== "Escape") return false;
  if (deps.state.noteModalOpen) {
    deps.state.noteModalOpen = false;
    deps.state.editingNoteId = undefined;
  } else if (deps.state.viewingNoteId) {
    deps.state.viewingNoteId = undefined;
  } else if (deps.state.deletingNoteId) {
    deps.state.deletingNoteId = undefined;
  } else {
    return false;
  }
  deps.render();
  return true;
}

export function upsertCharacterNote(character: Character, draft: { title: string; content: string; category: CharacterNoteCategory }, editingNoteId: string | undefined, now: string, newId: string): Character {
  const existing = character.notes.find((note) => note.id === editingNoteId);
  const note: CharacterNote = { id: existing?.id ?? newId, ...draft, createdAt: existing?.createdAt ?? now, updatedAt: now };
  const notes = existing ? character.notes.map((entry) => entry.id === existing.id ? note : entry) : [note, ...character.notes];
  return { ...character, notes };
}

export function removeCharacterNote(character: Character, noteId: string): Character {
  return { ...character, notes: character.notes.filter((note) => note.id !== noteId) };
}

async function saveNoteFromModal(deps: NoteActionDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character) return;
  const titleInput = document.querySelector<HTMLInputElement>("[data-note-title]");
  const categoryInput = document.querySelector<HTMLInputElement>("[data-note-category]");
  const contentInput = document.querySelector<HTMLTextAreaElement>("[data-note-content]");
  const title = titleInput?.value.trim() ?? "";
  const content = contentInput?.value.trim() ?? "";
  const category = categoryInput?.value;

  if (!title || !content || !isCharacterNoteCategory(category)) {
    const error = document.querySelector<HTMLElement>("[data-note-error]");
    if (error) {
      error.textContent = "Informe um titulo e um conteudo para salvar a anotacao.";
      error.removeAttribute("hidden");
    }
    titleInput?.classList.toggle("is-invalid", !title);
    contentInput?.classList.toggle("is-invalid", !content);
    (!title ? titleInput : contentInput)?.focus();
    return;
  }

  const updatedCharacter = upsertCharacterNote(character, { title, content, category }, deps.state.editingNoteId, new Date().toISOString(), `note.${crypto.randomUUID()}`);
  deps.state.character = updatedCharacter;
  deps.state.noteModalOpen = false;
  deps.state.editingNoteId = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

async function deleteNote(noteId: string | undefined, deps: NoteActionDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character || !noteId) return;
  const updatedCharacter = removeCharacterNote(character, noteId);
  deps.state.character = updatedCharacter;
  if (deps.state.viewingNoteId === noteId) deps.state.viewingNoteId = undefined;
  deps.state.deletingNoteId = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}
