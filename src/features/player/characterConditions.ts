import { getConditionArtwork } from "../../content/conditionArtwork";
import type { Catalog } from "../../domain/catalog";
import type { Character, CharacterActiveCondition, CharacterConditionOrigin, ConditionDefinition } from "../../domain/types";

export const vulnerableConditionId = "condition.core.vulnerable";

export type CharacterConditionUiState = {
  characterConditionPickerOpen: boolean;
  characterConditionPickerSearch: string;
  characterConditionDetailId?: string;
};

export type CharacterConditionDependencies = {
  state: CharacterConditionUiState & { character?: Character };
  catalog: Catalog;
  escapeHtml: (value: string) => string;
  saveCharacter: (character: Character) => Promise<void>;
  render: () => void;
};

/** Mantém a origem de Estresse alinhada ao valor atual sem tocar em outras origens. */
export function synchronizeCharacterConditions(character: Character): Character {
  const stress = character.resources.find((resource) => resource.id === "stress");
  if (!stress || stress.max <= 0) return character;
  const isFull = stress.value >= stress.max;
  const current = character.activeConditions ?? [];
  const vulnerable = current.find((condition) => condition.conditionId === vulnerableConditionId);
  const hasStressOrigin = vulnerable?.origins.some((origin) => origin.kind === "stress") ?? false;
  if (isFull === hasStressOrigin) return character;

  if (isFull) {
    const origin: CharacterConditionOrigin = { id: "stress", kind: "stress", label: "Último Estresse", appliedAt: new Date().toISOString() };
    const activeConditions = vulnerable
      ? current.map((condition) => condition.conditionId === vulnerableConditionId ? { ...condition, origins: [...condition.origins, origin] } : condition)
      : [...current, { conditionId: vulnerableConditionId, fallbackName: "Vulnerável", origins: [origin] }];
    return { ...character, activeConditions };
  }

  const activeConditions = current.flatMap((condition) => {
    if (condition.conditionId !== vulnerableConditionId) return [condition];
    const origins = condition.origins.filter((origin) => origin.kind !== "stress");
    return origins.length ? [{ ...condition, origins }] : [];
  });
  return { ...character, activeConditions };
}

