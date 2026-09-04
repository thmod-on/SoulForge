import type { Character } from "../../domain/types";
import type { Catalog } from "../../domain/catalog";
import { getActiveFeatureEffects, getFeatureActivationForCharacter } from "../feature-effects/featureEffects";
import { renderFeatureActivation } from "../feature-effects/renderFeatureActivation";

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
  const experiences = character.experiences.length
    ? `<div class="experience-grid">${character.experiences.map((experience) => `<article class="experience-card"><div><strong>${escapeHtml(experience.name)}</strong>${experience.description ? `<p>${escapeHtml(experience.description)}</p>` : ""}</div><span>+${experience.value}</span></article>`).join("")}</div>`
    : renderEmptyInline("Nenhuma experiência registrada.");

  return `<main class="content traits-content"><div class="screen-title"><div><h1>Traços</h1><p>Experiências que representam a história, os conhecimentos e os talentos do personagem.</p></div></div>${ancestryControls}<section class="traits-experience-section band"><div class="section-heading"><h2>Experiências</h2></div>${experiences}</section></main>`;
}
