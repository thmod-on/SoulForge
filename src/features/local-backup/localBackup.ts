import type { Character, Definition, PackBundle, PackManifest } from "../../domain/types";
import { parseCharacterImport } from "../character-transfer/characterTransfer";
import { validatePackBundle } from "../packs/packValidation";
import type { CardMarkerOverride } from "../../storage/compendiumRepository";
import { loadLocalDataSnapshot, mergeLocalContent, replaceLocalDataSnapshot, type LocalDataSnapshot } from "../../storage/localDataRepository";

export const backupFormat = "soulforge-backup-v1" as const;
export const contentFormat = "soulforge-content-v1" as const;

export type SoulforgeBackupBundle = {
  format: typeof backupFormat;
  exportedAt: string;
  appVersion: string;
  characters: Character[];
  packs: PackBundle[];
  localDefinitions: Definition[];
  overrides: CardMarkerOverride[];
};

export type SoulforgeContentBundle = {
  format: typeof contentFormat;
  exportedAt: string;
  appVersion: string;
  definitions: Definition[];
  overrides: CardMarkerOverride[];
};

export type ContentImportPreview = {
  bundle: SoulforgeContentBundle;
  definitionConflictIds: string[];
  overrideConflictIds: string[];
  missingOverrideDefinitionIds: string[];
  missingDefinitionReferenceIds: string[];
};

export type LocalBackupState = {
  backupRestoreOpen: boolean;
  pendingBackup?: SoulforgeBackupBundle;
  backupError?: string;
  contentImportOpen: boolean;
  pendingContentImport?: ContentImportPreview;
  contentImportError?: string;
  acceptedContentConflictIds: string[];
};

export type LocalBackupControllerState = LocalBackupState & {
  characters: Character[];
  character?: Character;
  characterSelectionOpen: boolean;
};

export type LocalBackupDependencies = {
  state: LocalBackupControllerState;
  appVersion: string;
  ensureDemo(): Promise<void>;
  loadCharacter(id: string): Promise<Character | undefined>;
  listCharacters(): Promise<Character[]>;
  availableDefinitions(): Definition[];
  refreshCatalog(): Promise<void>;
  render(): void;
  showError(message: string): void;
  afterLocalDataChange?(): Promise<void>;
};

export function buildBackupBundle(snapshot: LocalDataSnapshot, appVersion: string): SoulforgeBackupBundle {
  const installedPackIds = new Set(snapshot.installedPacks.map((pack) => pack.id));
  const orphanedDefinitions = snapshot.definitions.filter((definition) => definition.packId !== "local" && !installedPackIds.has(definition.packId));
  if (orphanedDefinitions.length) throw new Error("Há Definitions locais sem Pack de origem. Reimporte o Pack antes de criar o backup.");
  return {
    format: backupFormat,
    exportedAt: new Date().toISOString(),
    appVersion,
    characters: structuredClone(snapshot.characters),
    packs: snapshot.installedPacks.map((manifest) => ({
      format: "soulforge-pack-v1",
      manifest: structuredClone(manifest),
      definitions: structuredClone(snapshot.definitions.filter((definition) => definition.packId === manifest.id))
    })),
    localDefinitions: structuredClone(snapshot.definitions.filter((definition) => definition.packId === "local")),
    overrides: structuredClone(snapshot.overrides)
  };
}

export function buildContentBundle(snapshot: LocalDataSnapshot, appVersion: string): SoulforgeContentBundle {
  return {
    format: contentFormat,
    exportedAt: new Date().toISOString(),
    appVersion,
    definitions: structuredClone(snapshot.definitions.filter((definition) => definition.packId === "local")),
    overrides: structuredClone(snapshot.overrides)
  };
}

export function downloadLocalData(bundle: SoulforgeBackupBundle | SoulforgeContentBundle): void {
  const isBackup = bundle.format === backupFormat;
  downloadJson(bundle, `soulforge-${isBackup ? "backup" : "conteudo"}-${new Date().toISOString().slice(0, 10)}.${isBackup ? "soulforge-backup" : "soulforge-content"}.json`);
}

