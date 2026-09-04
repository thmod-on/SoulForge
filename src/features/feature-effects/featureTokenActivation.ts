import type { Catalog } from "../../domain/catalog";
import type { Character, FeatureActivationDefinition } from "../../domain/types";
import { getFeatureActivationForCharacter } from "./featureEffects";
import { activateFeatureEffect, changeFeatureEffectTokens, endFeatureEffect, type FeatureEffectActionDependencies } from "./featureEffectActions";

export type FeatureTokenActivationDialogState = {
  featureId: string;
  rolledValue?: number;
};

type TokenActivationState = { character?: Character; featureTokenActivation?: FeatureTokenActivationDialogState; featureActivationError?: string };

export function handleFeatureEffectAction(target: HTMLElement, deps: FeatureEffectActionDependencies & { state: TokenActivationState; catalog: Catalog }): boolean {
  if (handleFeatureTokenActivationAction(target, deps)) return true;
  const activateButton = target.closest<HTMLElement>('[data-action="activate-feature-effect"]');
  if (activateButton) {
    const featureId = activateButton.dataset.featureId;
    if (needsFeatureTokenActivationDialog(deps.state.character, deps.catalog, featureId)) {
      deps.state.featureTokenActivation = { featureId: featureId! };
      deps.state.featureActivationError = undefined;
      deps.render();
      return true;
    }
    const effectTarget = activateButton.dataset.effectTarget;
    void activateFeatureEffect(featureId, deps, undefined, effectTarget === "self" || effectTarget === "ally" ? effectTarget : undefined);
    return true;
  }
  const changeTokensButton = target.closest<HTMLElement>('[data-action="change-feature-effect-tokens"]');
  if (changeTokensButton) {
    void changeFeatureEffectTokens(changeTokensButton.dataset.featureId, Number(changeTokensButton.dataset.tokenDelta), deps);
    return true;
  }
  const endButton = target.closest<HTMLElement>('[data-action="end-feature-effect"]');
  if (endButton) {
    void endFeatureEffect(endButton.dataset.featureId, deps);
    return true;
  }
  return false;
}

export function needsFeatureTokenActivationDialog(character: Character | undefined, catalog: Catalog, featureId: string | undefined): boolean {
  if (!character || !featureId) return false;
  const tokens = getFeatureActivationForCharacter(character, catalog, featureId)?.tokens;
  return tokens?.initial.kind === "roll" || tokens?.initial.kind === "manual";
}

