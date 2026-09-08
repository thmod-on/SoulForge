import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { removeCharacterNote, upsertCharacterNote } from "./noteActions";

describe("ações de anotações", () => {
  it("cria uma anotação no início da lista", () => {
    const updated = upsertCharacterNote(demoCharacter, { title: "Pista", content: "Uma pista importante", category: "quest" }, undefined, "2026-09-07T10:00:00.000Z", "note.new");
    expect(updated.notes[0]).toMatchObject({ id: "note.new", title: "Pista", category: "quest", createdAt: "2026-09-07T10:00:00.000Z" });
  });

  it("edita preservando a data de criação", () => {
    const original = upsertCharacterNote(demoCharacter, { title: "Antes", content: "Texto", category: "session" }, undefined, "2026-09-01T10:00:00.000Z", "note.edit");
    const updated = upsertCharacterNote(original, { title: "Depois", content: "Novo texto", category: "npc" }, "note.edit", "2026-09-07T10:00:00.000Z", "note.ignored");
    expect(updated.notes[0]).toMatchObject({ id: "note.edit", title: "Depois", category: "npc", createdAt: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-07T10:00:00.000Z" });
  });

  it("remove somente a anotação solicitada", () => {
    const first = upsertCharacterNote(demoCharacter, { title: "A", content: "A", category: "free" }, undefined, "2026-09-01T10:00:00.000Z", "note.a");
    const second = upsertCharacterNote(first, { title: "B", content: "B", category: "free" }, undefined, "2026-09-02T10:00:00.000Z", "note.b");
    const remainingIds = removeCharacterNote(second, "note.a").notes.map((note) => note.id);
    expect(remainingIds).not.toContain("note.a");
    expect(remainingIds).toEqual(["note.b", ...demoCharacter.notes.map((note) => note.id)]);
  });
});
