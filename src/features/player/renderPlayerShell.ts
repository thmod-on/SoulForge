import type { Character } from "../../domain/types";
import type { Page } from "../../app/types";

type NavigationItem = { page: Page; label: string; icon?: string };

export type PlayerShellState = { page: Page };

export type PlayerShellDependencies = {
  state: PlayerShellState;
  appVersion: string;
  topNavigation: readonly NavigationItem[];
  editorNavigation: readonly NavigationItem[];
  escapeHtml: (value: string) => string;
  attributeTitle: (label: string) => string;
  progressPercent: (value: number, max: number) => number;
};

export function renderSidebar(character: Character, dependencies: PlayerShellDependencies): string {
  const { appVersion, escapeHtml, attributeTitle } = dependencies;
  return `<aside class="sidebar"><div class="portrait"><div class="portrait-art"></div><div><strong>${escapeHtml(character.identity.name)}</strong><span>${escapeHtml(character.identity.ancestry)} - ${escapeHtml(character.identity.className)}</span></div></div><section class="sidebar-section"><div class="sidebar-section-title">Atributos</div><div class="sidebar-attribute-grid">${character.attributes.map((attribute) => `<div class="attribute-badge ${attribute.upgraded ? "is-upgraded" : ""}"><span title="${attribute.label}">${attributeTitle(attribute.label)}</span><strong>${attribute.value}</strong></div>`).join("")}</div></section><section class="sidebar-section"><div class="sidebar-section-title">Combate</div><div class="sidebar-defense-grid"><div class="defense-badge defense-evasion"><strong>${character.defense.evasion}</strong><span>Evasao</span></div><div class="defense-badge defense-armor"><strong>${character.defense.armor}</strong><span>Armadura</span></div><div class="defense-badge defense-minor"><strong>${character.defense.minor}</strong><span>Dano menor</span></div><div class="defense-badge defense-major"><strong>${character.defense.major}</strong><span>Dano maior</span></div></div><div class="proficiency-marker" title="Proficiencia"><span aria-hidden="true">⚄</span><small>Proficiencia</small><strong>${character.proficiency}</strong></div></section><footer class="sidebar-footer" title="A PWA instala o app e guarda a interface para uso offline."><button class="sidebar-character-button" type="button" data-action="open-character-select" title="Trocar personagem">Personagens</button><span class="sidebar-offline-status"><i aria-hidden="true"></i>Pronto offline</span><span>v${appVersion}</span></footer></aside>`;
}

export function renderTopbar(dependencies: PlayerShellDependencies): string {
  const { state, topNavigation, editorNavigation } = dependencies;
  return `<header class="topbar"><nav class="top-nav" aria-label="Menu do personagem">${topNavigation.map((item) => `<button class="top-link ${state.page === item.page ? "is-active" : ""}" data-page="${item.page}">${item.label}</button>`).join("")}</nav><nav class="topbar-utilities" aria-label="Menu global">${editorNavigation.map((item) => `<button class="topbar-utility ${state.page === item.page ? "is-active" : ""}" data-page="${item.page}" aria-label="${item.label}" title="${item.label}"><span aria-hidden="true">${item.icon ?? ""}</span></button>`).join("")}</nav><div class="topbar-brand" aria-label="SoulForge"><div class="brand-mark"><img src="assets/brand/soulforge-symbol.png" alt="" /></div><strong>SOULFORGE</strong></div></header>`;
}

export function renderEditorHeader(dependencies: PlayerShellDependencies): string {
  const { state, editorNavigation } = dependencies;
  return `<header class="editor-header"><div class="editor-brand"><div class="brand-mark"><img src="assets/brand/soulforge-symbol.png" alt="" /></div><div><strong>SOULFORGE</strong><span>Modo Editor</span></div></div><nav class="editor-nav" aria-label="Areas globais">${editorNavigation.map((item) => `<button class="editor-nav-button ${state.page === item.page ? "is-active" : ""}" type="button" data-page="${item.page}"><span aria-hidden="true">${item.icon ?? ""}</span>${item.label}</button>`).join("")}</nav><div class="editor-context"><button class="secondary-action" type="button" data-action="back-player-mode">Voltar a ficha</button></div></header>`;
}

export function renderResources(character: Character, dependencies: PlayerShellDependencies): string {
  const { escapeHtml } = dependencies;
  return `<section class="band resources-band" aria-labelledby="resources-title"><div class="section-heading"><h2 id="resources-title">Recursos</h2></div><div class="resource-grid">${character.resources.map((resource) => `<button class="resource-card tone-${resource.tone}" data-resource-id="${resource.id}"><div class="resource-card-header"><span>${escapeHtml(resource.label)}</span><strong>${resource.value} / ${resource.max}</strong></div>${renderResourceIndicator(resource, dependencies)}</button>`).join("")}<button class="resource-add-card" data-action="add-resource"><span>+</span>Adicionar recurso</button></div></section>`;
}

export function renderResourceIndicator(resource: Character["resources"][number], dependencies: PlayerShellDependencies): string {
  if (resource.max > 10) return `<div class="resource-meter" aria-hidden="true"><i style="width: ${dependencies.progressPercent(resource.value, resource.max)}%"></i></div>`;
  if (resource.id === "armor-slots") return `<div class="shield-pips" aria-hidden="true">${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}</div>`;
  return `<div class="pips" aria-hidden="true">${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}</div>`;
}
