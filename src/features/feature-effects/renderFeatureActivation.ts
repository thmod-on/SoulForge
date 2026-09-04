import type { FeatureActivationDefinition } from "../../domain/types";

/** Shared controls for declarative activations, including effects bestowed on allies. */
export function renderFeatureActivation(featureId: string, activation: FeatureActivationDefinition, active: boolean, escapeHtml: (value: string) => string): string {
  const button = (label: string, target?: "self" | "ally") => `<button class="feature-activation-button" type="button" data-action="activate-feature-effect" data-feature-id="${escapeHtml(featureId)}" ${target ? `data-effect-target="${target}"` : active ? "disabled" : ""}>${escapeHtml(label)}</button>`;
  const costs = activation.costs.flatMap((cost) => cost.kind === "resource" ? [`${cost.amount === "per-token" ? "1 por ficha" : cost.amount} ${({ stress: "Estresse", hope: "Esperança" } as Record<string, string>)[cost.resourceId] ?? cost.resourceId}`] : []);
  return `<div class="feature-activation-controls">${activation.target === "self-or-ally" ? `${button(active ? "Reativar em mim" : "Ativar em mim", "self")}${button(active ? "Reativar em aliado" : "Ativar em aliado", "ally")}` : button(active ? "Efeito ativo" : activation.label)}${costs.length ? `<small>Custo por ativação: ${escapeHtml(costs.join(" · "))}</small>` : ""}</div>`;
}
