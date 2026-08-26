import type { Catalog } from "../../domain/catalog";
import type { DomainDefinition } from "../../domain/types";

export type DomainFeatureState = {
  domainModalOpen: boolean;
  editingDomainId?: string;
  deletingDomainId?: string;
};

export type DomainFeatureDependencies = {
  state: DomainFeatureState;
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  getPackOriginName: (packId: string) => string;
  saveCustomDefinition: (definition: DomainDefinition) => Promise<void>;
  deleteCustomDefinition: (definitionId: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: () => void;
};

export function renderCompendiumDomainsManager(dependencies: DomainFeatureDependencies): string {
  const { catalog } = dependencies;
  const sortedDomains = [...catalog.domains].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Dominios</h1><span class="compendium-index-count">${sortedDomains.length} ${sortedDomains.length === 1 ? "dominio" : "dominios"}</span></div><p>Organize as vertentes que classificam as cartas do seu Compendium.</p></div><div class="compendium-index-heading-actions"><button class="sf-action sf-action--primary primary-action" type="button" data-action="new-compendium-domain">Novo dominio</button><button class="sf-action sf-action--secondary secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button></div></div><section class="compendium-book-index">${sortedDomains.length ? `<div class="compendium-domain-results">${sortedDomains.map((domain) => renderCompendiumDomainResult(domain, dependencies)).join("")}</div>` : '<div class="empty-state"><h2>Nenhum dominio cadastrado</h2><p>Crie um dominio para classificar cartas no Compendium.</p></div>'}</section></main>`;
}

export function renderDomainModal(dependencies: DomainFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  if (!state.domainModalOpen) return "";
  const existing = state.editingDomainId ? catalog.domains.find((domain) => domain.id === state.editingDomainId) : undefined;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="form-modal" role="dialog" aria-modal="true" aria-labelledby="domain-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar dominio">x</button><span class="resource-modal-label">Compendium</span><h2 id="domain-modal-title">${existing ? "Editar dominio" : "Novo dominio"}</h2><p>O dominio sera oferecido como classificacao obrigatoria ao criar cartas.</p><label class="form-field"><span>Nome *</span><input data-domain-name value="${escapeHtml(existing?.name ?? "")}" placeholder="Ex.: Arcano" /></label><label class="form-field"><span>Descricao *</span><textarea data-domain-summary placeholder="Explique a proposta deste dominio.">${escapeHtml(existing?.summary ?? "")}</textarea></label><label class="form-field form-color-field"><span>Cor de identidade</span><input data-domain-color type="color" value="${escapeHtml(existing?.color ?? "#8e4fc4")}" /></label><p class="form-error" data-domain-error hidden></p><div class="modal-actions icon-modal-actions"><button class="sf-action sf-action--secondary secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="sf-action sf-action--primary primary-action icon-action" type="button" data-action="save-compendium-domain" aria-label="Gravar dominio" title="Gravar dominio">🪶</button></div></section></div>`;
}

export function renderDeleteDomainModal(dependencies: DomainFeatureDependencies): string {
  const { state, catalog, escapeHtml } = dependencies;
  const domain = state.deletingDomainId ? catalog.domains.find((entry) => entry.id === state.deletingDomainId) : undefined;
  if (!domain) return "";
  const linkedCards = catalog.cards.filter((card) => card.domainId === domain.id).length;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-domain-title"><h2 id="delete-domain-title">Excluir dominio?</h2><p>${linkedCards ? `O dominio <strong>${escapeHtml(domain.name)}</strong> possui ${linkedCards} ${linkedCards === 1 ? "carta vinculada" : "cartas vinculadas"} e nao pode ser excluido antes de transferi-las.` : `O dominio <strong>${escapeHtml(domain.name)}</strong> sera removido deste dispositivo.`}</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-domain">Cancelar</button>${linkedCards ? "" : '<button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-domain">Excluir dominio</button>'}</div></section></div>`;
}

export async function saveCompendiumDomain(dependencies: DomainFeatureDependencies): Promise<void> {
  const { state, catalog, saveCustomDefinition, refreshCatalog, render } = dependencies;
  const nameInput = document.querySelector<HTMLInputElement>("[data-domain-name]");
  const summaryInput = document.querySelector<HTMLTextAreaElement>("[data-domain-summary]");
  const colorInput = document.querySelector<HTMLInputElement>("[data-domain-color]");
  const name = nameInput?.value.trim() ?? "";
  const summary = summaryInput?.value.trim() ?? "";
  const color = colorInput?.value ?? "#8e4fc4";
  const error = document.querySelector<HTMLElement>("[data-domain-error]");
  const duplicate = catalog.domains.some((domain) => domain.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && domain.id !== state.editingDomainId);
  if (!name || !summary || duplicate) {
    if (error) { error.hidden = false; error.textContent = duplicate ? "Ja existe um dominio com este nome." : "Informe um nome e uma descricao para o dominio."; }
    nameInput?.classList.toggle("is-invalid", !name || duplicate);
    summaryInput?.classList.toggle("is-invalid", !summary);
    (!name || duplicate ? nameInput : summaryInput)?.focus();
    return;
  }
  const existing = state.editingDomainId ? catalog.domains.find((domain) => domain.id === state.editingDomainId) : undefined;
  if (existing && existing.packId !== "local") return;
  await saveCustomDefinition({ id: existing?.id ?? `domain.local.${crypto.randomUUID()}`, type: "domain", packId: "local", name, summary, color });
  await refreshCatalog();
  state.domainModalOpen = false;
  state.editingDomainId = undefined;
  render();
}

export async function removeCompendiumDomain(dependencies: DomainFeatureDependencies): Promise<void> {
  const { state, catalog, deleteCustomDefinition, refreshCatalog, render } = dependencies;
  const domain = state.deletingDomainId ? catalog.domains.find((entry) => entry.id === state.deletingDomainId) : undefined;
  if (!domain || domain.packId !== "local" || catalog.cards.some((card) => card.domainId === domain.id)) return;
  await deleteCustomDefinition(domain.id);
  await refreshCatalog();
  state.deletingDomainId = undefined;
  render();
}

function renderCompendiumDomainResult(domain: DomainDefinition, dependencies: DomainFeatureDependencies): string {
  const { catalog, escapeHtml, getPackOriginName } = dependencies;
  const linkedCards = catalog.cards.filter((card) => card.domainId === domain.id).length;
  const isLocal = domain.packId === "local";
  const sourceLabel = isLocal ? "Local" : getPackOriginName(domain.packId);
  return `<article class="compendium-domain-result" style="--domain-color: ${escapeHtml(domain.color)}"><div class="compendium-domain-swatch" aria-hidden="true"></div><div><div class="compendium-domain-result-meta"><span>${escapeHtml(sourceLabel)}</span></div><h2>${escapeHtml(domain.name)}</h2><span class="compendium-domain-card-count">${linkedCards} ${linkedCards === 1 ? "carta" : "cartas"}</span><p>${escapeHtml(domain.summary || "Sem descricao.")}</p></div><div class="compendium-card-result-actions">${isLocal ? `<button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="edit-compendium-domain" data-domain-id="${domain.id}">Editar</button><button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="delete-compendium-domain" data-domain-id="${domain.id}">Excluir</button>` : '<span class="readonly-label">Conteúdo não editável</span>'}</div></article>`;
}
