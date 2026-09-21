import { patchSurface } from "../../app/patchSurface";

/**
 * Atualiza a superfície da criação sem desmontar o seletor de personagens
 * nem o backdrop. Isso mantém a interação estável em telas sensíveis ao
 * repaint, como Safari no iPad.
 */
export function renderCharacterCreationInPlace(root: HTMLElement, markup: string, options: { resetScroll?: boolean; revealError?: boolean } = {}): boolean {
  const rendered = patchSurface(root, ".character-creation-modal", markup, { scrollSelector: ".character-creation-scroll", resetScroll: options.resetScroll });
  if (rendered && options.revealError) requestAnimationFrame(() => {
    const error = root.querySelector<HTMLElement>("[data-character-creation-error]");
    error?.focus({ preventScroll: true });
    error?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return rendered;
}
