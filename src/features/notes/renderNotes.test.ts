import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { renderNoteModal, renderNotes, renderViewNoteModal, type NotesRenderDependencies } from "./renderNotes";

const character = { ...demoCharacter, notes: [{ id: "note.lore", title: "A Primeira Era", content: "Memória de um reino perdido.", category: "lore" as const, createdAt: "2026-08-01T10:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" }] };
const deps = (state: NotesRenderDependencies["state"]): NotesRenderDependencies => ({ state, escapeHtml: (value) => value, renderEmptyInline: (message) => message });

describe("apresentação das categorias de anotações", () => {
  it("oferece Lore e não oferece Item ao criar uma anotação", () => {
    const html = renderNoteModal(deps({ character, noteModalOpen: true }));
    expect(html).toContain('data-note-category-option="lore"');
    expect(html).toContain(">Lore</button>");
    expect(html).not.toContain('data-note-category-option="item"');
  });

  it("usa Lore no cartão e no detalhe", () => {
    expect(renderNotes(character, deps({ character, noteModalOpen: false }))).toContain("Lore");
    expect(renderViewNoteModal(deps({ character, noteModalOpen: false, viewingNoteId: "note.lore" }))).toContain('<span class="resource-modal-label">Lore</span>');
  });
});
