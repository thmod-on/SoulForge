import type { Catalog } from "../../domain/catalog";
import { renderItemCardBody } from "../inventory/renderItemCard";
import type { Character, ItemDefinition, ItemDerivedDefenseModifier } from "../../domain/types";
import type { ItemPersonalOverride } from "../../storage/compendiumRepository";
import { readLocalImage } from "../../app/media";
import type { InventoryFilter } from "../../app/types";
import { getItemTierFilterOptions, matchesItemTierFilter } from "../items/itemTierFilters";
import { createItemPersonalOverride, getStaleItemOverrideFields, rebaseItemPersonalOverride } from "../items/itemPersonalOverrides";
import { describeDerivedDefenseModifier, sumDerivedDefense } from "../items/derivedDefense";

export type ItemFeatureState = {
  compendiumItemSearch: string;
  compendiumItemFilter: InventoryFilter;
  compendiumItemTierFilter: string;
  itemDefinitionModalOpen: boolean;
  editingCompendiumItemId?: string;
  duplicatingCompendiumItemId?: string;
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
  itemPersonalOverrides: ItemPersonalOverride[];
  getCanonicalItem: (definitionId: string) => ItemDefinition | undefined;
  saveItemPersonalOverride: (override: ItemPersonalOverride) => Promise<void>;
  deleteItemPersonalOverride: (overrideId: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: (options?: { preserveMainScroll?: boolean }) => void;
};

export function handleCompendiumItemAction(target: HTMLElement, dependencies: ItemFeatureDependencies): boolean {
  const { state, render } = dependencies;
  const edit = target.closest<HTMLElement>('[data-action="edit-compendium-item"]');
  if (edit) { state.itemDefinitionModalOpen = true; state.editingCompendiumItemId = edit.dataset.itemId; state.duplicatingCompendiumItemId = undefined; render(); return true; }
  const duplicate = target.closest<HTMLElement>('[data-action="duplicate-compendium-item"]');
  if (duplicate) { state.itemDefinitionModalOpen = true; state.editingCompendiumItemId = undefined; state.duplicatingCompendiumItemId = duplicate.dataset.itemId; render(); return true; }
  if (target.closest('[data-action="add-item-derived-modifier"]')) { addItemDerivedModifierRow(); return true; }
  if (target.closest('[data-action="remove-item-derived-modifier"]')) { removeItemDerivedModifierRow(target); return true; }
  const restore = target.closest<HTMLElement>('[data-action="restore-item-personal-override"]');
  if (restore?.dataset.itemId) { void restoreItemPersonalOverride(restore.dataset.itemId, dependencies); return true; }
  const keep = target.closest<HTMLElement>('[data-action="keep-item-personal-override"]');
  if (keep?.dataset.itemId) { void keepItemPersonalOverride(keep.dataset.itemId, dependencies); return true; }
  if (target.closest('[data-action="save-compendium-item"]')) { void saveCompendiumItem(dependencies); return true; }
  const remove = target.closest<HTMLElement>('[data-action="delete-compendium-item"]');
  if (remove) { state.deletingCompendiumItemId = remove.dataset.itemId; render(); return true; }
  if (target.closest('[data-action="cancel-delete-compendium-item"]')) { state.deletingCompendiumItemId = undefined; render(); return true; }
  if (target.closest('[data-action="confirm-delete-compendium-item"]')) { void removeCompendiumItem(dependencies); return true; }
  const preview = target.closest<HTMLElement>("[data-compendium-item-preview-id]");
  if (preview) { state.compendiumItemPreviewId = preview.dataset.compendiumItemPreviewId; render({ preserveMainScroll: true }); return true; }
  return false;
}

export function renderCompendiumItemsManager(dependencies: ItemFeatureDependencies): string {
  const { state, itemFilterLabels, escapeHtml, renderEmptyInline } = dependencies;
  const items = getFilteredItems(dependencies);
  const tierOptions = getItemTierFilterOptions(dependencies.catalog.items);
    return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Itens</h1><span class="compendium-index-count">${dependencies.catalog.items.length} ${dependencies.catalog.items.length === 1 ? "item" : "itens"}</span></div><p>Crie e organize os itens que poderao ser usados nos inventarios.</p></div><div class="compendium-index-heading-actions"><button class="sf-action sf-action--primary primary-action" type="button" data-action="new-compendium-item">Novo item</button><button class="sf-action sf-action--secondary secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button></div></div><section class="compendium-book-index compendium-item-index"><label class="sf-search-field search-box compendium-index-search"><span>BUSCA</span><input type="search" placeholder="Procurar item..." aria-label="Procurar item" data-compendium-item-search value="${escapeHtml(state.compendiumItemSearch)}" /></label><div class="compendium-dynamic" data-compendium-dynamic><div class="compendium-filter-block"><span>Categoria</span><div class="filter-row compendium-filter-row">${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip sf-filter-option ${state.compendiumItemFilter === category ? "is-active" : ""}" type="button" data-compendium-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}</div><span>Nível</span><div class="filter-row compendium-filter-row">${tierOptions.map((option) => `<button class="chip sf-filter-option ${state.compendiumItemTierFilter === option.value ? "is-active" : ""}" type="button" data-compendium-item-tier-filter="${option.value}">${option.label}</button>`).join("")}</div></div><div class="compendium-results-heading"><strong>${items.length}</strong><span>${items.length === 1 ? "item encontrado" : "itens encontrados"}</span></div>${items.length ? `<div class="item-grid compendium-item-results">${items.map((item) => renderItemResult(item, dependencies)).join("")}</div>` : renderEmptyInline("Nenhum item encontrado com os filtros atuais.")}</div></section></main>`;
}

export function renderCompendiumItemFormModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, itemFilterLabels, escapeHtml } = dependencies;
  if (!state.itemDefinitionModalOpen) return "";
  const editingItem = state.editingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.editingCompendiumItemId) : undefined;
  const item = editingItem ?? (state.duplicatingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.duplicatingCompendiumItemId) : undefined);
  const isPersonal = Boolean(editingItem && editingItem.packId !== "local");
  const categories = Object.keys(itemFilterLabels).filter((key) => key !== "todos") as ItemDefinition["category"][];
  const locked = isPersonal ? "disabled" : "";
  const derived = (item?.derivedDefenseModifiers ?? []).map((modifier) => renderDerivedModifierRow(modifier, escapeHtml)).join("");
  const modeCopy = isPersonal ? "O Pack permanece inalterado. Este ajuste pertence ao seu perfil e sincroniza entre seus dispositivos." : state.duplicatingCompendiumItemId ? "Uma cópia independente será criada como conteúdo customizado." : "O item será salvo como conteúdo customizado.";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="form-modal item-form-modal compendium-form-modal" role="dialog" aria-modal="true" aria-labelledby="item-form-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><header class="compendium-form-header"><h2 id="item-form-modal-title">${isPersonal ? "Ajustar para mim" : item ? state.duplicatingCompendiumItemId ? "Duplicar item" : "Editar item" : "Novo item"}</h2><p>${modeCopy}</p></header><div class="compendium-form-body"><div class="form-grid"><label class="form-field"><span>Nome *</span><input data-compendium-item-name value="${escapeHtml(item?.name ?? "")}" ${locked} /></label><label class="form-field"><span>Categoria *</span><select data-compendium-item-category ${locked}>${categories.map((category) => `<option value="${category}" ${category === item?.category ? "selected" : ""}>${itemFilterLabels[category]}</option>`).join("")}</select></label><label class="form-field"><span>Tier</span><input data-compendium-item-tier type="number" min="1" max="4" value="${item?.tier ?? ""}" ${locked} /></label><label class="form-field"><span>Peso *</span><input data-compendium-item-weight type="number" min="0" step="0.1" value="${item?.weight ?? ""}" ${locked} /></label><label class="form-field"><span>Valor</span><input data-compendium-item-value type="number" min="0" step="1" value="${item?.value ?? ""}" ${locked} /></label><label class="form-field"><span>Propriedades</span><input data-compendium-item-traits value="${escapeHtml((item?.traits ?? []).join(", "))}" ${locked} /></label></div><fieldset class="item-combat-modifiers"><legend>Valores fixos enquanto equipado</legend><p>Estes valores são somados antes das parcelas derivadas.</p><div class="form-grid">${(["armor", "evasion", "minor", "major"] as const).map((field) => `<label class="form-field"><span>${({ armor: "Armadura", evasion: "Evasão", minor: "Limiar menor", major: "Limiar maior" })[field]}</span><input data-compendium-item-modifier-${field} type="number" step="1" value="${item?.combatModifiers?.[field] ?? ""}" /></label>`).join("")}</div></fieldset><fieldset class="item-derived-modifiers"><legend>Valores derivados</legend><p>Somente origens estruturadas são aceitas; nenhuma descrição é interpretada automaticamente.</p><div data-item-derived-list>${derived}</div><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="add-item-derived-modifier">Adicionar valor derivado</button></fieldset><label class="form-field"><span>Imagem</span><input data-compendium-item-image type="file" accept="image/png,image/jpeg,image/webp" /><small>${item?.image ? "Uma imagem já está associada; envie outra para substituí-la." : "PNG, JPG ou WebP; até 1,5 MB."}</small></label>${item?.image ? '<label class="form-field item-image-remove"><span><input type="checkbox" data-compendium-item-remove-image /> Remover imagem atual</span></label>' : ""}<label class="form-field"><span>Descrição *</span><textarea data-compendium-item-summary>${escapeHtml(item?.summary ?? "")}</textarea></label></div><footer class="compendium-form-footer"><p class="form-error" data-compendium-item-error hidden></p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="save-compendium-item">Salvar</button></div></footer></section></div>`;
}

export function renderDeleteCompendiumItemModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  const item = state.deletingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.deletingCompendiumItemId) : undefined;
  if (!item) return "";
  const isInInventory = state.character?.inventory.entries.some((entry) => entry.definitionId === item.id);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-compendium-item-title"><button class="modal-close" type="button" data-action="cancel-delete-compendium-item" aria-label="Cancelar exclusão">×</button><span class="resource-modal-label">Compendium</span><h2 id="delete-compendium-item-title">Excluir item?</h2><p>O item <strong>${escapeHtml(item.name)}</strong> ${isInInventory ? "está presente no inventário atual." : "será removido deste dispositivo."}</p><div class="danger-summary"><strong>!</strong><span>${isInInventory ? "Remova o item do inventário antes de excluí-lo." : "Esta ação não pode ser desfeita."}</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-compendium-item">Cancelar</button>${isInInventory ? "" : '<button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-compendium-item">Excluir item</button>'}</div></section></div>`;
}

export function renderCompendiumItemPreviewModal(dependencies: ItemFeatureDependencies): string {
  const { state, catalog, itemFilterLabels, escapeHtml, renderItemVisual } = dependencies;
  const item = state.compendiumItemPreviewId ? catalog.items.find((entry) => entry.id === state.compendiumItemPreviewId) : undefined;
  if (!item) return "";
  const override = dependencies.itemPersonalOverrides?.find((entry) => entry.definitionId === item.id);
  const canonical = dependencies.getCanonicalItem?.(item.id);
  const stale = override && canonical ? getStaleItemOverrideFields(canonical, override) : [];
  const personalStatus = override ? `<aside class="item-personal-status ${stale.length ? "is-stale" : ""}"><strong>${stale.length ? "Revisão necessária" : "Ajuste pessoal"}</strong><span>${stale.length ? `O Pack alterou ${stale.length} campo(s) também ajustado(s) por você.` : "Este item usa valores do seu perfil."}</span>${canonical ? renderOverrideComparison(canonical, item, override, escapeHtml) : ""}${stale.length ? `<button class="sf-action sf-action--secondary sf-action--compact" data-action="keep-item-personal-override" data-item-id="${escapeHtml(item.id)}">Manter meu ajuste</button>` : ""}<button class="sf-action sf-action--secondary sf-action--compact" data-action="restore-item-personal-override" data-item-id="${escapeHtml(item.id)}">Restaurar padrão do Pack</button></aside>` : "";
  const unavailableSpellcast = state.character ? sumDerivedDefense(item.derivedDefenseModifiers, state.character, catalog).unavailableSpellcast : false;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="item-modal compendium-item-preview" role="dialog" aria-modal="true" aria-labelledby="compendium-item-preview-title"><button class="modal-close" data-modal-close aria-label="Fechar item">x</button><div class="item-modal-art">${renderItemVisual(item, "detail")}</div><div class="item-modal-body"><span class="resource-modal-label">${itemFilterLabels[item.category]}${override ? " · Ajuste pessoal" : ""}</span><h2 id="compendium-item-preview-title">${escapeHtml(item.name)}</h2><p>${escapeHtml(item.summary)}</p>${personalStatus}<dl class="detail-list item-modal-details"><div><dt>Tier</dt><dd>${item.tier ?? "-"}</dd></div><div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${item.weight}</dd></div></dl>${renderWeaponProfile(item, escapeHtml)}<div class="trait-list">${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${renderCombatModifiers(item)}${renderDerivedCombatModifiers(item, escapeHtml)}${unavailableSpellcast ? '<p class="item-derived-warning">Conjuração indisponível; bônus não aplicado.</p>' : ""}</div></section></div>`;
}

