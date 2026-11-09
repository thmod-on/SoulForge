// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { renderCompendiumInPlace, shouldRefreshCompendiumSearch } from "./renderInPlace";

describe("atualização incremental do Compendium", () => {
  it("preserva o campo ativo, o cursor e a seleção ao atualizar os resultados", () => {
    const root = document.createElement("div");
    root.innerHTML = `<main><input data-compendium-item-search value="adaga" /><div data-compendium-dynamic><strong>2</strong><article>Adaga</article></div></main>`;
    document.body.append(root);
    const search = root.querySelector<HTMLInputElement>("[data-compendium-item-search]")!;
    search.focus();
    search.setSelectionRange(1, 4);

    expect(renderCompendiumInPlace(root, `<main><input data-compendium-item-search value="adaga" /><div data-compendium-dynamic><strong>1</strong><article>Adaga longa</article></div></main>`)).toBe(true);

    expect(root.querySelector("[data-compendium-item-search]")).toBe(search);
    expect(document.activeElement).toBe(search);
    expect(search.selectionStart).toBe(1);
    expect(search.selectionEnd).toBe(4);
    expect(root.querySelector("[data-compendium-dynamic]")?.textContent).toContain("Adaga longa");
    root.remove();
  });

  it("atualiza filtros e estado vazio dentro da superfície compartilhada", () => {
    const root = document.createElement("div");
    root.innerHTML = `<main><input data-compendium-card-search /><div data-compendium-dynamic><button class="is-active" aria-pressed="true">Todos</button><article>Carta</article></div></main>`;

    expect(renderCompendiumInPlace(root, `<main><input data-compendium-card-search /><div data-compendium-dynamic><button aria-pressed="false">Todos</button><p class="empty-state">Nenhuma carta</p></div></main>`)).toBe(true);

    expect(root.querySelector("button")?.classList.contains("is-active")).toBe(false);
    expect(root.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
    expect(root.querySelector(".empty-state")?.textContent).toBe("Nenhuma carta");
  });

  it("não altera a tela quando a superfície esperada não existe", () => {
    const root = document.createElement("div");
    root.innerHTML = `<main><input data-compendium-condition-search /></main>`;

    expect(renderCompendiumInPlace(root, `<main><input data-compendium-condition-search /></main>`)).toBe(false);
    expect(root.querySelector("[data-compendium-condition-search]")).not.toBeNull();
  });

  it("adia a filtragem durante composição e a libera ao encerrá-la", () => {
    expect(shouldRefreshCompendiumSearch(true)).toBe(false);
    expect(shouldRefreshCompendiumSearch(false)).toBe(true);
  });
});
