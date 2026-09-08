import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { renderCompendiumIndex } from "./renderCompendiumIndex";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

describe("índice do Compendium", () => {
  it("marca o capítulo atual e mostra as ações da abertura", () => {
    const html = renderCompendiumIndex({ spread: 1, catalog: createCatalog([], []), escapeHtml, renderTransformationsSpread: () => "" });

    expect(html).toContain('data-compendium-spread="1" aria-current="page"');
    expect(html).toContain('data-action="new-compendium-domain"');
    expect(html).toContain('data-action="manage-compendium-cards"');
  });

  it("delega a composição do capítulo de transformações", () => {
    const html = renderCompendiumIndex({ spread: 4, catalog: createCatalog([], []), escapeHtml, renderTransformationsSpread: (renderCard) => renderCard({ eyebrow: "", title: "Transformações", summary: "Resumo", count: 0, countLabel: "Cadastradas", primaryAction: "Nova", secondaryAction: "Pesquisar", details: [] }) });

    expect(html).toContain("Transformações");
    expect(html).toContain('data-compendium-spread="4" aria-current="page"');
  });
});
