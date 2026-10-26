import { patchSurface } from "../../app/patchSurface";
import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { getActiveDefinitionRestAction, getDefinitionChoiceOptions } from "../transformations/transformationChoices";
import { getRestMoveLimit, getRestMoves, requiresRestRoll, restMoveDescription, restMoveLabels, type DefinitionRestMoveChoice, type RestKind, type RestMoveChoice } from "./restRules";
import { canContinueRestLoadout, getRestLoadoutDraft, getRestVaultCardIds, type RestLoadoutStage } from "./restLoadout";
import { getUnavailableCard } from "../player/cardAvailability";

export type RestRenderDependencies = { escapeHtml: (value: string) => string; catalog: Catalog };

/** Atualiza somente o diálogo de descanso, evitando remontar a ficha a cada escolha. */
export function renderRestModalInPlace(root: HTMLElement, character: Character | undefined, kind: RestKind | undefined, choices: RestMoveChoice[], error: string | undefined, deps: RestRenderDependencies, stage?: RestLoadoutStage, activeCardIds?: string[]): boolean {
  return patchSurface(root, ".rest-modal", renderRestModal(character, kind, choices, error, deps, stage, activeCardIds), { scrollSelector: ".rest-modal" });
}

export function renderRestModal(character: Character | undefined, kind: RestKind | undefined, choices: RestMoveChoice[], error: string | undefined, deps: RestRenderDependencies, stage: RestLoadoutStage = "moves", activeCardIds = character ? getRestLoadoutDraft(character) : []): string {
  if (!character || !kind) return "";
  if (stage === "loadout") return renderRestLoadoutModal(character, error, deps, activeCardIds);
  const selected = choices.length;
  const limit = getRestMoveLimit(character, deps.catalog);
  const options = getRestMoves(kind).map((move) => {
    const count = choices.filter((choice) => choice.id === move).length;
    return `<button type="button" class="rest-move-option ${count ? "is-selected" : ""}" data-action="choose-rest-move" data-rest-move="${move}" ${selected >= limit && !count ? "disabled" : ""}><strong>${restMoveLabels[move]}</strong><span>${restMoveDescription(kind, move)}</span>${count ? `<small>${count} ${count === 1 ? "escolha" : "escolhas"}</small>` : ""}</button>`;
  }).join("");
  const contextual = renderDefinitionActionOption(character, choices, selected, limit, deps);
  const selectedMoves = choices.map((choice, index) => renderSelectedMove(kind, choice, index, deps)).join("");
  const limitLabel = limit === 1 ? "um movimento" : `${limit} movimentos`;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="rest-modal sf-scroll-region" role="dialog" aria-modal="true" aria-labelledby="rest-modal-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar descanso">×</button><div class="rest-modal-heading"><h2 id="rest-modal-title">Descanso</h2></div><div class="rest-kind-switch" role="tablist" aria-label="Tipo de descanso"><button class="sf-tab ${kind === "short" ? "is-active" : ""}" type="button" data-action="set-rest-kind" data-rest-kind="short" role="tab" aria-selected="${kind === "short"}">Breve</button><button class="sf-tab ${kind === "long" ? "is-active" : ""}" type="button" data-action="set-rest-kind" data-rest-kind="long" role="tab" aria-selected="${kind === "long"}">Longo</button></div><p class="rest-guidance">Escolha ${limitLabel}.</p><div class="rest-move-options">${options}${contextual}</div><section class="rest-selections"><div class="section-heading"><h3>Movimentos escolhidos</h3><span>${selected}/${limit}</span></div>${selectedMoves || `<p>Escolha até ${limitLabel} de descanso.</p>`}</section>${error ? `<p class="form-error">${deps.escapeHtml(error)}</p>` : ""}<div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-rest" ${selected !== limit ? "disabled" : ""}>Concluir descanso</button></div></section></div>`;
}