export async function readBackupFile(file: File): Promise<SoulforgeBackupBundle> {
  return parseBackupBundle(await file.text());
}

export async function readContentFile(file: File): Promise<SoulforgeContentBundle> {
  return parseContentBundle(await file.text());
}

export function parseBackupBundle(serialized: string): SoulforgeBackupBundle {
  const parsed = parseJson(serialized, "O arquivo não contém um JSON válido.");
  if (!isRecord(parsed) || parsed.format !== backupFormat || !isNonEmptyString(parsed.exportedAt) || !isNonEmptyString(parsed.appVersion) || !Array.isArray(parsed.characters) || !Array.isArray(parsed.packs) || !Array.isArray(parsed.localDefinitions) || !Array.isArray(parsed.overrides)) {
    throw new Error("Este arquivo não é um backup completo compatível com o SoulForge.");
  }
  const characters = validateCharacters(parsed.characters);
  const packs = validatePacks(parsed.packs);
  const localDefinitions = validateLocalDefinitions(parsed.localDefinitions);
  const overrides = validateOverrides(parsed.overrides);
  assertUniqueIds(characters, "id", "O backup possui fichas com o mesmo identificador.");
  assertUniqueIds(packs.map((pack) => pack.manifest), "id", "O backup possui Packs com o mesmo identificador.");
  assertUniqueIds([...packs.flatMap((pack) => pack.definitions), ...localDefinitions], "id", "O backup possui Definitions com o mesmo identificador.");
  return { format: backupFormat, exportedAt: parsed.exportedAt, appVersion: parsed.appVersion, characters, packs, localDefinitions, overrides };
}

export function parseContentBundle(serialized: string): SoulforgeContentBundle {
  const parsed = parseJson(serialized, "O arquivo não contém um JSON válido.");
  if (!isRecord(parsed) || parsed.format !== contentFormat || !isNonEmptyString(parsed.exportedAt) || !isNonEmptyString(parsed.appVersion) || !Array.isArray(parsed.definitions) || !Array.isArray(parsed.overrides)) {
    throw new Error("Este arquivo não é um conteúdo compartilhável compatível com o SoulForge.");
  }
  const definitions = validateLocalDefinitions(parsed.definitions);
  const overrides = validateOverrides(parsed.overrides);
  assertUniqueIds(definitions, "id", "O arquivo possui Definitions com o mesmo identificador.");
  return { format: contentFormat, exportedAt: parsed.exportedAt, appVersion: parsed.appVersion, definitions, overrides };
}

export function snapshotFromBackup(bundle: SoulforgeBackupBundle): LocalDataSnapshot {
  return {
    characters: bundle.characters,
    installedPacks: bundle.packs.map((pack) => pack.manifest),
    definitions: [...bundle.packs.flatMap((pack) => pack.definitions), ...bundle.localDefinitions],
    overrides: bundle.overrides
  };
}

export function previewContentImport(bundle: SoulforgeContentBundle, snapshot: LocalDataSnapshot): ContentImportPreview {
  const existingDefinitionIds = new Set(snapshot.definitions.filter((definition) => definition.packId === "local").map((definition) => definition.id));
  const externalDefinitionIds = new Set(snapshot.definitions.filter((definition) => definition.packId !== "local").map((definition) => definition.id));
  const protectedIds = bundle.definitions.filter((definition) => externalDefinitionIds.has(definition.id)).map((definition) => definition.id);
  if (protectedIds.length) throw new Error("O conteúdo tenta reutilizar um ID que pertence a um Pack instalado.");
  const existingOverrideIds = new Set(snapshot.overrides.map((override) => override.id));
  const availableDefinitionIds = new Set([...snapshot.definitions.map((definition) => definition.id), ...bundle.definitions.map((definition) => definition.id)]);
  return {
    bundle,
    definitionConflictIds: bundle.definitions.filter((definition) => existingDefinitionIds.has(definition.id)).map((definition) => definition.id),
    overrideConflictIds: bundle.overrides.filter((override) => existingOverrideIds.has(override.id)).map((override) => override.id),
    missingOverrideDefinitionIds: bundle.overrides.filter((override) => !availableDefinitionIds.has(override.definitionId)).map((override) => override.definitionId),
    missingDefinitionReferenceIds: [...new Set(bundle.definitions.flatMap(getDefinitionReferenceIds).filter((id) => !availableDefinitionIds.has(id)))]
  };
}

