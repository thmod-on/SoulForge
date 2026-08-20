import type { Character, Defense } from "../../domain/types";
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
  getEffectiveDefense: (character: Character) => Defense;
  getSpellcastAttributeId: (character: Character) => string | undefined;
};

export function renderSidebar(character: Character, dependencies: PlayerShellDependencies): string {
  const { appVersion, escapeHtml, attributeTitle, progressPercent, getEffectiveDefense, getSpellcastAttributeId } = dependencies;
  const defense = getEffectiveDefense(character);
  const spellcastAttributeId = getSpellcastAttributeId(character);
  const portrait = character.identity.portraitImage ? `<img src="${escapeHtml(character.identity.portraitImage)}" alt="Retrato de ${escapeHtml(character.identity.name)}" />` : "";
  const portraitAction = portrait ? ' data-action="open-character-portrait-preview" title="Ampliar foto"' : "";
  return `<aside class="sidebar"><div class="portrait"><button class="portrait-art ${portrait ? "has-image is-expandable" : ""}" type="button"${portraitAction} aria-label="${portrait ? `Ampliar retrato de ${escapeHtml(character.identity.name)}` : "Retrato indisponivel"}" ${portrait ? "" : "disabled"}>${portrait}</button><div><strong>${escapeHtml(character.identity.name)}</strong>${character.identity.community ? `<small>${escapeHtml(character.identity.community)}</small>` : ""}</div><button class="portrait-change" type="button" data-action="open-character-portrait">Alterar foto</button></div><section class="sidebar-section"><div class="sidebar-section-title">Atributos</div><div class="sidebar-attribute-grid">${character.attributes.map((attribute) => { const isSpellcast = attribute.id === spellcastAttributeId; return `<div class="attribute-badge ${attribute.upgraded ? "is-upgraded" : ""} ${isSpellcast ? "is-spellcast" : ""}"><span title="${attribute.label}">${attributeTitle(attribute.label)}</span>${isSpellcast ? '<i class="attribute-spellcast-icon" role="img" aria-label="Atributo de Conjuração" title="Atributo de Conjuração">🪄</i>' : ""}<strong>${attribute.value}</strong></div>`; }).join("")}</div></section><section class="sidebar-section sidebar-combat-section"><div class="sidebar-section-title">Combate</div><div class="combat-primary-grid"><div class="combat-primary-stat combat-primary-evasion"><strong>${defense.evasion}</strong><span>Evasão</span></div><div class="combat-primary-stat combat-primary-armor"><strong>${defense.armor}</strong><span>Armadura</span></div><div class="combat-primary-stat combat-primary-proficiency" title="Proficiência"><strong>${character.proficiency}</strong><span>Proficiência</span></div></div><div class="combat-threshold-strip"><div class="combat-threshold combat-threshold-minor"><strong>${defense.minor}</strong><span>Limiar menor</span></div><div class="combat-threshold combat-threshold-major"><strong>${defense.major}</strong><span>Limiar maior</span></div></div></section><footer class="sidebar-footer" title="A PWA instala o app e guarda a interface para uso offline."><div class="sidebar-level-status" aria-label="Nível e experiência"><span>Nível ${character.identity.level}</span><strong>${character.identity.xp} / ${character.identity.nextLevelXp} XP</strong><i aria-hidden="true"><b style="width: ${progressPercent(character.identity.xp, character.identity.nextLevelXp)}%"></b></i></div><div class="sidebar-footer-actions"><button class="sidebar-character-button" type="button" data-action="open-character-select" title="Trocar personagem">Personagens</button><span class="sidebar-offline-status"><i aria-hidden="true"></i>Pronto offline</span><span>v${appVersion}</span></div></footer></aside>`;
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
  return `<section class="band resources-band" aria-labelledby="resources-title"><div class="section-heading"><h2 id="resources-title">Recursos</h2><button class="resource-add-button" type="button" data-action="add-resource"><span>+</span>Adicionar recurso</button></div><div class="resource-grid">${character.resources.map((resource) => `<article class="resource-card tone-${resource.tone}"><div class="resource-card-header"><span>${escapeHtml(resource.id === "armor-slots" ? "Armadura" : resource.label)}</span><strong>${resource.value} / ${resource.max}</strong></div><div class="resource-card-footer">${renderResourceIndicator(resource, dependencies)}<div class="resource-card-controls"><button type="button" data-resource-adjust="-1" data-resource-id="${resource.id}" aria-label="Reduzir ${escapeHtml(resource.label)}" title="Reduzir" ${resource.value <= 0 ? "disabled" : ""}>−</button><button type="button" data-resource-adjust="1" data-resource-id="${resource.id}" aria-label="Aumentar ${escapeHtml(resource.label)}" title="Aumentar" ${resource.value >= resource.max ? "disabled" : ""}>+</button></div></div></article>`).join("")}</div></section>`;
}

export function renderResourceIndicator(resource: Character["resources"][number], dependencies: PlayerShellDependencies): string {
  if (resource.max > 10) return `<div class="resource-meter" aria-hidden="true"><i style="width: ${dependencies.progressPercent(resource.value, resource.max)}%"></i></div>`;
  if (resource.id === "armor-slots") return `<div class="shield-pips" aria-hidden="true">${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}</div>`;
  return `<div class="pips" aria-hidden="true">${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}</div>`;
}
