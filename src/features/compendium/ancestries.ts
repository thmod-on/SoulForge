import type { Catalog } from "../../domain/catalog";
import type { AncestryDefinition, FeatureDefinition } from "../../domain/types";
import { readFeatureAuthoringFields, renderFeatureAuthoringFields } from "./featureAuthoring";

export type AncestryFeatureState = { compendiumAncestrySearch: string; ancestryModalOpen: boolean; editingCompendiumAncestryId?: string; deletingCompendiumAncestryId?: string; compendiumAncestryPreviewId?: string };
export type AncestryFeatureDependencies = { state: AncestryFeatureState; catalog: Catalog; escapeHtml: (value: string) => string; renderEmptyInline: (message: string) => string; getPackDisplayName: (packId: string) => string; saveCustomDefinition: (definition: AncestryDefinition | FeatureDefinition) => Promise<void>; deleteCustomDefinition: (definitionId: string) => Promise<void>; refreshCatalog: () => Promise<void>; render: () => void };

export function renderCompendiumAncestriesManager(deps: AncestryFeatureDependencies): string {
  const search = deps.state.compendiumAncestrySearch.trim().toLocaleLowerCase("pt-BR");
  const entries = [...deps.catalog.ancestries].filter((entry) => !search || `${entry.name} ${entry.summary}`.toLocaleLowerCase("pt-BR").includes(search)).sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Ancestralidades</h1><span class="compendium-index-count">${deps.catalog.ancestries.length} ${deps.catalog.ancestries.length === 1 ? "ancestralidade" : "ancestralidades"}</span></div><p>Defina linhagens reutilizaveis e as duas features que cada uma concede.</p></div><div class="compendium-index-heading-actions"><button class="primary-action" type="button" data-action="new-compendium-ancestry">Nova ancestralidade</button><button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button></div></div><section class="compendium-book-index compendium-ancestry-index"><label class="search-box compendium-index-search"><span aria-hidden="true">⌕</span><input type="search" data-compendium-ancestry-search value="${deps.escapeHtml(deps.state.compendiumAncestrySearch)}" placeholder="Pesquisar ancestralidade" aria-label="Pesquisar ancestralidade" /></label>${entries.length ? `<div class="compendium-ancestry-results">${entries.map((entry) => renderAncestryResult(entry, deps)).join("")}</div>` : deps.renderEmptyInline(search ? "Nenhuma ancestralidade corresponde a esta pesquisa." : "Nenhuma ancestralidade cadastrada. Crie a primeira para disponibilizar suas Top e Bottom Features na criacao de personagens.")}</section></main>${renderCompendiumAncestryPreviewModal(deps)}`;
}

export function renderCompendiumAncestryPreviewModal(deps: AncestryFeatureDependencies): string {
  const ancestry = deps.state.compendiumAncestryPreviewId ? deps.catalog.ancestries.find((entry) => entry.id === deps.state.compendiumAncestryPreviewId) : undefined;
  if (!ancestry) return "";
  const top = feature(ancestry, "top", deps.catalog); const bottom = feature(ancestry, "bottom", deps.catalog);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="compendium-entry-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ancestry-detail-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar detalhes da ancestralidade">x</button><div class="compendium-entry-detail-art ${ancestry.image ? "has-image" : ""}" ${ancestry.image ? `style="background-image: url('${deps.escapeHtml(ancestry.image)}')"` : ""} aria-hidden="true">${ancestry.image ? "" : "✦"}</div><div class="compendium-entry-detail-body"><span class="resource-modal-label">Ancestralidade</span><h2 id="ancestry-detail-title">${deps.escapeHtml(ancestry.name)}</h2><p class="compendium-entry-detail-summary">${deps.escapeHtml(ancestry.summary)}</p><section class="compendium-entry-detail-section"><h3>Features de ancestralidade</h3><div class="compendium-entry-feature-grid">${renderAncestryFeatureDetail("Top Feature", top, deps)}${renderAncestryFeatureDetail("Bottom Feature", bottom, deps)}</div></section></div></section></div>`;
}

export function handleAncestryAction(target: HTMLElement, deps: AncestryFeatureDependencies): boolean {
  const preview = target.closest<HTMLElement>("[data-ancestry-preview-id]");
  if (!preview) return false;
  deps.state.compendiumAncestryPreviewId = preview.dataset.ancestryPreviewId;
  deps.render();
  return true;
}