function renderRestLoadoutModal(character: Character, error: string | undefined, deps: RestRenderDependencies, activeCardIds: string[]): string {
  const cards = new Map(deps.catalog.cards.map((card) => [card.id, card]));
  const cardName = (cardId: string) => cards.get(cardId)?.name ?? "Carta indisponível";
  const art = (cardId: string) => { const card = cards.get(cardId); return card?.image ? `<img src="${deps.escapeHtml(card.image)}" alt="" draggable="false" />` : '<span aria-hidden="true">✦</span>'; };
  const slots = Array.from({ length: 5 }, (_, index) => {
    const cardId = activeCardIds[index];
    if (!cardId) return `<li class="rest-loadout-slot rest-loadout-slot--empty" data-rest-loadout-slot data-rest-loadout-slot-index="${index}" data-rest-loadout-slot-empty="true"><span>${index + 1}</span><small>Espaço livre</small></li>`;
    const name = deps.escapeHtml(cardName(cardId));
    const unavailable = getUnavailableCard(character, cardId);
    return `<li class="rest-loadout-slot" data-rest-loadout-slot data-rest-loadout-slot-index="${index}"><article class="rest-loadout-mini-card ${unavailable ? "is-unavailable" : ""}" data-rest-loadout-drag-card data-rest-loadout-source="loadout" data-card-id="${deps.escapeHtml(cardId)}" draggable="false"><button type="button" class="rest-loadout-mini-preview" data-action="view-rest-loadout-card" data-card-id="${deps.escapeHtml(cardId)}" aria-label="Ver detalhes de ${name}"><span class="rest-loadout-mini-art">${art(cardId)}</span><strong>${name}</strong>${unavailable ? '<em>Indisponível</em>' : ""}</button><div class="rest-loadout-card-actions" data-rest-loadout-fallback><button type="button" class="icon-action" data-action="rest-loadout-move" data-card-id="${deps.escapeHtml(cardId)}" data-direction="-1" aria-label="Mover ${name} para a esquerda" ${index === 0 ? "disabled" : ""}>←</button><button type="button" class="icon-action" data-action="rest-loadout-move" data-card-id="${deps.escapeHtml(cardId)}" data-direction="1" aria-label="Mover ${name} para a direita" ${index === activeCardIds.length - 1 ? "disabled" : ""}>→</button><button type="button" class="icon-action rest-loadout-remove" data-action="rest-loadout-remove" data-card-id="${deps.escapeHtml(cardId)}" aria-label="Mover ${name} ao Vault">×</button></div></article></li>`;
  }).join("");
  const vaultIds = getRestVaultCardIds(character, activeCardIds);
  const vault = vaultIds.map((cardId) => { const name = deps.escapeHtml(cardName(cardId)); return `<li class="rest-vault-mini-card" data-rest-loadout-drag-card data-rest-loadout-source="vault" data-card-id="${deps.escapeHtml(cardId)}" draggable="false"><button type="button" class="rest-loadout-mini-preview" data-action="view-rest-loadout-card" data-card-id="${deps.escapeHtml(cardId)}" aria-label="Ver detalhes de ${name}"><span class="rest-loadout-mini-art">${art(cardId)}</span><strong>${name}</strong></button><button type="button" class="rest-vault-add" data-action="rest-loadout-add" data-card-id="${deps.escapeHtml(cardId)}" ${activeCardIds.length >= 5 ? "disabled" : ""}>Adicionar</button></li>`; }).join("");
  return `<div class="modal-backdrop" data-modal-backdrop><section class="rest-modal rest-modal--loadout sf-scroll-region" role="dialog" aria-modal="true" aria-labelledby="rest-modal-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar descanso">×</button><div class="rest-modal-heading rest-modal-heading--loadout"><h2 id="rest-modal-title">Organizar Loadout</h2><span class="rest-loadout-count">${activeCardIds.length}/5</span></div><p class="rest-guidance rest-loadout-guidance">Arraste as cartas entre o Vault e o Loadout antes de escolher movimentos. Toque em uma carta para ler seu efeito.</p><section class="rest-loadout-section"><div class="section-heading"><h3>Loadout</h3><span>Cartas ativas</span></div><ol class="rest-loadout-slots">${slots}</ol></section><section class="rest-loadout-section" data-rest-vault-dropzone><div class="section-heading"><h3>Vault</h3><span>${vaultIds.length} ${vaultIds.length === 1 ? "carta disponível" : "cartas disponíveis"}</span></div><ul class="rest-vault-grid sf-scroll-region">${vault || "<li>Nenhuma carta disponível no Vault.</li>"}</ul></section>${error ? `<p class="form-error">${deps.escapeHtml(error)}</p>` : ""}<div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="continue-rest-moves" ${canContinueRestLoadout(character, activeCardIds) ? "" : "disabled"}>Continuar para movimentos</button></div></section></div>`;
}

export function renderRestLoadoutCardDetailModal(cardId: string | undefined, deps: RestRenderDependencies): string {
  const card = cardId ? deps.catalog.cards.find((entry) => entry.id === cardId) : undefined;
  if (!card) return "";
  const domain = deps.catalog.domains.find((entry) => entry.id === card.domainId);
  return `<div class="modal-backdrop rest-loadout-detail-backdrop" data-rest-loadout-detail-backdrop><section class="card-modal rest-loadout-card-detail-modal" role="dialog" aria-modal="true" aria-labelledby="rest-loadout-card-detail-title"><button class="modal-close" type="button" data-action="close-rest-loadout-card-detail" aria-label="Voltar ao Loadout">×</button><div class="modal-card-art ${card.image ? "has-image" : ""}" ${card.image ? `style="background-image: url('${deps.escapeHtml(card.image)}')"` : ""}></div><div class="modal-card-body"><div class="modal-card-kicker"><span>${deps.escapeHtml(domain?.name ?? "Sem domínio")}</span><span>Nível ${card.tier}</span></div><h2 id="rest-loadout-card-detail-title">${deps.escapeHtml(card.name)}</h2><div class="modal-card-meta"><span>${deps.escapeHtml(card.cardType)}</span><span>${deps.escapeHtml(card.cost ?? "Sem custo")}</span><span>⚡ Recall: ${card.recallCost ?? 0} Estresse</span></div><h3>Efeito</h3><p>${deps.escapeHtml(card.effect)}</p></div></section></div>`;
}

