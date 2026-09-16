import type { Character, CharacterScar } from "../../domain/types";

export type CharacterScarUiState = {
  character?: Character;
  characterScarsOpen: boolean;
  deletingCharacterScarId?: string;
};

export type CharacterScarDependencies = {
  state: CharacterScarUiState;
  escapeHtml: (value: string) => string;
  saveCharacter: (character: Character) => Promise<void>;
  render: () => void;
};

export function addCharacterScar(character: Character, scar: CharacterScar): Character {
  return { ...character, scars: [...(character.scars ?? []), scar] };
}

export function removeCharacterScar(character: Character, scarId: string): Character {
  const scars = (character.scars ?? []).filter((scar) => scar.id !== scarId);
  return scars.length === (character.scars?.length ?? 0) ? character : { ...character, scars };
}

export function renderCharacterScarDialogs({ state, escapeHtml }: CharacterScarDependencies): string {
  const character = state.character;
  if (!state.characterScarsOpen || !character) return "";
  const scars = character.scars ?? [];
  const deleting = scars.find((scar) => scar.id === state.deletingCharacterScarId);
  if (deleting) return `<div class="modal-backdrop character-scar-backdrop"><section class="container-modal danger-modal character-scar-confirm" role="dialog" aria-modal="true" aria-labelledby="remove-character-scar-title"><button class="modal-close" type="button" data-character-scar-action="cancel-remove" aria-label="Cancelar remoção">×</button><span class="resource-modal-label">Remover Cicatriz</span><h2 id="remove-character-scar-title">Remover esta Cicatriz?</h2><p>“${escapeHtml(deleting.narrative)}” será removida da ficha.</p><div class="danger-summary"><strong>+1</strong><span>O limite máximo de Esperança será restaurado em um ponto.</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-character-scar-action="cancel-remove">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-character-scar-action="confirm-remove" data-character-scar-id="${escapeHtml(deleting.id)}">Remover Cicatriz</button></div></section></div>`;
  const hope = character.resources.find((resource) => resource.id === "hope");
  const effectiveLimit = hope?.max ?? 0;
  const limitBeforeScars = effectiveLimit + scars.length;
  const canAdd = Boolean(hope) && effectiveLimit > 0;
  return `<div class="modal-backdrop character-scar-backdrop"><section class="container-modal character-scar-modal sf-scroll-region" role="dialog" aria-modal="true" aria-labelledby="character-scars-title">
    <div class="container-modal-heading"><h2 id="character-scars-title">Cicatrizes</h2><button class="modal-close modal-close-inline" type="button" data-character-scar-action="close" aria-label="Fechar Cicatrizes">×</button></div>
    <p class="character-scar-intro">Cada Cicatriz registra uma consequência narrativa da morte e reduz permanentemente em 1 o limite de Esperança, até que o mestre decida removê-la.</p>
    <div class="character-scar-equation" aria-label="Limite de Esperança: ${limitBeforeScars} menos ${scars.length} Cicatrizes, igual a ${effectiveLimit}"><span>Limite sem Cicatrizes<strong>${limitBeforeScars}</strong></span><b aria-hidden="true">−</b><span>${scars.length === 1 ? "Cicatriz" : "Cicatrizes"}<strong>${scars.length}</strong></span><b aria-hidden="true">=</b><span>Limite atual<strong>${effectiveLimit}</strong></span></div>
    ${renderScarList(scars, escapeHtml)}
    ${renderScarForm(hope, effectiveLimit, canAdd)}
  </section></div>`;
}

function renderScarList(scars: CharacterScar[], escapeHtml: (value: string) => string): string {
  const entries = scars.length ? scars.map((scar) => `<article class="character-scar-entry"><div><p>${escapeHtml(scar.narrative)}</p><time datetime="${escapeHtml(scar.createdAt)}">Registrada em ${formatScarDate(scar.createdAt)}</time></div><button class="sf-action sf-action--danger sf-action--compact" type="button" data-character-scar-action="prepare-remove" data-character-scar-id="${escapeHtml(scar.id)}" aria-label="Remover Cicatriz: ${escapeHtml(scar.narrative)}">Remover</button></article>`).join("") : '<div class="character-scar-empty"><span aria-hidden="true">◇</span><p>Nenhuma Cicatriz registrada.</p></div>';
  return `<section class="character-scar-list" aria-labelledby="registered-scars-title"><h3 id="registered-scars-title">Cicatrizes registradas</h3>${entries}</section>`;
}

