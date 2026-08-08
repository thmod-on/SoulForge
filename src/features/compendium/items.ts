import type { Catalog } from "../../domain/catalog";
import type { Character, ItemDefinition } from "../../domain/types";
import type { InventoryFilter } from "../../app/types";

export type ItemFeatureState = {
  compendiumItemSearch: string;
  compendiumItemFilter: InventoryFilter;
  itemDefinitionModalOpen: boolean;
  editingCompendiumItemId?: string;
  deletingCompendiumItemId?: string;
  compendiumItemPreviewId?: string;
  character?: Character;
};

export type ItemFeatureDependencies = {
  state: ItemFeatureState;
  catalog: Catalog;
  itemFilterLabels: Record<InventoryFilter, string>;
  escapeHtml: (value: string) => string;
  renderEmptyInline: (message: string) => string;
  renderItemVisual: (item: ItemDefinition, variant: "tile" | "detail") => string;
  saveCustomDefinition: (definition: ItemDefinition) => Promise<void>;
  deleteCustomDefinition: (definitionId: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: () => void;
};

export function renderCompendiumItemsManager(dependencies: ItemFeatureDependencies): string {
  const { state, itemFilterLabels, escapeHtml, renderEmptyInline } = dependencies;
  const items = getFilteredItems(dependencies);
  return `<main class="content compendium-content"><div class="screen-title"><div><h1>Itens</h1><p>Crie e organize os itens que poderao ser usados nos inventarios.</p></div><button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button></div><section class="compendium-management-panel"><div class="compendium-management-toolbar"><label class="search-box"><span>BUSCA</span><input type="search" placeholder="Procurar item..." aria-label="Procurar item" data-compendium-item-search value="${escapeHtml(state.compendiumItemSearch)}" /></label><button class="primary-action" type="button" data-action="new-compendium-item">Novo item</button></div><div class="compendium-filter-block"><span>Categoria</span><div class="filter-row compendium-filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip ${state.compendiumItemFilter === category ? "is-active" : ""}" type="button" data-compendium-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}</div></div><div class="compendium-results-heading"><strong>${items.length}</strong><span>${items.length === 1 ? "item encontrado" : "itens encontrados"}</span></div>${items.length ? `<div class="item-grid compendium-item-results">${items.map((item) => renderItemResult(item, dependencies)).join("")}</div>` : renderEmptyInline("Nenhum item encontrado com os filtros atuais.")}</section></main>`;
}

export function renderCompendiumItemFormModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, itemFilterLabels, escapeHtml } = dependencies;
  if (!state.itemDefinitionModalOpen) return "";
  const item = state.editingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.editingCompendiumItemId) : undefined;
  const categories = Object.keys(itemFilterLabels).filter((key) => key !== "todos") as ItemDefinition["category"][];
  return `<div class="modal-backdrop" data-modal-backdrop><section class="form-modal item-form-modal" role="dialog" aria-modal="true" aria-labelledby="item-form-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><h2 id="item-form-modal-title">${item ? "Editar item" : "Novo item"}</h2><p>O item sera salvo localmente e podera ser adicionado ao inventario em uma proxima etapa.</p><div class="form-grid"><label class="form-field"><span>Nome *</span><input data-compendium-item-name value="${escapeHtml(item?.name ?? "")}" placeholder="Ex.: Adaga lunar" /></label><label class="form-field"><span>Categoria *</span><select data-compendium-item-category>${categories.map((category) => `<option value="${category}" ${category === item?.category ? "selected" : ""}>${itemFilterLabels[category]}</option>`).join("")}</select></label><label class="form-field"><span>Tier</span><input data-compendium-item-tier type="number" min="1" max="4" value="${item?.tier ?? ""}" placeholder="Opcional" /></label><label class="form-field"><span>Peso *</span><input data-compendium-item-weight type="number" min="0" step="0.1" value="${item?.weight ?? ""}" placeholder="Ex.: 1" /></label><label class="form-field"><span>Valor</span><input data-compendium-item-value type="number" min="0" step="1" value="${item?.value ?? ""}" placeholder="Opcional" /></label><label class="form-field"><span>Propriedades</span><input data-compendium-item-traits value="${escapeHtml((item?.traits ?? []).join(", "))}" placeholder="Ex.: versatil, leve" /></label></div><fieldset class="item-combat-modifiers"><legend>Modificadores enquanto equipado</legend><p>Preencha somente os bônus ou penalidades concedidos por este item.</p><div class="form-grid"><label class="form-field"><span>Armadura</span><input data-compendium-item-modifier-armor type="number" step="1" value="${item?.combatModifiers?.armor ?? ""}" placeholder="Ex.: +2" /></label><label class="form-field"><span>Evasão</span><input data-compendium-item-modifier-evasion type="number" step="1" value="${item?.combatModifiers?.evasion ?? ""}" placeholder="Ex.: -1" /></label><label class="form-field"><span>Limiar menor</span><input data-compendium-item-modifier-minor type="number" step="1" value="${item?.combatModifiers?.minor ?? ""}" placeholder="Ex.: +3" /></label><label class="form-field"><span>Limiar maior</span><input data-compendium-item-modifier-major type="number" step="1" value="${item?.combatModifiers?.major ?? ""}" placeholder="Ex.: +4" /></label></div></fieldset><label class="form-field"><span>Imagem</span><input data-compendium-item-image type="file" accept="image/png,image/jpeg,image/webp" /><small>${item?.image ? "Uma imagem ja esta associada; envie outra para substitui-la." : "PNG, JPG ou WebP; ate 1,5 MB."}</small></label><label class="form-field"><span>Descricao *</span><textarea data-compendium-item-summary placeholder="Descreva o item e seu uso.">${escapeHtml(item?.summary ?? "")}</textarea></label><p class="form-error" data-compendium-item-error hidden></p><div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="primary-action icon-action" type="button" data-action="save-compendium-item" aria-label="Gravar item" title="Gravar item">🪶</button></div></section></div>`;
}

export function renderDeleteCompendiumItemModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  const item = state.deletingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.deletingCompendiumItemId) : undefined;
  if (!item) return "";
  const isInInventory = state.character?.inventory.entries.some((entry) => entry.definitionId === item.id);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-compendium-item-title"><h2 id="delete-compendium-item-title">Excluir item?</h2><p>${isInInventory ? `O item <strong>${escapeHtml(item.name)}</strong> esta presente no inventario atual e nao pode ser excluido antes de ser removido.` : `O item <strong>${escapeHtml(item.name)}</strong> sera removido deste dispositivo.`}</p><div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-compendium-item">Cancelar</button>${isInInventory ? "" : '<button class="danger-action" type="button" data-action="confirm-delete-compendium-item">Excluir item</button>'}</div></section></div>`;
}

export function renderCompendiumItemPreviewModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, itemFilterLabels, escapeHtml, renderItemVisual } = dependencies;
  const item = state.compendiumItemPreviewId ? catalog.items.find((entry) => entry.id === state.compendiumItemPreviewId) : undefined;
  if (!item) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="item-modal compendium-item-preview" role="dialog" aria-modal="true" aria-labelledby="compendium-item-preview-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><div class="item-modal-art">${renderItemVisual(item, "detail")}</div><div class="item-modal-body"><span class="resource-modal-label">${itemFilterLabels[item.category]}</span><h2 id="compendium-item-preview-title">${escapeHtml(item.name)}</h2><p>${escapeHtml(item.summary)}</p><dl class="detail-list item-modal-details"><div><dt>Tier</dt><dd>${item.tier ?? "-"}</dd></div><div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${item.weight}</dd></div></dl><div class="trait-list">${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${renderCombatModifiers(item)}</div></section></div>`;
}

