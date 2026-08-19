import type { Catalog } from "../../domain/catalog";
import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";
import { renderCombatModifiers } from "../compendium/items";
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
  return `<main class="content inventory-layout"><section class="inventory-main"><div class="screen-title"><h1>Inventario</h1></div><div class="filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((filter) => `<button class="chip ${state.inventoryFilter === filter ? "is-active" : ""}" data-inventory-filter="${filter}">${itemFilterLabels[filter]}</button>`).join("")}<button class="chip inventory-container-action" data-action="add-container" type="button">Novo container</button></div><div class="inventory-compartments">${getInventoryCompartments(character).map((compartment) => renderInventoryCompartment(compartment, entries, state.selectedItemId, dependencies)).join("")}</div></section></main>`;
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
  const availableItems = catalog.items.filter((item) => canCompartmentAcceptItem(compartment, item) && (state.addItemCatalogFilter === "todos" || item.category === state.addItemCatalogFilter));
  const selectedItem = state.addingDefinitionItemId ? findDefinition(catalog, state.addingDefinitionItemId) : undefined;
  const fitsSelected = selectedItem ? canAddItemToCompartment(dependencies, compartment, entries, selectedItem, 1) : false;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal add-item-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title"><div class="container-modal-heading"><h2 id="add-item-title">Adicionar item</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar adicionar item">x</button></div><p>Escolha um item do Compendium para adicionar em <strong>${escapeHtml(compartment.name)}</strong>.</p><div class="filter-row add-item-filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip ${state.addItemCatalogFilter === category ? "is-active" : ""}" type="button" data-add-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}</div><div class="add-item-catalog">${availableItems.length ? availableItems.map((item) => `<button class="item-tile add-item-choice ${state.addingDefinitionItemId === item.id ? "is-active" : ""}" type="button" data-add-item-definition-id="${item.id}"><span class="item-media">${renderItemVisual(item, "tile", escapeHtml)}</span><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Tier ${item.tier} - ` : ""}${itemFilterLabels[item.category]} · Peso ${item.weight}</small></button>`).join("") : renderEmptyInline("Nenhum item compativel com este container.")}</div>${selectedItem ? `<div class="add-item-confirm"><label><span>Quantidade</span><input type="number" min="1" step="1" value="1" data-add-item-quantity /></label><span>${fitsSelected ? "O item cabe neste container." : "Nao ha capacidade suficiente neste container."}</span><button class="primary-action" type="button" data-action="confirm-add-item-to-container">Adicionar</button></div>${state.addItemError ? `<p class="form-error">${escapeHtml(state.addItemError)}</p>` : ""}` : ""}</section></div>`;
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
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : `<span class="item-icon item-icon-${variant}">${itemIcon(item.category)}</span>`;
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
  const quantityControls = entry.quantity > 1 ? `<section class="item-quantity-management"><strong>Quantidade</strong><input aria-label="Quantidade a gerenciar" type="number" min="1" max="${entry.quantity}" step="1" value="${entry.quantity}" data-item-managed-quantity /><button class="secondary-action" type="button" data-action="split-item" data-inventory-entry-id="${getEntryId(entry)}">Separar</button></section>` : "";
  const moveOptions = compartments.map((compartment) => { const isCurrent = compartment.id === currentCompartmentId; const accepts = canCompartmentAcceptItem(compartment, item); const fits = wouldFitCompartment(compartment, entries, item, 1, currentCompartmentId); const disabled = isCurrent || !accepts || !fits; const suffix = isCurrent ? " (atual)" : !accepts ? " (incompatível)" : !fits ? " (sem espaço)" : ""; return `<option value="${compartment.id}" ${disabled ? "disabled" : ""}>${escapeHtml(compartment.name)}${suffix}</option>`; }).join("");
  return `<div class="modal-backdrop" data-modal-backdrop><section class="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><div class="item-modal-art">${renderItemVisual(item, "detail", escapeHtml)}</div><div class="item-modal-body"><span class="resource-modal-label">${itemFilterLabels[item.category]}</span><div class="item-modal-heading"><div><h2 id="item-modal-title">${escapeHtml(item.name)}</h2><span>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</span></div></div><p>${escapeHtml(item.summary)}</p><dl class="detail-list item-modal-details"><div><dt>Qtd.</dt><dd>${entry.quantity}</dd></div><div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${item.weight}</dd></div><div><dt>Container</dt><dd>${escapeHtml(currentCompartment?.name ?? "Mochila")}</dd></div></dl><div class="trait-list">${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${renderCombatModifiers(item)}${quantityControls}<div class="move-list"><label><span>Mover para</span><select data-item-move-destination><option value="">Escolha um compartimento</option>${moveOptions}</select></label><button class="secondary-action" type="button" data-action="move-item" data-inventory-entry-id="${getEntryId(entry)}">Mover quantidade</button></div><div class="item-modal-actions"><button class="danger-action" type="button" data-action="delete-item" data-inventory-entry-id="${getEntryId(entry)}">Descartar${entry.quantity > 1 ? " quantidade" : ""}</button></div></div></section></div>`;
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
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-item-title"><button class="modal-close" data-modal-close aria-label="Cancelar descarte">x</button><span class="resource-modal-label">Descartar item</span><h2 id="delete-item-title">${escapeHtml(item.name)}</h2><p>Esta acao removera apenas a quantidade escolhida do inventario.</p><div class="danger-summary"><strong>${quantity}</strong><span>${quantity === 1 ? "unidade sera perdida" : "unidades serao perdidas"} em ${escapeHtml(compartment?.name ?? "Mochila")}</span></div><div class="confirmation-actions"><button class="secondary-action" type="button" data-action="cancel-delete-item">Cancelar</button><button class="danger-action" type="button" data-action="confirm-delete-item">Descartar quantidade</button></div></section></div>`;
}

export function renderResourceModal(resourceId: string | undefined, dependencies: InventoryRenderDependencies): string {
  const { state, escapeHtml, renderResourceIndicator } = dependencies;
  const resource = state.character?.resources.find((entry) => entry.id === resourceId);
  if (!resource) return "";
  return `<div class="modal-backdrop resource-modal-backdrop" data-modal-backdrop><section class="resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar recurso">x</button><span class="resource-modal-label">Recurso</span><h2 id="resource-modal-title">${escapeHtml(resource.label)}</h2><div class="resource-stepper"><button data-resource-adjust="-1" aria-label="Diminuir ${escapeHtml(resource.label)}">-</button><strong>${resource.value} / ${resource.max}</strong><button data-resource-adjust="1" aria-label="Aumentar ${escapeHtml(resource.label)}">+</button></div>${renderResourceIndicator(resource)}</section></div>`;
}
