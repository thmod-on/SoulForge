import type { Catalog } from "../../domain/catalog";
import type { SettingsViewState } from "../../app/types";
import { installLocalPacks, removeAllLocalPacks, removeLocalPack } from "../../storage/packRepository";
import { getPackDefinitionSummary } from "../settings/renderSettings";
import { validatePackBundle } from "./packValidation";

export type PackManagementDependencies = {
  state: SettingsViewState;
  getCatalog(): Catalog;
  refreshCatalog(): Promise<void>;
  afterImport?(): Promise<void>;
  escapeHtml(value: string): string;
  render(): void;
  removeAllPacks?(): Promise<void>;
};

export function renderPackManagementDialogs(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  return `${renderPackImportModal(deps)}${renderRemoveInstalledPackModal(deps)}${renderRemoveAllInstalledPacksModal(deps)}`;
}

export function handlePackManagementAction(target: HTMLElement, deps: PackManagementDependencies): boolean {
  const { state, render } = deps;
  if (target.closest('[data-action="open-pack-import"]')) {
    state.packImportOpen = true;
    state.pendingPackBundles = undefined;
    state.packImportError = undefined;
  } else if (target.closest('[data-action="choose-pack-file"]')) {
    document.querySelector<HTMLInputElement>("[data-pack-file]")?.click();
    return true;
  } else if (target.closest('[data-action="confirm-pack-import"]')) {
    void confirmPackImport(deps).then(render);
    return true;
  } else {
    const removeButton = target.closest<HTMLElement>('[data-action="remove-installed-pack"]');
    if (removeButton) state.deletingInstalledPackId = removeButton.dataset.packId;
    else if (target.closest('[data-action="cancel-remove-installed-pack"]')) state.deletingInstalledPackId = undefined;
    else if (target.closest('[data-action="confirm-remove-installed-pack"]')) {
      void confirmRemoveInstalledPack(deps).then(render);
      return true;
    } else if (target.closest('[data-action="open-remove-all-installed-packs"]')) {
      state.removeAllInstalledPacksOpen = true;
      state.removeAllInstalledPacksError = undefined;
    } else if (target.closest('[data-action="cancel-remove-all-installed-packs"]')) {
      state.removeAllInstalledPacksOpen = false;
      state.removeAllInstalledPacksError = undefined;
    } else if (target.closest('[data-action="confirm-remove-all-installed-packs"]')) {
      void confirmRemoveAllInstalledPacks(deps).then(render);
      return true;
    } else return false;
  }
  render();
  return true;
}

export async function readPackImportFiles(files: File[], deps: Pick<PackManagementDependencies, "state" | "getCatalog">): Promise<void> {
  const results = await Promise.all(files.map(async (file) => {
    try {
      return { file, bundle: validatePackBundle(JSON.parse(await file.text())) };
    } catch (caught) {
      return { file, error: caught instanceof Error ? caught.message : "Não foi possível ler este arquivo." };
    }
  }));
  const errors = results.flatMap((result) => result.error ? [`${result.file.name}: ${result.error}`] : []);
  const bundles = results.flatMap((result) => result.bundle ? [result.bundle] : []);
  const catalog = deps.getCatalog();

  const selectedPackIds = new Set<string>();
  const selectedDefinitionIds = new Set<string>();
  for (const bundle of bundles) {
    if (selectedPackIds.has(bundle.manifest.id)) errors.push(`O Pack “${bundle.manifest.name}” foi selecionado mais de uma vez.`);
    selectedPackIds.add(bundle.manifest.id);
    if (catalog.packs.some((pack) => pack.id === bundle.manifest.id)) errors.push(`O Pack “${bundle.manifest.name}” já está instalado neste dispositivo.`);
    for (const definition of bundle.definitions) {
      if (selectedDefinitionIds.has(definition.id)) errors.push(`A Definition “${definition.name}” aparece em mais de um arquivo selecionado.`);
      selectedDefinitionIds.add(definition.id);
    }
  }

  const existingDefinitionIds = new Set(catalog.definitions.map((definition) => definition.id));
  if (bundles.some((bundle) => bundle.definitions.some((definition) => existingDefinitionIds.has(definition.id)))) {
    errors.push("Um dos Packs possui uma Definition que já existe neste dispositivo.");
  }

  if (errors.length) {
    deps.state.pendingPackBundles = undefined;
    deps.state.packImportError = errors.join("\n");
    return;
  }
  deps.state.pendingPackBundles = bundles;
  deps.state.packImportError = undefined;
}

export async function confirmPackImport(deps: PackManagementDependencies): Promise<boolean> {
  const bundles = deps.state.pendingPackBundles;
  if (!bundles?.length) return false;
  try {
    await installLocalPacks(bundles);
    await deps.refreshCatalog();
    await deps.afterImport?.();
    deps.state.packImportOpen = false;
    deps.state.pendingPackBundles = undefined;
    deps.state.packImportError = undefined;
    return true;
  } catch {
    deps.state.packImportError = "Não foi possível instalar os Packs. Nenhuma alteração foi concluída.";
    return false;
  }
}

