import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { renderRestModal } from "./renderRest";

describe("renderRestModal", () => {
  it("usa a nomenclatura de descanso sem alterar os contratos de rest", () => {
    const html = renderRestModal(demoCharacter, "short", [], undefined, { escapeHtml: (value) => value });

    expect(html).toContain('<h2 id="rest-modal-title">Descanso</h2>');
    expect(html).toContain('aria-label="Fechar descanso"');
    expect(html).toContain('aria-label="Tipo de descanso"');
    expect(html).toContain("movimentos de descanso");
    expect(html).toContain('data-rest-kind="short"');
    expect(html).not.toMatch(/downtime/i);
  });
});
