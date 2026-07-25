import { describe, expect, it } from "vitest";
import { catalog } from "../content/installedPacks";
import { findDomain } from "./catalog";

describe("catalog", () => {
  it("loads Dread cards from the installed demo pack", () => {
    const dread = catalog.domains.find((domain) => domain.name === "Dread");
    const dreadCards = catalog.cards.filter((card) => card.domainId === dread?.id);

    expect(dread).toBeDefined();
    expect(dreadCards).toHaveLength(2);
    expect(dreadCards.map((card) => card.name)).toContain("Dread Veil");
  });

  it("resolves domains by id", () => {
    const dread = findDomain(catalog, "domain.demo.dread");

    expect(dread?.name).toBe("Dread");
  });
});
