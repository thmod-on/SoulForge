import type { Catalog } from "../../domain/catalog";
import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";
import { renderCombatModifiers } from "../compendium/items";
import { getItemTierFilterOptions, matchesItemTierFilter } from "../items/itemTierFilters";
import type { InventoryFilter } from "../../app/types";

type InventoryItemEntry = {
  entry: Character["inventory"]["entries"][number];
  item: ItemDefinition;
};

export type InventoryRenderState = {
  inventoryFilter: InventoryFilter;
  selectedItemId?: string;
  character?: Character;
  addItemToCompartmentId?: string;
  addItemCatalogFilter: InventoryFilter;
  addItemCatalogTierFilter: string;
  addItemCatalogSearch: string;
  addItemPreviewDefinitionId?: string;
  addingDefinitionItemId?: string;
  addItemError?: string;
  deletingItemId?: string;
  deletingItemQuantity?: number;
};

function getEntryId(entry: Character["inventory"]["entries"][number]): string {
  return entry.id ?? entry.definitionId;
}

export type InventoryRenderDependencies = {
  state: InventoryRenderState;
  catalog: Catalog;
  itemFilterLabels: Record<InventoryFilter, string>;
  escapeHtml: (value: string) => string;
  progressPercent: (value: number, max: number) => number;
  renderEmptyInline: (message: string) => string;
  renderResourceIndicator: (resource: Character["resources"][number]) => string;
  getItemEntries: (character: Character) => InventoryItemEntry[];
  getInventoryCompartments: (character: Character) => InventoryCompartment[];
  getEntryCompartmentId: (entry: InventoryItemEntry["entry"]) => string;
  getCompartmentWeight: (entries: InventoryItemEntry[], compartmentId: string) => number;
  canCompartmentAcceptItem: (compartment: InventoryCompartment, item: ItemDefinition) => boolean;
  wouldFitCompartment: (compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number, currentCompartmentId: string) => boolean;
  findDefinition: (catalog: Catalog, definitionId: string) => ItemDefinition | undefined;
};

function canAddItemToCompartment(dependencies: InventoryRenderDependencies, compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number): boolean {
  if (!dependencies.canCompartmentAcceptItem(compartment, item)) return false;
  return !compartment.capacity || dependencies.getCompartmentWeight(entries, compartment.id) + item.weight * quantity <= compartment.capacity;
}

export function renderInventory(character: Character, dependencies: InventoryRenderDependencies): string {
  const { state, itemFilterLabels, getItemEntries, getInventoryCompartments } = dependencies;
  const entries = getItemEntries(character);
  return `<main class="content inventory-layout"><section class="inventory-main"><div class="screen-title"><h1>Inventario</h1></div><div class="filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((filter) => `<button class="chip sf-filter-option ${state.inventoryFilter === filter ? "is-active" : ""}" data-inventory-filter="${filter}">${itemFilterLabels[filter]}</button>`).join("")}<button class="chip inventory-container-action" data-action="add-container" type="button">Novo container</button></div><div class="inventory-compartments">${getInventoryCompartments(character).map((compartment) => renderInventoryCompartment(compartment, entries, state.selectedItemId, dependencies)).join("")}</div></section></main>`;
}

function renderInventoryCompartment(compartment: InventoryCompartment, entries: InventoryItemEntry[], selectedItemId: string | undefined, dependencies: InventoryRenderDependencies): string {
  const { state, escapeHtml, getEntryCompartmentId, getCompartmentWeight, progressPercent, renderEmptyInline } = dependencies;
  const compartmentEntries = entries.filter(({ entry, item }) => getEntryCompartmentId(entry) === compartment.id && (state.inventoryFilter === "todos" || item.category === state.inventoryFilter));
  const currentWeight = getCompartmentWeight(entries, compartment.id);
  const capacityLabel = compartment.capacity ? `${currentWeight} / ${compartment.capacity}` : `${compartmentEntries.length} itens`;
  return `<section class="inventory-compartment" data-compartment-id="${compartment.id}"><div class="compartment-heading"><div><h2>${escapeHtml(compartment.name)}</h2><span>${renderCompartmentHint(compartment, dependencies)}</span></div><div class="compartment-actions"><strong>${capacityLabel}</strong><button class="add-item-to-container" type="button" data-action="open-add-item-to-container" data-compartment-id="${compartment.id}">Adicionar item</button><button type="button" data-action="delete-container" data-compartment-id="${compartment.id}" ${compartment.source === "character" ? "disabled" : ""}>Excluir</button></div></div>${compartment.capacity ? `<div class="capacity-bar compartment-capacity"><i style="width: ${progressPercent(currentWeight, compartment.capacity)}%"></i></div>` : ""}${compartmentEntries.length ? `<div class="item-grid ${compartment.id === "equipped" ? "equipped-grid" : ""}">${compartmentEntries.map(({ entry, item }) => renderItemTile(entry, item, selectedItemId === getEntryId(entry), Boolean(entry.equipped), compartment.id, dependencies)).join("")}</div>` : renderEmptyInline("Nenhum item neste compartimento.")}</section>`;
}

