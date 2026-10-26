import type { Definition, PackManifest } from "../../domain/types";
import type { SettingsViewState } from "../../app/types";
import { hasPackUsageImpact, type PackUsageImpact } from "../packs/packUsage";
import type { SyncViewModel } from "../../sync/syncCoordinator";
import { getLibraryUpdates, getMissingLibraryEntries } from "../packs/privateLibrary";

type RenderSettingsOptions = {
  appVersion: string;
  state: SettingsViewState;
  escapeHtml: (value: string) => string;
  getPackDisplayName: (packId: string) => string;
  getPackDisplayDescription: (pack: PackManifest) => string;
  sync: SyncViewModel;
};

export function renderSettings(options: RenderSettingsOptions): string {
  const { appVersion, state, escapeHtml, getPackDisplayName, getPackDisplayDescription, sync } = options;
  const cloud = renderCloudSettings(sync, escapeHtml);
  const packCount = state.installedPacks.length;
  const packLabel = `${packCount} ${packCount === 1 ? "Pack instalado" : "Packs instalados"}`;
  const packs = state.installedPacks.length
    ? state.installedPacks.map((pack) => `<article class="installed-pack"><div><strong>${escapeHtml(getPackDisplayName(pack.id))}</strong><span>v${escapeHtml(pack.version)} · ${escapeHtml(getPackDisplayDescription(pack))} · ${pack.installationSource === "library" ? "Biblioteca privada" : "Arquivo local"}</span></div><button class="sf-action sf-action--icon sf-action--danger icon-action danger-icon-action" type="button" data-action="remove-installed-pack" data-pack-id="${escapeHtml(pack.id)}" aria-label="Remover ${escapeHtml(getPackDisplayName(pack.id))}">×</button></article>`).join("")
    : '<p class="settings-panel-copy">Nenhum Pack local instalado neste dispositivo.</p>';
  const library = renderPrivateLibrary(state, sync, escapeHtml);

  return `<main class="content settings-content"><header class="settings-page-heading"><div><h1>Configurações</h1><p>Sincronização, Packs e cópias dos dados deste dispositivo.</p></div><dl class="settings-app-status" aria-label="Estado do SoulForge">${renderReadableSetting("Versão", `v${appVersion}`, escapeHtml)}${renderReadableSetting("Offline/PWA", "Pronta para uso offline", escapeHtml)}</dl></header><div class="settings-layout"><section class="settings-section"><header class="settings-section-heading"><div><h2>Nuvem</h2><p>Conta opcional, sincronização e resolução de conflitos.</p></div></header>${cloud}</section><section class="settings-section"><header class="settings-section-heading"><div><h2>Conteúdo e Packs</h2><p>Instale conjuntos privados para ampliar o Compendium neste dispositivo.</p></div><strong class="settings-section-count">${packLabel}</strong></header>${library}<div class="settings-pack-toolbar"><span>Os Packs instalados não acompanham a exportação individual de uma ficha.</span><button class="sf-action sf-action--secondary" type="button" data-action="open-pack-import">Importar Pack local</button></div><div class="settings-pack-list-shell"><div class="installed-pack-list sf-scroll-region" aria-label="Packs instalados">${packs}</div><span class="settings-pack-scroll-cue" aria-hidden="true"><span class="settings-pack-scroll-cue-down">↓ Role para ver mais</span><span class="settings-pack-scroll-cue-up">↑ Voltar ao topo</span></span></div><div class="settings-danger-zone"><p>Remova todos os Packs deste dispositivo. A biblioteca não será baixada novamente até uma reinstalação explícita.</p><button class="sf-action sf-action--danger" type="button" data-action="open-remove-all-installed-packs" ${packCount ? "" : "disabled"}>Remover todos os Packs</button></div></section><section class="settings-section"><header class="settings-section-heading"><div><h2>Backup e compartilhamento</h2><p>Proteja todo o dispositivo ou leve somente as criações do Compendium.</p></div></header><div class="settings-data-grid"><section class="settings-data-group"><div><h3>Backup completo</h3><p>Guarda fichas, Packs importados, criações e complementos locais em um único arquivo.</p></div><div class="settings-actions"><button class="sf-action sf-action--primary" type="button" data-action="create-full-backup">Criar backup completo</button><button class="sf-action sf-action--secondary" type="button" data-action="open-backup-restore">Restaurar backup</button></div></section><section class="settings-data-group"><div><h3>Conteúdo criado</h3><p>Compartilhe apenas criações e complementos do Compendium, sem fichas nem Packs de terceiros.</p></div><div class="settings-actions"><button class="sf-action sf-action--primary" type="button" data-action="open-content-import">Importar conteúdo</button><button class="sf-action sf-action--secondary" type="button" data-action="export-local-content">Exportar conteúdo</button></div></section></div></section></div></main>`;
}

