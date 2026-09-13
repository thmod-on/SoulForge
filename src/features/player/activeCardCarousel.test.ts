import { describe, expect, it } from "vitest";
import { getActiveCardCarouselRestoreLeft, getActiveCardCarouselState } from "./activeCardCarousel";

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

  it("restaura o deslocamento salvo dentro dos novos limites do trilho", () => {
    expect(getActiveCardCarouselRestoreLeft(320, 1200, 700)).toBe(320);
    expect(getActiveCardCarouselRestoreLeft(800, 1200, 700)).toBe(500);
    expect(getActiveCardCarouselRestoreLeft(-20, 1200, 700)).toBe(0);
  });
});
