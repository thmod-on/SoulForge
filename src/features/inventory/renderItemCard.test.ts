import { describe, expect, it } from "vitest";
import type { ItemDefinition } from "../../domain/types";
import { renderItemCardBody } from "./renderItemCard";

const item: ItemDefinition = { id: "test", packId: "test", type: "item", name: "Armadura Fortificada Completa (Full Fortified Armor)", summary: "", category: "armadura", weight: 0, tier: 4 };
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

describe("shared inventory cards", () => {
  it("keeps full long names and renders a category symbol without an image", () => {
    const html = renderItemCardBody(item, { categoryLabel: "Armaduras" }, escapeHtml);
    expect(html).toContain(item.name);
    expect(html).toContain("inventory-card-symbol");
    expect(html).toContain("Tier 4");
    expect(html).not.toContain("<img");
  });
  it("keeps quantity and equipment state separate from the name", () => {
    const html = renderItemCardBody(item, { categoryLabel: "Armaduras", quantity: 128, equipped: true }, escapeHtml);
    expect(html).toContain("×128");
    expect(html).toContain("Equipado");
    expect(html).not.toContain("Selecionado");
  });
  it("uses artwork and a separate selection state in the catalog", () => {
    const html = renderItemCardBody({ ...item, image: 'art.png?x="', name: "<item>" }, { categoryLabel: "Armaduras", selected: true }, escapeHtml);
    expect(html).toContain("<img");
    expect(html).toContain("&quot;");
    expect(html).toContain("&lt;item>");
    expect(html).toContain("✓ Selecionado");
    expect(html).not.toContain("item-quantity");
  });
});
