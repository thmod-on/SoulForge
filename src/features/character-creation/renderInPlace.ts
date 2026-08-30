import { patchSurface } from "../../app/patchSurface";

/**
 * Atualiza a superfície da criação sem desmontar o seletor de personagens
 * nem o backdrop. Isso mantém a interação estável em telas sensíveis ao
 * repaint, como Safari no iPad.
 */
export function renderCharacterCreationInPlace(root: HTMLElement, markup: string, options: { resetScroll?: boolean } = {}): boolean {
  return patchSurface(root, ".character-creation-modal", markup, { scrollSelector: ".character-creation-scroll", resetScroll: options.resetScroll });
}