function renderPrivateLibrary(state: SettingsViewState, sync: SyncViewModel, escapeHtml: (value: string) => string): string {
  if (!sync.session.authenticated) return '<section class="private-library"><div><h3>Biblioteca privada</h3><p>Entre com uma conta autorizada para instalar o conteúdo disponibilizado para o grupo.</p></div></section>';
  const library = state.privateLibrary;
  if (library.loading) return '<section class="private-library"><div><h3>Biblioteca privada</h3><p>Consultando conteúdo disponível…</p></div></section>';
  if (library.error) return `<section class="private-library"><div><h3>Biblioteca privada</h3><p class="form-error">${escapeHtml(library.error)}</p></div><button class="sf-action sf-action--secondary" type="button" data-action="refresh-private-library">Tentar novamente</button></section>`;
  if (!library.catalog) return '<section class="private-library"><div><h3>Biblioteca privada</h3><p>Entre novamente para consultar o conteúdo autorizado.</p></div></section>';
  const missing = getMissingLibraryEntries(library.catalog, state.installedPacks);
  const updates = getLibraryUpdates(library.catalog, state.installedPacks);
  const local = state.installedPacks.filter((pack) => pack.installationSource !== "library").length;
  const managed = state.installedPacks.filter((pack) => pack.installationSource === "library").length;
  const updateCards = updates.map((entry) => `<article class="private-library-update"><div><strong>${escapeHtml(entry.name)}</strong><span>v${escapeHtml(entry.version)} · ${escapeHtml(entry.changes)}</span><small>${entry.definitionCount} Definitions serão conferidas antes da instalação.</small></div><button class="sf-action sf-action--primary" type="button" data-action="update-private-library-pack" data-pack-id="${escapeHtml(entry.id)}">Atualizar</button></article>`).join("");
  const installAction = missing.length
    ? `<button class="sf-action sf-action--primary" type="button" data-action="install-private-library">${state.installedPacks.length ? "Completar biblioteca" : "Instalar biblioteca"}</button>`
    : managed < library.catalog.packs.length
      ? '<button class="sf-action sf-action--primary" type="button" data-action="reinstall-private-library">Usar versão da biblioteca</button>'
      : '<span class="private-library-ready">Biblioteca instalada</span>';
  const pending = library.pendingUpdate;
  const pendingUpdate = pending ? `<section class="pack-update-impact"><h3>Confirmar atualização</h3><p><strong>${escapeHtml(pending.entry.name)}</strong> será atualizado para v${escapeHtml(pending.entry.version)}.</p>${renderUpdateImpact(pending.impact, escapeHtml)}<div class="settings-actions"><button class="sf-action sf-action--secondary" type="button" data-action="cancel-private-library-update">Cancelar</button><button class="sf-action ${hasPackUsageImpact(pending.impact) ? "sf-action--danger danger-action" : "sf-action--primary primary-action"}" type="button" data-action="confirm-private-library-update">${hasPackUsageImpact(pending.impact) ? "Atualizar mesmo assim" : "Confirmar atualização"}</button></div></section>` : "";
  return `<section class="private-library"><div><h3>Biblioteca privada</h3><p>${library.catalog.packs.length} Packs autorizados${local ? ` · ${local} local${local === 1 ? "" : "is"} preservado${local === 1 ? "" : "s"}` : ""}.</p></div><div class="private-library-actions">${installAction}<button class="sf-action sf-action--secondary" type="button" data-action="refresh-private-library">Verificar atualizações</button></div>${pendingUpdate}${updates.length && !pending ? `<div class="private-library-updates"><strong>${updates.length} ${updates.length === 1 ? "atualização disponível" : "atualizações disponíveis"}</strong>${updateCards}</div>` : ""}</section>`;
}

