import { describe, expect, it } from "vitest";
import { getScrollState } from "./scrollAffordance";

describe("getScrollState", () => {
  it("não indica rolagem quando todo o conteúdo cabe", () => {
    expect(getScrollState(100, 100, 0)).toEqual({ hasOverflow: false, canScrollUp: false, canScrollDown: false });
  });

  it("indica conteúdo abaixo no início da lista", () => {
    expect(getScrollState(220, 100, 0)).toEqual({ hasOverflow: true, canScrollUp: false, canScrollDown: true });
  });

  it("indica conteúdo acima e abaixo no meio da lista", () => {
    expect(getScrollState(220, 100, 60)).toEqual({ hasOverflow: true, canScrollUp: true, canScrollDown: true });
  });

  it("indica retorno ao topo no fim da lista", () => {
    expect(getScrollState(220, 100, 120)).toEqual({ hasOverflow: true, canScrollUp: true, canScrollDown: false });
  });
});
