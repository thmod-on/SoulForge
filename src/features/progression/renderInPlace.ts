import { patchSurface } from "../../app/patchSurface";

/** Mantém a ficha estável enquanto o jogador prepara os avanços. */
export function renderProgressionInPlace(root: HTMLElement, markup: string): boolean {
  return patchSurface(root, ".progression-content", markup, { syncScroll: false });
}

/** Atualiza somente o diálogo de escolha, sem remontar a ficha ao fundo. */
export function renderProgressionDialogInPlace(root: HTMLElement, selector: string, markup: string): boolean {
  return patchSurface(root, selector, markup, { syncScroll: false });
}