export function renderAddItemToContainerModal(dependencies: InventoryRenderDependencies): string {
  const { state, catalog, itemFilterLabels, escapeHtml, getInventoryCompartments, getItemEntries, canCompartmentAcceptItem, findDefinition, renderEmptyInline } = dependencies;
  const character = state.character;
  const compartment = character && state.addItemToCompartmentId ? getInventoryCompartments(character).find((entry) => entry.id === state.addItemToCompartmentId) : undefined;
  if (!character || !compartment) return "";
  const entries = getItemEntries(character);
  const compatibleItems = catalog.items.filter((item) => canCompartmentAcceptItem(compartment, item));
  const tierOptions = getItemTierFilterOptions(compatibleItems);
  const search = state.addItemCatalogSearch.trim().toLocaleLowerCase("pt-BR");
  const availableItems = compatibleItems.filter((item) => (state.addItemCatalogFilter === "todos" || item.category === state.addItemCatalogFilter) && matchesItemTierFilter(item, state.addItemCatalogTierFilter) && (!search || [item.name, item.summary, itemFilterLabels[item.category], item.tier ?? "", item.weight, item.value ?? "", ...(item.traits ?? [])].join(" ").toLocaleLowerCase("pt-BR").includes(search)));
  const previewItem = state.addItemPreviewDefinitionId ? findDefinition(catalog, state.addItemPreviewDefinitionId) : undefined;
  const selectedItem = state.addingDefinitionItemId ? findDefinition(catalog, state.addingDefinitionItemId) : undefined;
  const fitsSelected = selectedItem ? canAddItemToCompartment(dependencies, compartment, entries, selectedItem, 1) : false;
  if (previewItem) {
    return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal sf-scroll-region add-item-modal add-item-detail-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-preview-title"><div class="container-modal-heading"><h2 id="add-item-preview-title">${escapeHtml(previewItem.name)}</h2><button class="modal-close modal-close-inline" type="button" data-action="close-add-item-preview" aria-label="Voltar à lista de itens">x</button></div><p>Confira os detalhes antes de adicionar em <strong>${escapeHtml(compartment.name)}</strong>.</p><article class="add-item-preview"><div class="add-item-preview-art">${renderItemVisual(previewItem, "detail", escapeHtml)}</div><div class="add-item-preview-body"><span class="resource-modal-label">${itemFilterLabels[previewItem.category]}</span><span>${previewItem.tier ? `Tier ${previewItem.tier}` : "Sem Tier"}</span><p>${escapeHtml(previewItem.summary)}</p><dl class="detail-list item-modal-details"><div><dt>Valor</dt><dd>${previewItem.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${previewItem.weight}</dd></div></dl><div class="trait-list">${(previewItem.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${renderCombatModifiers(previewItem)}<div class="add-item-preview-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="close-add-item-preview">Voltar à lista</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="select-add-item-from-preview" data-item-id="${previewItem.id}">Selecionar item</button></div></div></article></section></div>`;
  }
  const errorMessage = state.addItemError ? `<p class="form-error add-item-error">${escapeHtml(state.addItemError)}</p>` : "";
  const confirmation = selectedItem
    ? `<div class="add-item-confirm"><label><span>Quantidade</span><input type="number" min="1" step="1" value="1" data-add-item-quantity /></label><span>${fitsSelected ? "O item cabe neste container." : "Não há capacidade suficiente neste container."}</span><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-add-item-to-container">Adicionar</button>${errorMessage}</div>`
    : `<div class="add-item-confirm is-idle"><span>Selecione um item para conferir seus detalhes e adicioná-lo.</span>${errorMessage}</div>`;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal sf-scroll-region add-item-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title"><div class="container-modal-heading"><h2 id="add-item-title">Adicionar item</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar adicionar item">x</button></div><div class="add-item-catalog-toolbar"><p>Escolha um item do Compendium para adicionar em <strong>${escapeHtml(compartment.name)}</strong>.</p><div class="add-item-toolbar-controls"><label class="sf-search-field add-item-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar item..." aria-label="Buscar item" data-add-item-catalog-search value="${escapeHtml(state.addItemCatalogSearch)}" /></label><div class="add-item-filter-stack"><div class="filter-row add-item-filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip sf-filter-option ${state.addItemCatalogFilter === category ? "is-active" : ""}" type="button" data-add-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}</div><div class="filter-row add-item-filter-row add-item-tier-filter"><span>Nível</span>${tierOptions.map((option) => `<button class="chip sf-filter-option ${state.addItemCatalogTierFilter === option.value ? "is-active" : ""}" type="button" data-add-item-tier-filter="${option.value}">${option.label}</button>`).join("")}</div></div></div></div><div class="add-item-catalog">${availableItems.length ? availableItems.map((item) => renderAddItemCatalogTile(item, state.addingDefinitionItemId === item.id, itemFilterLabels, escapeHtml)).join("") : renderEmptyInline("Nenhum item compatível com estes filtros.")}</div>${confirmation}</section></div>`;
}

function renderAddItemCatalogTile(item: ItemDefinition, selected: boolean, itemFilterLabels: Record<InventoryFilter, string>, escapeHtml: (value: string) => string): string {
  return `<button class="item-tile add-item-choice ${selected ? "is-active" : ""}" type="button" data-add-item-preview-definition-id="${item.id}" aria-label="Ver detalhes de ${escapeHtml(item.name)}"><span class="item-media">${renderItemVisual(item, "tile", escapeHtml)}</span><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Nível ${item.tier}` : "Sem nível"} · ${itemFilterLabels[item.category]} · Peso ${item.weight}</small><span class="item-catalog-footer">${selected ? "<em class=\"item-selection-state\">Selecionado</em>" : ""}</span></button>`;
}