export async function saveCompendiumItem(dependencies: ItemFeatureDependencies): Promise<void> {
  const { state, catalog, saveCustomDefinition, refreshCatalog, render } = dependencies;
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? "";
  const name = value("[data-compendium-item-name]"); const category = value("[data-compendium-item-category]") as ItemDefinition["category"]; const tierText = value("[data-compendium-item-tier]"); const weight = Number(value("[data-compendium-item-weight]")); const valueText = value("[data-compendium-item-value]"); const summary = value("[data-compendium-item-summary]"); const traits = value("[data-compendium-item-traits]").split(",").map((trait) => trait.trim()).filter(Boolean); const error = document.querySelector<HTMLElement>("[data-compendium-item-error]");
  const existing = state.editingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.editingCompendiumItemId) : undefined;
  const tier = tierText ? Number(tierText) : undefined; const itemValue = valueText ? Number(valueText) : undefined;
  const modifierValues = {
    armor: value("[data-compendium-item-modifier-armor]"),
    evasion: value("[data-compendium-item-modifier-evasion]"),
    minor: value("[data-compendium-item-modifier-minor]"),
    major: value("[data-compendium-item-modifier-major]")
  };
  const combatModifiers = Object.fromEntries(Object.entries(modifierValues).filter(([, modifier]) => modifier !== "").map(([key, modifier]) => [key, Number(modifier)]));
  const validModifiers = Object.values(combatModifiers).every(Number.isFinite);
  const validCategory = ["arma", "armadura", "consumivel", "equipamento", "loot"].includes(category); const duplicate = catalog.items.some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && item.id !== existing?.id);
  if (!name || !validCategory || !Number.isFinite(weight) || weight < 0 || !summary || duplicate || !validModifiers || (tier !== undefined && (!Number.isInteger(tier) || tier < 1 || tier > 4)) || (itemValue !== undefined && (!Number.isFinite(itemValue) || itemValue < 0))) { if (error) { error.hidden = false; error.textContent = duplicate ? "Ja existe um item com este nome." : !validModifiers ? "Os modificadores de combate devem ser números válidos." : "Preencha nome, categoria, peso e descricao. Tier deve ficar entre 1 e 4."; } return; }
  if (existing && existing.packId !== "local") return;
  let image = existing?.image;
  try { image = (await readDefinitionImage("[data-compendium-item-image]")) ?? image; } catch (imageError) { if (error) { error.hidden = false; error.textContent = imageError instanceof Error ? imageError.message : "Nao foi possivel usar a imagem."; } return; }
  await saveCustomDefinition({ id: existing?.id ?? `item.local.${crypto.randomUUID()}`, type: "item", packId: "local", name, summary, category, tier, weight, value: itemValue, traits: traits.length ? traits : undefined, combatModifiers: Object.keys(combatModifiers).length ? combatModifiers : undefined, image });
  await refreshCatalog(); state.itemDefinitionModalOpen = false; state.editingCompendiumItemId = undefined; render();
}

export async function removeCompendiumItem(dependencies: ItemFeatureDependencies): Promise<void> {
  const { state, catalog, deleteCustomDefinition, refreshCatalog, render } = dependencies;
  const item = state.deletingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.deletingCompendiumItemId) : undefined;
  if (!item || item.packId !== "local" || state.character?.inventory.entries.some((entry) => entry.definitionId === item.id)) return;
  await deleteCustomDefinition(item.id); await refreshCatalog(); state.deletingCompendiumItemId = undefined; render();
}

function getFilteredItems(dependencies: ItemFeatureDependencies): ItemDefinition[] {
  const { state, catalog, itemFilterLabels } = dependencies; const search = state.compendiumItemSearch.trim().toLowerCase();
  return catalog.items.filter((item) => (state.compendiumItemFilter === "todos" || item.category === state.compendiumItemFilter) && (!search || [item.name, item.summary, itemFilterLabels[item.category], item.tier ?? "", item.weight, item.value ?? "", ...(item.traits ?? [])].join(" ").toLowerCase().includes(search)));
}

function renderItemResult(item: ItemDefinition, dependencies: ItemFeatureDependencies): string {
  const { escapeHtml, itemFilterLabels, renderItemVisual } = dependencies;
  return `<article class="compendium-item-result"><button class="item-tile compendium-item-tile" type="button" data-compendium-item-preview-id="${item.id}" aria-label="Ver detalhes de ${escapeHtml(item.name)}"><span class="item-media">${renderItemVisual(item, "tile")}</span><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Tier ${item.tier} - ` : ""}${itemFilterLabels[item.category]} · Peso ${item.weight}</small></button><div class="compendium-card-result-actions">${item.packId === "local" ? `<button type="button" data-action="edit-compendium-item" data-item-id="${item.id}">Editar</button><button type="button" data-action="delete-compendium-item" data-item-id="${item.id}">Excluir</button>` : '<span class="readonly-label">Conteudo do pack</span>'}</div></article>`;
}

function readDefinitionImage(selector: string): Promise<string | undefined> {
  const file = document.querySelector<HTMLInputElement>(selector)?.files?.[0]; if (!file) return Promise.resolve(undefined); if (file.size > 1_500_000) return Promise.reject(new Error("A imagem deve ter no maximo 1,5 MB."));
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined); reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem.")); reader.readAsDataURL(file); });
}

export function renderCombatModifiers(item: ItemDefinition): string {
  const modifiers = item.combatModifiers;
  if (!modifiers || !Object.keys(modifiers).length) return "";
  const labels: Record<keyof NonNullable<ItemDefinition["combatModifiers"]>, string> = { armor: "Armadura", evasion: "Evasão", minor: "Limiar menor", major: "Limiar maior" };
  return `<div class="trait-list item-combat-summary">${Object.entries(modifiers).map(([key, value]) => `<span>${labels[key as keyof typeof labels]} ${value >= 0 ? "+" : ""}${value}</span>`).join("")}</div>`;
}
