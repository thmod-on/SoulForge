import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { handleAttributeDetailAction, handleAttributeDetailEscape, renderAttributeDetailModal } from "./attributeDetails";
import { renderSidebar, type PlayerShellDependencies } from "./renderPlayerShell";

const escapeHtml = (value: string) => value;

function shellDependencies(): PlayerShellDependencies {
  return {
    state: { page: "overview" },
    appVersion: "0.0.0",
    topNavigation: [],
    editorNavigation: [],
    escapeHtml,
    attributeTitle: (label) => label,
    progressPercent: () => 0,
    getEffectiveDefense: (character) => character.defense,
    getSpellcastAttributeId: () => "con",
    getCommunityName: () => "Comunidade"
  };
}

describe("detalhes dos atributos na ficha", () => {
  it("transforma cada brasão em um controle acessível sem oferecer edição", () => {
    const html = renderSidebar(demoCharacter, shellDependencies());

    expect(html.match(/data-action="open-attribute-detail"/g)).toHaveLength(6);
    expect(html).toContain('data-attribute-id="for"');
    expect(html).toContain("Força, valor");
    expect(html).not.toContain("data-attribute-adjust");
  });

  it("mostra valor, verbos de referência e características do atributo", () => {
    const html = renderAttributeDetailModal(demoCharacter, "con", "con", escapeHtml);

    expect(html).toContain('class="container-modal attribute-detail-modal"');
    expect(html).toContain("Presença");
    expect(html).toContain("Encantar");
    expect(html).toContain("Performar");
    expect(html).toContain("Enganar");
    expect(html).toContain("Atributo de Conjuração");
    expect(html).not.toContain('type="number"');
    expect(html).not.toContain("Esses verbos são referências");
    expect(html).not.toContain("Voltar à ficha");
  });

  it("não abre conteúdo para um identificador desconhecido", () => {
    expect(renderAttributeDetailModal(demoCharacter, undefined, undefined, escapeHtml)).toBe("");
  });

  it("abre pelo controle da ficha e fecha com Escape preservando apenas o estado de interface", () => {
    const state: { attributeDetailId?: "for" } = {};
    let renders = 0;
    const target = { closest: () => ({ dataset: { attributeId: "for" } }) } as unknown as HTMLElement;

    expect(handleAttributeDetailAction(target, state, () => { renders += 1; })).toBe(true);
    expect(state.attributeDetailId).toBe("for");
    expect(handleAttributeDetailEscape({ key: "Escape" } as KeyboardEvent, state, () => { renders += 1; })).toBe(true);
    expect(state.attributeDetailId).toBeUndefined();
    expect(renders).toBe(2);
  });
});
