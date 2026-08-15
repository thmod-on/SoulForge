import type { Definition, PackBundle, PackManifest } from "../../domain/types";

/** Valida a estrutura mínima de um pack antes de qualquer escrita no IndexedDB. */
export function validatePackBundle(value: unknown): PackBundle {
  if (!value || typeof value !== "object") throw new Error("O arquivo não contém um Pack válido.");
  const bundle = value as Partial<PackBundle>;
  const manifest = bundle.manifest;
  if (bundle.format !== "soulforge-pack-v1" || !manifest || typeof manifest !== "object" || !Array.isArray(bundle.definitions)) {
    throw new Error("Use um arquivo no formato .soulforge-pack.json.");
  }
  if (!manifest.id || !manifest.name || !manifest.version || !manifest.description) throw new Error("O manifesto do Pack está incompleto.");
  if (!bundle.definitions.length) throw new Error("O Pack não possui Definitions para importar.");

  const knownTypes = new Set(["domain", "card", "item", "class", "subclass", "feature", "ancestry", "community"]);
  const ids = new Set<string>();
  for (const definition of bundle.definitions) {
    if (!isDefinitionShapeValid(definition, manifest)) throw new Error("Uma Definition é inválida ou não pertence ao Pack informado.");
    if (ids.has(definition.id)) throw new Error("O Pack contém IDs de Definition repetidos.");
    ids.add(definition.id);
  }

  const definitions = bundle.definitions as Definition[];
  for (const community of definitions.filter((definition) => definition.type === "community")) {
    if (!Array.isArray(community.adjectives) || community.adjectives.length !== 6 || community.adjectives.some((value) => typeof value !== "string" || !value.trim())) {
      throw new Error(`A comunidade “${community.name}” precisa declarar exatamente seis adjetivos.`);
    }
    const feature = definitions.find((definition) => definition.id === community.featureId);
    if (!feature || feature.type !== "feature" || feature.sourceType !== "community" || feature.sourceId !== community.id) {
      throw new Error(`A comunidade “${community.name}” precisa incluir sua Feature de comunidade vinculada.`);
    }
  }
  return { format: "soulforge-pack-v1", manifest: manifest as PackManifest, definitions };

  function isDefinitionShapeValid(definition: unknown, candidateManifest: Partial<PackManifest>): definition is { id: string; name: string; summary: string; packId: string; type: string } {
    if (!definition || typeof definition !== "object") return false;
    const candidate = definition as { type?: string; id?: string; name?: string; summary?: string; packId?: string };
    return Boolean(knownTypes.has(candidate.type ?? "") && candidate.id && candidate.name && candidate.summary && candidate.packId === candidateManifest.id);
  }
}