export function selectContentImport(preview: ContentImportPreview, acceptedConflictIds: ReadonlySet<string>, snapshot: LocalDataSnapshot): { definitions: Definition[]; overrides: CardMarkerOverride[] } {
  const existingDefinitionIds = new Set(snapshot.definitions.filter((definition) => definition.packId === "local").map((definition) => definition.id));
  const existingOverrideIds = new Set(snapshot.overrides.map((override) => override.id));
  return {
    definitions: preview.bundle.definitions.filter((definition) => !existingDefinitionIds.has(definition.id) || acceptedConflictIds.has(`definition:${definition.id}`)),
    overrides: preview.bundle.overrides.filter((override) => !existingOverrideIds.has(override.id) || acceptedConflictIds.has(`override:${override.id}`))
  };
}

function getDefinitionReferenceIds(definition: Definition): string[] {
  switch (definition.type) {
    case "card": return [definition.domainId];
    case "class": return [...definition.domainIds, ...definition.featureIds, definition.hopeFeatureId, ...definition.subclassIds];
    case "subclass": return [definition.classId, ...definition.foundationFeatureIds, ...definition.specializationFeatureIds, ...definition.masteryFeatureIds];
    case "ancestry": return [definition.topFeatureId, definition.bottomFeatureId];
    case "community": return [definition.featureId];
    case "feature": return [definition.sourceId];
    default: return [];
  }
}

export function describeBackup(bundle: SoulforgeBackupBundle): string {
  const definitionCount = bundle.packs.reduce((count, pack) => count + pack.definitions.length, 0) + bundle.localDefinitions.length;
  return `${bundle.characters.length} fichas · ${bundle.packs.length} Packs · ${definitionCount} Definitions · ${bundle.overrides.length} complementos`;
}

export function renderLocalBackupDialogs(state: LocalBackupState, escapeHtml: (value: string) => string): string {
  return `${renderBackupRestoreModal(state, escapeHtml)}${renderContentImportModal(state, escapeHtml)}`;
}

export function handleLocalBackupAction(target: HTMLElement, deps: LocalBackupDependencies): boolean {
  const { state } = deps;
  if (target.closest('[data-action="create-full-backup"]')) {
    void createFullBackup(deps);
  } else if (target.closest('[data-action="export-local-content"]')) {
    void exportLocalContent(deps);
  } else if (target.closest('[data-action="open-backup-restore"]')) {
    state.backupRestoreOpen = true;
    state.pendingBackup = undefined;
    state.backupError = undefined;
    deps.render();
  } else if (target.closest('[data-action="cancel-backup-restore"]')) {
    closeBackupRestore(state);
    deps.render();
  } else if (target.closest('[data-action="choose-backup-file"]')) {
    document.querySelector<HTMLInputElement>("[data-backup-file]")?.click();
  } else if (target.closest('[data-action="confirm-backup-restore"]')) {
    void confirmBackupRestore(deps);
  } else if (target.closest('[data-action="open-content-import"]')) {
    state.contentImportOpen = true;
    state.pendingContentImport = undefined;
    state.contentImportError = undefined;
    state.acceptedContentConflictIds = [];
    deps.render();
  } else if (target.closest('[data-action="cancel-content-import"]')) {
    closeContentImport(state);
    deps.render();
  } else if (target.closest('[data-action="choose-content-file"]')) {
    document.querySelector<HTMLInputElement>("[data-content-file]")?.click();
  } else if (target.closest('[data-action="confirm-content-import"]')) {
    void confirmContentImport(deps);
  } else return false;
  return true;
}