function renderScarForm(hope: Character["resources"][number] | undefined, effectiveLimit: number, canAdd: boolean): string {
  const warning = effectiveLimit === 1 ? '<p class="character-scar-last-warning" role="alert"><strong>Último espaço de Esperança</strong>Esta Cicatriz reduzirá o limite atual a zero.</p>' : !hope ? '<p class="character-scar-last-warning" role="alert">Esta ficha não possui o recurso Esperança.</p>' : effectiveLimit === 0 ? '<p class="character-scar-last-warning" role="alert">Não há outro espaço de Esperança disponível para uma nova Cicatriz.</p>' : "";
  return `<form class="character-scar-form" data-character-scar-form><h3>Nova Cicatriz</h3><label class="form-field"><span>Lembrete narrativo *</span><textarea data-character-scar-narrative maxlength="500" rows="4" placeholder="Ex.: O som de correntes desperta o medo de voltar à cripta."></textarea><small>Descreva o trauma, gatilho ou marca que deve acompanhar a personagem.</small></label><p class="form-error" data-character-scar-error hidden></p>${warning}<button class="sf-action sf-action--primary primary-action" type="submit" data-character-scar-action="add" ${canAdd ? "" : "disabled"}>Adicionar Cicatriz</button></form>`;
}

export function handleCharacterScarAction(target: HTMLElement, dependencies: CharacterScarDependencies): boolean {
  const button = target.closest<HTMLElement>("[data-character-scar-action]");
  const action = button?.dataset.characterScarAction;
  if (!action) return false;
  const { state } = dependencies;
  if (action === "open") { state.characterScarsOpen = true; state.deletingCharacterScarId = undefined; dependencies.render(); return true; }
  if (action === "close") { state.characterScarsOpen = false; state.deletingCharacterScarId = undefined; dependencies.render(); return true; }
  if (action === "prepare-remove") { state.deletingCharacterScarId = button.dataset.characterScarId; dependencies.render(); return true; }
  if (action === "cancel-remove") { state.deletingCharacterScarId = undefined; dependencies.render(); return true; }
  if (action === "add") { void saveNewScar(button, dependencies); return true; }
  if (action === "confirm-remove") { void deleteScar(button.dataset.characterScarId, dependencies); return true; }
  return false;
}

export function handleCharacterScarEscape(event: KeyboardEvent, dependencies: CharacterScarDependencies): boolean {
  if (event.key !== "Escape" || !dependencies.state.characterScarsOpen) return false;
  if (dependencies.state.deletingCharacterScarId) dependencies.state.deletingCharacterScarId = undefined;
  else dependencies.state.characterScarsOpen = false;
  dependencies.render();
  return true;
}

async function saveNewScar(button: HTMLElement, dependencies: CharacterScarDependencies): Promise<void> {
  const form = button.closest<HTMLFormElement>("[data-character-scar-form]");
  const input = form?.querySelector<HTMLTextAreaElement>("[data-character-scar-narrative]");
  const error = form?.querySelector<HTMLElement>("[data-character-scar-error]");
  const character = dependencies.state.character;
  const narrative = input?.value.trim() ?? "";
  if (!narrative) { showError(error, "Descreva a Cicatriz antes de registrá-la."); input?.focus(); return; }
  const hope = character?.resources.find((resource) => resource.id === "hope");
  if (!character || !hope || hope.max <= 0) { showError(error, "Não há espaço de Esperança disponível para esta Cicatriz."); return; }
  const now = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? `scar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const updated = addCharacterScar(character, { id, narrative, createdAt: now });
  dependencies.state.character = updated;
  await dependencies.saveCharacter(updated);
  dependencies.render();
}

async function deleteScar(scarId: string | undefined, dependencies: CharacterScarDependencies): Promise<void> {
  const character = dependencies.state.character;
  if (!character || !scarId) return;
  const updated = removeCharacterScar(character, scarId);
  dependencies.state.character = updated;
  dependencies.state.deletingCharacterScarId = undefined;
  await dependencies.saveCharacter(updated);
  dependencies.render();
}

function showError(element: HTMLElement | null | undefined, message: string): void {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function formatScarDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "data desconhecida" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
