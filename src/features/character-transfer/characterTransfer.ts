import type { Character } from "../../domain/types";

export const characterExportFormat = "soulforge-character-v1" as const;

export type CharacterExportBundle = {
  format: typeof characterExportFormat;
  exportedAt: string;
  character: Character;
};

export type CharacterImportState = {
  characters: Character[];
  pendingCharacterImport?: Character;
  characterImportError?: string;
};

export function downloadCharacterExport(character: Character): void {
  const bundle: CharacterExportBundle = {
    format: characterExportFormat,
    exportedAt: new Date().toISOString(),
    character
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `soulforge-${toSafeFileName(character.identity.name) || "personagem"}.soulforge-character.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}

export async function readCharacterImportFile(file: File, existingCharacterIds: ReadonlySet<string>): Promise<Character> {
  return parseCharacterImport(await file.text(), existingCharacterIds);
}

export async function stageCharacterImport(state: CharacterImportState, file: File): Promise<void> {
  try {
    state.pendingCharacterImport = await readCharacterImportFile(file, new Set(state.characters.map((character) => character.id)));
    state.characterImportError = undefined;
  } catch (caught) {
    state.pendingCharacterImport = undefined;
    state.characterImportError = caught instanceof Error ? caught.message : "Não foi possível ler esta ficha.";
  }
}

export async function confirmStagedCharacterImport(
  state: CharacterImportState,
  saveCharacter: (character: Character) => Promise<void>,
  listCharacters: () => Promise<Character[]>
): Promise<boolean> {
  if (!state.pendingCharacterImport) return false;
  try {
    await saveCharacter(state.pendingCharacterImport);
    state.characters = await listCharacters();
    state.pendingCharacterImport = undefined;
    state.characterImportError = undefined;
    return true;
  } catch {
    state.characterImportError = "Não foi possível salvar esta ficha neste dispositivo.";
    return false;
  }
}

type RenderCharacterImportModalOptions = {
  isOpen: boolean;
  character?: Character;
  error?: string;
  escapeHtml: (value: string) => string;
};

export function renderCharacterImportModal(options: RenderCharacterImportModalOptions): string {
  if (!options.isOpen) return "";
  const { character, error, escapeHtml } = options;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal pack-import-modal" role="dialog" aria-modal="true" aria-labelledby="character-import-title">
        <button class="modal-close" type="button" data-modal-close aria-label="Fechar importacao">x</button>
        <span class="resource-modal-label">Dados locais</span>
        <h2 id="character-import-title">Importar personagem</h2>
        ${character ? `
          <div class="pack-import-preview">
            <span>Pronto para importar</span>
            <h3>${escapeHtml(character.identity.name)}</h3>
            <p>${escapeHtml(character.identity.ancestry)} · ${escapeHtml(character.identity.className)} · Nível ${character.identity.level}</p>
          </div>
          <p class="settings-panel-copy">A ficha será salva neste navegador. Se já existir uma ficha com o mesmo identificador, será criada uma cópia segura.</p>
          <div class="modal-actions">
            <button class="sf-action sf-action--secondary secondary-action" type="button" data-action="choose-character-file">Escolher outro arquivo</button>
            <button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-character-import">Importar personagem</button>
          </div>
        ` : `
          <p>Selecione um arquivo <strong>.soulforge-character.json</strong> exportado pelo SoulForge.</p>
          <button class="sf-action sf-action--primary primary-action" type="button" data-action="choose-character-file">Selecionar arquivo</button>
        `}
        <input type="file" accept="application/json,.json,.soulforge-character.json" data-character-file hidden>
        ${error ? `<p class="form-error">${escapeHtml(error)}</p>` : ""}
      </section>
    </div>
  `;
}

/** Lê a exportação atual e o JSON simples emitido por versões anteriores. */
export function parseCharacterImport(serialized: string, existingCharacterIds: ReadonlySet<string>): Character {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("O arquivo não contém um JSON válido.");
  }

  const candidate = isExportBundle(parsed) ? parsed.character : parsed;
  if (!isCharacter(candidate)) {
    throw new Error("Este arquivo não contém uma ficha compatível com o SoulForge.");
  }

  const character = structuredClone(candidate);
  if (existingCharacterIds.has(character.id)) {
    character.id = createImportedCharacterId();
  }
  return character;
}

function isExportBundle(value: unknown): value is CharacterExportBundle {
  return isRecord(value) && value.format === characterExportFormat && "character" in value;
}

function isCharacter(value: unknown): value is Character {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isRecord(value.identity) || !isRecord(value.defense) || !isRecord(value.deck) || !isRecord(value.inventory)) return false;
  return isNonEmptyString(value.identity.name)
    && isFiniteNumber(value.identity.level)
    && isFiniteNumber(value.identity.xp)
    && isFiniteNumber(value.identity.nextLevelXp)
    && isFiniteNumber(value.defense.evasion)
    && isFiniteNumber(value.defense.armor)
    && isFiniteNumber(value.defense.minor)
    && isFiniteNumber(value.defense.major)
    && isFiniteNumber(value.proficiency)
    && Array.isArray(value.attributes)
    && Array.isArray(value.resources)
    && Array.isArray(value.skills)
    && Array.isArray(value.experiences)
    && Array.isArray(value.notes)
    && isStringArray(value.deck.activeCardIds)
    && isStringArray(value.deck.learnedCardIds)
    && isFiniteNumber(value.inventory.capacity)
    && Array.isArray(value.inventory.compartments)
    && Array.isArray(value.inventory.entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function createImportedCharacterId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `character-imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toSafeFileName(value: string): string {
  return value.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
