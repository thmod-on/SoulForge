import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { AncestryDefinition } from "../../domain/types";
import { filterAncestries, handleAncestryAction, renderCompendiumAncestriesManager, type AncestryFeatureDependencies } from "./ancestries";

const ancestry = (id: string, packId: string, name: string): AncestryDefinition => ({
  id,
  type: "ancestry",
  packId,
  name,
  summary: `Resumo de ${name}`,
  topFeatureId: `${id}.top`,
  bottomFeatureId: `${id}.bottom`
});

const entries = [
  ancestry("ancestry.core.elf", "daggerheart-core-ancestries-local", "Elfo"),
  ancestry("ancestry.hope-fear.minotaur", "daggerheart-hope-and-fear-ancestries-local", "Minotauro"),
  ancestry("ancestry.local.crystal", "local", "Cristalino")
];

describe("filtro de origem das ancestralidades", () => {
  it("separa Core, Hope & Fear e conteúdo customizado pelos IDs estáveis", () => {
    expect(filterAncestries(entries, "", "todos")).toHaveLength(3);
    expect(filterAncestries(entries, "", "core").map((entry) => entry.name)).toEqual(["Elfo"]);
    expect(filterAncestries(entries, "", "hope-fear").map((entry) => entry.name)).toEqual(["Minotauro"]);
    expect(filterAncestries(entries, "", "customizado").map((entry) => entry.name)).toEqual(["Cristalino"]);
  });

  it("combina origem e pesquisa textual", () => {
    expect(filterAncestries(entries, "elfo", "core").map((entry) => entry.name)).toEqual(["Elfo"]);
    expect(filterAncestries(entries, "minotauro", "core")).toEqual([]);
  });

  it("renderiza as quatro opções e indica a seleção atual", () => {
    const catalog = createCatalog([], entries);
    const deps: AncestryFeatureDependencies = {
      state: { compendiumAncestrySearch: "", compendiumAncestrySource: "hope-fear", ancestryModalOpen: false },
      catalog,
      escapeHtml: (value) => value,
      renderEmptyInline: (message) => message,
      getPackDisplayName: (packId) => packId,
      saveCustomDefinition: vi.fn(),
      deleteCustomDefinition: vi.fn(),
      refreshCatalog: vi.fn(),
      render: vi.fn()
    };

    const html = renderCompendiumAncestriesManager(deps);
    expect(html).toContain('data-compendium-ancestry-source="todos"');
    expect(html).toContain('data-compendium-ancestry-source="core"');
    expect(html).toContain('data-compendium-ancestry-source="hope-fear" aria-pressed="true"');
    expect(html).toContain('data-compendium-ancestry-source="customizado"');
    expect(html).toContain("Minotauro");
    expect(html).not.toContain("Cristalino");
  });

  it("atualiza a origem pelo manipulador do módulo", () => {
    const filter = { closest: (selector: string) => selector === "[data-compendium-ancestry-source]" ? { dataset: { compendiumAncestrySource: "customizado" } } : null } as unknown as HTMLElement;
    const state = { compendiumAncestrySearch: "", compendiumAncestrySource: "todos" as const, ancestryModalOpen: false };
    const render = vi.fn();

    expect(handleAncestryAction(filter, { state, render } as unknown as AncestryFeatureDependencies)).toBe(true);
    expect(state.compendiumAncestrySource).toBe("customizado");
    expect(render).toHaveBeenCalledWith({ preserveMainScroll: true });
  });
});
