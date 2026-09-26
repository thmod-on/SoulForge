import type { Character } from "../../domain/types";
import { createCustomResource, isCustomResource, removeCustomResource } from "../../domain/customResources";

export type CustomResourceUiState = {
  character?: Character;
  addResourceModalOpen?: boolean;
  deletingCustomResourceId?: string;
};

type CustomResourceDependencies = {
  state: CustomResourceUiState;
  escapeHtml: (value: string) => string;
  saveCharacter: (character: Character) => Promise<void>;
  render: () => void;
};

export function renderAddCustomResourceModal(state: CustomResourceUiState): string {
  if (!state.addResourceModalOpen) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal resource-create-modal" role="dialog" aria-modal="true" aria-labelledby="add-resource-title"><div class="container-modal-heading"><h2 id="add-resource-title">Novo recurso</h2><button class="modal-close modal-close-inline" type="button" data-modal-close aria-label="Fechar">x</button></div><p>Crie um controle próprio para esta ficha. Ele ficará salvo somente neste personagem.</p><div class="resource-form-grid"><label class="form-field resource-form-wide"><span>Nome *</span><input data-add-resource-label type="text" maxlength="40" placeholder="Ex.: Cargas Arcanas" /></label><label class="form-field"><span>Valor atual *</span><input data-add-resource-value type="number" min="0" value="0" /></label><label class="form-field"><span>Valor máximo *</span><input data-add-resource-max type="number" min="1" value="1" /></label><label class="form-field resource-form-wide"><span>Cor</span><select data-add-resource-tone><option value="focus">Azul</option><option value="hope">Esperança</option><option value="stress">Estresse</option><option value="hp">PV</option><option value="shadow">Essência</option></select></label></div><p class="form-error" data-add-resource-error hidden></p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="save-resource">Criar recurso</button></div></section></div>`;
}

export function renderRemoveCustomResourceModal(state: CustomResourceUiState, escapeHtml: (value: string) => string): string {
  const resource = state.character?.resources.find((entry) => entry.id === state.deletingCustomResourceId);
  if (!resource || !isCustomResource(resource)) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="remove-custom-resource-title"><button class="modal-close" type="button" data-action="cancel-remove-custom-resource" aria-label="Cancelar remoção">×</button><span class="resource-modal-label">Recurso customizado</span><h2 id="remove-custom-resource-title">Remover recurso?</h2><p><strong>${escapeHtml(resource.label)}</strong>, atualmente em ${resource.value} / ${resource.max}, será removido desta ficha.</p><div class="danger-summary"><strong>!</strong><span>Esta ação não pode ser desfeita.</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-remove-custom-resource">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-remove-custom-resource">Remover recurso</button></div></section></div>`;
}

export function handleCustomResourceAction(target: HTMLElement, dependencies: CustomResourceDependencies): boolean {
  if (target.closest('[data-action="add-resource"]')) {
    dependencies.state.addResourceModalOpen = true;
    dependencies.render();
    return true;
  }
  if (target.closest('[data-action="save-resource"]')) {
    void createResource(dependencies);
    return true;
  }
  const request = target.closest<HTMLElement>('[data-action="request-remove-custom-resource"]');
  if (request) {
    const resource = dependencies.state.character?.resources.find((entry) => entry.id === request.dataset.resourceId);
    if (resource && isCustomResource(resource)) dependencies.state.deletingCustomResourceId = resource.id;
    dependencies.render();
    return true;
  }
  if (target.closest('[data-action="cancel-remove-custom-resource"]')) {
    dependencies.state.deletingCustomResourceId = undefined;
    dependencies.render();
    return true;
  }
  if (!target.closest('[data-action="confirm-remove-custom-resource"]')) return false;
  const character = dependencies.state.character;
  const resourceId = dependencies.state.deletingCustomResourceId;
  if (!character || !resourceId) return true;
  const result = removeCustomResource(character, resourceId);
  dependencies.state.deletingCustomResourceId = undefined;
  if (result instanceof Error) {
    dependencies.render();
    return true;
  }
  dependencies.state.character = result;
  void dependencies.saveCharacter(result).then(dependencies.render);
  return true;
}

async function createResource(dependencies: CustomResourceDependencies): Promise<void> {
  const character = dependencies.state.character;
  if (!character) return;
  const labelInput = document.querySelector<HTMLInputElement>("[data-add-resource-label]");
  const valueInput = document.querySelector<HTMLInputElement>("[data-add-resource-value]");
  const maxInput = document.querySelector<HTMLInputElement>("[data-add-resource-max]");
  const toneInput = document.querySelector<HTMLSelectElement>("[data-add-resource-tone]");
  const error = document.querySelector<HTMLElement>("[data-add-resource-error]");
  const label = labelInput?.value.trim() ?? "";
  const value = Number(valueInput?.value);
  const max = Number(maxInput?.value);
  const tone = toneInput?.value as Character["resources"][number]["tone"] | undefined;
  if (!label || !Number.isInteger(value) || !Number.isInteger(max) || value < 0 || max < 1 || value > max || !tone) {
    if (error) { error.textContent = "Informe um nome e valores inteiros entre 0 e o máximo definido."; error.removeAttribute("hidden"); }
    labelInput?.classList.toggle("is-invalid", !label);
    valueInput?.classList.toggle("is-invalid", !Number.isInteger(value) || value < 0 || value > max);
    maxInput?.classList.toggle("is-invalid", !Number.isInteger(max) || max < 1 || value > max);
    return;
  }
  const updatedCharacter = { ...character, resources: [...character.resources, createCustomResource({ label, value, max, tone })] };
  dependencies.state.character = updatedCharacter;
  dependencies.state.addResourceModalOpen = false;
  await dependencies.saveCharacter(updatedCharacter);
  dependencies.render();
}

export function handleCustomResourceEscape(event: KeyboardEvent, state: CustomResourceUiState, render: () => void): boolean {
  if (event.key !== "Escape" || !state.deletingCustomResourceId) return false;
  state.deletingCustomResourceId = undefined;
  render();
  return true;
}