export async function saveCompendiumItem(dependencies: ItemFeatureDependencies): Promise<void> {
  const { state, catalog, saveCustomDefinition, refreshCatalog, render } = dependencies;
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? "";
  const name = value("[data-compendium-item-name]"); const category = value("[data-compendium-item-category]") as ItemDefinition["category"]; const tierText = value("[data-compendium-item-tier]"); const weight = Number(value("[data-compendium-item-weight]")); const valueText = value("[data-compendium-item-value]"); const summary = value("[data-compendium-item-summary]"); const traits = value("[data-compendium-item-traits]").split(",").map((trait) => trait.trim()).filter(Boolean); const error = document.querySelector<HTMLElement>("[data-compendium-item-error]");
  const existing = state.editingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.editingCompendiumItemId) : undefined;
  const source = existing ?? (state.duplicatingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.duplicatingCompendiumItemId) : undefined);
  const tier = tierText ? Number(tierText) : undefined; const itemValue = valueText ? Number(valueText) : undefined;
  const modifierValues = {
    armor: value("[data-compendium-item-modifier-armor]"),
    evasion: value("[data-compendium-item-modifier-evasion]"),
    minor: value("[data-compendium-item-modifier-minor]"),
    major: value("[data-compendium-item-modifier-major]")
  };
  const combatModifiers = Object.fromEntries(Object.entries(modifierValues).filter(([, modifier]) => modifier !== "").map(([key, modifier]) => [key, Number(modifier)]));
  const validModifiers = Object.values(combatModifiers).every(Number.isFinite);
  const derivedDefenseModifiers = readDerivedDefenseModifiers();
  const validCategory = ["arma", "armadura", "consumivel", "equipamento", "loot"].includes(category); const duplicate = catalog.items.some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && item.id !== existing?.id);
  if (!name || !validCategory || !Number.isFinite(weight) || weight < 0 || !summary || duplicate || !validModifiers || derivedDefenseModifiers instanceof Error || (tier !== undefined && (!Number.isInteger(tier) || tier < 1 || tier > 4)) || (itemValue !== undefined && (!Number.isFinite(itemValue) || itemValue < 0))) { if (error) { error.hidden = false; error.textContent = derivedDefenseModifiers instanceof Error ? derivedDefenseModifiers.message : duplicate ? "Ja existe um item com este nome." : !validModifiers ? "Os modificadores de combate devem ser números válidos." : "Preencha nome, categoria, peso e descricao. Tier deve ficar entre 1 e 4."; } return; }
  let image = document.querySelector<HTMLInputElement>("[data-compendium-item-remove-image]")?.checked ? undefined : source?.image;
  try { image = (await readDefinitionImage("[data-compendium-item-image]")) ?? image; } catch (imageError) { if (error) { error.hidden = false; error.textContent = imageError instanceof Error ? imageError.message : "Nao foi possivel usar a imagem."; } return; }
  const mechanics = { combatModifiers: Object.keys(combatModifiers).length ? combatModifiers : undefined, derivedDefenseModifiers: derivedDefenseModifiers.length ? derivedDefenseModifiers : undefined };
  if (existing && existing.packId !== "local") {
    const canonical = dependencies.getCanonicalItem(existing.id);
    const pack = catalog.packs.find((entry) => entry.id === existing.packId);
    if (!canonical || !pack) return;
    const previous = dependencies.itemPersonalOverrides.find((entry) => entry.definitionId === existing.id);
    const candidate = { ...canonical, summary, image, ...mechanics };
    const changes = buildOverrideChanges(canonical, candidate);
    if (Object.keys(changes).length) await dependencies.saveItemPersonalOverride(createItemPersonalOverride(canonical, pack, changes, previous));
    else if (previous) await dependencies.deleteItemPersonalOverride(previous.id);
  } else {
    await saveCustomDefinition({ ...(source ?? {}), id: existing?.id ?? `item.local.${crypto.randomUUID()}`, type: "item", packId: "local", name, summary, category, tier, weight, value: itemValue, traits: traits.length ? traits : undefined, ...mechanics, image });
  }
  await refreshCatalog(); state.itemDefinitionModalOpen = false; state.editingCompendiumItemId = undefined; state.duplicatingCompendiumItemId = undefined; render();
}

