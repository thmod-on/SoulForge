import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import type { SettingsViewState } from "../../app/types";
import { installLocalPacks, removeAllLocalPacks, removeLocalPack } from "../../storage/packRepository";
import { getPackDefinitionSummary } from "../settings/renderSettings";
import { analyzePackRemoval, analyzePackUpdate, hasPackUsageImpact, type PackUsageImpact } from "./packUsage";
import { validatePackBundle } from "./packValidation";

export type PackManagementDependencies = {
  state: SettingsViewState;
  getCatalog(): Catalog;
  getCharacters(): Character[];
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
    if (removeButton?.dataset.packId) {
      state.deletingInstalledPackId = removeButton.dataset.packId;
      state.deletingInstalledPackImpact = analyzePackRemoval(deps.getCharacters(), deps.getCatalog(), [removeButton.dataset.packId]);
      state.deletingInstalledPackError = undefined;
    } else if (target.closest('[data-action="cancel-remove-installed-pack"]')) { state.deletingInstalledPackId = undefined; state.deletingInstalledPackImpact = undefined; state.deletingInstalledPackError = undefined; }
    else if (target.closest('[data-action="confirm-remove-installed-pack"]')) {
      void confirmRemoveInstalledPack(deps).then(render);
      return true;
    } else if (target.closest('[data-action="open-remove-all-installed-packs"]')) {
      state.removeAllInstalledPacksOpen = true;
      state.removeAllInstalledPacksError = undefined;
      state.removeAllInstalledPacksImpact = analyzePackRemoval(deps.getCharacters(), deps.getCatalog(), state.installedPacks.map((pack) => pack.id));
    } else if (target.closest('[data-action="cancel-remove-all-installed-packs"]')) {
      state.removeAllInstalledPacksOpen = false;
      state.removeAllInstalledPacksError = undefined;
      state.removeAllInstalledPacksImpact = undefined;
    } else if (target.closest('[data-action="confirm-remove-all-installed-packs"]')) {
      void confirmRemoveAllInstalledPacks(deps).then(render);
      return true;
    } else return false;
  }
  render();
  return true;
}

export async function readPackImportFiles(files: File[], deps: Pick<PackManagementDependencies, "state" | "getCatalog" | "getCharacters">): Promise<void> {
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
  const installedPackIds = new Set(deps.state.installedPacks.map((pack) => pack.id));

  const selectedPackIds = new Set<string>();
  const selectedDefinitionIds = new Set<string>();
  for (const bundle of bundles) {
    if (selectedPackIds.has(bundle.manifest.id)) errors.push(`O Pack “${bundle.manifest.name}” foi selecionado mais de uma vez.`);
    selectedPackIds.add(bundle.manifest.id);
    if (catalog.packs.some((pack) => pack.id === bundle.manifest.id) && !installedPackIds.has(bundle.manifest.id)) errors.push(`O Pack “${bundle.manifest.name}” já faz parte desta versão do SoulForge e não pode ser substituído.`);
    for (const definition of bundle.definitions) {
      if (selectedDefinitionIds.has(definition.id)) errors.push(`A Definition “${definition.name}” aparece em mais de um arquivo selecionado.`);
      selectedDefinitionIds.add(definition.id);
    }
  }

  const existingDefinitions = new Map(catalog.definitions.map((definition) => [definition.id, definition]));
  if (bundles.some((bundle) => bundle.definitions.some((definition) => {
    const existing = existingDefinitions.get(definition.id);
    return existing && (!installedPackIds.has(bundle.manifest.id) || existing.packId !== bundle.manifest.id);
  }))) {
    errors.push("Um dos Packs possui uma Definition que já existe neste dispositivo.");
  }

  if (errors.length) {
    deps.state.pendingPackBundles = undefined;
    deps.state.pendingPackImportImpact = undefined;
    deps.state.packImportError = errors.join("\n");
    return;
  }
  deps.state.pendingPackBundles = bundles;
  deps.state.pendingPackImportImpact = analyzePackUpdate(deps.getCharacters(), deps.getCatalog(), bundles);
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
    deps.state.pendingPackImportImpact = undefined;
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
  deps.state.deletingInstalledPackImpact = undefined;
  deps.state.deletingInstalledPackError = undefined;
  await deps.refreshCatalog();
  return true;
}

