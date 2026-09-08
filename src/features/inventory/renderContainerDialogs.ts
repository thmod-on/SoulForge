import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { getEntryCompartmentId, getInventoryCompartments, getInventoryItemEntries } from "./inventoryModel";

export type ContainerDialogState = {
  character?: Character;
  addContainerOpen: boolean;
  deleteContainerId?: string;
};

export function renderContainerDialogs(state: ContainerDialogState, catalog: Catalog, escapeHtml: (value: string) => string): string {
  return `${renderAddContainerModal(state)}${renderDeleteContainerModal(state, catalog, escapeHtml)}`;
}

function renderAddContainerModal(state: ContainerDialogState): string {
  if (!state.addContainerOpen) return "";
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal sf-scroll-region" role="dialog" aria-modal="true" aria-labelledby="container-modal-title">
        <div class="container-modal-heading"><h2 id="container-modal-title">Novo container</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar novo container">x</button></div>
        <p>Defina um compartimento com capacidade propria para organizar os itens do personagem.</p>
        <p class="form-error" data-container-error hidden></p>
        <label><span>Nome</span><input data-container-name type="text" placeholder="Ex.: Sacola de couro" /></label>
        <label><span>Capacidade</span><input data-container-capacity type="number" min="1" step="1" placeholder="Ex.: 8" /></label>
        <fieldset><legend>Tipos aceitos</legend><label><input type="checkbox" data-container-accepts value="arma" /> Armas</label><label><input type="checkbox" data-container-accepts value="armadura" /> Armaduras</label><label><input type="checkbox" data-container-accepts value="consumivel" /> Consumiveis</label><label><input type="checkbox" data-container-accepts value="equipamento" /> Equipamentos</label><label><input type="checkbox" data-container-accepts value="loot" /> Loot</label></fieldset>
        <p>Se nenhum tipo for marcado, o container aceitara qualquer item.</p>
        <button class="sf-action sf-action--primary primary-action" type="button" data-action="create-container">Criar container</button>
      </section>
    </div>
  `;
}

function renderDeleteContainerModal(state: ContainerDialogState, catalog: Catalog, escapeHtml: (value: string) => string): string {
  const character = state.character;
  if (!character || !state.deleteContainerId) return "";
  const compartment = getInventoryCompartments(character).find((entry) => entry.id === state.deleteContainerId);
  if (!compartment) return "";
  const itemCount = getInventoryItemEntries(character, catalog)
    .filter(({ entry }) => getEntryCompartmentId(entry) === compartment.id)
    .reduce((total, { entry }) => total + entry.quantity, 0);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal sf-scroll-region danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-container-title"><button class="modal-close" data-modal-close aria-label="Cancelar exclusao">x</button><span class="resource-modal-label">Excluir container</span><h2 id="delete-container-title">${escapeHtml(compartment.name)}</h2><p>Esta acao removera o container e todos os itens guardados nele.</p><div class="danger-summary"><strong>${itemCount}</strong><span>${itemCount === 1 ? "item sera perdido" : "itens serao perdidos"}</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-container">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-container">Excluir container e itens</button></div></section></div>`;
}