export async function restoreItemPersonalOverride(definitionId: string, dependencies: ItemFeatureDependencies): Promise<void> {
  const override = dependencies.itemPersonalOverrides.find((entry) => entry.definitionId === definitionId);
  if (!override) return;
  await dependencies.deleteItemPersonalOverride(override.id);
  await dependencies.refreshCatalog();
  dependencies.state.compendiumItemPreviewId = definitionId;
  dependencies.render();
}

export async function keepItemPersonalOverride(definitionId: string, dependencies: ItemFeatureDependencies): Promise<void> {
  const override = dependencies.itemPersonalOverrides.find((entry) => entry.definitionId === definitionId);
  const item = dependencies.getCanonicalItem(definitionId);
  const pack = item ? dependencies.catalog.packs.find((entry) => entry.id === item.packId) : undefined;
  if (!override || !item || !pack) return;
  await dependencies.saveItemPersonalOverride(rebaseItemPersonalOverride(item, pack, override));
  await dependencies.refreshCatalog(); dependencies.render();
}

export function addItemDerivedModifierRow(): void {
  document.querySelector<HTMLElement>("[data-item-derived-list]")?.insertAdjacentHTML("beforeend", renderDerivedModifierRow(undefined, escapeAttribute));
}

export function removeItemDerivedModifierRow(target: HTMLElement): void {
  target.closest("[data-item-derived-row]")?.remove();
}