function renderCompartmentHint(compartment: InventoryCompartment, dependencies: InventoryRenderDependencies): string {
  if (compartment.accepts?.length) return `Aceita ${compartment.accepts.map((category) => dependencies.itemFilterLabels[category]).join(", ")}`;
  return compartment.capacity ? "Compartimento com capacidade propria" : "Acesso rapido";
}

function renderItemTile(entry: Character["inventory"]["entries"][number], item: ItemDefinition, selected: boolean, equipped: boolean, compartmentId: string, dependencies: InventoryRenderDependencies): string {
  const { escapeHtml, itemFilterLabels } = dependencies;
  return `<button class="item-tile ${selected ? "is-active" : ""}" data-item-id="${item.id}" data-inventory-entry-id="${getEntryId(entry)}" data-item-compartment-id="${compartmentId}" draggable="false"><span class="item-media">${renderItemVisual(item, "tile", escapeHtml)}<span class="item-quantity">x${entry.quantity}</span></span><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]} - ${itemFilterLabels[item.category]}</small>${equipped ? "<em>Equipado</em>" : ""}</button>`;
}

export function renderItemVisual(item: ItemDefinition, variant: "tile" | "detail", escapeHtml: (value: string) => string): string {
  return item.image ? `<img class="sf-media-image sf-media-image--item" src="${escapeHtml(item.image)}" alt="" />` : `<span class="item-icon item-icon-${variant}" aria-label="Sem imagem; tipo ${itemIcon(item.category)}">${itemIcon(item.category)}</span>`;
}

function itemIcon(category: ItemDefinition["category"]): string {
  return { arma: "WPN", armadura: "ARM", consumivel: "POT", equipamento: "KIT", loot: "LOOT" }[category];
}