export function handleLocalBackupInput(target: EventTarget | null, deps: LocalBackupDependencies): boolean {
  if (!(target instanceof HTMLInputElement)) return false;
  if (target.matches("[data-backup-file]")) {
    const file = target.files?.[0];
    if (file) void stageBackupRestore(file, deps).then(deps.render);
    return true;
  }
  if (target.matches("[data-content-file]")) {
    const file = target.files?.[0];
    if (file) void stageContentImport(file, deps).then(deps.render);
    return true;
  }
  if (target.matches("[data-content-conflict-id]")) {
    const id = target.dataset.contentConflictId;
    if (!id) return true;
    const accepted = new Set(deps.state.acceptedContentConflictIds);
    target.checked ? accepted.add(id) : accepted.delete(id);
    deps.state.acceptedContentConflictIds = [...accepted];
    return true;
  }
  return false;
}

async function createFullBackup(deps: LocalBackupDependencies): Promise<void> {
  try {
    downloadLocalData(buildBackupBundle(await loadLocalDataSnapshot(), deps.appVersion));
  } catch (caught) {
    deps.showError(caught instanceof Error ? caught.message : "Não foi possível criar o backup.");
  }
}

async function exportLocalContent(deps: LocalBackupDependencies): Promise<void> {
  try {
    downloadLocalData(buildContentBundle(await loadLocalDataSnapshot(), deps.appVersion));
  } catch (caught) {
    deps.showError(caught instanceof Error ? caught.message : "Não foi possível exportar o conteúdo.");
  }
}

async function stageBackupRestore(file: File, deps: LocalBackupDependencies): Promise<void> {
  try {
    deps.state.pendingBackup = await readBackupFile(file);
    deps.state.backupError = undefined;
  } catch (caught) {
    deps.state.pendingBackup = undefined;
    deps.state.backupError = caught instanceof Error ? caught.message : "Não foi possível ler o backup.";
  }
}

async function confirmBackupRestore(deps: LocalBackupDependencies): Promise<void> {
  const backup = deps.state.pendingBackup;
  if (!backup) return;
  try {
    downloadLocalData(buildBackupBundle(await loadLocalDataSnapshot(), deps.appVersion));
    await replaceLocalDataSnapshot(snapshotFromBackup(backup));
    await deps.ensureDemo();
    await deps.refreshCatalog();
    await deps.afterLocalDataChange?.();
    deps.state.characters = await deps.listCharacters();
    deps.state.character = deps.state.character ? await deps.loadCharacter(deps.state.character.id) : undefined;
    deps.state.characterSelectionOpen = !deps.state.character;
    closeBackupRestore(deps.state);
  } catch (caught) {
    deps.state.backupError = caught instanceof Error ? caught.message : "Não foi possível restaurar o backup. Os dados atuais foram preservados.";
  }
  deps.render();
}

async function stageContentImport(file: File, deps: LocalBackupDependencies): Promise<void> {
  try {
    const snapshot = await loadLocalDataSnapshot();
    deps.state.pendingContentImport = previewContentImport(await readContentFile(file), { ...snapshot, definitions: [...snapshot.definitions, ...deps.availableDefinitions()] });
    deps.state.contentImportError = undefined;
    deps.state.acceptedContentConflictIds = [];
  } catch (caught) {
    deps.state.pendingContentImport = undefined;
    deps.state.contentImportError = caught instanceof Error ? caught.message : "Não foi possível ler o conteúdo.";
  }
}

async function confirmContentImport(deps: LocalBackupDependencies): Promise<void> {
  const preview = deps.state.pendingContentImport;
  if (!preview) return;
  try {
    const selected = selectContentImport(preview, new Set(deps.state.acceptedContentConflictIds), await loadLocalDataSnapshot());
    await mergeLocalContent(selected.definitions, selected.overrides);
    await deps.refreshCatalog();
    await deps.afterLocalDataChange?.();
    closeContentImport(deps.state);
  } catch (caught) {
    deps.state.contentImportError = caught instanceof Error ? caught.message : "Não foi possível importar o conteúdo. Nenhuma alteração foi concluída.";
  }
  deps.render();
}

