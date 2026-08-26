import type { Character } from "../../domain/types";

export type TraitsRenderDependencies = {
  escapeHtml: (value: string) => string;
  renderEmptyInline: (message: string) => string;
};

export function renderTraits(character: Character, dependencies: TraitsRenderDependencies): string {
  const { escapeHtml, renderEmptyInline } = dependencies;
  const experiences = character.experiences.length
    ? `<div class="experience-grid">${character.experiences.map((experience) => `<article class="experience-card"><div><strong>${escapeHtml(experience.name)}</strong>${experience.description ? `<p>${escapeHtml(experience.description)}</p>` : ""}</div><span>+${experience.value}</span></article>`).join("")}</div>`
    : renderEmptyInline("Nenhuma experiência registrada.");

  return `<main class="content traits-content"><div class="screen-title"><div><h1>Traços</h1><p>Experiências que representam a história, os conhecimentos e os talentos do personagem.</p></div></div><section class="traits-experience-section band"><div class="section-heading"><h2>Experiências</h2></div>${experiences}</section></main>`;
}
