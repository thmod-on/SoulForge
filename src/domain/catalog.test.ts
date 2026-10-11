import { describe, expect, it } from "vitest";
import { catalog } from "../content/installedPacks";

describe("catalog", () => {
  it("starts without bundled fictional content", () => {
    expect(catalog.packs).toEqual([]);
    expect(catalog.definitions).toEqual([]);
  });
});
