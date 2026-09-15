import type { Catalog } from "../../domain/catalog";
import type { ConditionDefinition } from "../../domain/types";
import { getConditionArtwork } from "../../content/conditionArtwork";
import type { CompendiumChapter } from "./renderCompendiumIndex";

export type ConditionFeatureState = {
  compendiumConditionSearch: string;
  conditionModalOpen: boolean;
  editingCompendiumConditionId?: string;
  deletingCompendiumConditionId?: string;
  compendiumConditionPreviewId?: string;
};

export type ConditionFeatureDependencies = {
  state: ConditionFeatureState;
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  getPackDisplayName: (packId: string) => string;
  saveCustomDefinition: (definition: ConditionDefinition) => Promise<void>;
  deleteCustomDefinition: (id: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  render: () => void;
};

const categoryLabels: Record<ConditionDefinition["category"], string> = {
  standard: "Condição padrão",
  special: "Condição especial"
};

export function renderCompendiumConditionsManager(deps: ConditionFeatureDependencies): string {
  const query = deps.state.compendiumConditionSearch.trim().toLocaleLowerCase("pt-BR");
  const all = [...deps.catalog.conditions].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  const entries = all.filter((entry) => !query || [entry.name, entry.summary, entry.effect, entry.clearing, categoryLabels[entry.category], ...(entry.rulesNotes ?? [])].join(" ").toLocaleLowerCase("pt-BR").includes(query));
  return `<main class="content compendium-content"><div class="screen-title compendium-index-heading"><div><div class="compendium-index-title-row"><h1>Condições</h1><span class="compendium-index-count">${all.length} ${all.length === 1 ? "condição" : "condições"}</span></div><p>Estados temporários e especiais, com seus efeitos e formas de encerramento.</p></div><div class="compendium-index-heading-actions"><button class="sf-action sf-action--primary primary-action" type="button" data-action="new-compendium-condition">Nova condição</button><button class="sf-action sf-action--secondary secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao índice</button></div></div><section class="compendium-book-index compendium-condition-index"><label class="sf-search-field search-box compendium-index-search"><span aria-hidden="true">⌕</span><input type="search" data-compendium-condition-search value="${deps.escapeHtml(deps.state.compendiumConditionSearch)}" placeholder="Pesquisar condição" aria-label="Pesquisar condição" /></label>${entries.length ? `<div class="compendium-ancestry-results condition-results">${entries.map((entry) => renderConditionResult(entry, deps)).join("")}</div>` : `<div class="empty-state"><h2>Nenhuma condição encontrada</h2><p>${all.length ? "Altere os termos da busca." : "Importe um Pack de condições ou adicione uma condição local."}</p></div>`}</section></main>${renderConditionFormModal(deps)}${renderConditionDeleteModal(deps)}${renderConditionPreviewModal(deps)}`;
}

export function renderCompendiumConditionsSpread(deps: Pick<ConditionFeatureDependencies, "catalog" | "escapeHtml">, renderChapterCard: (chapter: CompendiumChapter) => string): string {
  return `<section class="compendium-spread compendium-index-spread" aria-label="Condições do Compendium"><article class="compendium-page compendium-page--solo">${renderChapterCard({ eyebrow: "Estados de jogo", title: "Condições", summary: "Estados que alteram temporariamente como uma criatura age ou é afetada durante a ficção.", count: deps.catalog.conditions.length, countLabel: "Condições cadastradas", primaryAction: "Nova condição", primaryActionId: "new-compendium-condition", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-conditions", details: ["Oculto, Restringido e Vulnerável são as Condições padrão.", "Condições especiais declaram no próprio efeito quando terminam.", "Aplicar Condições à ficha será tratado separadamente."], emphasized: true })}</article><article class="compendium-page compendium-page--solo compendium-conditions-guide"><div class="compendium-index-card"><div class="compendium-page-heading"><h2>Como consultar</h2><p>Cada definição reúne significado, efeito mecânico e orientação de encerramento.</p></div><ul class="compendium-chapter-notes"><li>A mesma Condição não se acumula, salvo quando uma regra disser o contrário.</li><li>Ao marcar o último Estresse, uma personagem fica Vulnerável até limpar ao menos 1 Estresse.</li><li>O detalhe identifica a origem do conteúdo e preserva condições locais.</li></ul></div></article></section>`;
}

export function handleConditionAction(target: HTMLElement, deps: ConditionFeatureDependencies): boolean {
  const preview = target.closest<HTMLElement>("[data-condition-preview-id]");
  if (preview) { deps.state.compendiumConditionPreviewId = preview.dataset.conditionPreviewId; deps.render(); return true; }
  if (target.closest('[data-action="new-compendium-condition"]')) { deps.state.conditionModalOpen = true; deps.state.editingCompendiumConditionId = undefined; deps.render(); return true; }
  const edit = target.closest<HTMLElement>('[data-action="edit-compendium-condition"]');
  if (edit) { deps.state.conditionModalOpen = true; deps.state.editingCompendiumConditionId = edit.dataset.conditionId; deps.render(); return true; }
  if (target.closest('[data-action="cancel-compendium-condition"]')) { deps.state.conditionModalOpen = false; deps.state.editingCompendiumConditionId = undefined; deps.render(); return true; }
  if (target.closest('[data-action="save-compendium-condition"]')) { void saveCondition(deps); return true; }
  const remove = target.closest<HTMLElement>('[data-action="delete-compendium-condition"]');
  if (remove) { deps.state.deletingCompendiumConditionId = remove.dataset.conditionId; deps.render(); return true; }
  if (target.closest('[data-action="cancel-delete-compendium-condition"]')) { deps.state.deletingCompendiumConditionId = undefined; deps.render(); return true; }
  if (target.closest('[data-action="confirm-delete-compendium-condition"]')) { void deleteCondition(deps); return true; }
  return false;
}

function renderConditionResult(entry: ConditionDefinition, deps: ConditionFeatureDependencies): string {
  const local = entry.packId === "local";
  const artworkUrl = getConditionArtwork(entry);
  const artwork = artworkUrl ? `<span class="compendium-class-image condition-art" style="background-image: url('${deps.escapeHtml(artworkUrl)}')" aria-hidden="true"></span>` : `<span class="compendium-class-image class-image-placeholder condition-glyph" aria-hidden="true">${entry.category === "standard" ? "◈" : "✦"}</span>`;
  return `<article class="compendium-class-result compendium-condition-result"><button class="compendium-class-result-open" type="button" data-condition-preview-id="${deps.escapeHtml(entry.id)}" aria-label="Ver detalhes de ${deps.escapeHtml(entry.name)}">${artwork}<span class="compendium-class-body"><span>${deps.escapeHtml(local ? "Local" : deps.getPackDisplayName(entry.packId))} · ${deps.escapeHtml(categoryLabels[entry.category])}</span><h2>${deps.escapeHtml(entry.name)}</h2><p>${deps.escapeHtml(entry.summary)}</p><span class="condition-result-rules"><span><b>Efeito</b><small>${deps.escapeHtml(entry.effect)}</small></span><span><b>Encerramento</b><small>${deps.escapeHtml(entry.clearing)}</small></span></span></span></button><div class="compendium-card-result-actions">${local ? `<button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="edit-compendium-condition" data-condition-id="${deps.escapeHtml(entry.id)}">Editar</button><button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="delete-compendium-condition" data-condition-id="${deps.escapeHtml(entry.id)}">Excluir</button>` : '<span class="readonly-label">Conteúdo não editável</span>'}</div></article>`;
}

function renderConditionPreviewModal(deps: ConditionFeatureDependencies): string {
  const entry = deps.catalog.conditions.find((condition) => condition.id === deps.state.compendiumConditionPreviewId);
  if (!entry) return "";
  const artworkUrl = getConditionArtwork(entry);
  const artwork = artworkUrl ? `<div class="compendium-entry-detail-art has-image condition-art" style="background-image: url('${deps.escapeHtml(artworkUrl)}')" aria-hidden="true"></div>` : `<div class="compendium-entry-detail-art condition-glyph" aria-hidden="true">${entry.category === "standard" ? "◈" : "✦"}</div>`;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="compendium-entry-detail-modal condition-detail-modal" role="dialog" aria-modal="true" aria-labelledby="condition-detail-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar detalhes da condição">x</button>${artwork}<div class="compendium-entry-detail-body"><span class="resource-modal-label">${deps.escapeHtml(categoryLabels[entry.category])}</span><h2 id="condition-detail-title">${deps.escapeHtml(entry.name)}</h2><p class="compendium-entry-detail-summary">${deps.escapeHtml(entry.summary)}</p><section class="compendium-entry-detail-section"><h3>Efeito</h3><p>${deps.escapeHtml(entry.effect)}</p></section><section class="compendium-entry-detail-section"><h3>Como encerrar</h3><p>${deps.escapeHtml(entry.clearing)}</p></section>${entry.rulesNotes?.length ? `<section class="compendium-entry-detail-section"><h3>Observações de regra</h3><ul class="transformation-question-list">${entry.rulesNotes.map((note) => `<li>${deps.escapeHtml(note)}</li>`).join("")}</ul></section>` : ""}<p class="condition-detail-source">Fonte: ${deps.escapeHtml(entry.packId === "local" ? "Conteúdo local" : deps.getPackDisplayName(entry.packId))}</p></div></section></div>`;
}

export function renderConditionFormModal(deps: ConditionFeatureDependencies): string {
  if (!deps.state.conditionModalOpen) return "";
  const entry = deps.catalog.conditions.find((condition) => condition.id === deps.state.editingCompendiumConditionId);
  return `<div class="modal-backdrop" data-modal-backdrop><form class="modal form-modal compendium-form-modal condition-form-modal" onsubmit="return false;"><button class="modal-close" type="button" data-action="cancel-compendium-condition">×</button><header class="compendium-form-header"><div class="modal-title"><span>Compendium</span><h2>${entry ? "Editar condição" : "Nova condição"}</h2><p>Registre o significado, o efeito e quando a condição termina.</p></div></header><div class="compendium-form-body"><label class="form-field"><span>Nome</span><input data-condition-name required value="${deps.escapeHtml(entry?.name ?? "")}" /></label><label class="form-field"><span>Categoria</span><select data-condition-category><option value="standard" ${entry?.category === "standard" ? "selected" : ""}>Padrão</option><option value="special" ${entry?.category === "special" ? "selected" : ""}>Especial</option></select></label><label class="form-field"><span>Descrição</span><textarea data-condition-summary required>${deps.escapeHtml(entry?.summary ?? "")}</textarea></label><label class="form-field"><span>Efeito</span><textarea data-condition-effect required>${deps.escapeHtml(entry?.effect ?? "")}</textarea></label><label class="form-field"><span>Como encerrar</span><textarea data-condition-clearing required>${deps.escapeHtml(entry?.clearing ?? "")}</textarea></label><label class="form-field"><span>Observações de regra</span><textarea data-condition-rules placeholder="Uma observação por linha">${deps.escapeHtml(entry?.rulesNotes?.join("\n") ?? "")}</textarea></label></div><footer class="compendium-form-footer"><p class="form-error" data-condition-error hidden></p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-compendium-condition">Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="save-compendium-condition">Salvar condição</button></div></footer></form></div>`;
}

function renderConditionDeleteModal(deps: ConditionFeatureDependencies): string {
  const entry = deps.catalog.conditions.find((condition) => condition.id === deps.state.deletingCompendiumConditionId);
  return entry ? `<div class="modal-backdrop" data-modal-backdrop><section class="modal confirm-modal"><h2>Excluir condição?</h2><p>“${deps.escapeHtml(entry.name)}” será removida deste dispositivo.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-compendium-condition">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-compendium-condition">Excluir</button></div></section></div>` : "";
}

async function saveCondition(deps: ConditionFeatureDependencies): Promise<void> {
  const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? "";
  const name = value("[data-condition-name]"), summary = value("[data-condition-summary]"), effect = value("[data-condition-effect]"), clearing = value("[data-condition-clearing]");
  const category = value("[data-condition-category]") as ConditionDefinition["category"];
  const rulesNotes = value("[data-condition-rules]").split("\n").map((note) => note.trim()).filter(Boolean);
  const error = document.querySelector<HTMLElement>("[data-condition-error]");
  const existing = deps.catalog.conditions.find((condition) => condition.id === deps.state.editingCompendiumConditionId);
  const duplicate = deps.catalog.conditions.some((condition) => condition.id !== existing?.id && condition.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
  if (!name || !summary || !effect || !clearing || !["standard", "special"].includes(category) || duplicate) { if (error) { error.hidden = false; error.textContent = duplicate ? "Já existe uma condição com este nome." : "Preencha nome, descrição, efeito e encerramento."; } return; }
  await deps.saveCustomDefinition({ id: existing?.id ?? `condition.local.${crypto.randomUUID()}`, type: "condition", packId: "local", name, summary, category, effect, clearing, ...(rulesNotes.length ? { rulesNotes } : {}) });
  await deps.refreshCatalog(); deps.state.conditionModalOpen = false; deps.state.editingCompendiumConditionId = undefined; deps.render();
}

async function deleteCondition(deps: ConditionFeatureDependencies): Promise<void> {
  const entry = deps.catalog.conditions.find((condition) => condition.id === deps.state.deletingCompendiumConditionId);
  if (!entry || entry.packId !== "local") return;
  await deps.deleteCustomDefinition(entry.id); await deps.refreshCatalog(); deps.state.deletingCompendiumConditionId = undefined; deps.render();
}
