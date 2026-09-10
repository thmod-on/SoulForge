import type { Catalog } from "../../domain/catalog";
import type { Character, TransformationDefinition } from "../../domain/types";

export type CharacterTransformationUiState = {
  characterTransformationPickerOpen: boolean;
  characterTransformationDetailOpen: boolean;
  characterTransformationRemoveOpen: boolean;
  characterTransformationSelectedId?: string;
  characterTransformationError?: string;
};

export type CharacterTransformationDependencies = {
  state: CharacterTransformationUiState;
  character: Character;
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  saveCharacter: (character: Character) => Promise<void>;
  render: () => void;
};

export function getCharacterTransformation(character: Character, catalog: Catalog): TransformationDefinition | undefined {
  return catalog.transformations.find((entry) => entry.id === character.identity.transformationId);
}

export function assignCharacterTransformation(character: Character, transformationId: string): Character {
  return { ...character, identity: { ...character.identity, transformationId } };
}

export function removeCharacterTransformation(character: Character): Character {
  return { ...character, identity: { ...character.identity, transformationId: undefined } };
}

export function renderCharacterTransformationPanel(character: Character, catalog: Catalog, escapeHtml: (value: string) => string): string {
  const transformationId = character.identity.transformationId;
  const transformation = getCharacterTransformation(character, catalog);
  if (!transformationId) {
    return `<section class="band character-transformation-band"><div class="section-heading"><h2>Transformação</h2><span>Opcional</span></div><div class="character-transformation-empty"><span aria-hidden="true">✦</span><div><strong>Nenhuma transformação</strong><small>Uma transformação passa a fazer parte da identidade e não ocupa o Loadout.</small></div><button class="sf-action sf-action--secondary" type="button" data-action="open-character-transformation-picker">Escolher transformação</button></div></section>`;
  }
  if (!transformation) {
    return `<section class="band character-transformation-band"><div class="section-heading"><h2>Transformação</h2><span>Pack ausente</span></div><div class="character-transformation-missing"><span aria-hidden="true">!</span><div><strong>Transformação indisponível</strong><small>A referência foi preservada, mas a Definition <code>${escapeHtml(transformationId)}</code> não está instalada.</small></div><button class="sf-action sf-action--secondary" type="button" data-action="request-remove-character-transformation">Remover referência</button></div></section>`;
  }
  const artwork = transformation.image
    ? `<span class="character-transformation-art has-image" style="background-image: url('${escapeHtml(transformation.image)}')" aria-hidden="true"></span>`
    : '<span class="character-transformation-art" aria-hidden="true">✦</span>';
  return `<section class="band character-transformation-band"><div class="section-heading"><h2>Transformação</h2><span>Ativa</span></div><article class="character-transformation-card">${artwork}<div class="character-transformation-copy"><small>Transformação ativa</small><h3>${escapeHtml(transformation.name)}</h3><p>${escapeHtml(transformation.summary)}</p><em>Herança · não ocupa o Loadout</em></div><button class="character-transformation-detail-action" type="button" data-action="view-character-transformation">Ver detalhes <span aria-hidden="true">›</span></button></article></section>`;
}

export function renderCharacterTransformationDialogs(deps: CharacterTransformationDependencies): string {
  return `${renderPicker(deps)}${renderDetail(deps)}${renderRemoveConfirmation(deps)}`;
}

export function handleCharacterTransformationAction(target: HTMLElement, deps: CharacterTransformationDependencies): boolean {
  if (target.closest('[data-action="open-character-transformation-picker"]') || target.closest('[data-action="replace-character-transformation"]')) {
    deps.state.characterTransformationPickerOpen = true;
    deps.state.characterTransformationDetailOpen = false;
    deps.state.characterTransformationSelectedId = undefined;
    deps.state.characterTransformationError = undefined;
    deps.render();
    return true;
  }
  const selected = target.closest<HTMLElement>("[data-character-transformation-id]");
  if (selected) {
    deps.state.characterTransformationSelectedId = selected.dataset.characterTransformationId;
    deps.state.characterTransformationError = undefined;
    updatePickerSelection(selected);
    return true;
  }
  if (target.closest('[data-action="cancel-character-transformation-picker"]')) {
    deps.state.characterTransformationPickerOpen = false;
    deps.state.characterTransformationSelectedId = undefined;
    deps.state.characterTransformationError = undefined;
    deps.render();
    return true;
  }
  if (target.closest('[data-action="confirm-character-transformation"]')) { void assignTransformation(deps); return true; }
  if (target.closest('[data-action="view-character-transformation"]')) { deps.state.characterTransformationDetailOpen = true; deps.render(); return true; }
  if (target.closest('[data-action="close-character-transformation-detail"]')) { deps.state.characterTransformationDetailOpen = false; deps.render(); return true; }
  if (target.closest('[data-action="request-remove-character-transformation"]')) { deps.state.characterTransformationDetailOpen = false; deps.state.characterTransformationRemoveOpen = true; deps.render(); return true; }
  if (target.closest('[data-action="cancel-remove-character-transformation"]')) { deps.state.characterTransformationRemoveOpen = false; deps.render(); return true; }
  if (target.closest('[data-action="confirm-remove-character-transformation"]')) { void removeTransformation(deps); return true; }
  return false;
}