export function updateItemDerivedModifierPreview(target: HTMLElement): void {
  const row = target.closest<HTMLElement>("[data-item-derived-row]");
  const output = row?.querySelector<HTMLOutputElement>("output");
  if (!row || !output) return;
  const value = (selector: string) => row.querySelector<HTMLInputElement | HTMLSelectElement>(selector)?.value ?? "";
  const sourceKind = value("[data-item-derived-source]");
  const modifier: ItemDerivedDefenseModifier = {
    field: value("[data-item-derived-field]") as ItemDerivedDefenseModifier["field"],
    source: sourceKind === "attribute" ? { kind: "attribute", attributeId: value("[data-item-derived-attribute]") as "for" | "dex" | "con" | "int" | "wil" | "cha" } : { kind: sourceKind as "spellcast-attribute" | "character-level" | "character-tier" },
    multiplier: Number(value("[data-item-derived-multiplier]")), divisor: Number(value("[data-item-derived-divisor]")), rounding: value("[data-item-derived-rounding]") as ItemDerivedDefenseModifier["rounding"]
  };
  output.textContent = describeDerivedDefenseModifier(modifier);
}

export async function removeCompendiumItem(dependencies: ItemFeatureDependencies): Promise<void> {
  const { state, catalog, deleteCustomDefinition, refreshCatalog, render } = dependencies;
  const item = state.deletingCompendiumItemId ? catalog.items.find((entry) => entry.id === state.deletingCompendiumItemId) : undefined;
  if (!item || item.packId !== "local" || state.character?.inventory.entries.some((entry) => entry.definitionId === item.id)) return;
  await deleteCustomDefinition(item.id); await refreshCatalog(); state.deletingCompendiumItemId = undefined; render();
}

function getFilteredItems(dependencies: ItemFeatureDependencies): ItemDefinition[] {
  const { state, catalog, itemFilterLabels } = dependencies; const search = state.compendiumItemSearch.trim().toLowerCase();
  return catalog.items.filter((item) => (state.compendiumItemFilter === "todos" || item.category === state.compendiumItemFilter) && matchesItemTierFilter(item, state.compendiumItemTierFilter) && (!search || [item.name, item.summary, itemFilterLabels[item.category], item.tier ?? "", item.weight, item.value ?? "", ...(item.traits ?? [])].join(" ").toLowerCase().includes(search)));
}

