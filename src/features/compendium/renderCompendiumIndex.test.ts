import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { renderCompendiumIndex } from "./renderCompendiumIndex";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

describe("índice do Compendium", () => {
  const dependencies = (spread: 1 | 2 | 3 | 4) => ({
    spread,
    catalog: createCatalog([], []),
    escapeHtml,
    transformationChapter: { title: "Transformações", summary: "Resumo", count: 0, countLabel: "Cadastradas", primaryAction: "Nova transformação", primaryActionId: "new-compendium-transformation", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-transformations", details: ["Transformações não são Condições nem efeitos temporários de cena."] },
    conditionChapter: { title: "Condições", summary: "Resumo", count: 0, countLabel: "Cadastradas", primaryAction: "Nova condição", primaryActionId: "new-compendium-condition", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-conditions", details: ["A mesma Condição não se acumula."] }
  });

  it("marca o capítulo atual e mostra as ações da abertura", () => {
    const html = renderCompendiumIndex(dependencies(1));

    expect(html).toContain('data-compendium-spread="1" aria-current="page"');
    expect(html).toContain('data-action="new-compendium-domain"');
    expect(html).toContain('data-action="manage-compendium-cards"');
  });

  it("reúne transformações e condições no quarto e último capítulo", () => {
    const html = renderCompendiumIndex(dependencies(4));

    expect(html).toContain("Transformações");
    expect(html).toContain("Condições");
    expect(html).toContain('data-compendium-spread="4" aria-current="page"');
    expect(html).toContain('data-action="new-compendium-transformation"');
    expect(html).toContain('data-action="manage-compendium-conditions"');
    expect(html).toContain("Transformações não são Condições");
    expect(html).toContain("A mesma Condição não se acumula");
    expect(html).not.toContain('data-compendium-spread="5"');
    expect(html).not.toContain("Identidade opcional");
    expect(html).not.toContain("Estados de jogo");
  });
});
