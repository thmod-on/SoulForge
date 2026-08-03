import type { Character, CharacterNote, CharacterNoteCategory } from "../../domain/types";

export type NotesRenderState = {
  character?: Character;
  noteModalOpen: boolean;
  editingNoteId?: string;
  viewingNoteId?: string;
  deletingNoteId?: string;
};

export type NotesRenderDependencies = {
  state: NotesRenderState;
  noteCategoryLabels: Record<CharacterNoteCategory, string>;
  escapeHtml: (value: string) => string;
  renderEmptyInline: (message: string) => string;
};

export function renderNotes(character: Character, dependencies: NotesRenderDependencies): string {
  const notes = [...character.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return `<main class="content"><div class="screen-title"><div><h1>Anotacoes</h1><p>Registre lembretes, pistas e detalhes importantes da campanha.</p></div><button class="primary-action screen-title-action" type="button" data-action="open-note-modal">Nova anotacao</button></div>${notes.length ? `<div class="notes-grid">${notes.map((note) => renderNoteCard(note, dependencies)).join("")}</div>` : dependencies.renderEmptyInline("Nenhuma anotacao registrada.")}</main>`;
}

function renderNoteCard(note: CharacterNote, dependencies: NotesRenderDependencies): string {
  const { escapeHtml, noteCategoryLabels } = dependencies;
  return `<article class="note-card" data-action="view-note" data-note-id="${note.id}"><div class="note-card-heading"><span>${noteCategoryLabels[note.category]}</span><small>${formatNoteDate(note.updatedAt)}</small></div><h2>${escapeHtml(note.title)}</h2><p>${escapeHtml(note.content)}</p><div class="note-actions"><button type="button" data-action="edit-note" data-note-id="${note.id}">Editar</button><button type="button" data-action="delete-note" data-note-id="${note.id}">Excluir</button></div></article>`;
}

function formatNoteDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}

export function renderNoteModal(dependencies: NotesRenderDependencies): string {
  const { state, noteCategoryLabels, escapeHtml } = dependencies;
  const character = state.character;
  if (!character || !state.noteModalOpen) return "";
  const note = character.notes.find((entry) => entry.id === state.editingNoteId);
  const selectedCategory = note?.category ?? "session";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title"><div class="container-modal-heading"><h2 id="note-modal-title">${note ? "Editar anotacao" : "Nova anotacao"}</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar anotacao">x</button></div><p class="form-error" data-note-error hidden></p><label><span>Titulo</span><input data-note-title type="text" value="${escapeHtml(note?.title ?? "")}" placeholder="Ex.: Nome do contato misterioso" /></label><div class="note-category-field"><span>Categoria</span><div class="note-category-options">${(Object.keys(noteCategoryLabels) as CharacterNoteCategory[]).map((category) => `<button class="${selectedCategory === category ? "is-active" : ""}" type="button" data-note-category-option="${category}">${noteCategoryLabels[category]}</button>`).join("")}</div><input data-note-category type="hidden" value="${selectedCategory}" /></div><label><span>Conteudo</span><textarea data-note-content rows="8" placeholder="Anote pistas, promessas, NPCs ou ideias da sessao...">${escapeHtml(note?.content ?? "")}</textarea></label><button class="primary-action" type="button" data-action="save-note">Salvar anotacao</button></section></div>`;
}

export function renderViewNoteModal(dependencies: NotesRenderDependencies): string {
  const { state, noteCategoryLabels, escapeHtml } = dependencies;
  const note = state.character?.notes.find((entry) => entry.id === state.viewingNoteId);
  if (!note) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="note-view-modal" role="dialog" aria-modal="true" aria-labelledby="view-note-title"><div class="container-modal-heading"><div><span class="resource-modal-label">${noteCategoryLabels[note.category]}</span><h2 id="view-note-title">${escapeHtml(note.title)}</h2></div><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar anotacao">x</button></div><small>Atualizado em ${formatNoteDate(note.updatedAt)}</small><p>${escapeHtml(note.content)}</p><button class="primary-action" type="button" data-action="edit-note" data-note-id="${note.id}">Editar anotacao</button></section></div>`;
}

export function renderDeleteNoteModal(dependencies: NotesRenderDependencies): string {
  const { state, escapeHtml } = dependencies;
  const note = state.character?.notes.find((entry) => entry.id === state.deletingNoteId);
  if (!note) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-note-title"><button class="modal-close" data-modal-close aria-label="Cancelar exclusao">x</button><span class="resource-modal-label">Excluir anotacao</span><h2 id="delete-note-title">${escapeHtml(note.title)}</h2><p>Esta acao removera a anotacao permanentemente.</p><div class="danger-summary"><strong>!</strong><span>A anotacao nao podera ser recuperada neste momento.</span></div><div class="confirmation-actions"><button class="secondary-action" type="button" data-action="cancel-delete-note">Cancelar</button><button class="danger-action" type="button" data-action="confirm-delete-note">Excluir anotacao</button></div></section></div>`;
}