function renderItemResult(item: ItemDefinition, dependencies: ItemFeatureDependencies): string {
  const { escapeHtml, itemFilterLabels } = dependencies;
  const adjusted = dependencies.itemPersonalOverrides?.some((entry) => entry.definitionId === item.id) ?? false;
  return `<article class="compendium-item-result"><button class="item-tile inventory-art-card compendium-item-tile" type="button" data-compendium-item-preview-id="${item.id}" aria-label="Ver detalhes de ${escapeHtml(item.name)}">${renderItemCardBody(item, { categoryLabel: itemFilterLabels[item.category] }, escapeHtml)}</button><div class="compendium-card-result-actions">${item.packId === "local" ? `<button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="edit-compendium-item" data-item-id="${item.id}">Editar</button><button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="delete-compendium-item" data-item-id="${item.id}">Excluir</button>` : `<span class="readonly-label">${adjusted ? "Ajuste pessoal" : "Conteúdo do Pack"}</span><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="edit-compendium-item" data-item-id="${item.id}">Ajustar para mim</button><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="duplicate-compendium-item" data-item-id="${item.id}">Duplicar</button>`}</div></article>`;
}

function readDefinitionImage(selector: string): Promise<string | undefined> {
  return readLocalImage(document.querySelector<HTMLInputElement>(selector)?.files?.[0]);
}

export function renderCombatModifiers(item: ItemDefinition): string {
  const modifiers = item.combatModifiers;
  if (!modifiers || !Object.keys(modifiers).length) return "";
  const labels: Record<keyof NonNullable<ItemDefinition["combatModifiers"]>, string> = { armor: "Armadura", evasion: "Evasão", minor: "Limiar menor", major: "Limiar maior" };
  return `<div class="trait-list item-combat-summary">${Object.entries(modifiers).map(([key, value]) => `<span>${labels[key as keyof typeof labels]} ${value >= 0 ? "+" : ""}${value}</span>`).join("")}</div>`;
}

export function renderDerivedCombatModifiers(item: ItemDefinition, escapeHtml: (value: string) => string): string {
  if (!item.derivedDefenseModifiers?.length) return "";
  return `<div class="trait-list item-derived-summary">${item.derivedDefenseModifiers.map((modifier) => `<span>${escapeHtml(describeDerivedDefenseModifier(modifier))}</span>`).join("")}</div>`;
}

export function renderWeaponProfile(item: ItemDefinition, escapeHtml: (value: string) => string): string {
  const profile = item.weaponProfile;
  if (!profile) return "";
  const attackTrait = { dex: "Agilidade", for: "Força", cha: "Finesse", wil: "Instinto", con: "Presença", int: "Conhecimento", conjuracao: "Conjuração" }[profile.attackTrait];
  const range = { "corpo-a-corpo": "Corpo a corpo", "muito-proximo": "Muito próximo", proximo: "Próximo", longe: "Longe", "muito-longe": "Muito longe" }[profile.range];
  const damageType = { fisico: "Físico", magico: "Mágico", "fisico-ou-magico": "Físico ou mágico" }[profile.damageType];
  const category = profile.category === "primaria" ? "Arma primária" : "Arma secundária";
  return `<section class="item-weapon-profile" aria-label="Perfil de combate"><div class="item-weapon-profile-heading"><span>Perfil de arma</span><small>${category}</small></div><div class="item-weapon-damage"><span>Dano</span><strong>${escapeHtml(profile.damage)}</strong><small>${damageType}</small></div><dl class="detail-list item-weapon-details"><div><dt>Teste</dt><dd>${attackTrait}</dd></div><div><dt>Alcance</dt><dd>${range}</dd></div><div><dt>Empunhadura</dt><dd>${profile.burden === 1 ? "Uma mão" : "Duas mãos"}</dd></div></dl></section>`;
}

function renderDerivedModifierRow(modifier: ItemDerivedDefenseModifier | undefined, escapeHtml: (value: string) => string): string {
  const sourceKind = modifier?.source.kind ?? "spellcast-attribute";
  const attributeId = modifier?.source.kind === "attribute" ? modifier.source.attributeId : "int";
  const option = (value: string, label: string, selected: string) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
  return `<div class="item-derived-row" data-item-derived-row><div class="form-grid"><label class="form-field"><span>Campo</span><select data-item-derived-field>${option("armor", "Armadura", modifier?.field ?? "minor")}${option("evasion", "Evasão", modifier?.field ?? "minor")}${option("minor", "Limiar menor", modifier?.field ?? "minor")}${option("major", "Limiar maior", modifier?.field ?? "minor")}</select></label><label class="form-field"><span>Origem</span><select data-item-derived-source>${option("spellcast-attribute", "Conjuração", sourceKind)}${option("attribute", "Atributo", sourceKind)}${option("character-level", "Nível", sourceKind)}${option("character-tier", "Tier", sourceKind)}</select></label><label class="form-field"><span>Atributo</span><select data-item-derived-attribute>${([ ["dex", "Agilidade"], ["for", "Força"], ["cha", "Finesse"], ["wil", "Instinto"], ["con", "Presença"], ["int", "Conhecimento"] ] as const).map(([value, label]) => option(value, label, attributeId)).join("")}</select></label><label class="form-field"><span>Multiplicador</span><input data-item-derived-multiplier type="number" step="0.1" value="${modifier?.multiplier ?? 1}" /></label><label class="form-field"><span>Divisor</span><input data-item-derived-divisor type="number" min="0.01" step="0.1" value="${modifier?.divisor ?? 1}" /></label><label class="form-field"><span>Arredondamento</span><select data-item-derived-rounding>${option("ceil", "Para cima", modifier?.rounding ?? "ceil")}${option("floor", "Para baixo", modifier?.rounding ?? "ceil")}${option("round", "Mais próximo", modifier?.rounding ?? "ceil")}</select></label></div><output>${escapeHtml(modifier ? describeDerivedDefenseModifier(modifier) : "Limiar menor: Conjuração (ceil)")}</output><button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="remove-item-derived-modifier">Remover</button></div>`;
}