function renderDefinitionActionOption(character: Character, choices: RestMoveChoice[], selected: number, limit: number, deps: RestRenderDependencies): string {
  const active = getActiveDefinitionRestAction(character, deps.catalog);
  const chosen = choices.some((choice) => choice.id === "definition-action" && choice.sourceDefinitionId === active?.source.id && choice.actionId === active.action.id);
  const transformation = deps.catalog.transformations.find((entry) => entry.id === character.identity.transformationId);
  const missingPack = Boolean(character.identity.transformationId && !transformation);
  const sourcePack = transformation ? deps.catalog.packs.find((pack) => pack.id === transformation.packId) : undefined;
  const unavailableMessage = missingPack ? "A transformação ativa está indisponível. Importe novamente o Pack para mudar de forma." : transformation ? `A transformação ativa não oferece esta ação. Verifique se o Pack${sourcePack ? ` “${sourcePack.name}”` : ""} está atualizado.` : "Disponível quando uma transformação permitir mudar de forma.";
  const unavailable = !active || chosen || selected >= limit;
  const status = chosen ? "Movimento escolhido" : !active ? unavailableMessage : selected >= limit ? "Remova um movimento para escolher este." : "Ocupa um movimento de descanso.";
  return `<button type="button" class="rest-move-option rest-move-option--contextual ${chosen ? "is-selected" : ""} ${!active ? "is-unavailable" : ""}" data-action="choose-definition-rest-action" ${active ? `data-source-definition-id="${deps.escapeHtml(active.source.id)}" data-definition-rest-action-id="${deps.escapeHtml(active.action.id)}"` : ""} aria-disabled="${unavailable}"><strong>${deps.escapeHtml(active?.action.label ?? "Mudar de forma")}</strong><span>${deps.escapeHtml(active?.action.description ?? "Escolha uma ancestralidade e uma de suas Features durante o descanso.")}</span><small>${deps.escapeHtml(status)}</small></button>`;
}

function renderSelectedMove(kind: RestKind, choice: RestMoveChoice, index: number, deps: RestRenderDependencies): string {
  if (choice.id === "definition-action") return renderSelectedDefinitionAction(choice, index, deps);
  return `<article class="rest-choice"><div><strong>${index + 1}. ${restMoveLabels[choice.id]}</strong><span>${requiresRestRoll(kind, choice.id) ? `Resultado: ${choice.roll ? choice.roll : "a definir"}` : restMoveDescription(kind, choice.id)}</span></div>${requiresRestRoll(kind, choice.id) ? `<div class="rest-roll-controls"><button type="button" data-action="roll-rest-d4" data-rest-choice-index="${index}">Rolar d4</button><label><span>Resultado</span><input data-rest-roll-index="${index}" type="number" min="1" max="4" value="${choice.roll ?? ""}" /></label></div>` : ""}<button type="button" class="icon-action" data-action="remove-rest-move" data-rest-choice-index="${index}" aria-label="Remover escolha">×</button></article>`;
}

function renderSelectedDefinitionAction(choice: DefinitionRestMoveChoice, index: number, deps: RestRenderDependencies): string {
  const source = deps.catalog.transformations.find((entry) => entry.id === choice.sourceDefinitionId);
  const action = source?.restActions?.find((entry) => entry.id === choice.actionId);
  if (!source || !action) return `<article class="rest-choice"><div><strong>${index + 1}. Ação indisponível</strong><span>A Definition que oferecia este movimento não está instalada.</span></div><button type="button" class="icon-action" data-action="remove-rest-move" data-rest-choice-index="${index}" aria-label="Remover escolha">×</button></article>`;
  const fields = action.choiceIds.map((choiceId) => {
    const definition = source.choices?.find((entry) => entry.id === choiceId);
    if (!definition) return "";
    const options = getDefinitionChoiceOptions(definition, choice.values, deps.catalog);
    const selectedOption = options.find((entry) => entry.id === choice.values[definition.id]);
    return `<label class="form-field"><span>${deps.escapeHtml(definition.label)}</span><select data-rest-definition-choice-index="${index}" data-definition-choice-id="${deps.escapeHtml(definition.id)}">${options.map((entry) => `<option value="${deps.escapeHtml(entry.id)}" ${entry.id === choice.values[definition.id] ? "selected" : ""}>${deps.escapeHtml(entry.label)}</option>`).join("")}</select><small>${deps.escapeHtml(selectedOption?.description ?? "Nenhuma opção compatível está disponível no Compendium.")}</small></label>`;
  }).join("");
  return `<article class="rest-choice rest-choice--definition"><div><strong>${index + 1}. ${deps.escapeHtml(action.label)}</strong><span>${deps.escapeHtml(action.description)}</span></div><div class="rest-definition-choice-fields">${fields}</div><button type="button" class="icon-action" data-action="remove-rest-move" data-rest-choice-index="${index}" aria-label="Remover escolha">×</button></article>`;
}
