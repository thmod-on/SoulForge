import { describe, expect, it } from "vitest";
import { getPageFromEventTarget } from "./navigation";

function eventTarget(page: string | undefined): EventTarget {
  const navigationElement = page === undefined
    ? null
    : { getAttribute: (name: string) => name === "data-page" ? page : null };
  return { closest: (selector: string) => selector === "[data-page]" ? navigationElement : null } as unknown as EventTarget;
}

describe("getPageFromEventTarget", () => {
  it.each(["compendium", "settings"] as const)("resolve %s a partir do próprio botão", (page) => {
    expect(getPageFromEventTarget(eventTarget(page))).toBe(page);
  });

  it.each([
    ["svg do Compendium", "compendium"],
    ["path de Configurações", "settings"]
  ] as const)("resolve o clique originado no %s", (_origin, page) => {
    expect(getPageFromEventTarget(eventTarget(page))).toBe(page);
  });

  it("ignora alvos sem navegação e páginas desconhecidas", () => {
    expect(getPageFromEventTarget(eventTarget(undefined))).toBeUndefined();
    expect(getPageFromEventTarget(eventTarget("desconhecida"))).toBeUndefined();
    expect(getPageFromEventTarget(null)).toBeUndefined();
  });
});
