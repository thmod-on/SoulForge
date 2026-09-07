import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { ItemDefinition } from "../../domain/types";
import { renderCompendiumItemsManager, type ItemFeatureDependencies } from "./items";

const item: ItemDefinition = { id: "item.test", packId: "local", type: "item", name: "Armadura Fortificada Completa (Full Fortified Armor)", summary: "Proteção", category: "armadura", tier: 4, weight: 0 };
function render(items: ItemDefinition[]) {
  return renderCompendiumItemsManager({
    state: { compendiumItemSearch: "", compendiumItemFilter: "todos", compendiumItemTierFilter: "todos", itemDefinitionModalOpen: false },
    catalog: createCatalog([], items),
    itemFilterLabels: { todos: "Tudo", arma: "Armas", armadura: "Armaduras", consumivel: "Consumíveis", equipamento: "Equipamentos", loot: "Loot" },
    escapeHtml: (value: string) => value,
    renderEmptyInline: (value: string) => value
  } as ItemFeatureDependencies);
}

describe("Compendium item previews", () => {
  it("reuses the shared card and retains local actions outside its button", () => {
    const html = render([item]);
    expect(html).toContain("inventory-art-card");
    expect(html).toContain("inventory-card-symbol");
    expect(html).toContain(item.name);
    expect(html).toContain('data-compendium-item-preview-id="item.test"');
    expect(html).toContain('data-action="edit-compendium-item"');
    expect(html).toContain('data-action="delete-compendium-item"');
    expect(html).toContain('</button><div class="compendium-card-result-actions">');
  });
  it("keeps pack items read-only and renders all items in a large catalog", () => {
    const html = render(Array.from({ length: 180 }, (_, index) => ({ ...item, id: `item.${index}`, packId: "pack" })));
    expect(html.match(/inventory-art-card/g)).toHaveLength(180);
    expect(html).toContain("Conteudo do pack");
    expect(html).not.toContain('data-action="edit-compendium-item"');
    expect(html).not.toContain('data-action="delete-compendium-item"');
  });
});
