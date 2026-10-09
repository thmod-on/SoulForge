import type { Character, Definition, PackManifest } from "../../domain/types";
import type { SettingsSection, SettingsViewState } from "../../app/types";
import type { SyncViewModel } from "../../sync/syncCoordinator";

type RenderSettingsOptions = {
  character: Character;
  appVersion: string;
  state: SettingsViewState;
  hasActiveCharacter: boolean;
  escapeHtml: (value: string) => string;
  getPackDisplayName: (packId: string) => string;
  getPackDisplayDescription: (pack: PackManifest) => string;
  sync: SyncViewModel;
};

export function renderSettings(options: RenderSettingsOptions): string {
  const { character, appVersion, state, escapeHtml, getPackDisplayName, getPackDisplayDescription, hasActiveCharacter, sync } = options;
  const cloud = renderCloudSettings(sync, escapeHtml);
  const localData = `<p class="settings-panel-copy">Packs e fichas ficam apenas neste navegador. Use o backup completo para guardar tudo junto; use conteúdo compartilhável para enviar somente suas criações do Compendium.</p><div class="settings-actions"><button class="sf-action sf-action--primary settings-action settings-action-primary" type="button" data-action="export-character" ${hasActiveCharacter ? "" : "disabled"}>Exportar personagem</button><button class="sf-action sf-action--primary settings-action settings-action-primary" type="button" data-action="open-character-import">Importar personagem</button><button class="sf-action sf-action--primary settings-action settings-action-primary" type="button" data-action="create-full-backup">Criar backup completo</button><button class="sf-action sf-action--secondary settings-action" type="button" data-action="open-backup-restore">Restaurar backup</button><button class="sf-action sf-action--secondary settings-action" type="button" data-action="export-local-content">Exportar conteúdo</button><button class="sf-action sf-action--secondary settings-action" type="button" data-action="open-content-import">Importar conteúdo</button><button class="sf-action sf-action--primary settings-action settings-action-primary" type="button" data-action="open-pack-import">Importar Pack local</button><button class="sf-action sf-action--danger settings-action settings-action-danger" type="button" data-action="open-remove-all-installed-packs" ${state.installedPacks.length ? "" : "disabled"}>Remover todos os Packs <span>${state.installedPacks.length ? `${state.installedPacks.length} instalados` : "Nenhum instalado"}</span></button></div><div class="installed-pack-list"><h3>Packs instalados neste dispositivo</h3>${state.installedPacks.length ? state.installedPacks.map((pack) => `<article class="installed-pack"><div><strong>${escapeHtml(getPackDisplayName(pack.id))}</strong><span>v${escapeHtml(pack.version)} · ${escapeHtml(getPackDisplayDescription(pack))}</span></div><button class="sf-action sf-action--icon sf-action--danger icon-action danger-icon-action" type="button" data-action="remove-installed-pack" data-pack-id="${escapeHtml(pack.id)}" aria-label="Remover ${escapeHtml(getPackDisplayName(pack.id))}">×</button></article>`).join("") : '<p class="settings-panel-copy">Nenhum Pack local instalado.</p>'}</div>`;
  const progression = `<p class="settings-panel-copy">Esta área vai concentrar quais opções existem por Tier, ganhos automáticos e regras usadas pela tela de Progressão.</p><div class="settings-option-grid settings-option-grid-wide">${renderSettingOption("Tiers", "2, 3 e 4", true, escapeHtml)}${renderSettingOption("Escolhas por nível", "Configurável depois", false, escapeHtml)}${renderSettingOption("Ganhos automáticos", "Configurável depois", false, escapeHtml)}</div>`;
  return `<main class="content settings-content"><div class="screen-title"><div><h1>Configuracoes</h1><p>Ajustes da aplicacao, dados locais e regras que moldam novos personagens.</p></div></div><div class="settings-grid">${renderSettingsSection("general", "Geral", "Versao e disponibilidade offline.", `<dl class="settings-readable-list">${renderReadableSetting("Versao do app", `v${appVersion}`, escapeHtml)}${renderReadableSetting("Status offline/PWA", "PWA pronta para uso offline", escapeHtml)}</dl>`, state, escapeHtml)}${renderSettingsSection("cloud", "Nuvem", "Conta opcional, sincronização e conflitos.", cloud, state, escapeHtml, true)}${renderSettingsSection("localData", "Dados locais", "Importe Packs privados e proteja os dados deste dispositivo.", localData, state, escapeHtml)}${renderSettingsSection("loadRules", "Regras de Carga", "Capacidade, peso e padroes usados por novos personagens.", `<div class="settings-list">${renderSettingInfo("Containers padrao", "Equipados e Mochila", escapeHtml)}${renderSettingInfo("Capacidade padrao", `${character.inventory.capacity} espacos`, escapeHtml)}${renderSettingInfo("Regra de peso", "Peso por item", escapeHtml)}${renderSettingInfo("Aplicacao", "Novos personagens", escapeHtml)}</div>`, state, escapeHtml)}${renderSettingsSection("appearance", "Aparencia", "Tema, paleta, densidade e tamanho dos componentes.", `<div class="settings-option-grid">${renderSettingOption("Tema", "Escuro", true, escapeHtml)}${renderSettingOption("Paleta", "SoulForge", true, escapeHtml)}${renderSettingOption("Densidade", "Confortavel", true, escapeHtml)}${renderSettingOption("Cartas e itens", "Medios", true, escapeHtml)}</div>`, state, escapeHtml)}${renderSettingsSection("progression", "Progressao", "Regras de tier e ganhos usados pela tela de Progressao.", progression, state, escapeHtml, true)}</div></main>`;
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

function renderSettingsSection(section: SettingsSection, title: string, summary: string, content: string, state: SettingsViewState, escapeHtml: (value: string) => string, wide = false): string {
  const isOpen = state.openSettingsSections[section];
  const contentId = `settings-section-${section}`;
  return `<section class="settings-panel ${wide ? "settings-panel-wide" : ""} ${isOpen ? "is-open" : "is-collapsed"}"><button class="settings-panel-toggle" type="button" data-settings-section="${section}" aria-expanded="${isOpen}" aria-controls="${contentId}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(summary)}</small></span><i aria-hidden="true">${isOpen ? "−" : "+"}</i></button>${isOpen ? `<div class="settings-panel-body" id="${contentId}">${content}</div>` : ""}</section>`;
}

function renderReadableSetting(label: string, value: string, escapeHtml: (value: string) => string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function renderSettingInfo(label: string, value: string, escapeHtml: (value: string) => string): string {
  return `<div class="setting-info"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderSettingOption(label: string, value: string, active: boolean, escapeHtml: (value: string) => string): string {
  return `<button class="setting-option ${active ? "is-active" : ""}" type="button" disabled><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${active ? "Atual" : "Em breve"}</small></button>`;
}
