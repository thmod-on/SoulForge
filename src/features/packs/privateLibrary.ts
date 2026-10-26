import type { Catalog } from "../../domain/catalog";
import type { Character, PackBundle, PackManifest } from "../../domain/types";
import { validatePackBundle } from "./packValidation";
import { analyzePackUpdate, type PackUsageImpact } from "./packUsage";
import { installLibraryPacks } from "../../storage/packRepository";

export type PrivateLibraryEntry = {
  id: string;
  name: string;
  version: string;
  checksum: string;
  changes: string;
  definitionCount: number;
};

export type PrivateLibraryCatalog = {
  format: "soulforge-private-library-v1";
  publishedAt: string;
  packs: PrivateLibraryEntry[];
};

export type PrivateLibraryView = {
  catalog?: PrivateLibraryCatalog;
  loading: boolean;
  error?: string;
  lastCheckedAt?: string;
  bootstrapComplete: boolean;
  pendingUpdate?: { entry: PrivateLibraryEntry; impact: PackUsageImpact };
};

export type PrivateLibraryControllerDependencies = {
  authenticated(): boolean;
  installedPacks(): PackManifest[];
  catalog(): Catalog;
  characters(): Character[];
  view(): PrivateLibraryView;
  setView(view: PrivateLibraryView): void;
  refreshCatalog(): Promise<void>;
};

const bootstrapKey = "soulforge.private-library.bootstrap-complete";
let requestInFlight: Promise<void> | undefined;

export function getPrivateLibraryBootstrapComplete(): boolean {
  return localStorage.getItem(bootstrapKey) === "true";
}

export function markPrivateLibraryBootstrapComplete(): void {
  localStorage.setItem(bootstrapKey, "true");
}

export async function fetchPrivateLibraryCatalog(): Promise<PrivateLibraryCatalog> {
  const response = await fetch("/api/library/catalog", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(await readApiError(response, "Não foi possível consultar a biblioteca privada."));
  return validatePrivateLibraryCatalog(await response.json());
}

export function validatePrivateLibraryCatalog(value: unknown): PrivateLibraryCatalog {
  if (!value || typeof value !== "object") throw new Error("O catálogo privado é inválido.");
  const candidate = value as Partial<PrivateLibraryCatalog>;
  if (candidate.format !== "soulforge-private-library-v1" || typeof candidate.publishedAt !== "string" || !Array.isArray(candidate.packs) || !candidate.packs.length) throw new Error("O catálogo privado é inválido.");
  const ids = new Set<string>();
  const packs = candidate.packs.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("O catálogo privado contém um Pack inválido.");
    const pack = entry as Partial<PrivateLibraryEntry>;
    if (typeof pack.id !== "string" || !pack.id || ids.has(pack.id) || typeof pack.name !== "string" || !pack.name || typeof pack.version !== "string" || !pack.version || !/^[a-f0-9]{64}$/i.test(String(pack.checksum)) || typeof pack.changes !== "string" || !pack.changes.trim() || !Number.isInteger(pack.definitionCount) || Number(pack.definitionCount) < 1) throw new Error("O catálogo privado contém um Pack inválido.");
    const id = pack.id as string;
    const name = pack.name as string;
    const version = pack.version as string;
    const checksum = pack.checksum as string;
    const changes = pack.changes as string;
    const definitionCount = pack.definitionCount as number;
    ids.add(id);
    return { id, name, version, checksum: checksum.toLowerCase(), changes, definitionCount };
  });
  return { format: "soulforge-private-library-v1", publishedAt: candidate.publishedAt, packs };
}

