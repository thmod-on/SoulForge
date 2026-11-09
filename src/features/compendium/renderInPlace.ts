import { patchSurface } from "../../app/patchSurface";

/** Atualiza filtros e resultados sem substituir o campo de busca ativo. */
export function renderCompendiumInPlace(root: HTMLElement, markup: string): boolean {
  return patchSurface(root, "[data-compendium-dynamic]", markup, { syncScroll: false });
}

export function shouldRefreshCompendiumSearch(isComposing: boolean): boolean {
  return !isComposing;
}
