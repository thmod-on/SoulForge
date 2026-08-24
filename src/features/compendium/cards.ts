import type { Catalog } from "../../domain/catalog";
import type { CardDefinition, Character, GameMarkerDefinition } from "../../domain/types";
import { readGameMarker, renderGameMarkerFields } from "./gameMarkerForm";

export type CardFeatureState = {
  compendiumCardSearch: string;
  compendiumDomainFilter: string;
  compendiumTierFilter: string;
  cardModalOpen: boolean;
  editingCompendiumCardId?: string;
  deletingCompendiumCardId?: string;
  modalCardId?: string;
  character?: Character;
};

export type CardFeatureDependencies = {
  state: CardFeatureState;
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  renderEmptyInline: (message: string) => string;
  saveCustomDefinition: (definition: CardDefinition) => Promise<void>;
  saveCardMarkerOverride: (definitionId: string, gameMarkers: GameMarkerDefinition[]) => Promise<void>;
  deleteCustomDefinition: (definitionId: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: () => void;
};

export function renderCompendiumCardsManager(dependencies: CardFeatureDependencies): string {
  const { state, catalog, escapeHtml, renderEmptyInline } = dependencies;
  const filteredCards = getFilteredCompendiumCards(dependencies);
  const tiers = [...new Set(catalog.cards.map((card) => card.tier))].sort((a, b) => a - b);
  return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Cartas</h1><span class="compendium-index-count">${catalog.cards.length} ${catalog.cards.length === 1 ? "carta" : "cartas"}</span></div><p>Crie e organize cartas locais, sempre vinculadas a um dominio do Compendium.</p></div><div class="compendium-index-heading-actions"><button class="primary-action" type="button" data-action="new-compendium-card">Nova carta</button><button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button></div></div><section class="compendium-book-index compendium-card-index"><label class="search-box compendium-index-search"><span>BUSCA</span><input type="search" placeholder="Procurar carta..." aria-label="Procurar carta" data-compendium-card-search value="${escapeHtml(state.compendiumCardSearch)}" /></label><div class="compendium-index-filters"><div class="compendium-filter-block"><span>Dominio</span><div class="domain-strip compendium-filter-row"><button class="domain-chip ${state.compendiumDomainFilter === "todos" ? "is-active" : ""}" type="button" data-compendium-domain-filter="todos" style="--domain-color: #d99a3d">Todos</button>${catalog.domains.map((domain) => `<button class="domain-chip ${state.compendiumDomainFilter === domain.id ? "is-active" : ""}" type="button" data-compendium-domain-filter="${domain.id}" style="--domain-color: ${escapeHtml(domain.color)}">${escapeHtml(domain.name)}</button>`).join("")}</div></div><div class="compendium-filter-block"><span>Nível</span><div class="filter-row compendium-filter-row"><button class="chip ${state.compendiumTierFilter === "todos" ? "is-active" : ""}" type="button" data-compendium-tier-filter="todos">Todos</button>${tiers.map((tier) => `<button class="chip ${state.compendiumTierFilter === String(tier) ? "is-active" : ""}" type="button" data-compendium-tier-filter="${tier}">Nível ${tier}</button>`).join("")}</div></div></div><div class="compendium-results-heading"><strong>${filteredCards.length}</strong><span>${filteredCards.length === 1 ? "carta encontrada" : "cartas encontradas"}</span></div>${filteredCards.length ? `<div class="compendium-card-results">${filteredCards.map((card) => renderCompendiumCardResult(card, dependencies)).join("")}</div>` : renderEmptyInline("Nenhuma carta encontrada com os filtros atuais.")}</section></main>`;
}

export function renderCompendiumCardFormModal(dependencies: CardFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  if (!state.cardModalOpen) return "";
  const card = state.editingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.editingCompendiumCardId) : undefined;
  if (card && card.packId !== "local") {
    return `<div class="modal-backdrop" data-modal-backdrop><section class="form-modal card-form-modal" role="dialog" aria-modal="true" aria-labelledby="card-form-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar marcador">x</button><h2 id="card-form-modal-title">Complementar marcador</h2><p><strong>${escapeHtml(card.name)}</strong> pertence a um pack e permanece inalterada. Este complemento e salvo somente neste dispositivo.</p>${renderGameMarkerFields("pack-card", card.gameMarkers?.[0], escapeHtml)}<p class="form-error" data-compendium-card-error hidden></p><div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">â†©</button><button class="primary-action icon-action" type="button" data-action="save-pack-card-marker" aria-label="Salvar marcador" title="Salvar marcador">✒</button></div></section></div>`;
  }
  const domains = [...catalog.domains].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return `<div class="modal-backdrop" data-modal-backdrop><section class="form-modal card-form-modal" role="dialog" aria-modal="true" aria-labelledby="card-form-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar carta">x</button><h2 id="card-form-modal-title">${card ? "Editar carta" : "Nova carta"}</h2><p>A carta sera salva localmente e podera ser usada no catalogo do personagem futuramente.</p><div class="form-grid"><label class="form-field"><span>Nome *</span><input data-compendium-card-name value="${escapeHtml(card?.name ?? "")}" placeholder="Ex.: Passo Sombrio" /></label><label class="form-field"><span>Dominio *</span><select data-compendium-card-domain>${domains.map((domain) => `<option value="${domain.id}" ${domain.id === card?.domainId ? "selected" : ""}>${escapeHtml(domain.name)}</option>`).join("")}</select></label><label class="form-field"><span>Nível *</span><select data-compendium-card-tier>${[1, 2, 3, 4].map((tier) => `<option value="${tier}" ${tier === (card?.tier ?? 1) ? "selected" : ""}>Nível ${tier}</option>`).join("")}</select></label><label class="form-field"><span>Tipo *</span><select data-compendium-card-type>${(["acao", "reacao", "passiva"] as const).map((type) => `<option value="${type}" ${type === (card?.cardType ?? "acao") ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="form-field"><span>Custo de uso</span><input data-compendium-card-cost value="${escapeHtml(card?.cost ?? "")}" placeholder="Ex.: 1 Esperanca" /></label><label class="form-field"><span>Custo de recall</span><input data-compendium-card-recall-cost type="number" min="0" step="1" value="${card?.recallCost ?? 0}" /><small>Stress para trazer esta carta do Vault fora de um descanso.</small></label></div><label class="form-field"><span>Imagem</span><input data-compendium-card-image type="file" accept="image/png,image/jpeg,image/webp" /><small>${card?.image ? "Uma imagem ja esta associada; envie outra para substitui-la." : "PNG, JPG ou WebP; ate 1,5 MB."}</small></label><label class="form-field"><span>Efeito *</span><textarea data-compendium-card-effect placeholder="Descreva a regra e o efeito completo da carta.">${escapeHtml(card?.effect ?? "")}</textarea></label><p class="form-error" data-compendium-card-error hidden></p><div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="primary-action icon-action" type="button" data-action="save-compendium-card" aria-label="Gravar carta" title="Gravar carta">🪶</button></div></section></div>`;
}

export function renderDeleteCompendiumCardModal(dependencies: CardFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  const card = state.deletingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.deletingCompendiumCardId) : undefined;
  if (!card) return "";
  const isInDeck = state.character?.deck.learnedCardIds.includes(card.id) || state.character?.deck.activeCardIds.includes(card.id);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-card-title"><h2 id="delete-card-title">Excluir carta?</h2><p>${isInDeck ? `A carta <strong>${escapeHtml(card.name)}</strong> esta vinculada ao personagem atual e nao pode ser excluida antes de ser removida do deck.` : `A carta <strong>${escapeHtml(card.name)}</strong> sera removida deste dispositivo.`}</p><div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-compendium-card">Cancelar</button>${isInDeck ? "" : '<button class="danger-action" type="button" data-action="confirm-delete-compendium-card">Excluir carta</button>'}</div></section></div>`;
}

export function renderCardModal(cardId: string | undefined, dependencies: CardFeatureDependencies): string {
  const { catalog, escapeHtml } = dependencies;
  const card = cardId ? catalog.cards.find((entry) => entry.id === cardId) : undefined;
  if (!card) return "";
  const domain = catalog.domains.find((entry) => entry.id === card.domainId);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="card-modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar carta">x</button><div class="modal-card-art ${card.image ? "has-image" : ""}" ${card.image ? `style="background-image: url('${escapeHtml(card.image)}')"` : ""}></div><div class="modal-card-body"><div class="modal-card-kicker"><span>${escapeHtml(domain?.name ?? "Sem dominio")}</span><span>Nível ${card.tier}</span></div><h2 id="card-modal-title">${escapeHtml(card.name)}</h2><div class="modal-card-meta"><span>${escapeHtml(card.cardType)}</span><span>${escapeHtml(card.cost ?? "Sem custo")}</span><span>⚡ Recall: ${card.recallCost ?? 0} Stress</span></div><p>${escapeHtml(card.summary)}</p><h3>Efeito</h3><p>${escapeHtml(card.effect)}</p></div></section></div>`;
}

export async function saveCompendiumCard(dependencies: CardFeatureDependencies): Promise<void> {
  const { state, catalog, saveCustomDefinition, refreshCatalog, render } = dependencies;
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? "";
  const name = value("[data-compendium-card-name]");
  const domainId = value("[data-compendium-card-domain]");
  const tier = Number(value("[data-compendium-card-tier]"));
  const cardType = value("[data-compendium-card-type]") as CardDefinition["cardType"];
  const cost = value("[data-compendium-card-cost]");
  const recallCost = Number(value("[data-compendium-card-recall-cost]"));
  const effect = value("[data-compendium-card-effect]");
  const error = document.querySelector<HTMLElement>("[data-compendium-card-error]");
  const existing = state.editingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.editingCompendiumCardId) : undefined;
  const gameMarker = readGameMarker("card", existing?.gameMarkers?.[0]?.id);
  const duplicate = catalog.cards.some((card) => card.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && card.id !== existing?.id);
  if (!name || !domainId || !Number.isInteger(tier) || tier < 1 || !["acao", "reacao", "passiva"].includes(cardType) || !Number.isInteger(recallCost) || recallCost < 0 || !effect || duplicate) {
    if (error) { error.hidden = false; error.textContent = duplicate ? "Ja existe uma carta com este nome." : "Preencha nome, dominio, nível, tipo, custo de recall e efeito."; }
    return;
  }
  if (existing && existing.packId !== "local") return;
  if (gameMarker instanceof Error) { if (error) { error.hidden = false; error.textContent = gameMarker.message; } return; }
  let image = existing?.image;
  try { image = (await readDefinitionImage("[data-compendium-card-image]")) ?? image; } catch (imageError) { if (error) { error.hidden = false; error.textContent = imageError instanceof Error ? imageError.message : "Nao foi possivel usar a imagem."; } return; }
  await saveCustomDefinition({ id: existing?.id ?? `card.local.${crypto.randomUUID()}`, type: "card", packId: "local", name, summary: effect.length > 140 ? `${effect.slice(0, 137).trimEnd()}...` : effect, domainId, tier, cardType, cost: cost || undefined, recallCost, effect, image, ...(gameMarker ? { gameMarkers: [gameMarker] } : {}) });
  await refreshCatalog();
  state.cardModalOpen = false;
  state.editingCompendiumCardId = undefined;
  state.compendiumDomainFilter = domainId;
  render();
}

export async function savePackCardMarkerOverride(dependencies: CardFeatureDependencies): Promise<void> {
  const { state, catalog, saveCardMarkerOverride, refreshCatalog, render } = dependencies;
  const card = state.editingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.editingCompendiumCardId) : undefined;
  if (!card || card.packId === "local") return;
  const marker = readGameMarker("pack-card", card.gameMarkers?.[0]?.id);
  const error = document.querySelector<HTMLElement>("[data-compendium-card-error]");
  if (marker instanceof Error) { if (error) { error.hidden = false; error.textContent = marker.message; } return; }
  await saveCardMarkerOverride(card.id, marker ? [marker] : []);
  await refreshCatalog();
  state.cardModalOpen = false;
  state.editingCompendiumCardId = undefined;
  render();
}

export async function removeCompendiumCard(dependencies: CardFeatureDependencies): Promise<void> {
  const { state, catalog, deleteCustomDefinition, refreshCatalog, render } = dependencies;
  const card = state.deletingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.deletingCompendiumCardId) : undefined;
  const isInDeck = card && (state.character?.deck.learnedCardIds.includes(card.id) || state.character?.deck.activeCardIds.includes(card.id));
  if (!card || card.packId !== "local" || isInDeck) return;
  await deleteCustomDefinition(card.id);
  await refreshCatalog();
  state.deletingCompendiumCardId = undefined;
  if (state.compendiumDomainFilter === card.domainId) state.compendiumDomainFilter = "todos";
  render();
}

function getFilteredCompendiumCards(dependencies: CardFeatureDependencies): CardDefinition[] {
  const { state, catalog } = dependencies;
  const search = state.compendiumCardSearch.trim().toLowerCase();
  return catalog.cards.filter((card) => {
    const domain = catalog.domains.find((entry) => entry.id === card.domainId);
    const searchableText = [card.name, card.summary, card.effect, card.cardType, card.cost ?? "", domain?.name ?? ""].join(" ").toLowerCase();
    return (state.compendiumDomainFilter === "todos" || card.domainId === state.compendiumDomainFilter) && (state.compendiumTierFilter === "todos" || String(card.tier) === state.compendiumTierFilter) && (!search || searchableText.includes(search));
  });
}

function renderCompendiumCardResult(card: CardDefinition, dependencies: CardFeatureDependencies): string {
  const domain = dependencies.catalog.domains.find((entry) => entry.id === card.domainId);
  const isLocal = card.packId === "local";
  return `<article class="compendium-card-result"><button class="compendium-card-result-open" type="button" data-card-modal-id="${card.id}" aria-label="Ver detalhes de ${dependencies.escapeHtml(card.name)}"><span class="compendium-card-result-image ${card.image ? "has-image" : ""}" ${card.image ? `style="background-image: url('${dependencies.escapeHtml(card.image)}')"` : ""} aria-hidden="true"></span><div class="compendium-card-result-copy"><div class="compendium-card-result-kicker"><span style="--domain-color: ${dependencies.escapeHtml(domain?.color ?? "#d99a3d")}">${dependencies.escapeHtml(domain?.name ?? "Sem dominio")}</span><span>Nível ${card.tier}</span></div><h2>${dependencies.escapeHtml(card.name)}</h2><p>${dependencies.escapeHtml(card.summary)}</p></div><div class="compendium-card-result-meta"><span>${dependencies.escapeHtml(card.cardType)}</span><span>${dependencies.escapeHtml(card.cost ?? "Sem custo")}</span><span>⚡ Recall ${card.recallCost ?? 0}</span></div></button><div class="compendium-card-result-actions">${isLocal ? `<button type="button" data-action="edit-compendium-card" data-card-id="${card.id}">Editar</button><button type="button" data-action="delete-compendium-card" data-card-id="${card.id}">Excluir</button>` : `<span class="readonly-label">Conteudo do pack</span><button type="button" data-action="edit-pack-card-marker" data-card-id="${card.id}">${card.gameMarkers?.length ? "Editar marcador" : "Complementar marcador"}</button>`}</div></article>`;
}


function readDefinitionImage(selector: string): Promise<string | undefined> {
  const file = document.querySelector<HTMLInputElement>(selector)?.files?.[0];
  if (!file) return Promise.resolve(undefined);
  if (file.size > 1_500_000) return Promise.reject(new Error("A imagem deve ter no maximo 1,5 MB."));
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined); reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem.")); reader.readAsDataURL(file); });
}