function closeBackupRestore(state: LocalBackupState): void {
  state.backupRestoreOpen = false;
  state.pendingBackup = undefined;
  state.backupError = undefined;
}

function closeContentImport(state: LocalBackupState): void {
  state.contentImportOpen = false;
  state.pendingContentImport = undefined;
  state.contentImportError = undefined;
  state.acceptedContentConflictIds = [];
}

function renderBackupRestoreModal(state: LocalBackupState, escapeHtml: (value: string) => string): string {
  if (!state.backupRestoreOpen) return "";
  const backup = state.pendingBackup;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal danger-modal backup-restore-modal" role="dialog" aria-modal="true" aria-labelledby="backup-restore-title"><button class="modal-close" type="button" data-action="cancel-backup-restore" aria-label="Cancelar restauração">×</button><span class="resource-modal-label">Backup completo</span><h2 id="backup-restore-title">Restaurar backup?</h2>${backup ? `<div class="pack-import-preview"><span>Pronto para restaurar</span><h3>${escapeHtml(describeBackup(backup))}</h3><p>Exportado em ${escapeHtml(new Date(backup.exportedAt).toLocaleString("pt-BR"))} · SoulForge ${escapeHtml(backup.appVersion)}</p></div><div class="danger-summary"><strong>!</strong><span>Todos os dados locais atuais serão substituídos. Antes disso, o SoulForge baixará automaticamente uma cópia de segurança deste dispositivo.</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="choose-backup-file">Escolher outro arquivo</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-backup-restore">Baixar cópia e restaurar</button></div>` : `<p>Selecione um arquivo <strong>.soulforge-backup.json</strong> criado pelo SoulForge.</p><button class="sf-action sf-action--primary primary-action" type="button" data-action="choose-backup-file">Selecionar backup</button>`}<input type="file" accept="application/json,.json,.soulforge-backup.json" data-backup-file hidden>${state.backupError ? `<p class="form-error" role="alert">${escapeHtml(state.backupError)}</p>` : ""}</section></div>`;
}