export function renderCompendiumAncestryFormModal(deps: AncestryFeatureDependencies): string {
  if (!deps.state.ancestryModalOpen) return "";
  const ancestry = deps.state.editingCompendiumAncestryId ? deps.catalog.ancestries.find((entry) => entry.id === deps.state.editingCompendiumAncestryId) : undefined;
  const top = ancestry ? feature(ancestry, "top", deps.catalog) : undefined;
  const bottom = ancestry ? feature(ancestry, "bottom", deps.catalog) : undefined;
  return `<div class="modal-backdrop" data-modal-backdrop><form class="modal ancestry-form-modal" onsubmit="return false;" aria-labelledby="ancestry-form-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar">×</button><div class="modal-title"><span>Compendium</span><h2 id="ancestry-form-title">${ancestry ? "Editar ancestralidade" : "Nova ancestralidade"}</h2><p>As duas features ficam ordenadas para suportar escolhas unicas e mistas.</p></div><label class="form-field"><span>Nome</span><input data-ancestry-name required value="${deps.escapeHtml(ancestry?.name ?? "")}" /></label><label class="form-field"><span>Descricao</span><textarea data-ancestry-summary required>${deps.escapeHtml(ancestry?.summary ?? "")}</textarea></label><label class="form-field"><span>Imagem (opcional)</span><input data-ancestry-image type="file" accept="image/*" />${ancestry?.image ? "<small>A imagem atual sera mantida se nenhum arquivo for escolhido.</small>" : ""}</label>${featureFields("Top", top, "top", deps)}${featureFields("Bottom", bottom, "bottom", deps)}<p class="form-error" data-ancestry-error hidden></p><div class="modal-actions"><button class="secondary-action" type="button" data-modal-close>Cancelar</button><button class="primary-action" type="button" data-action="save-compendium-ancestry">Salvar ancestralidade</button></div></form></div>`;
}

export function renderDeleteCompendiumAncestryModal(deps: AncestryFeatureDependencies): string {
  const ancestry = deps.state.deletingCompendiumAncestryId ? deps.catalog.ancestries.find((entry) => entry.id === deps.state.deletingCompendiumAncestryId) : undefined;
  return ancestry ? `<div class="modal-backdrop" data-modal-backdrop><section class="modal confirm-modal"><h2>Excluir ancestralidade?</h2><p>"${deps.escapeHtml(ancestry.name)}" e suas duas features serao removidas deste dispositivo. Personagens que futuramente a referenciarem poderao perder essas referencias.</p><div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-compendium-ancestry">Cancelar</button><button class="danger-action" type="button" data-action="confirm-delete-compendium-ancestry">Excluir</button></div></section></div>` : "";
}

export async function saveCompendiumAncestry(deps: AncestryFeatureDependencies): Promise<void> {
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)?.value.trim() ?? "";
  const name = value("[data-ancestry-name]"); const summary = value("[data-ancestry-summary]");
  const error = document.querySelector<HTMLElement>("[data-ancestry-error]");
  const existing = deps.state.editingCompendiumAncestryId ? deps.catalog.ancestries.find((entry) => entry.id === deps.state.editingCompendiumAncestryId) : undefined;
  const duplicate = deps.catalog.ancestries.some((entry) => entry.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && entry.id !== existing?.id);
  const top = readFeatureAuthoringFields({ key: "ancestry-top", feature: existing ? feature(existing, "top", deps.catalog) : undefined, sourceType: "ancestry", tier: "top", includeResourceModifier: true });
  const bottom = readFeatureAuthoringFields({ key: "ancestry-bottom", feature: existing ? feature(existing, "bottom", deps.catalog) : undefined, sourceType: "ancestry", tier: "bottom", includeResourceModifier: true });
  const featureError = top instanceof Error ? top : bottom instanceof Error ? bottom : undefined;
  if (!name || !summary || !top || !bottom || featureError || duplicate) { if (error) { error.hidden = false; error.textContent = featureError?.message ?? (duplicate ? "Ja existe uma ancestralidade com este nome." : "Preencha a ancestralidade e as duas features."); } return; }
  if (existing && existing.packId !== "local") return;
  try {
    const image = (await readImage("[data-ancestry-image]")) ?? existing?.image; const id = existing?.id ?? `ancestry.local.${crypto.randomUUID()}`;
    const topId = (existing ? feature(existing, "top", deps.catalog)?.id : undefined) ?? `feature.local.${crypto.randomUUID()}`; const bottomId = (existing ? feature(existing, "bottom", deps.catalog)?.id : undefined) ?? `feature.local.${crypto.randomUUID()}`;
    const ancestry: AncestryDefinition = { id, type: "ancestry", packId: "local", name, summary, image, topFeatureId: topId, bottomFeatureId: bottomId };
    const topDefinition: FeatureDefinition = { ...(top as FeatureDefinition), id: topId, sourceId: id };
    const bottomDefinition: FeatureDefinition = { ...(bottom as FeatureDefinition), id: bottomId, sourceId: id };
    await Promise.all([deps.saveCustomDefinition(ancestry), deps.saveCustomDefinition(topDefinition), deps.saveCustomDefinition(bottomDefinition)]); await deps.refreshCatalog(); deps.state.ancestryModalOpen = false; deps.state.editingCompendiumAncestryId = undefined; deps.render();
  } catch (caught) { if (error) { error.hidden = false; error.textContent = caught instanceof Error ? caught.message : "Nao foi possivel salvar a ancestralidade."; } }
}

