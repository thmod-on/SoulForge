import type { Catalog } from "../../domain/catalog";
import type { TransformationDefinition } from "../../domain/types";

export type TransformationFeatureState = {
  compendiumTransformationSearch: string;
  transformationModalOpen: boolean;
  editingCompendiumTransformationId?: string;
  deletingCompendiumTransformationId?: string;
  compendiumTransformationPreviewId?: string;
};

export type TransformationFeatureDependencies = {
  state: TransformationFeatureState;
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  getPackDisplayName: (packId: string) => string;
  saveCustomDefinition: (definition: TransformationDefinition) => Promise<void>;
  deleteCustomDefinition: (id: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: () => void;
};

export function renderCompendiumTransformationsManager(deps: TransformationFeatureDependencies): string {
  const query = deps.state.compendiumTransformationSearch.trim().toLocaleLowerCase("pt-BR");
  const all = [...deps.catalog.transformations].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  const entries = all.filter((entry) => !query || `${entry.name} ${entry.summary} ${entry.benefit} ${entry.drawback}`.toLocaleLowerCase("pt-BR").includes(query));
  return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Transformações</h1><span class="compendium-index-count">${all.length} ${all.length === 1 ? "transformação" : "transformações"}</span></div><p>Escolhas opcionais de identidade: uma personagem pode ter apenas uma.</p></div><div class="compendium-index-heading-actions"><button class="sf-action sf-action--primary primary-action" type="button" data-action="new-compendium-transformation">Nova transformação</button><button class="sf-action sf-action--secondary secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao índice</button></div></div><section class="compendium-book-index compendium-transformation-index"><label class="sf-search-field search-box compendium-index-search"><span aria-hidden="true">⌕</span><input type="search" data-compendium-transformation-search value="${deps.escapeHtml(deps.state.compendiumTransformationSearch)}" placeholder="Pesquisar transformação" aria-label="Pesquisar transformação" /></label>${entries.length ? `<div class="compendium-ancestry-results">${entries.map((entry) => renderTransformationResult(entry, deps)).join("")}</div>` : `<div class="empty-state"><h2>Nenhuma transformação encontrada</h2><p>Altere a busca ou adicione uma transformação local.</p></div>`}</section></main>${renderTransformationFormModal(deps)}${renderTransformationDeleteModal(deps)}${renderTransformationPreviewModal(deps)}`;
}

export function renderCompendiumTransformationsSpread(deps: Pick<TransformationFeatureDependencies, "catalog" | "escapeHtml">, renderChapterCard: (chapter: { eyebrow: string; title: string; summary: string; count: number; countLabel: string; primaryAction: string; primaryActionId?: string; secondaryAction: string; secondaryActionId?: string; details: string[]; emphasized?: boolean }) => string): string {
  return `<section class="compendium-spread compendium-index-spread" aria-label="Transformações do Compendium"><article class="compendium-page compendium-page--solo">${renderChapterCard({ eyebrow: "Identidade opcional", title: "Transformações", summary: "Mudanças fundamentais que concedem um benefício e uma desvantagem. Elas não contam para o limite do Loadout.", count: deps.catalog.transformations.length, countLabel: "Transformações cadastradas", primaryAction: "Nova transformação", primaryActionId: "new-compendium-transformation", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-transformations", details: ["Cada personagem pode ter no máximo uma transformação.", "A carta vai para o Loadout como parte da herança, sem ocupar limite.", "Benefício, desvantagem e perguntas narrativas ficam reunidos no detalhe."], emphasized: true })}</article><article class="compendium-page compendium-page--solo compendium-transformations-guide"><div class="compendium-index-card"><div class="compendium-page-heading"><h2>Escolhas de identidade</h2><p>O catálogo registra conteúdo e sua fonte. A aplicação na ficha será disponibilizada em etapa posterior.</p></div><ul class="compendium-chapter-notes"><li>Transformações não são Condições: não são efeitos temporários de cena.</li><li>Consulte o detalhe para considerar o benefício e a contrapartida juntos.</li></ul></div></article></section>`;
}

export function handleTransformationAction(target: HTMLElement, deps: TransformationFeatureDependencies): boolean {
  const preview = target.closest<HTMLElement>("[data-transformation-preview-id]");
  if (preview) { deps.state.compendiumTransformationPreviewId = preview.dataset.transformationPreviewId; deps.render(); return true; }
  if (target.closest('[data-action="new-compendium-transformation"]')) { deps.state.transformationModalOpen = true; deps.state.editingCompendiumTransformationId = undefined; deps.render(); return true; }
  const edit = target.closest<HTMLElement>('[data-action="edit-compendium-transformation"]');
  if (edit) { deps.state.transformationModalOpen = true; deps.state.editingCompendiumTransformationId = edit.dataset.transformationId; deps.render(); return true; }
  if (target.closest('[data-action="cancel-compendium-transformation"]')) { deps.state.transformationModalOpen = false; deps.state.editingCompendiumTransformationId = undefined; deps.render(); return true; }
  if (target.closest('[data-action="save-compendium-transformation"]')) { void saveTransformation(deps); return true; }
  const remove = target.closest<HTMLElement>('[data-action="delete-compendium-transformation"]');
  if (remove) { deps.state.deletingCompendiumTransformationId = remove.dataset.transformationId; deps.render(); return true; }
  if (target.closest('[data-action="cancel-delete-compendium-transformation"]')) { deps.state.deletingCompendiumTransformationId = undefined; deps.render(); return true; }
  if (target.closest('[data-action="confirm-delete-compendium-transformation"]')) { void deleteTransformation(deps); return true; }
  return false;
}

function renderTransformationResult(entry: TransformationDefinition, deps: TransformationFeatureDependencies): string {
  const local = entry.packId === "local";
  const artwork = entry.image
    ? `<span class="compendium-class-image" style="background-image: url('${deps.escapeHtml(entry.image)}')" aria-hidden="true"></span>`
    : '<span class="compendium-class-image class-image-placeholder transformation-glyph" aria-hidden="true">✦</span>';
  return `<article class="compendium-class-result compendium-transformation-result"><button class="compendium-class-result-open" type="button" data-transformation-preview-id="${deps.escapeHtml(entry.id)}" aria-label="Ver detalhes de ${deps.escapeHtml(entry.name)}">${artwork}<span class="compendium-class-body"><span>${deps.escapeHtml(local ? "Local" : deps.getPackDisplayName(entry.packId))}</span><h2>${deps.escapeHtml(entry.name)}</h2><p>${deps.escapeHtml(entry.summary)}</p><span class="transformation-result-traits"><span><b>Benefício</b><small>${deps.escapeHtml(entry.benefit)}</small></span><span><b>Desvantagem</b><small>${deps.escapeHtml(entry.drawback)}</small></span></span></span></button><div class="compendium-card-result-actions">${local ? `<button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="edit-compendium-transformation" data-transformation-id="${deps.escapeHtml(entry.id)}">Editar</button><button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="delete-compendium-transformation" data-transformation-id="${deps.escapeHtml(entry.id)}">Excluir</button>` : '<span class="readonly-label">Conteúdo não editável</span>'}</div></article>`;
}

function renderTransformationPreviewModal(deps: TransformationFeatureDependencies): string {
  const entry = deps.catalog.transformations.find((transformation) => transformation.id === deps.state.compendiumTransformationPreviewId);
  if (!entry) return "";
  const artwork = entry.image
    ? `<div class="compendium-entry-detail-art has-image" style="background-image: url('${deps.escapeHtml(entry.image)}')" aria-hidden="true"></div>`
    : '<div class="compendium-entry-detail-art transformation-glyph" aria-hidden="true">✦</div>';
  return `<div class="modal-backdrop" data-modal-backdrop><section class="compendium-entry-detail-modal transformation-detail-modal" role="dialog" aria-modal="true" aria-labelledby="transformation-detail-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar detalhes da transformação">x</button>${artwork}<div class="compendium-entry-detail-body"><span class="resource-modal-label">Transformação</span><h2 id="transformation-detail-title">${deps.escapeHtml(entry.name)}</h2><p class="compendium-entry-detail-summary">${deps.escapeHtml(entry.summary)}</p><p class="transformation-single-rule">Uma personagem pode ter apenas uma transformação. Ela entra no Loadout sem consumir o limite.</p><section class="compendium-entry-detail-section"><h3>Benefício</h3><p>${deps.escapeHtml(entry.benefit)}</p></section><section class="compendium-entry-detail-section"><h3>Desvantagem</h3><p>${deps.escapeHtml(entry.drawback)}</p></section>${entry.rulesNotes?.length ? `<section class="compendium-entry-detail-section"><h3>Observações de regra</h3><ul class="transformation-question-list">${entry.rulesNotes.map((note) => `<li>${deps.escapeHtml(note)}</li>`).join("")}</ul></section>` : ""}<section class="compendium-entry-detail-section"><h3>Perguntas narrativas</h3><ul class="transformation-question-list">${entry.narrativeQuestions.map((question) => `<li>${deps.escapeHtml(question)}</li>`).join("")}</ul></section></div></section></div>`;
}

function renderTransformationFormModal(deps: TransformationFeatureDependencies): string {
  if (!deps.state.transformationModalOpen) return "";
  const entry = deps.catalog.transformations.find((transformation) => transformation.id === deps.state.editingCompendiumTransformationId);
  return `<div class="modal-backdrop" data-modal-backdrop><form class="modal form-modal transformation-form-modal" onsubmit="return false;"><button class="modal-close" type="button" data-action="cancel-compendium-transformation">×</button><div class="modal-title"><span>Compendium</span><h2>${entry ? "Editar transformação" : "Nova transformação"}</h2><p>Uma escolha opcional de identidade, com benefício, desvantagem e perguntas narrativas.</p></div><label class="form-field"><span>Nome</span><input data-transformation-name required value="${deps.escapeHtml(entry?.name ?? "")}" /></label><label class="form-field"><span>Descrição narrativa</span><textarea data-transformation-summary required>${deps.escapeHtml(entry?.summary ?? "")}</textarea></label><label class="form-field"><span>Benefício</span><textarea data-transformation-benefit required>${deps.escapeHtml(entry?.benefit ?? "")}</textarea></label><label class="form-field"><span>Desvantagem</span><textarea data-transformation-drawback required>${deps.escapeHtml(entry?.drawback ?? "")}</textarea></label><label class="form-field"><span>Perguntas narrativas</span><textarea data-transformation-questions required placeholder="Uma pergunta por linha">${deps.escapeHtml(entry?.narrativeQuestions.join("\n") ?? "")}</textarea></label><p class="form-error" data-transformation-error hidden></p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-compendium-transformation">Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="save-compendium-transformation">Salvar transformação</button></div></form></div>`;
}

function renderTransformationDeleteModal(deps: TransformationFeatureDependencies): string {
  const entry = deps.catalog.transformations.find((transformation) => transformation.id === deps.state.deletingCompendiumTransformationId);
  return entry ? `<div class="modal-backdrop" data-modal-backdrop><section class="modal confirm-modal"><h2>Excluir transformação?</h2><p>“${deps.escapeHtml(entry.name)}” será removida deste dispositivo.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-compendium-transformation">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-compendium-transformation">Excluir</button></div></section></div>` : "";
}

async function saveTransformation(deps: TransformationFeatureDependencies): Promise<void> {
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)?.value.trim() ?? "";
  const name = value("[data-transformation-name]"), summary = value("[data-transformation-summary]"), benefit = value("[data-transformation-benefit]"), drawback = value("[data-transformation-drawback]"), narrativeQuestions = value("[data-transformation-questions]").split("\n").map((question) => question.trim()).filter(Boolean);
  const error = document.querySelector<HTMLElement>("[data-transformation-error]");
  const existing = deps.catalog.transformations.find((transformation) => transformation.id === deps.state.editingCompendiumTransformationId);
  if (!name || !summary || !benefit || !drawback || !narrativeQuestions.length || (existing && existing.packId !== "local")) { if (error) { error.hidden = false; error.textContent = "Preencha todos os campos da transformação."; } return; }
  await deps.saveCustomDefinition({ id: existing?.id ?? `transformation.local.${crypto.randomUUID()}`, type: "transformation", packId: "local", name, summary, benefit, drawback, narrativeQuestions });
  await deps.refreshCatalog(); deps.state.transformationModalOpen = false; deps.state.editingCompendiumTransformationId = undefined; deps.render();
}

async function deleteTransformation(deps: TransformationFeatureDependencies): Promise<void> {
  const entry = deps.catalog.transformations.find((transformation) => transformation.id === deps.state.deletingCompendiumTransformationId);
  if (!entry || entry.packId !== "local") return;
  await deps.deleteCustomDefinition(entry.id); await deps.refreshCatalog(); deps.state.deletingCompendiumTransformationId = undefined; deps.render();
}