function updatePickerSelection(selected: HTMLElement): void {
  const modal = selected.closest<HTMLElement>(".character-transformation-picker-modal");
  if (!modal) return;
  modal.querySelectorAll<HTMLElement>(".character-transformation-option").forEach((option) => option.classList.remove("is-selected"));
  selected.closest<HTMLElement>(".character-transformation-option")?.classList.add("is-selected");
  modal.querySelectorAll<HTMLInputElement>('input[name="character-transformation"]').forEach((input) => { input.checked = input === selected; });
  const confirm = modal.querySelector<HTMLButtonElement>('[data-action="confirm-character-transformation"]');
  if (confirm) confirm.disabled = false;
  modal.querySelector<HTMLElement>('[role="alert"]')?.remove();
}

export function handleCharacterTransformationEscape(event: KeyboardEvent, deps: CharacterTransformationDependencies): boolean {
  if (event.key !== "Escape" || (!deps.state.characterTransformationPickerOpen && !deps.state.characterTransformationDetailOpen && !deps.state.characterTransformationRemoveOpen)) return false;
  deps.state.characterTransformationPickerOpen = false;
  deps.state.characterTransformationDetailOpen = false;
  deps.state.characterTransformationRemoveOpen = false;
  deps.state.characterTransformationSelectedId = undefined;
  deps.state.characterTransformationError = undefined;
  deps.render();
  return true;
}

