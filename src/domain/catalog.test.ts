import { describe, expect, it } from "vitest";
import { catalog } from "../content/installedPacks";
import { findDomain } from "./catalog";

describe("catalog", () => {
  it("loads test cards from the installed demo pack", () => {
    const testDomain = catalog.domains.find((domain) => domain.name === "Teste");
    const testCards = catalog.cards.filter((card) => card.domainId === testDomain?.id);

    expect(testDomain).toBeDefined();
    expect(testCards).toHaveLength(3);
    expect(testCards.map((card) => card.name)).toContain("Véu de Teste");
  });

  it("resolves domains by id", () => {
    const testDomain = findDomain(catalog, "domain.demo.test");

    expect(testDomain?.name).toBe("Teste");
  });
});
