import type { Catalog } from "../../domain/catalog";
import type { SettingsViewState } from "../../app/types";
import { installLocalPacks, removeLocalPack } from "../../storage/packRepository";
import { getPackDefinitionSummary } from "../settings/renderSettings";
import { validatePackBundle } from "./packValidation";

export type PackManagementDependencies = {
  state: SettingsViewState;
  getCatalog(): Catalog;
  refreshCatalog(): Promise<void>;
  afterImport?(): Promise<void>;
  escapeHtml(value: string): string;
};

export function renderPackManagementDialogs(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  return `${renderPackImportModal(deps)}${renderRemoveInstalledPackModal(deps)}`;
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
