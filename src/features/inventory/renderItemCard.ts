import type { ItemDefinition } from "../../domain/types";

type ItemCardOptions = { quantity?: number; equipped?: boolean; selected?: boolean; categoryLabel: string };

const categoryShapes: Record<ItemDefinition["category"], string> = {
  arma: '<path d="m9 23 14-14 1-7-7 1L3 17m3-3 12 12M8 22l-5 5m-2-2 4 4"/>',
  armadura: '<path d="m16 3 11 4-1 11c-1 5-5 9-10 12C11 27 7 23 6 18L5 7Z"/><path d="M16 7v17M9 11h14"/>',
  consumivel: '<path d="M12 3h8v5l-1 1v4l7 10c2 4 0 6-4 6H10c-4 0-6-2-4-6l7-10V9l-1-1Zm-3 18h14M12 7h8"/>',
  equipamento: '<path d="M10 3h12l-3 7c8 5 10 10 9 14s-5 5-12 5-11-1-12-5 1-9 9-14Zm2 7h8M10 16l-2 7"/>',
  loot: '<path d="m16 3 12 11-12 16L4 14Zm-12 11h24M16 3l-5 11 5 16 5-16Z"/>'
};

/** Shared card content for owned items and the add-item catalog. */
export function renderItemCardBody(item: ItemDefinition, options: ItemCardOptions, escapeHtml: (value: string) => string): string {
  const art = item.image
    ? `<img class="sf-media-image sf-media-image--item" src="${escapeHtml(item.image)}" alt="" loading="lazy" />`
    : `<svg class="inventory-card-symbol" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${categoryShapes[item.category]}</svg>`;
  return `<span class="item-media ${item.image ? "has-image" : "is-placeholder"}">${art}</span>${options.quantity !== undefined ? `<span class="item-quantity" aria-label="Quantidade: ${options.quantity}">×${options.quantity}</span>` : ""}<span class="inventory-card-copy"><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Tier ${item.tier}` : escapeHtml(options.categoryLabel)}</small>${options.equipped || options.selected ? `<span class="inventory-card-state">${options.selected ? "✓ Selecionado" : "Equipado"}</span>` : ""}</span>`;
}