export async function removeCompendiumAncestry(deps: AncestryFeatureDependencies): Promise<void> {
  const ancestry = deps.state.deletingCompendiumAncestryId ? deps.catalog.ancestries.find((entry) => entry.id === deps.state.deletingCompendiumAncestryId) : undefined;
  if (!ancestry || ancestry.packId !== "local") return;
  await Promise.all([ancestry.id, ancestry.topFeatureId, ancestry.bottomFeatureId].map((id) => deps.deleteCustomDefinition(id))); await deps.refreshCatalog(); deps.state.deletingCompendiumAncestryId = undefined; deps.render();
}

function renderAncestryResult(ancestry: AncestryDefinition, deps: AncestryFeatureDependencies): string {
  const top = feature(ancestry, "top", deps.catalog); const bottom = feature(ancestry, "bottom", deps.catalog); const local = ancestry.packId === "local"; const source = local ? "Local" : deps.getPackDisplayName(ancestry.packId);
  return `<article class="compendium-class-result compendium-ancestry-result"><button class="compendium-class-result-open compendium-ancestry-result-open" type="button" data-ancestry-preview-id="${deps.escapeHtml(ancestry.id)}" aria-label="Ver detalhes de ${deps.escapeHtml(ancestry.name)}">${ancestry.image ? `<span class="compendium-class-image" style="background-image: url('${deps.escapeHtml(ancestry.image)}')"></span>` : '<span class="compendium-class-image class-image-placeholder" aria-hidden="true"></span>'}<span class="compendium-class-body"><span>${deps.escapeHtml(source)}</span><h2>${deps.escapeHtml(ancestry.name)}</h2><p>${deps.escapeHtml(ancestry.summary)}</p><span class="ancestry-feature-pair"><span><b>Top Feature</b><strong>${deps.escapeHtml(top?.name ?? "Feature indisponivel")}</strong><small>${deps.escapeHtml(top?.summary ?? "")}</small></span><span><b>Bottom Feature</b><strong>${deps.escapeHtml(bottom?.name ?? "Feature indisponivel")}</strong><small>${deps.escapeHtml(bottom?.summary ?? "")}</small></span></span></span></button><div class="compendium-card-result-actions">${local ? `<button type="button" data-action="edit-compendium-ancestry" data-ancestry-id="${deps.escapeHtml(ancestry.id)}">Editar</button><button type="button" data-action="delete-compendium-ancestry" data-ancestry-id="${deps.escapeHtml(ancestry.id)}">Excluir</button>` : '<span class="readonly-label">Conteúdo não editável</span>'}</div></article>`;
}

function renderAncestryFeatureDetail(label: string, definition: FeatureDefinition | undefined, deps: AncestryFeatureDependencies): string { return `<article class="compendium-entry-feature"><span>${label}</span><h4>${deps.escapeHtml(definition?.name ?? "Feature indisponível")}</h4><p>${deps.escapeHtml(definition?.summary ?? "")}</p></article>`; }

function feature(ancestry: AncestryDefinition, position: "top" | "bottom", catalog: Catalog): FeatureDefinition | undefined { return catalog.features.find((entry) => entry.id === (position === "top" ? ancestry.topFeatureId : ancestry.bottomFeatureId)); }
function featureFields(label: string, definition: FeatureDefinition | undefined, key: "top" | "bottom", deps: AncestryFeatureDependencies): string {
  return `<div class="ancestry-feature-form-grid">${renderFeatureAuthoringFields({ key: `ancestry-${key}`, title: `${label} Feature`, feature: definition, required: true, escapeHtml: deps.escapeHtml, includeResourceModifier: true })}</div>`;
}
function readImage(selector: string): Promise<string | undefined> { const file = document.querySelector<HTMLInputElement>(selector)?.files?.[0]; if (!file) return Promise.resolve(undefined); if (file.size > 1_500_000) return Promise.reject(new Error("A imagem deve ter no maximo 1,5 MB.")); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined); reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem.")); reader.readAsDataURL(file); }); }
