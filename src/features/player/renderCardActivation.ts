import type { CardDefinition, ResourceTrack } from "../../domain/types";

type CardActivationRenderOptions = {
  incomingCard: CardDefinition;
  activeCards: CardDefinition[];
  stress?: ResourceTrack;
  error?: string;
  escapeHtml: (value: string) => string;
  getDomainInfo: (domainId: string) => { name: string; color: string } | undefined;
};

const restIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/></svg>';
const stressIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 2-9 12h8l-1 8 9-12h-8z"/></svg>';

function renderCardArt(card: CardDefinition, escapeHtml: (value: string) => string): string {
  return card.image
    ? `<img src="${escapeHtml(card.image)}" alt="" />`
    : '<span aria-hidden="true">✦</span>';
}

function renderSwapCard(card: CardDefinition, options: CardActivationRenderOptions): string {
  const domain = options.getDomainInfo(card.domainId);
  return `<label class="card-activation-swap-card" style="--card-domain-color: ${options.escapeHtml(domain?.color ?? "#8e4fc4")}"><input type="radio" name="recall-swap-card" value="${options.escapeHtml(card.id)}" data-recall-swap-card data-card-name="${options.escapeHtml(card.name)}" /><span class="card-activation-swap-art">${renderCardArt(card, options.escapeHtml)}</span><span class="card-activation-swap-copy"><strong>${options.escapeHtml(card.name)}</strong><small>${options.escapeHtml(domain?.name ?? "Domínio")} · Nível ${card.tier}</small></span><i aria-hidden="true">✓</i></label>`;
}

export function renderCardActivationModal(options: CardActivationRenderOptions): string {
  const { incomingCard, activeCards, stress, escapeHtml } = options;
  const domain = options.getDomainInfo(incomingCard.domainId);
  const recallCost = incomingCard.recallCost ?? 0;
  const loadoutFull = activeCards.length >= 5;
  const canActivateNow = Boolean(stress) && (stress?.value ?? 0) + recallCost <= (stress?.max ?? 0);
  const remainingStress = stress ? Math.max(0, stress.max - stress.value) : 0;
  const swapStep = loadoutFull
    ? `<div class="card-activation-swap-list" role="radiogroup" aria-label="Carta que irá para o Vault">${activeCards.map((card) => renderSwapCard(card, options)).join("")}</div>`
    : '<div class="card-activation-open-slot"><span aria-hidden="true">+</span><div><strong>Há espaço no Loadout</strong><small>Nenhuma carta precisa voltar para o Vault.</small></div></div>';

  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal card-activation-modal" role="dialog" aria-modal="true" aria-labelledby="activate-card-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar ativação">×</button><header class="card-activation-header"><span class="resource-modal-label">Vault para Loadout</span><h2 id="activate-card-title">Mover para o Loadout</h2><p>Confira a carta, escolha a troca e defina quando ela será ativada.</p></header><article class="card-activation-incoming" style="--card-domain-color: ${escapeHtml(domain?.color ?? "#8e4fc4")}"><span class="card-activation-incoming-art">${renderCardArt(incomingCard, escapeHtml)}</span><div><small>Carta que entra</small><strong>${escapeHtml(incomingCard.name)}</strong><span>${escapeHtml(domain?.name ?? "Domínio")} · Nível ${incomingCard.tier}</span></div><em>Recall ${recallCost}</em></article><div class="card-activation-frame" data-card-activation-dialog data-requires-swap="${loadoutFull}" data-incoming-name="${escapeHtml(incomingCard.name)}" data-recall-cost="${recallCost}"><section class="card-activation-step"><header><b>1</b><div><strong>${loadoutFull ? "Escolha a carta que irá para o Vault" : "Espaço no Loadout"} </strong><small>${loadoutFull ? "O Loadout já possui cinco cartas." : "A nova carta ocupará o espaço disponível."}</small></div></header>${swapStep}</section><section class="card-activation-step"><header><b>2</b><div><strong>Quando deseja fazer a troca?</strong><small>O momento define se haverá custo de Stress.</small></div></header><div class="card-activation-options" role="radiogroup" aria-label="Momento da ativação"><label class="card-activation-option"><input type="radio" name="card-activation-mode" value="rest" data-card-activation-mode /><span class="card-activation-option-icon">${restIcon}</span><span><strong>Durante um descanso</strong><small>A troca é gratuita.</small></span><em>Sem custo</em></label><label class="card-activation-option card-activation-option--immediate ${canActivateNow ? "" : "is-disabled"}"><input type="radio" name="card-activation-mode" value="stress" data-card-activation-mode ${canActivateNow ? "" : "disabled"} /><span class="card-activation-option-icon">${stressIcon}</span><span><strong>Trocar agora</strong><small>${stress ? `${stress.value}/${stress.max} marcados · ${remainingStress} restantes` : "Marcador de Stress indisponível"}</small></span><em>+${recallCost} Stress</em></label></div></section><aside class="card-activation-summary" aria-live="polite"><strong>Resumo da troca</strong><p><span>${escapeHtml(incomingCard.name)}</span> entrará no Loadout.</p><p data-card-activation-swap-summary>${loadoutFull ? "Escolha qual carta retornará ao Vault." : "O Loadout possui um espaço livre."}</p><p data-card-activation-cost-summary>Escolha quando a troca será realizada.</p></aside>${options.error ? `<p class="form-error" data-card-activation-error role="alert">${escapeHtml(options.error)}</p>` : ""}</div><footer class="card-activation-footer"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-stored-card-activation" disabled>Confirmar troca</button></footer></section></div>`;
}

export function syncCardActivationDialog(root: ParentNode): void {
  const dialog = root.querySelector<HTMLElement>("[data-card-activation-dialog]");
  if (!dialog) return;
  const selectedSwap = dialog.querySelector<HTMLInputElement>("[data-recall-swap-card]:checked");
  const selectedMode = dialog.querySelector<HTMLInputElement>("[data-card-activation-mode]:checked");
  const requiresSwap = dialog.dataset.requiresSwap === "true";
  const swapSummary = dialog.querySelector<HTMLElement>("[data-card-activation-swap-summary]");
  const costSummary = dialog.querySelector<HTMLElement>("[data-card-activation-cost-summary]");
  const confirm = root.querySelector<HTMLButtonElement>('[data-action="confirm-stored-card-activation"]');
  if (swapSummary) swapSummary.textContent = selectedSwap ? `${selectedSwap.dataset.cardName ?? "A carta escolhida"} irá para o Vault.` : requiresSwap ? "Escolha qual carta retornará ao Vault." : "O Loadout possui um espaço livre.";
  if (costSummary) costSummary.textContent = selectedMode?.value === "rest" ? "Custo: nenhum durante um descanso." : selectedMode?.value === "stress" ? `Custo: ${dialog.dataset.recallCost ?? "0"} Stress.` : "Escolha quando a troca será realizada.";
  if (confirm) confirm.disabled = !selectedMode || (requiresSwap && !selectedSwap);
}
