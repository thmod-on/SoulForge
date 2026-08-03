import type { Character, Definition, PackManifest } from "../../domain/types";
import type { SettingsSection, SettingsViewState } from "../../app/types";

type RenderSettingsOptions = {
  character: Character;
  appVersion: string;
  state: SettingsViewState;
  escapeHtml: (value: string) => string;
  getPackDisplayName: (packId: string) => string;
  getPackDisplayDescription: (pack: PackManifest) => string;
};

export function renderSettings(options: RenderSettingsOptions): string {
  const { character, appVersion, state, escapeHtml, getPackDisplayName, getPackDisplayDescription } = options;
  const offlineStatus = "PWA pronta para uso offline";
  return `<main class="content settings-content"><div class="screen-title"><div><h1>Configuracoes</h1><p>Ajustes da aplicacao, dados locais e regras que moldam novos personagens.</p></div></div><div class="settings-grid">${renderSettingsSection("general", "Geral", "Versao e disponibilidade offline.", `<dl class="settings-readable-list">${renderReadableSetting("Versao do app", `v${appVersion}`, escapeHtml)}${renderReadableSetting("Status offline/PWA", offlineStatus, escapeHtml)}</dl>`, state, escapeHtml)}${renderSettingsSection("localData", "Dados locais", "Importe Packs privados e proteja os dados deste dispositivo.", `<p class="settings-panel-copy">Packs locais ficam apenas neste navegador. Eles nao sao enviados ao GitHub nem incluidos na versao publicada.</p><div class="settings-actions"><button class="settings-action settings-action-primary" type="button" data-action="export-character">Exportar personagem</button><button class="settings-action settings-action-primary" type="button" data-action="open-pack-import">Importar Pack local</button><button class="settings-action" type="button" disabled>Importar personagem <span>Em breve</span></button><button class="settings-action" type="button" disabled>Criar backup <span>Em breve</span></button><button class="settings-action settings-action-danger" type="button" disabled>Apagar dados locais <span>Exige confirmacao</span></button></div><div class="installed-pack-list"><h3>Packs instalados neste dispositivo</h3>${state.installedPacks.length ? state.installedPacks.map((pack) => `<article class="installed-pack"><div><strong>${escapeHtml(getPackDisplayName(pack.id))}</strong><span>v${escapeHtml(pack.version)} · ${escapeHtml(getPackDisplayDescription(pack))}</span></div><button class="icon-action danger-icon-action" type="button" data-action="remove-installed-pack" data-pack-id="${escapeHtml(pack.id)}" aria-label="Remover ${escapeHtml(getPackDisplayName(pack.id))}">×</button></article>`).join("") : '<p class="settings-panel-copy">Nenhum Pack local instalado.</p>'}</div>`, state, escapeHtml)}${renderSettingsSection("loadRules", "Regras de Carga", "Capacidade, peso e padroes usados por novos personagens.", `<div class="settings-list">${renderSettingInfo("Containers padrao", "Equipados e Mochila", escapeHtml)}${renderSettingInfo("Capacidade padrao", `${character.inventory.capacity} espacos`, escapeHtml)}${renderSettingInfo("Regra de peso", "Peso por item", escapeHtml)}${renderSettingInfo("Aplicacao", "Novos personagens", escapeHtml)}</div>`, state, escapeHtml)}${renderSettingsSection("appearance", "Aparencia", "Tema, paleta, densidade e tamanho dos componentes.", `<div class="settings-option-grid">${renderSettingOption("Tema", "Escuro", true, escapeHtml)}${renderSettingOption("Paleta", "SoulForge", true, escapeHtml)}${renderSettingOption("Densidade", "Confortavel", true, escapeHtml)}${renderSettingOption("Cartas e itens", "Medios", true, escapeHtml)}</div>`, state, escapeHtml)}${renderSettingsSection("progression", "Progressao", "Regras de tier e ganhos usados pela tela de Progressao.", `<p class="settings-panel-copy">Esta area vai concentrar quais opcoes existem por tier, ganhos automaticos e regras usadas pela tela de Progressao.</p><div class="settings-option-grid settings-option-grid-wide">${renderSettingOption("Tiers", "2, 3 e 4", true, escapeHtml)}${renderSettingOption("Escolhas por nivel", "Configuravel depois", false, escapeHtml)}${renderSettingOption("Ganhos automaticos", "Configuravel depois", false, escapeHtml)}</div>`, state, escapeHtml, true)}</div></main>`;
}

export function getPackDefinitionSummary(definitions: Definition[]): string {
  const counts = new Map<string, number>();
  definitions.forEach((definition) => counts.set(definition.type, (counts.get(definition.type) ?? 0) + 1));
  const labels: Record<string, string> = { ancestry: "ancestralidades", feature: "caracteristicas", card: "cartas", item: "itens", class: "classes", subclass: "subclasses", domain: "dominios" };
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