function renderUpdateImpact(impact: PackUsageImpact, escapeHtml: (value: string) => string): string {
  if (!hasPackUsageImpact(impact)) return `<p class="settings-panel-copy">${impact.changedDefinitionIds.length ? `${impact.changedDefinitionIds.length} Definition${impact.changedDefinitionIds.length === 1 ? " será alterada" : "s serão alteradas"}; nenhuma referência de ficha será perdida.` : "Nenhuma referência de ficha será removida."}</p>`;
  const characters = [...new Map(impact.references.map((reference) => [reference.characterId, reference.characterName])).values()];
  return `<div class="pack-usage-impact"><strong>${characters.length} ${characters.length === 1 ? "ficha afetada" : "fichas afetadas"}</strong><p>As fichas não serão alteradas; suas referências voltam a funcionar quando o conteúdo for reinstalado.</p><ul>${characters.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul></div>`;
}

function renderCloudSettings(sync: SyncViewModel, escapeHtml: (value: string) => string): string {
  const statusLabels = { "local-only": "Somente neste dispositivo", pending: "Pendente", syncing: "Sincronizando", synced: "Sincronizado", offline: "Offline", error: "Erro", conflict: "Conflito" } as const;
  if (!sync.syncEnabled) return '<div class="cloud-settings"><p class="settings-panel-copy">A sincronização está desativada neste ambiente. Seus dados continuam armazenados somente neste dispositivo.</p></div>';
  if (!sync.session.authenticated) return `<div class="cloud-settings"><div class="cloud-status cloud-status--${sync.status}"><i aria-hidden="true"></i><div><strong>${statusLabels[sync.status]}</strong><span>${escapeHtml(sync.message ?? "Entre apenas se quiser backup e sincronização entre dispositivos.")}</span></div></div>${sync.googleClientId ? '<div class="cloud-google-button" data-google-signin></div>' : '<p class="form-error">Configure GOOGLE_CLIENT_ID no Worker para habilitar o login.</p>'}</div>`;
  const user = sync.session.user!;
  const conflicts = sync.conflicts.length ? `<section class="cloud-conflicts"><h3>Conflitos pendentes</h3>${sync.conflicts.map((conflict) => `<article><div><strong>${escapeHtml(conflict.local.type === "character" ? "Personagem" : conflict.local.type === "definition" ? "Criação do Compendium" : "Complemento")}</strong><span>${escapeHtml(conflict.local.id)}</span></div><div class="settings-actions"><button class="sf-action sf-action--primary" type="button" data-sync-conflict="${escapeHtml(conflict.key)}" data-sync-choice="local">Manter este dispositivo</button><button class="sf-action sf-action--secondary" type="button" data-sync-conflict="${escapeHtml(conflict.key)}" data-sync-choice="remote">Usar nuvem</button>${conflict.local.type === "character" ? `<button class="sf-action sf-action--secondary" type="button" data-sync-conflict="${escapeHtml(conflict.key)}" data-sync-choice="copy">Salvar ambos</button>` : ""}</div></article>`).join("")}</section>` : "";
  return `<div class="cloud-settings"><div class="cloud-account">${user.picture ? `<img src="${escapeHtml(user.picture)}" alt="" referrerpolicy="no-referrer" />` : ""}<div><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)}</span></div></div><div class="cloud-status cloud-status--${sync.status}"><i aria-hidden="true"></i><div><strong>${statusLabels[sync.status]}</strong><span>${escapeHtml(sync.message ?? "Fichas e criações locais são salvas primeiro neste dispositivo.")}</span></div></div><div class="settings-actions"><button class="sf-action sf-action--primary" type="button" data-action="sync-now" ${sync.status === "syncing" ? "disabled" : ""}>Sincronizar agora</button><button class="sf-action sf-action--secondary" type="button" data-action="cloud-sign-out">Sair da conta</button><button class="sf-action sf-action--danger" type="button" data-action="delete-cloud-account">Excluir dados da nuvem</button></div>${conflicts}</div>`;
}

export function getPackDefinitionSummary(definitions: Definition[]): string {
  const counts = new Map<string, number>();
  definitions.forEach((definition) => counts.set(definition.type, (counts.get(definition.type) ?? 0) + 1));
  const labels: Record<string, string> = { ancestry: "ancestralidades", feature: "caracteristicas", card: "cartas", item: "itens", class: "classes", subclass: "subclasses", domain: "dominios", community: "comunidades", transformation: "transformações", condition: "condições" };
  return [...counts.entries()].map(([type, count]) => `${count} ${labels[type] ?? type}`).join(" · ");
}

function renderReadableSetting(label: string, value: string, escapeHtml: (value: string) => string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}