export function renderFeatureTokenActivationDialog(deps: { state: TokenActivationState; catalog: Catalog; escapeHtml(value: string): string }): string {
  const character = deps.state.character;
  const dialog = deps.state.featureTokenActivation;
  if (!character || !dialog) return "";
  const feature = deps.catalog.features.find((entry) => entry.id === dialog.featureId);
  const activation = feature && getFeatureActivationForCharacter(character, deps.catalog, feature.id);
  const tokens = activation?.tokens;
  if (!feature || !activation || !tokens) return "";

  const title = `Ativar ${feature.name}`;
  if (tokens.initial.kind === "roll") {
    const rolled = dialog.rolledValue;
    const bonus = tokens.initial.bonus ?? 0;
    const total = rolled === undefined ? undefined : rolled + bonus;
    return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal feature-token-activation-dialog" role="dialog" aria-modal="true" aria-labelledby="feature-token-activation-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar ativação">x</button><span class="resource-modal-label">${tokens.initial.die}</span><h2 id="feature-token-activation-title">${deps.escapeHtml(title)}</h2>${total === undefined ? `<p>Role para definir as fichas de <strong>${deps.escapeHtml(tokens.label)}</strong> desta ativação.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="roll-feature-effect-tokens">Rolar ${tokens.initial.die}${bonus ? ` + ${bonus}` : ""}</button></div>` : `<p><strong>${deps.escapeHtml(tokens.label)}:</strong> ${rolled}${bonus ? ` + ${bonus}` : ""} = <strong>${total}</strong></p><p>Você poderá gastar as fichas na área de Efeitos ativos.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="retry-feature-effect-tokens">Rolar novamente</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-feature-effect-tokens" data-feature-token-value="${total}">Ativar efeito</button></div>`}</section></div>`;
  }

  const initial = tokens.initial;
  const min = initial.kind === "manual" ? initial.min ?? 1 : 1;
  const maximum = initial.kind === "manual" && initial.maximumResourceId
    ? character.resources.find((resource) => resource.id === initial.maximumResourceId)
    : undefined;
  const max = maximum ? Math.max(0, maximum.max - maximum.value) : undefined;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal feature-token-activation-dialog" role="dialog" aria-modal="true" aria-labelledby="feature-token-activation-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar ativação">x</button><h2 id="feature-token-activation-title">${deps.escapeHtml(title)}</h2><p>Informe quantas fichas de <strong>${deps.escapeHtml(tokens.label)}</strong> deseja criar.${maximum ? ` A quantidade também será marcada em ${deps.escapeHtml(maximum.label)}.` : ""}</p><label class="form-field"><span>Fichas</span><input type="number" min="${min}" ${max !== undefined ? `max="${max}"` : ""} value="${min}" data-feature-token-value-input /></label>${max !== undefined && max < min ? '<p class="form-error">Não há recursos suficientes para criar uma ficha.</p>' : ""}<div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-feature-effect-tokens" ${max !== undefined && max < min ? "disabled" : ""}>Ativar efeito</button></div></section></div>`;
}

export function handleFeatureTokenActivationAction(target: HTMLElement, deps: FeatureEffectActionDependencies & { state: TokenActivationState; catalog: Catalog }): boolean {
  const state = deps.state;
  const dialog = state.featureTokenActivation;
  if (!dialog) return false;
  const character = state.character;
  const activation = character ? getFeatureActivationForCharacter(character, deps.catalog, dialog.featureId) : undefined;
  const tokens = activation?.tokens;
  if (!character || !activation || !tokens) return false;

  if (target.closest('[data-action="roll-feature-effect-tokens"]')) {
    if (tokens.initial.kind !== "roll") return true;
    state.featureTokenActivation = { ...dialog, rolledValue: rollDie(tokens.initial.die) };
    deps.render();
    return true;
  }
  if (target.closest('[data-action="retry-feature-effect-tokens"]')) {
    state.featureTokenActivation = { featureId: dialog.featureId };
    deps.render();
    return true;
  }
  if (!target.closest('[data-action="confirm-feature-effect-tokens"]')) return false;
  const valueFromButton = target.closest<HTMLElement>('[data-feature-token-value]')?.dataset.featureTokenValue;
  const valueFromInput = document.querySelector<HTMLInputElement>("[data-feature-token-value-input]")?.value;
  const tokenValue = Number(valueFromButton ?? valueFromInput);
  const error = validateTokenValue(character, activation, tokenValue);
  if (error) {
    state.featureActivationError = error;
    deps.render();
    return true;
  }
  state.featureTokenActivation = undefined;
  void activateFeatureEffect(dialog.featureId, deps, tokenValue);
  return true;
}

function validateTokenValue(character: Character, activation: FeatureActivationDefinition, value: number): string | undefined {
  const initial = activation.tokens?.initial;
  if (!initial || !Number.isInteger(value) || value < 0) return "A quantidade de fichas é inválida.";
  if (initial.kind === "manual") {
    const min = initial.min ?? 1;
    if (value < min) return `Informe pelo menos ${min} ficha${min === 1 ? "" : "s"}.`;
    if (initial.maximumResourceId) {
      const resource = character.resources.find((entry) => entry.id === initial.maximumResourceId);
      if (!resource || value > resource.max - resource.value) return "Não há espaços disponíveis neste recurso para criar essas fichas.";
    }
  }
  return undefined;
}

function rollDie(die: string): number {
  const faces = Number(die.slice(1));
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return random[0] % faces + 1;
}