export async function confirmRemoveInstalledPack(deps: PackManagementDependencies): Promise<boolean> {
  if (!deps.state.deletingInstalledPackId) return false;
  await removeLocalPack(deps.state.deletingInstalledPackId);
  deps.state.deletingInstalledPackId = undefined;
  await deps.refreshCatalog();
  return true;
}

export async function confirmRemoveAllInstalledPacks(deps: PackManagementDependencies): Promise<boolean> {
  if (!deps.state.removeAllInstalledPacksOpen || !deps.state.installedPacks.length) return false;
  try {
    await (deps.removeAllPacks ?? removeAllLocalPacks)();
    deps.state.removeAllInstalledPacksOpen = false;
    deps.state.removeAllInstalledPacksError = undefined;
    await deps.refreshCatalog();
    return true;
  } catch {
    deps.state.removeAllInstalledPacksError = "Não foi possível remover os Packs. Nenhuma alteração foi concluída.";
    return false;
  }
}

function renderPackImportModal(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  const { state, escapeHtml } = deps;
  if (!state.packImportOpen) return "";
  const bundles = state.pendingPackBundles ?? [];
  const packCount = bundles.length;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal pack-import-modal" role="dialog" aria-modal="true" aria-labelledby="pack-import-title">
        <button class="modal-close" type="button" data-modal-close aria-label="Fechar importacao">x</button>
        <span class="resource-modal-label">Dados locais</span>
        <h2 id="pack-import-title">Importar Pack local</h2>
        ${packCount ? `
          <p class="settings-panel-copy"><strong>${packCount} ${packCount === 1 ? "Pack pronto" : "Packs prontos"} para instalar.</strong> Confira o conteúdo do lote:</p>
          <div class="pack-import-preview-list">${bundles.map((bundle) => `<article class="pack-import-preview"><span>Pronto para instalar</span><h3>${escapeHtml(bundle.manifest.name)}</h3><p>v${escapeHtml(bundle.manifest.version)} · ${escapeHtml(bundle.manifest.description)}</p><strong>${escapeHtml(getPackDefinitionSummary(bundle.definitions))}</strong></article>`).join("")}</div>
          <p class="settings-panel-copy">O lote inteiro será salvo somente neste navegador. Se ocorrer um erro, nenhum Pack será instalado.</p>
          <div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="choose-pack-file">Escolher outros arquivos</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-pack-import">Instalar ${packCount === 1 ? "Pack" : `${packCount} Packs`}</button></div>
        ` : `<p>Selecione um ou vários arquivos <strong>.soulforge-pack.json</strong>. O SoulForge exibirá uma prévia do lote antes de instalar.</p><button class="sf-action sf-action--primary primary-action" type="button" data-action="choose-pack-file">Selecionar Packs</button>`}
        <input type="file" accept="application/json,.json,.soulforge-pack.json" data-pack-file multiple hidden>
        ${state.packImportError ? `<p class="form-error pack-import-error" data-pack-import-error role="alert">${escapeHtml(state.packImportError)}</p>` : ""}
      </section>
    </div>
  `;
}

function renderRemoveInstalledPackModal(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  const { state, escapeHtml } = deps;
  const pack = state.installedPacks.find((entry) => entry.id === state.deletingInstalledPackId);
  if (!pack) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="remove-pack-title"><h2 id="remove-pack-title">Remover Pack?</h2><p><strong>${escapeHtml(pack.name)}</strong> e todas as suas Definitions serão removidos deste dispositivo. Personagens que usem esse conteúdo poderão ficar com referências indisponíveis.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-remove-installed-pack">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-remove-installed-pack">Remover Pack</button></div></section></div>`;
}

function renderRemoveAllInstalledPacksModal(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  const { state, escapeHtml } = deps;
  if (!state.removeAllInstalledPacksOpen || !state.installedPacks.length) return "";
  const count = state.installedPacks.length;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal remove-all-packs-modal" role="dialog" aria-modal="true" aria-labelledby="remove-all-packs-title"><span class="resource-modal-label">Dados locais</span><h2 id="remove-all-packs-title">Remover todos os Packs?</h2><p>Os <strong>${count} ${count === 1 ? "Pack importado" : "Packs importados"}</strong> e suas Definitions serão removidos deste dispositivo em uma única operação.</p><div class="remove-all-packs-list sf-scroll-region">${state.installedPacks.map((pack) => `<span><strong>${escapeHtml(pack.name)}</strong><small>v${escapeHtml(pack.version)}</small></span>`).join("")}</div><p>Personagens, conteúdo criado manualmente, configurações e complementos locais serão preservados. Fichas que usam estes Packs podem mostrar referências indisponíveis até que eles sejam reimportados.</p>${state.removeAllInstalledPacksError ? `<p class="form-error" role="alert">${escapeHtml(state.removeAllInstalledPacksError)}</p>` : ""}<div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-remove-all-installed-packs">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-remove-all-installed-packs">Remover todos os Packs</button></div></section></div>`;
}
