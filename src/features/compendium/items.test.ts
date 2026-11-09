import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { ItemDefinition } from "../../domain/types";
import { renderCompendiumItemFormModal, renderCompendiumItemsManager, type ItemFeatureDependencies } from "./items";

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
  it("renders fixed and derived mechanics in the custom item editor", () => {
    const configured: ItemDefinition = { ...item, combatModifiers: { minor: 10, major: 31 }, derivedDefenseModifiers: [{ field: "minor", source: { kind: "spellcast-attribute" } }], weaponProfile: { category: "primaria", attackTrait: "int", range: "longe", damage: "d8", damageType: "magico", burden: 1 }, armorProfile: { armor: 5, minorThreshold: 10, majorThreshold: 31 } };
    const html = renderCompendiumItemFormModal({ state: { compendiumItemSearch: "", compendiumItemFilter: "todos", compendiumItemTierFilter: "todos", itemDefinitionModalOpen: true, editingCompendiumItemId: configured.id }, catalog: createCatalog([], [configured]), itemFilterLabels: { todos: "Tudo", arma: "Armas", armadura: "Armaduras", consumivel: "Consumíveis", equipamento: "Equipamentos", loot: "Loot" }, escapeHtml: (value) => value } as ItemFeatureDependencies);
    expect(html).toContain("Valores derivados");
    expect(html).toContain('data-item-derived-source');
    expect(html).toContain('value="spellcast-attribute" selected');
    expect(html).toContain('data-compendium-item-modifier-minor type="number" step="1" value="10"');
  });
  it("reuses the shared card and retains local actions outside its button", () => {
    const html = render([item]);
    expect(html).toContain("inventory-art-card");
    expect(html).toContain("inventory-card-symbol");
    expect(html).toContain(item.name);
    expect(html).toContain('data-compendium-item-preview-id="item.test"');
    expect(html).toContain('data-action="edit-compendium-item"');
    expect(html).toContain('data-action="delete-compendium-item"');
    expect(html).toContain('</button><div class="compendium-card-result-actions">');
    expect(html).toContain("data-compendium-dynamic");
  });
  it("offers personal adjustments without destructive Pack actions and renders all items", () => {
    const html = render(Array.from({ length: 180 }, (_, index) => ({ ...item, id: `item.${index}`, packId: "pack" })));
    expect(html.match(/inventory-art-card/g)).toHaveLength(180);
    expect(html).toContain("Conteúdo do Pack");
    expect(html).toContain("Ajustar para mim");
    expect(html).toContain('data-action="duplicate-compendium-item"');
    expect(html).not.toContain('data-action="delete-compendium-item"');
  });
});