function readDerivedDefenseModifiers(): ItemDerivedDefenseModifier[] | Error {
  const result: ItemDerivedDefenseModifier[] = [];
  for (const row of document.querySelectorAll<HTMLElement>("[data-item-derived-row]")) {
    const value = (selector: string) => row.querySelector<HTMLInputElement | HTMLSelectElement>(selector)?.value ?? "";
    const field = value("[data-item-derived-field]") as ItemDerivedDefenseModifier["field"];
    const sourceKind = value("[data-item-derived-source]");
    const multiplier = Number(value("[data-item-derived-multiplier]"));
    const divisor = Number(value("[data-item-derived-divisor]"));
    const rounding = value("[data-item-derived-rounding]") as ItemDerivedDefenseModifier["rounding"];
    if (!["armor", "evasion", "minor", "major"].includes(field) || !Number.isFinite(multiplier) || !Number.isFinite(divisor) || divisor <= 0 || !["ceil", "floor", "round"].includes(rounding ?? "")) return new Error("Revise campo, coeficientes e arredondamento dos valores derivados.");
    const source = sourceKind === "attribute" ? { kind: "attribute" as const, attributeId: value("[data-item-derived-attribute]") as "for" | "dex" | "con" | "int" | "wil" | "cha" }
      : sourceKind === "spellcast-attribute" || sourceKind === "character-level" || sourceKind === "character-tier" ? { kind: sourceKind } as ItemDerivedDefenseModifier["source"] : undefined;
    if (!source || source.kind === "attribute" && !["for", "dex", "con", "int", "wil", "cha"].includes(source.attributeId)) return new Error("Selecione uma origem válida para cada valor derivado.");
    result.push({ field, source, multiplier, divisor, rounding });
  }
  return result;
}

function buildOverrideChanges(canonical: ItemDefinition, candidate: ItemDefinition): import("../../storage/compendiumRepository").ItemOverrideValues {
  const changes: import("../../storage/compendiumRepository").ItemOverrideValues = {};
  for (const field of ["summary", "image", "combatModifiers", "derivedDefenseModifiers", "armorProfile"] as const) {
    if (JSON.stringify(canonical[field] ?? null) !== JSON.stringify(candidate[field] ?? null)) Object.assign(changes, { [field]: structuredClone(candidate[field]) ?? null });
  }
  return changes;
}

function renderOverrideComparison(canonical: ItemDefinition, adjusted: ItemDefinition, override: ItemPersonalOverride, escapeHtml: (value: string) => string): string {
  const labels = { summary: "Descrição", image: "Imagem", combatModifiers: "Valores fixos", derivedDefenseModifiers: "Valores derivados", armorProfile: "Perfil de armadura" } as const;
  const rows = (Object.keys(override.changes) as Array<keyof typeof labels>).filter((field) => field in labels).map((field) => {
    const format = (value: unknown) => typeof value === "string" ? value : value == null ? "Sem valor" : JSON.stringify(value);
    return `<div><dt>${labels[field]}</dt><dd><small>Pack</small>${escapeHtml(format(canonical[field]))}<small>Meu ajuste</small>${escapeHtml(format(adjusted[field]))}</dd></div>`;
  }).join("");
  return rows ? `<dl class="item-override-comparison">${rows}</dl>` : "";
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
