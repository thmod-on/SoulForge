import type { Character } from "../../domain/types";
import type { Catalog } from "../../domain/catalog";
import { getActiveFeatureEffects, getFeatureActivationForCharacter } from "../feature-effects/featureEffects";
import { renderFeatureActivation } from "../feature-effects/renderFeatureActivation";
import { getCharacterFieldDisplayValue, getCharacterFieldSources, getDefinitionSelectionValues } from "../feature-fields/featureFields";

export type TraitsRenderDependencies = {
  catalog: Catalog;
  featureActivationError?: string;
  escapeHtml: (value: string) => string;
  renderEmptyInline: (message: string) => string;
};

export function renderTraits(character: Character, dependencies: TraitsRenderDependencies): string {
  const { escapeHtml, renderEmptyInline } = dependencies;
  const activeIds = new Set(getActiveFeatureEffects(character, dependencies.catalog).map((effect) => effect.feature.id));
  const selectedIds = new Set(Object.values(character.identity.ancestryFeatureIds ?? {}));
  const ancestryFeatures = dependencies.catalog.features.filter((feature) => selectedIds.has(feature.id) && getFeatureActivationForCharacter(character, dependencies.catalog, feature.id));
  const ancestryControls = ancestryFeatures.length ? `<section class="band"><div class="section-heading"><h2>Habilidades de ancestralidade</h2></div><div class="character-identity-feature-grid">${ancestryFeatures.map((feature) => `<article class="character-identity-feature"><h3>${escapeHtml(feature.name)}</h3><p>${escapeHtml(feature.summary)}</p>${renderFeatureActivation(feature.id, feature.activation!, activeIds.has(feature.id), escapeHtml)}</article>`).join("")}</div>${dependencies.featureActivationError ? `<p class="form-error">${escapeHtml(dependencies.featureActivationError)}</p>` : ""}</section>` : "";
  const classChoices = getCharacterFieldSources(character, dependencies.catalog);
  const classChoiceSection = classChoices.length ? `<section class="band traits-class-choice-section"><div class="section-heading"><div><h2>Escolhas de classe</h2><p>Detalhes definidos pelas Features da classe e da subclasse.</p></div></div><div class="class-choice-grid">${classChoices.map(({ feature }) => {
    const values = getDefinitionSelectionValues(character.definitionSelections, feature.id);
    const hasValues = (feature.characterFields ?? []).some((field) => Boolean(values[field.id]));
    const displayValues = (feature.characterFields ?? []).map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd class="${values[field.id] ? "" : "is-empty"}">${escapeHtml(getCharacterFieldDisplayValue(field, values[field.id]))}</dd></div>`).join("");
    const fields = (feature.characterFields ?? []).map((field) => {
      const shared = `data-character-field-edit data-character-field-id="${escapeHtml(field.id)}" data-character-field-saved-value="${escapeHtml(values[field.id] ?? "")}"`;
      const value = values[field.id] ?? "";
      const control = field.kind === "select"
        ? `<select ${shared}>${field.options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>`
        : `<input ${shared} value="${escapeHtml(value)}" ${field.maxLength ? `maxlength="${field.maxLength}"` : ""} ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""} ${field.suggestions?.length ? `list="traits-field-${escapeHtml(feature.id)}-${escapeHtml(field.id)}"` : ""}/>${field.suggestions?.length ? `<datalist id="traits-field-${escapeHtml(feature.id)}-${escapeHtml(field.id)}">${field.suggestions.map((suggestion) => `<option value="${escapeHtml(suggestion)}"></option>`).join("")}</datalist>` : ""}`;
      return `<label class="form-field"><span>${escapeHtml(field.label)}</span>${control}${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</label>`;
    }).join("");
    return `<article class="class-choice-card" data-character-field-source="${escapeHtml(feature.id)}"><header><h3>${escapeHtml(feature.name)}</h3><p>${escapeHtml(feature.summary)}</p></header><dl class="class-choice-values" data-character-field-view>${displayValues}</dl><button type="button" class="sf-action sf-action--secondary" data-character-field-action="edit">${hasValues ? "Editar escolhas" : "Definir escolhas"}</button><div class="class-choice-editor" data-character-field-editor hidden><div class="form-grid">${fields}</div><p class="form-error" role="alert" tabindex="-1" data-character-field-error hidden></p><div class="class-choice-actions"><button type="button" class="sf-action sf-action--secondary" data-character-field-action="cancel">Cancelar</button><button type="button" class="sf-action sf-action--primary" data-character-field-action="save">Salvar</button></div></div></article>`;
  }).join("")}</div></section>` : "";
  const experiences = character.experiences.length
    ? `<div class="experience-grid">${character.experiences.map((experience) => `<article class="experience-card"><div><strong>${escapeHtml(experience.name)}</strong>${experience.description ? `<p>${escapeHtml(experience.description)}</p>` : ""}</div><span>+${experience.value}</span></article>`).join("")}</div>`
    : renderEmptyInline("Nenhuma experiência registrada.");

  return `<main class="content traits-content"><div class="screen-title"><div><h1>Traços</h1><p>Experiências que representam a história, os conhecimentos e os talentos do personagem.</p></div></div>${ancestryControls}${classChoiceSection}<section class="traits-experience-section band"><div class="section-heading"><h2>Experiências</h2></div>${experiences}</section></main>`;
}