function renderPicker(deps: CharacterTransformationDependencies): string {
  if (!deps.state.characterTransformationPickerOpen) return "";
  const selectedId = deps.state.characterTransformationSelectedId;
  const current = getCharacterTransformation(deps.character, deps.catalog);
  const options = deps.catalog.transformations.map((entry) => renderPickerOption(entry, selectedId === entry.id, deps.escapeHtml)).join("");
  const actionLabel = current ? "Substituir transformação" : "Conceder transformação";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="modal character-transformation-picker-modal" role="dialog" aria-modal="true" aria-labelledby="character-transformation-picker-title"><button class="modal-close" type="button" data-action="cancel-character-transformation-picker" aria-label="Fechar seleção">×</button><header><span class="resource-modal-label">Identidade persistente</span><h2 id="character-transformation-picker-title">${current ? "Substituir transformação" : "Escolher transformação"}</h2><p>Revise benefício e desvantagem juntos. A transformação não ocupa um espaço do Loadout.</p></header>${current ? `<p class="character-transformation-current">Transformação atual: <strong>${deps.escapeHtml(current.name)}</strong></p>` : ""}<div class="character-transformation-picker-list" role="radiogroup" aria-label="Transformações disponíveis">${options || '<div class="sf-state sf-state--empty sf-state--inline"><p>Nenhuma transformação está disponível. Importe ou crie uma no Compendium.</p></div>'}</div>${deps.state.characterTransformationError ? `<p class="form-error" role="alert">${deps.escapeHtml(deps.state.characterTransformationError)}</p>` : ""}<footer><button class="sf-action sf-action--secondary" type="button" data-action="cancel-character-transformation-picker">Cancelar</button><button class="sf-action sf-action--primary" type="button" data-action="confirm-character-transformation" ${selectedId ? "" : "disabled"}>${actionLabel}</button></footer></section></div>`;
}

function renderPickerOption(entry: TransformationDefinition, selected: boolean, escapeHtml: (value: string) => string): string {
  const artwork = entry.image ? `<span style="background-image: url('${escapeHtml(entry.image)}')" aria-hidden="true"></span>` : '<span aria-hidden="true">✦</span>';
  return `<label class="character-transformation-option ${selected ? "is-selected" : ""}"><input type="radio" name="character-transformation" value="${escapeHtml(entry.id)}" data-character-transformation-id="${escapeHtml(entry.id)}" ${selected ? "checked" : ""}/>${artwork}<strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.summary)}</small><div><p><b>Benefício</b>${escapeHtml(entry.benefit)}</p><p><b>Desvantagem</b>${escapeHtml(entry.drawback)}</p></div></label>`;
}

function renderDetail(deps: CharacterTransformationDependencies): string {
  if (!deps.state.characterTransformationDetailOpen) return "";
  const entry = getCharacterTransformation(deps.character, deps.catalog);
  if (!entry) return "";
  const artwork = entry.image ? `<div class="compendium-entry-detail-art has-image" style="background-image: url('${deps.escapeHtml(entry.image)}')" aria-hidden="true"></div>` : '<div class="compendium-entry-detail-art transformation-glyph" aria-hidden="true">✦</div>';
  return `<div class="modal-backdrop" data-modal-backdrop><section class="compendium-entry-detail-modal transformation-detail-modal character-transformation-detail-modal" role="dialog" aria-modal="true" aria-labelledby="character-transformation-detail-title"><button class="modal-close" type="button" data-action="close-character-transformation-detail" aria-label="Fechar detalhes">×</button>${artwork}<div class="compendium-entry-detail-body"><span class="resource-modal-label">Transformação ativa</span><h2 id="character-transformation-detail-title">${deps.escapeHtml(entry.name)}</h2><p class="compendium-entry-detail-summary">${deps.escapeHtml(entry.summary)}</p><p class="transformation-single-rule">Herança da personagem · não ocupa um espaço do Loadout.</p><section class="compendium-entry-detail-section"><h3>Benefício</h3><p>${deps.escapeHtml(entry.benefit)}</p></section><section class="compendium-entry-detail-section"><h3>Desvantagem</h3><p>${deps.escapeHtml(entry.drawback)}</p></section>${entry.rulesNotes?.length ? `<section class="compendium-entry-detail-section"><h3>Lembretes de regra</h3><ul class="transformation-question-list">${entry.rulesNotes.map((note) => `<li>${deps.escapeHtml(note)}</li>`).join("")}</ul></section>` : ""}<section class="compendium-entry-detail-section"><h3>Perguntas narrativas</h3><ul class="transformation-question-list">${entry.narrativeQuestions.map((question) => `<li>${deps.escapeHtml(question)}</li>`).join("")}</ul></section><footer class="character-transformation-detail-actions"><button class="sf-action sf-action--danger" type="button" data-action="request-remove-character-transformation">Remover</button><button class="sf-action sf-action--secondary" type="button" data-action="replace-character-transformation">Substituir</button><button class="sf-action sf-action--primary" type="button" data-action="close-character-transformation-detail">Concluir</button></footer></div></section></div>`;
}

function renderRemoveConfirmation(deps: CharacterTransformationDependencies): string {
  if (!deps.state.characterTransformationRemoveOpen) return "";
  const entry = getCharacterTransformation(deps.character, deps.catalog);
  const label = entry?.name ?? "a referência indisponível";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="remove-character-transformation-title"><span class="resource-modal-label">Alteração de identidade</span><h2 id="remove-character-transformation-title">Remover transformação?</h2><p><strong>${deps.escapeHtml(label)}</strong> deixará de aparecer e suas mecânicas serão desativadas. Marcadores já registrados serão preservados, mas ficarão inativos.</p><div class="modal-actions"><button class="sf-action sf-action--secondary" type="button" data-action="cancel-remove-character-transformation">Cancelar</button><button class="sf-action sf-action--danger" type="button" data-action="confirm-remove-character-transformation">Remover transformação</button></div></section></div>`;
}

async function assignTransformation(deps: CharacterTransformationDependencies): Promise<void> {
  const id = deps.state.characterTransformationSelectedId;
  if (!id || !deps.catalog.transformations.some((entry) => entry.id === id)) { deps.state.characterTransformationError = "Escolha uma transformação disponível."; deps.render(); return; }
  try {
    await deps.saveCharacter(assignCharacterTransformation(deps.character, id));
    deps.state.characterTransformationPickerOpen = false;
    deps.state.characterTransformationSelectedId = undefined;
    deps.state.characterTransformationError = undefined;
    deps.render();
  } catch { deps.state.characterTransformationError = "Não foi possível salvar a transformação neste dispositivo."; deps.render(); }
}

async function removeTransformation(deps: CharacterTransformationDependencies): Promise<void> {
  try {
    await deps.saveCharacter(removeCharacterTransformation(deps.character));
    deps.state.characterTransformationRemoveOpen = false;
    deps.render();
  } catch { deps.state.characterTransformationError = "Não foi possível remover a transformação neste dispositivo."; deps.render(); }
}
