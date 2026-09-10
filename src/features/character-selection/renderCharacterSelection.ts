import type { Character } from "../../domain/types";
import { editorNavigation } from "../../app/navigation";

function renderCharacterCard(character: Character, demoCharacterId: string, escapeHtml: (value: string) => string): string {
  const name = escapeHtml(character.identity.name);
  const portrait = character.identity.portraitImage
    ? `<img src="${escapeHtml(character.identity.portraitImage)}" alt="" />`
    : `<span class="character-select-placeholder" aria-hidden="true"><img src="assets/brand/soulforge-symbol.png" alt="" /><strong>${escapeHtml(character.identity.name.slice(0, 1).toUpperCase())}</strong></span>`;
  const cardAction = character.id === demoCharacterId
    ? '<span class="character-demo-label">Ficha demo</span>'
    : `<details class="character-card-menu"><summary aria-label="Ações de ${name}" title="Ações do personagem">•••</summary><div><button type="button" data-action="request-delete-character" data-character-id="${escapeHtml(character.id)}" aria-label="Excluir ${name}" title="Excluir personagem">Excluir personagem</button></div></details>`;

  return `<article class="character-select-entry"><button class="character-select-card" type="button" data-action="select-character" data-character-id="${escapeHtml(character.id)}" aria-label="Abrir ficha de ${name}"><span class="character-select-art">${portrait}</span><span class="character-select-body"><strong>${name}</strong><small>${escapeHtml(character.identity.className)} · ${escapeHtml(character.identity.ancestry)}</small><em>Nível ${character.identity.level}</em></span></button>${cardAction}</article>`;
}

function getNavigationIcon(page: "compendium" | "settings"): string {
  return editorNavigation.find((item) => item.page === page)?.icon ?? "";
}

const importIcon = '<svg class="sf-navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3"/><path d="M3 16v3a2 2 0 0 0 2 2"/></svg>';

export function renderCharacterSelection(characters: Character[], demoCharacterId: string, escapeHtml: (value: string) => string): string {
  const cards = characters.map((character) => renderCharacterCard(character, demoCharacterId, escapeHtml)).join("");
  const characterContent = cards
    ? `<section class="character-select-carousel" aria-label="Personagens salvos"><button class="sf-action sf-action--icon sf-action--secondary character-carousel-control is-previous" type="button" data-action="scroll-character-carousel" data-carousel-direction="-1" aria-label="Ver personagens anteriores" title="Personagens anteriores" hidden>‹</button><div class="character-select-track" data-character-carousel tabindex="0" aria-label="Lista de personagens">${cards}</div><button class="sf-action sf-action--icon sf-action--secondary character-carousel-control is-next" type="button" data-action="scroll-character-carousel" data-carousel-direction="1" aria-label="Ver próximos personagens" title="Próximos personagens" hidden>›</button></section>`
    : `<div class="empty-state"><h2>Nenhuma ficha encontrada</h2><p>Crie seu primeiro personagem para iniciar a aventura.</p></div>`;

  return `<main class="character-gate"><span class="character-gate-watermark-halo" aria-hidden="true"></span><img class="character-gate-watermark" src="assets/brand/soulforge-symbol.png" alt="" aria-hidden="true" /><section class="character-gate-panel"><div class="character-gate-brand"><img class="character-gate-brand-mark" src="assets/brand/soulforge-symbol.png" alt="" aria-hidden="true" /><div><strong>SOULFORGE</strong><span>Escolha uma ficha para continuar</span></div></div><div class="character-gate-heading"><div class="character-gate-intro"><h1>Personagens</h1><p>Suas fichas ficam salvas somente neste dispositivo.</p></div><div class="character-gate-actions"><button class="sf-action sf-action--primary primary-action character-gate-new-action" type="button" data-action="new-character">+ Novo personagem</button><div class="character-gate-utilities" aria-label="Ações auxiliares"><button class="sf-action sf-action--secondary secondary-action character-import-action" type="button" data-action="open-character-import">${importIcon}<span>Importar</span></button><button class="sf-action sf-action--icon sf-action--secondary character-gate-utility-icon" type="button" data-page="compendium" aria-label="Compendium" title="Compendium"><span aria-hidden="true">${getNavigationIcon("compendium")}</span></button><button class="sf-action sf-action--icon sf-action--secondary character-gate-utility-icon" type="button" data-page="settings" aria-label="Configurações" title="Configurações"><span aria-hidden="true">${getNavigationIcon("settings")}</span></button></div></div></div>${characterContent}</section></main>`;
}