export function addSceneCondition(character: Character, definition: ConditionDefinition, label?: string): Character {
  const existing = character.activeConditions?.find((condition) => condition.conditionId === definition.id);
  if (existing?.origins.some((origin) => origin.kind === "scene")) return character;
  const origin: CharacterConditionOrigin = {
    id: globalThis.crypto?.randomUUID?.() ?? `condition-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: "scene",
    label: label?.trim() || "Aplicada na cena",
    appliedAt: new Date().toISOString()
  };
  const activeConditions = existing
    ? (character.activeConditions ?? []).map((condition) => condition.conditionId === definition.id ? { ...condition, origins: [...condition.origins, origin] } : condition)
    : [...(character.activeConditions ?? []), { conditionId: definition.id, fallbackName: definition.name, origins: [origin] }];
  return { ...character, activeConditions };
}

export function removeSceneConditionOrigin(character: Character, conditionId: string, originId: string): Character {
  const activeConditions = (character.activeConditions ?? []).flatMap((condition) => {
    if (condition.conditionId !== conditionId) return [condition];
    const origins = condition.origins.filter((origin) => origin.id !== originId || origin.kind !== "scene");
    return origins.length ? [{ ...condition, origins }] : [];
  });
  return activeConditions.length === (character.activeConditions ?? []).length && activeConditions.every((condition, index) => condition === character.activeConditions?.[index]) ? character : { ...character, activeConditions };
}

export function renderSceneStates(character: Character, deps: Pick<CharacterConditionDependencies, "catalog" | "escapeHtml">, effectsMarkup: string, effectCount: number): string {
  const conditions = character.activeConditions ?? [];
  const conditionCount = conditions.length;
  const summary = [conditionCount ? `${conditionCount} ${conditionCount === 1 ? "condição" : "condições"}` : "", effectCount ? `${effectCount} ${effectCount === 1 ? "efeito" : "efeitos"}` : ""].filter(Boolean).join(" · ") || "Sem estados ativos";
  return `<section class="active-effects-band scene-states-band" aria-labelledby="scene-states-title"><div class="active-effects-heading scene-states-heading"><div><span>Estado atual</span><h2 id="scene-states-title">Estados em cena</h2></div><div class="scene-states-actions"><strong>${deps.escapeHtml(summary)}</strong><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="open-character-condition-picker">+ Adicionar condição</button></div></div>${conditionCount ? `<section class="scene-state-group" aria-labelledby="active-conditions-title"><div class="scene-state-group-heading"><h3 id="active-conditions-title">Condições</h3><span>${conditionCount}</span></div><div class="active-condition-list">${conditions.map((condition) => renderConditionToken(condition, deps)).join("")}</div></section>` : ""}${effectsMarkup || (!conditionCount ? '<p class="scene-states-empty">Nenhuma condição ou efeito ativo.</p>' : "")}</section>`;
}

export function renderCharacterConditionDialogs(deps: CharacterConditionDependencies): string {
  return `${renderPicker(deps)}${renderDetail(deps)}`;
}

export function handleCharacterConditionAction(target: HTMLElement, deps: CharacterConditionDependencies): boolean {
  if (target.closest('[data-action="open-character-condition-picker"]')) {
    deps.state.characterConditionPickerOpen = true;
    deps.state.characterConditionPickerSearch = "";
    deps.render();
    return true;
  }
  if (target.closest('[data-action="close-character-condition-picker"]')) {
    deps.state.characterConditionPickerOpen = false;
    deps.state.characterConditionPickerSearch = "";
    deps.render();
    return true;
  }
  const detail = target.closest<HTMLElement>("[data-character-condition-detail-id]");
  if (detail) {
    deps.state.characterConditionDetailId = detail.dataset.characterConditionDetailId;
    deps.render();
    return true;
  }
  if (target.closest('[data-action="close-character-condition-detail"]')) {
    deps.state.characterConditionDetailId = undefined;
    deps.render();
    return true;
  }
  const apply = target.closest<HTMLElement>("[data-action=\"apply-character-condition\"]");
  if (apply) {
    const id = apply.dataset.conditionId;
    const definition = deps.catalog.conditions.find((condition) => condition.id === id);
    const sourceInput = apply.closest<HTMLElement>(".character-condition-picker-modal")?.querySelector<HTMLInputElement>("[data-character-condition-source]");
    if (!definition || !deps.state.character) return true;
    void saveAppliedCondition(addSceneCondition(deps.state.character, definition, sourceInput?.value), deps);
    return true;
  }
  const remove = target.closest<HTMLElement>("[data-action=\"remove-character-condition-origin\"]");
  if (remove && deps.state.character) {
    const { conditionId, originId } = remove.dataset;
    if (!conditionId || !originId) return true;
    void saveRemovedOrigin(removeSceneConditionOrigin(deps.state.character, conditionId, originId), deps);
    return true;
  }
  return false;
}

export function handleCharacterConditionEscape(event: KeyboardEvent, deps: CharacterConditionDependencies): boolean {
  if (event.key !== "Escape" || (!deps.state.characterConditionPickerOpen && !deps.state.characterConditionDetailId)) return false;
  deps.state.characterConditionPickerOpen = false;
  deps.state.characterConditionPickerSearch = "";
  deps.state.characterConditionDetailId = undefined;
  deps.render();
  return true;
}

function renderConditionToken(condition: CharacterActiveCondition, deps: Pick<CharacterConditionDependencies, "catalog" | "escapeHtml">): string {
  const definition = deps.catalog.conditions.find((entry) => entry.id === condition.conditionId);
  const name = definition?.name ?? condition.fallbackName;
  const artwork = definition ? getConditionArtwork(definition) : undefined;
  const art = artwork ? `<span class="active-condition-art has-image" style="background-image: url('${deps.escapeHtml(artwork)}')" aria-hidden="true"></span>` : '<span class="active-condition-art condition-glyph" aria-hidden="true">◈</span>';
  const summary = definition?.effect ?? "Os detalhes desta condição ficarão disponíveis quando o Pack de origem for instalado.";
  return `<button class="active-condition" type="button" data-character-condition-detail-id="${deps.escapeHtml(condition.conditionId)}" aria-label="Ver detalhes da condição ${deps.escapeHtml(name)}">${art}<span><strong>${deps.escapeHtml(name)}</strong><small>${deps.escapeHtml(summary)}</small></span><i aria-hidden="true">›</i></button>`;
}

function renderPicker(deps: CharacterConditionDependencies): string {
  if (!deps.state.characterConditionPickerOpen) return "";
  const query = deps.state.characterConditionPickerSearch.trim().toLocaleLowerCase("pt-BR");
  const entries = [...deps.catalog.conditions].filter((condition) => !query || [condition.name, condition.summary, condition.effect].join(" ").toLocaleLowerCase("pt-BR").includes(query)).sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  return `<div class="modal-backdrop" data-modal-backdrop><section class="modal character-condition-picker-modal sf-scroll-region" role="dialog" aria-modal="true" aria-labelledby="character-condition-picker-title"><button class="modal-close" type="button" data-action="close-character-condition-picker" aria-label="Fechar seleção de condição">×</button><header><span class="resource-modal-label">Estados em cena</span><h2 id="character-condition-picker-title">Adicionar condição</h2><p>Registre uma condição causada pela cena, por uma criatura ou por decisão do mestre.</p></header><label class="sf-search-field search-box"><span aria-hidden="true">⌕</span><input type="search" data-character-condition-search value="${deps.escapeHtml(deps.state.characterConditionPickerSearch)}" placeholder="Pesquisar condição" aria-label="Pesquisar condição" /></label><label class="form-field character-condition-source-field"><span>Origem na cena <em>opcional</em></span><input data-character-condition-source maxlength="160" placeholder="Ex.: Ataque do Guardião da Cripta" /><small>Se ficar em branco, será registrada como “Aplicada na cena”.</small></label><div class="character-condition-picker-list">${entries.map((entry) => renderPickerOption(entry, deps)).join("") || '<p class="scene-states-empty">Nenhuma condição disponível. Importe ou crie uma no Compendium.</p>'}</div></section></div>`;
}

function renderPickerOption(entry: ConditionDefinition, deps: CharacterConditionDependencies): string {
  const alreadyApplied = deps.state.character?.activeConditions?.find((condition) => condition.conditionId === entry.id)?.origins.some((origin) => origin.kind === "scene") ?? false;
  const art = getConditionArtwork(entry);
  return `<article class="character-condition-picker-option">${art ? `<span class="active-condition-art has-image" style="background-image: url('${deps.escapeHtml(art)}')" aria-hidden="true"></span>` : '<span class="active-condition-art condition-glyph" aria-hidden="true">◈</span>'}<div><h3>${deps.escapeHtml(entry.name)}</h3><p>${deps.escapeHtml(entry.summary)}</p><small>${deps.escapeHtml(entry.effect)}</small></div><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="apply-character-condition" data-condition-id="${deps.escapeHtml(entry.id)}" ${alreadyApplied ? "disabled" : ""}>${alreadyApplied ? "Já aplicada" : "Aplicar"}</button></article>`;
}

function renderDetail(deps: CharacterConditionDependencies): string {
  const condition = deps.state.character?.activeConditions?.find((entry) => entry.conditionId === deps.state.characterConditionDetailId);
  if (!condition) return "";
  const definition = deps.catalog.conditions.find((entry) => entry.id === condition.conditionId);
  const name = definition?.name ?? condition.fallbackName;
  const art = definition ? getConditionArtwork(definition) : undefined;
  const artwork = art ? `<div class="compendium-entry-detail-art has-image condition-art" style="background-image: url('${deps.escapeHtml(art)}')" aria-hidden="true"></div>` : '<div class="compendium-entry-detail-art condition-glyph" aria-hidden="true">◈</div>';
  return `<div class="modal-backdrop" data-modal-backdrop><section class="compendium-entry-detail-modal condition-detail-modal character-condition-detail-modal" role="dialog" aria-modal="true" aria-labelledby="character-condition-detail-title"><button class="modal-close" type="button" data-action="close-character-condition-detail" aria-label="Fechar detalhes da condição">×</button>${artwork}<div class="compendium-entry-detail-body"><span class="resource-modal-label">Condição ativa</span><h2 id="character-condition-detail-title">${deps.escapeHtml(name)}</h2>${definition ? `<p class="compendium-entry-detail-summary">${deps.escapeHtml(definition.summary)}</p><section class="compendium-entry-detail-section"><h3>Efeito</h3><p>${deps.escapeHtml(definition.effect)}</p></section><section class="compendium-entry-detail-section"><h3>Como encerrar</h3><p>${deps.escapeHtml(definition.clearing)}</p></section>${definition.rulesNotes?.length ? `<section class="compendium-entry-detail-section"><h3>Observações de regra</h3><ul class="transformation-question-list">${definition.rulesNotes.map((note) => `<li>${deps.escapeHtml(note)}</li>`).join("")}</ul></section>` : ""}` : '<p class="compendium-entry-detail-summary">A referência foi preservada, mas o Pack que descreve esta condição não está instalado.</p>'}<section class="compendium-entry-detail-section character-condition-origins"><h3>Origens ativas</h3>${condition.origins.map((origin) => `<div><span><strong>${deps.escapeHtml(origin.kind === "stress" ? "Último Estresse" : "Cena")}</strong><small>${deps.escapeHtml(origin.label)}</small></span>${origin.kind === "scene" ? `<button class="sf-action sf-action--danger sf-action--compact" type="button" data-action="remove-character-condition-origin" data-condition-id="${deps.escapeHtml(condition.conditionId)}" data-origin-id="${deps.escapeHtml(origin.id)}">Remover</button>` : '<small class="condition-locked-origin">Limpe ao menos 1 Estresse para encerrar.</small>'}</div>`).join("")}</section></div></section></div>`;
}

async function saveAppliedCondition(character: Character, deps: CharacterConditionDependencies): Promise<void> {
  deps.state.character = character;
  await deps.saveCharacter(character);
  deps.state.characterConditionPickerOpen = false;
  deps.state.characterConditionPickerSearch = "";
  deps.render();
}

async function saveRemovedOrigin(character: Character, deps: CharacterConditionDependencies): Promise<void> {
  deps.state.character = character;
  await deps.saveCharacter(character);
  if (!character.activeConditions?.some((condition) => condition.conditionId === deps.state.characterConditionDetailId)) deps.state.characterConditionDetailId = undefined;
  deps.render();
}