function renderContentImportModal(state: LocalBackupState, escapeHtml: (value: string) => string): string {
  if (!state.contentImportOpen) return "";
  const preview = state.pendingContentImport;
  const accepted = new Set(state.acceptedContentConflictIds);
  if (!preview) return `<div class="modal-backdrop" data-modal-backdrop><section class="modal pack-import-modal" role="dialog" aria-modal="true" aria-labelledby="content-import-title"><button class="modal-close" type="button" data-action="cancel-content-import" aria-label="Cancelar importação">×</button><span class="resource-modal-label">Conteúdo compartilhável</span><h2 id="content-import-title">Importar conteúdo</h2><p>Selecione um arquivo <strong>.soulforge-content.json</strong>. Ele pode conter criações locais e complementos de cartas, mas nunca fichas ou cópias de Packs externos.</p><button class="sf-action sf-action--primary primary-action" type="button" data-action="choose-content-file">Selecionar conteúdo</button><input type="file" accept="application/json,.json,.soulforge-content.json" data-content-file hidden>${state.contentImportError ? `<p class="form-error" role="alert">${escapeHtml(state.contentImportError)}</p>` : ""}</section></div>`;
  const conflicts = [
    ...preview.definitionConflictIds.map((id) => ({ key: `definition:${id}`, label: `Definition local: ${id}` })),
    ...preview.overrideConflictIds.map((id) => ({ key: `override:${id}`, label: `Complemento: ${id}` }))
  ];
  const availabilityWarning = preview.missingOverrideDefinitionIds.length || preview.missingDefinitionReferenceIds.length
    ? `<div class="danger-summary"><strong>!</strong><span>${preview.missingOverrideDefinitionIds.length ? `${preview.missingOverrideDefinitionIds.length} complemento(s) será(ão) preservado(s), mas só ficará(ão) visível(is) quando a carta de origem estiver instalada. ` : ""}${preview.missingDefinitionReferenceIds.length ? `${preview.missingDefinitionReferenceIds.length} referência(s) do conteúdo ainda não está(ão) disponível(is) neste dispositivo.` : ""}</span></div>`
    : "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="modal pack-import-modal content-import-modal" role="dialog" aria-modal="true" aria-labelledby="content-import-title"><button class="modal-close" type="button" data-action="cancel-content-import" aria-label="Cancelar importação">×</button><span class="resource-modal-label">Conteúdo compartilhável</span><h2 id="content-import-title">Importar conteúdo</h2><div class="pack-import-preview"><span>Pronto para importar</span><h3>${preview.bundle.definitions.length} Definitions · ${preview.bundle.overrides.length} complementos</h3><p>Exportado em ${escapeHtml(new Date(preview.bundle.exportedAt).toLocaleString("pt-BR"))}</p></div>${conflicts.length ? `<div class="content-import-conflicts"><strong>Conflitos encontrados</strong><p>Marque somente o que deseja substituir pelo arquivo recebido.</p>${conflicts.map((conflict) => `<label><input type="checkbox" data-content-conflict-id="${escapeHtml(conflict.key)}" ${accepted.has(conflict.key) ? "checked" : ""}><span>${escapeHtml(conflict.label)}</span></label>`).join("")}</div>` : '<p class="settings-panel-copy">Nenhum conteúdo existente será substituído.</p>'}${availabilityWarning}<div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="choose-content-file">Escolher outro arquivo</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-content-import">Importar conteúdo</button></div><input type="file" accept="application/json,.json,.soulforge-content.json" data-content-file hidden>${state.contentImportError ? `<p class="form-error" role="alert">${escapeHtml(state.contentImportError)}</p>` : ""}</section></div>`;
}

function validateCharacters(entries: unknown[]): Character[] {
  return entries.map((entry) => parseCharacterImport(JSON.stringify(entry), new Set()));
}

function validatePacks(entries: unknown[]): PackBundle[] {
  return entries.map((entry) => validatePackBundle(entry));
}

function validateLocalDefinitions(entries: unknown[]): Definition[] {
  if (entries.some((entry) => !isRecord(entry) || entry.packId !== "local")) throw new Error("Conteúdo compartilhável só pode conter Definitions locais.");
  const manifest: PackManifest = { id: "local", name: "Conteúdo local", version: "1", description: "Validação temporária." };
  try {
    return validatePackBundle({ format: "soulforge-pack-v1", manifest, definitions: entries }).definitions;
  } catch {
    throw new Error("O arquivo contém Definitions locais inválidas.");
  }
}

function validateOverrides(entries: unknown[]): CardMarkerOverride[] {
  if (entries.some((entry) => !isValidOverride(entry))) throw new Error("O arquivo contém complementos locais inválidos.");
  assertUniqueIds(entries as Array<{ id: string }>, "id", "O arquivo possui complementos com o mesmo identificador.");
  return structuredClone(entries) as CardMarkerOverride[];
}

function isValidOverride(value: unknown): value is CardMarkerOverride {
  if (!isRecord(value) || value.kind !== "card-marker" || !isNonEmptyString(value.id) || !isNonEmptyString(value.definitionId) || value.id !== `card-marker:${value.definitionId}` || !Array.isArray(value.gameMarkers)) return false;
  try {
    validatePackBundle({
      format: "soulforge-pack-v1",
      manifest: { id: "backup-validation", name: "Validação", version: "1", description: "Validação temporária." },
      definitions: [{ id: "card.backup-validation", type: "card", packId: "backup-validation", name: "Validação", summary: "Validação.", domainId: "domain.backup-validation", tier: 1, cardType: "acao", effect: "Validação.", gameMarkers: value.gameMarkers }]
    });
    return true;
  } catch {
    return false;
  }
}

function parseJson(serialized: string, message: string): unknown {
  try { return JSON.parse(serialized); } catch { throw new Error(message); }
}

function assertUniqueIds<T extends Record<string, unknown>>(entries: T[], key: keyof T, message: string): void {
  const ids = entries.map((entry) => entry[key]);
  if (new Set(ids).size !== ids.length) throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function downloadJson(value: unknown, name: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
