import { describe, expect, it } from "vitest";
import { getSpellcastAttributeId } from "./spellcastAttributes";

describe("metadados de Conjuração", () => {
  it("preserva o metadado declarado pela subclasse", () => {
    expect(getSpellcastAttributeId("subclass.test", { id: "subclass.test", spellcastAttributeId: "dex" } as never)).toBe("dex");
  });

  it("mantém compatibilidade com as subclasses oficiais conhecidas", () => {
    expect(getSpellcastAttributeId("subclass.core.serafim.portador-divino")).toBe("for");
    expect(getSpellcastAttributeId("subclass.core.bardo.trovador")).toBe("con");
    expect(getSpellcastAttributeId("subclass.hope-fear.assassin.guilda-dos-envenenadores")).toBe("int");
  });
});