export function renderItemModal(dependencies: InventoryRenderDependencies): string {
  const { state, escapeHtml, itemFilterLabels, getItemEntries, getInventoryCompartments, getEntryCompartmentId, canCompartmentAcceptItem, wouldFitCompartment } = dependencies;
  const character = state.character;
  if (!character || !state.selectedItemId) return "";
  const selectedEntry = getItemEntries(character).find(({ entry }) => getEntryId(entry) === state.selectedItemId);
  if (!selectedEntry) return "";
  const { item, entry } = selectedEntry;
  const compartments = getInventoryCompartments(character);
  const currentCompartmentId = getEntryCompartmentId(entry);
  const currentCompartment = compartments.find((compartment) => compartment.id === currentCompartmentId);
  const entries = getItemEntries(character);
  const quantityControls = entry.quantity > 1 ? `<section class="item-quantity-management"><strong>Quantidade</strong><input aria-label="Quantidade a gerenciar" type="number" min="1" max="${entry.quantity}" step="1" value="${entry.quantity}" data-item-managed-quantity /><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="split-item" data-inventory-entry-id="${getEntryId(entry)}">Separar</button></section>` : "";
  const moveOptions = compartments.map((compartment) => { const isCurrent = compartment.id === currentCompartmentId; const accepts = canCompartmentAcceptItem(compartment, item); const fits = wouldFitCompartment(compartment, entries, item, 1, currentCompartmentId); const disabled = isCurrent || !accepts || !fits; const suffix = isCurrent ? " (atual)" : !accepts ? " (incompatível)" : !fits ? " (sem espaço)" : ""; return `<option value="${compartment.id}" ${disabled ? "disabled" : ""}>${escapeHtml(compartment.name)}${suffix}</option>`; }).join("");
  return `<div class="modal-backdrop" data-modal-backdrop><section class="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><div class="item-modal-art">${renderItemVisual(item, "detail", escapeHtml)}</div><div class="item-modal-body sf-scroll-region"><span class="resource-modal-label">${itemFilterLabels[item.category]}</span><div class="item-modal-heading"><div><h2 id="item-modal-title">${escapeHtml(item.name)}</h2><span>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</span></div></div><p>${escapeHtml(item.summary)}</p><dl class="detail-list item-modal-details"><div><dt>Qtd.</dt><dd>${entry.quantity}</dd></div><div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${item.weight}</dd></div><div><dt>Container</dt><dd>${escapeHtml(currentCompartment?.name ?? "Mochila")}</dd></div></dl><div class="trait-list">${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${renderCombatModifiers(item)}${quantityControls}<div class="move-list"><label><span>Mover para</span><select data-item-move-destination><option value="">Escolha um compartimento</option>${moveOptions}</select></label><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="move-item" data-inventory-entry-id="${getEntryId(entry)}">Mover quantidade</button></div><div class="item-modal-actions"><button class="sf-action sf-action--danger danger-action" type="button" data-action="delete-item" data-inventory-entry-id="${getEntryId(entry)}">Descartar${entry.quantity > 1 ? " quantidade" : ""}</button></div></div></section></div>`;
}

export function renderDeleteItemModal(dependencies: InventoryRenderDependencies): string {
  const { state, escapeHtml, getItemEntries, getInventoryCompartments, getEntryCompartmentId } = dependencies;
  const character = state.character;
  if (!character || !state.deletingItemId) return "";
  const selectedEntry = getItemEntries(character).find(({ entry }) => getEntryId(entry) === state.deletingItemId);
  if (!selectedEntry) return "";
  const { item, entry } = selectedEntry;
  const compartment = getInventoryCompartments(character).find((container) => container.id === getEntryCompartmentId(entry));
  const quantity = Math.max(1, Math.min(entry.quantity, state.deletingItemQuantity ?? entry.quantity));
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-item-title"><button class="modal-close" data-modal-close aria-label="Cancelar descarte">x</button><span class="resource-modal-label">Descartar item</span><h2 id="delete-item-title">${escapeHtml(item.name)}</h2><p>Esta acao removera apenas a quantidade escolhida do inventario.</p><div class="danger-summary"><strong>${quantity}</strong><span>${quantity === 1 ? "unidade sera perdida" : "unidades serao perdidas"} em ${escapeHtml(compartment?.name ?? "Mochila")}</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-item">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-item">Descartar quantidade</button></div></section></div>`;
}

export function renderResourceModal(resourceId: string | undefined, dependencies: InventoryRenderDependencies): string {
  const { state, escapeHtml, renderResourceIndicator } = dependencies;
  const resource = state.character?.resources.find((entry) => entry.id === resourceId);
  if (!resource) return "";
  return `<div class="modal-backdrop resource-modal-backdrop" data-modal-backdrop><section class="resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar recurso">x</button><span class="resource-modal-label">Recurso</span><h2 id="resource-modal-title">${escapeHtml(resource.label)}</h2><div class="resource-stepper"><button data-resource-adjust="-1" aria-label="Diminuir ${escapeHtml(resource.label)}">-</button><strong>${resource.value} / ${resource.max}</strong><button data-resource-adjust="1" aria-label="Aumentar ${escapeHtml(resource.label)}">+</button></div>${renderResourceIndicator(resource)}</section></div>`;
}
