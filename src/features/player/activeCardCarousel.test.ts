import { describe, expect, it } from "vitest";
import { getActiveCardCarouselState } from "./activeCardCarousel";

describe("getActiveCardCarouselState", () => {
  it("mantém os controles ocultos quando todas as cartas cabem", () => {
    expect(getActiveCardCarouselState(0, 700, 700)).toEqual({ hasOverflow: false, hasPrevious: false, hasNext: false });
  });

  it("mostra somente o avanço no início do trilho", () => {
    expect(getActiveCardCarouselState(0, 1200, 700)).toEqual({ hasOverflow: true, hasPrevious: false, hasNext: true });
  });

  it("troca o controle disponível ao alcançar o final", () => {
    expect(getActiveCardCarouselState(500, 1200, 700)).toEqual({ hasOverflow: true, hasPrevious: true, hasNext: false });
  });
});