export async function downloadPrivateLibraryBundle(entry: PrivateLibraryEntry): Promise<PackBundle> {
  const response = await fetch(`/api/library/packs/${encodeURIComponent(entry.id)}/${encodeURIComponent(entry.version)}`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(await readApiError(response, `Não foi possível baixar ${entry.name}.`));
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (await sha256(bytes) !== entry.checksum) throw new Error(`A verificação de integridade de ${entry.name} falhou.`);
  const bundle = validatePackBundle(JSON.parse(new TextDecoder().decode(bytes)));
  if (bundle.manifest.id !== entry.id || bundle.manifest.version !== entry.version || bundle.definitions.length !== entry.definitionCount) throw new Error(`O conteúdo recebido para ${entry.name} não corresponde ao catálogo.`);
  return bundle;
}

export async function installPrivateLibrary(entries: PrivateLibraryEntry[]): Promise<void> {
  const downloaded = await Promise.all(entries.map(async (entry) => ({ bundle: await downloadPrivateLibraryBundle(entry), checksum: entry.checksum })));
  await installLibraryPacks(downloaded);
  markPrivateLibraryBootstrapComplete();
}

export async function refreshPrivateLibraryState(deps: PrivateLibraryControllerDependencies, autoInstall = false): Promise<void> {
  if (requestInFlight) return requestInFlight;
  if (!deps.authenticated()) {
    deps.setView({ loading: false, bootstrapComplete: getPrivateLibraryBootstrapComplete() });
    return;
  }
  deps.setView({ ...deps.view(), loading: true, error: undefined, bootstrapComplete: getPrivateLibraryBootstrapComplete() });
  requestInFlight = (async () => {
    try {
      const catalog = await fetchPrivateLibraryCatalog();
      deps.setView({ catalog, loading: false, lastCheckedAt: new Date().toISOString(), bootstrapComplete: getPrivateLibraryBootstrapComplete() });
      if (autoInstall && !getPrivateLibraryBootstrapComplete() && !deps.installedPacks().length) {
        await installPrivateLibrary(catalog.packs);
        await deps.refreshCatalog();
        deps.setView({ catalog, loading: false, lastCheckedAt: new Date().toISOString(), bootstrapComplete: true });
      }
    } catch (error) {
      deps.setView({ ...deps.view(), loading: false, error: error instanceof Error ? error.message : "Não foi possível consultar a biblioteca privada.", bootstrapComplete: getPrivateLibraryBootstrapComplete() });
    } finally {
      requestInFlight = undefined;
    }
  })();
  return requestInFlight;
}

export async function installMissingPrivateLibrary(deps: PrivateLibraryControllerDependencies): Promise<void> {
  const catalog = deps.view().catalog;
  if (!catalog) return;
  const missing = getMissingLibraryEntries(catalog, deps.installedPacks());
  if (!missing.length) return;
  await installPrivateLibraryEntries(deps, missing, "Não foi possível instalar a biblioteca privada.");
}

export async function reinstallPrivateLibrary(deps: PrivateLibraryControllerDependencies): Promise<void> {
  const catalog = deps.view().catalog;
  if (!catalog) return;
  await installPrivateLibraryEntries(deps, catalog.packs, "Não foi possível reinstalar a biblioteca privada.");
}

export async function preparePrivateLibraryUpdate(deps: PrivateLibraryControllerDependencies, id: string): Promise<void> {
  const entry = deps.view().catalog?.packs.find((pack) => pack.id === id);
  if (!entry) return;
  deps.setView({ ...deps.view(), loading: true, error: undefined, pendingUpdate: undefined });
  try {
    const bundle = await downloadPrivateLibraryBundle(entry);
    deps.setView({ ...deps.view(), loading: false, pendingUpdate: { entry, impact: analyzePackUpdate(deps.characters(), deps.catalog(), [bundle]) } });
  } catch (error) {
    deps.setView({ ...deps.view(), loading: false, error: error instanceof Error ? error.message : "Não foi possível preparar a atualização." });
  }
}

export async function confirmPrivateLibraryUpdate(deps: PrivateLibraryControllerDependencies): Promise<void> {
  const pending = deps.view().pendingUpdate;
  if (!pending) return;
  await installPrivateLibraryEntries(deps, [pending.entry], "Não foi possível atualizar o Pack.");
}

export function cancelPrivateLibraryUpdate(deps: PrivateLibraryControllerDependencies): void {
  deps.setView({ ...deps.view(), pendingUpdate: undefined });
}

async function installPrivateLibraryEntries(deps: PrivateLibraryControllerDependencies, entries: PrivateLibraryEntry[], fallback: string): Promise<void> {
  deps.setView({ ...deps.view(), loading: true, error: undefined });
  try {
    await installPrivateLibrary(entries);
    await deps.refreshCatalog();
    deps.setView({ ...deps.view(), loading: false, bootstrapComplete: true, pendingUpdate: undefined });
  } catch (error) {
    deps.setView({ ...deps.view(), loading: false, error: error instanceof Error ? error.message : fallback });
  }
}

export function getLibraryUpdates(catalog: PrivateLibraryCatalog | undefined, installed: PackManifest[]): PrivateLibraryEntry[] {
  if (!catalog) return [];
  const installedById = new Map(installed.map((pack) => [pack.id, pack]));
  return catalog.packs.filter((entry) => {
    const local = installedById.get(entry.id);
    return local?.installationSource === "library" && (local.version !== entry.version || local.libraryChecksum !== entry.checksum);
  });
}

export function getMissingLibraryEntries(catalog: PrivateLibraryCatalog | undefined, installed: PackManifest[]): PrivateLibraryEntry[] {
  if (!catalog) return [];
  const ids = new Set(installed.map((pack) => pack.id));
  return catalog.packs.filter((entry) => !ids.has(entry.id));
}

async function sha256(value: Uint8Array): Promise<string> {
  const copy = new Uint8Array(value).buffer;
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
  return body?.error ?? fallback;
}
