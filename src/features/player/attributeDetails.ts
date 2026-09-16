import type { Attribute, Character } from "../../domain/types";
import { characterCreationAttributes } from "../character-creation/attributeAllocation";

export type AttributeDetailState = { attributeDetailId?: Attribute["id"] };

const legacyLabels: Record<string, string> = {
  AGI: "Agilidade",
  FOR: "Força",
  FIN: "Finesse",
  INS: "Instinto",
  PRE: "Presença",
  CON: "Conhecimento"
};

export function getAttributeLabel(label: string): string {
  return legacyLabels[label] ?? label;
}

export function getAttributeReference(attributeId: string | undefined) {
  return characterCreationAttributes.find((attribute) => attribute.id === attributeId);
}

export function handleAttributeDetailAction(target: HTMLElement, state: AttributeDetailState, render: () => void): boolean {
  const button = target.closest<HTMLElement>('[data-action="open-attribute-detail"]');
  if (!button) return false;
  const reference = getAttributeReference(button.dataset.attributeId);
  if (reference) {
    state.attributeDetailId = reference.id;
    render();
  }
  return true;
}

export function handleAttributeDetailEscape(event: KeyboardEvent, state: AttributeDetailState, render: () => void): boolean {
  if (event.key !== "Escape" || !state.attributeDetailId) return false;
  state.attributeDetailId = undefined;
  render();
  return true;
}

export function renderAttributeDetailModal(
  character: Character,
  attributeId: Attribute["id"] | undefined,
  spellcastAttributeId: string | undefined,
  escapeHtml: (value: string) => string
): string {
  const reference = getAttributeReference(attributeId);
  const attribute = character.attributes.find((entry) => entry.id === attributeId);
  if (!reference || !attribute) return "";

  const isSpellcast = attribute.id === spellcastAttributeId;
  const status = [attribute.upgraded ? "Aprimorado" : "", isSpellcast ? "Atributo de Conjuração" : ""].filter(Boolean);
  const value = attribute.value > 0 ? `+${attribute.value}` : String(attribute.value);

  return `<div class="modal-backdrop attribute-detail-backdrop" data-modal-backdrop><section class="container-modal attribute-detail-modal" role="dialog" aria-modal="true" aria-labelledby="attribute-detail-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar detalhes de ${escapeHtml(reference.label)}">×</button><span class="resource-modal-label">Atributo</span><header class="attribute-detail-heading"><div class="attribute-detail-title"><h2 id="attribute-detail-title">${escapeHtml(reference.label)}</h2><strong aria-label="Valor atual ${escapeHtml(value)}">${escapeHtml(value)}</strong></div><p>Use este atributo quando a ação envolver:</p></header><ul class="attribute-reference-verbs" aria-label="Verbos de referência">${reference.verbs.map((verb) => `<li>${escapeHtml(verb)}</li>`).join("")}</ul>${status.length ? `<div class="attribute-detail-status" aria-label="Características do atributo">${status.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>` : ""}</section></div>`;
}