export async function confirmRemoveAllInstalledPacks(deps: PackManagementDependencies): Promise<boolean> {
  if (!deps.state.removeAllInstalledPacksOpen || !deps.state.installedPacks.length) return false;
  try {
    await (deps.removeAllPacks ?? removeAllLocalPacks)();
    deps.state.removeAllInstalledPacksOpen = false;
    deps.state.removeAllInstalledPacksImpact = undefined;
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
  const updateCount = bundles.filter((bundle) => state.installedPacks.some((pack) => pack.id === bundle.manifest.id)).length;
  const installCount = packCount - updateCount;
  const actionLabel = updateCount && !installCount ? `Atualizar ${packCount === 1 ? "Pack" : `${packCount} Packs`}` : updateCount ? "Aplicar lote" : `Instalar ${packCount === 1 ? "Pack" : `${packCount} Packs`}`;
  const impact = state.pendingPackImportImpact;
  const requiresConfirmation = hasPackUsageImpact(impact);
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal pack-import-modal" role="dialog" aria-modal="true" aria-labelledby="pack-import-title">
        <button class="modal-close" type="button" data-modal-close aria-label="Fechar importacao">x</button>
        <span class="resource-modal-label">Dados locais</span>
        <h2 id="pack-import-title">Importar Pack local</h2>
        ${packCount ? `
          <p class="settings-panel-copy"><strong>${packCount} ${packCount === 1 ? "Pack pronto" : "Packs prontos"}.</strong> Confira o conteúdo do lote:</p>
          <div class="pack-import-preview-list">${bundles.map((bundle) => { const installed = state.installedPacks.find((pack) => pack.id === bundle.manifest.id); return `<article class="pack-import-preview"><span>${installed ? "Pronto para atualizar" : "Pronto para instalar"}</span><h3>${escapeHtml(bundle.manifest.name)}</h3><p>${installed ? `v${escapeHtml(installed.version)} → ` : ""}v${escapeHtml(bundle.manifest.version)} · ${escapeHtml(bundle.manifest.description)}</p><strong>${escapeHtml(getPackDefinitionSummary(bundle.definitions))}</strong></article>`; }).join("")}</div>
          <p class="settings-panel-copy">O lote inteiro será salvo somente neste navegador. Atualizações substituem apenas as Definitions do mesmo Pack e preservam as fichas. Se ocorrer um erro, nenhuma alteração será concluída.</p>
          ${renderUsageImpact(impact, escapeHtml, "Esta atualização deixará estas referências indisponíveis até que o conteúdo volte a ser instalado.")}
          <div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="choose-pack-file">Escolher outros arquivos</button>${requiresConfirmation ? `<button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-pack-import">Atualizar mesmo assim</button>` : `<button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-pack-import">${actionLabel}</button>`}</div>
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
  const impact = state.deletingInstalledPackImpact;
  const affected = hasPackUsageImpact(impact);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="remove-pack-title"><button class="modal-close" type="button" data-action="cancel-remove-installed-pack" aria-label="Cancelar remoção">×</button><span class="resource-modal-label">Dados locais</span><h2 id="remove-pack-title">Remover Pack?</h2><p><strong>${escapeHtml(pack.name)}</strong> e todas as suas Definitions serão removidos deste dispositivo.</p>${renderUsageImpact(impact, escapeHtml, "A ficha não será alterada; essas referências voltam a funcionar se este Pack for reinstalado.")}<div class="danger-summary"><strong>!</strong><span>${affected ? "A remoção preserva as fichas, mas deixará o conteúdo listado indisponível." : "Nenhuma ficha usa este Pack."}</span></div>${state.deletingInstalledPackError ? `<p class="form-error" role="alert">${escapeHtml(state.deletingInstalledPackError)}</p>` : ""}<div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-remove-installed-pack">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-remove-installed-pack">${affected ? "Remover mesmo assim" : "Remover Pack"}</button></div></section></div>`;
}

function renderRemoveAllInstalledPacksModal(deps: Pick<PackManagementDependencies, "state" | "escapeHtml">): string {
  const { state, escapeHtml } = deps;
  if (!state.removeAllInstalledPacksOpen || !state.installedPacks.length) return "";
  const count = state.installedPacks.length;
  const impact = state.removeAllInstalledPacksImpact;
  const affected = hasPackUsageImpact(impact);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal remove-all-packs-modal" role="dialog" aria-modal="true" aria-labelledby="remove-all-packs-title"><button class="modal-close" type="button" data-action="cancel-remove-all-installed-packs" aria-label="Cancelar remoção">×</button><div class="remove-all-packs-body"><span class="resource-modal-label">Dados locais</span><h2 id="remove-all-packs-title">Remover todos os Packs?</h2><p>Os <strong>${count} ${count === 1 ? "Pack importado" : "Packs importados"}</strong> e suas Definitions serão removidos deste dispositivo em uma única operação.</p><div class="remove-all-packs-list sf-scroll-region">${state.installedPacks.map((pack) => `<span><strong>${escapeHtml(pack.name)}</strong><small>v${escapeHtml(pack.version)}</small></span>`).join("")}</div>${renderUsageImpact(impact, escapeHtml, "Personagens e referências serão preservados e voltarão a resolver quando os Packs forem reinstalados.")}<div class="danger-summary"><strong>!</strong><span>${affected ? "Há fichas afetadas pela remoção." : "Nenhuma ficha usa estes Packs."}</span></div><p>Personagens, conteúdo criado manualmente, configurações e complementos locais serão preservados.</p>${state.removeAllInstalledPacksError ? `<p class="form-error" role="alert">${escapeHtml(state.removeAllInstalledPacksError)}</p>` : ""}</div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-remove-all-installed-packs">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-remove-all-installed-packs">${affected ? "Remover todos mesmo assim" : "Remover todos os Packs"}</button></div></section></div>`;
}

export function renderUsageImpact(impact: PackUsageImpact | undefined, escapeHtml: (value: string) => string, message: string): string {
  if (!hasPackUsageImpact(impact)) return impact?.changedDefinitionIds.length ? `<p class="settings-panel-copy">${impact.changedDefinitionIds.length} Definition${impact.changedDefinitionIds.length === 1 ? " será alterada" : "s serão alteradas"}, sem referências removidas.</p>` : "";
  const activeImpact = impact!;
  const characters = [...new Map(activeImpact.references.map((reference) => [reference.characterId, reference.characterName])).values()];
  return `<section class="pack-usage-impact"><strong>${characters.length} ${characters.length === 1 ? "ficha afetada" : "fichas afetadas"}</strong><p>${escapeHtml(message)}</p><ul>${characters.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul></section>`;
}
