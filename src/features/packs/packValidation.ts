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
  if (manifest.source !== undefined && (!manifest.source || typeof manifest.source !== "object" || !hasSourceMetadata(manifest.source))) throw new Error("A fonte declarada no manifesto do Pack é inválida.");
  if (!bundle.definitions.length) throw new Error("O Pack não possui Definitions para importar.");

  const knownTypes = new Set(["domain", "card", "item", "class", "subclass", "feature", "ancestry", "community", "transformation"]);
  const ids = new Set<string>();
  for (const definition of bundle.definitions) {
    if (!isDefinitionShapeValid(definition, manifest)) throw new Error("Uma Definition é inválida ou não pertence ao Pack informado.");
    if (ids.has(definition.id)) throw new Error("O Pack contém IDs de Definition repetidos.");
    ids.add(definition.id);
  }

  const definitions = bundle.definitions as Definition[];
  for (const feature of definitions.filter((definition) => definition.type === "feature" || definition.type === "card")) {
    if (!isGameMarkerListValid(feature.gameMarkers)) throw new Error(`A Feature “${feature.name}” possui marcadores de jogo inválidos.`);
    if (!isSheetModifierListValid(feature.sheetModifiers)) throw new Error(`A ${feature.type === "card" ? "carta" : "Feature"} “${feature.name}” possui modificadores de ficha inválidos.`);
    if (feature.type === "feature" && !isFeatureActivationValid(feature.activation)) throw new Error(`A Feature “${feature.name}” possui metadados de ativação inválidos.`);
  }

  function isGameMarkerListValid(value: unknown): boolean {
    if (value === undefined) return true;
    if (!Array.isArray(value)) return false;
    return value.every((marker) => {
      if (!marker || typeof marker !== "object") return false;
      const candidate = marker as { id?: unknown; kind?: unknown; label?: unknown; die?: unknown; quantity?: unknown; initialValue?: unknown; max?: unknown; reset?: unknown; gainTrigger?: unknown; resetRecovery?: unknown };
      if (typeof candidate.id !== "string" || !candidate.id || typeof candidate.label !== "string" || !candidate.label) return false;
      if (candidate.reset !== undefined && !["session", "short-rest", "long-rest"].includes(String(candidate.reset))) return false;
      if (candidate.kind === "counter") {
        if (candidate.initialValue !== undefined && (!Number.isInteger(candidate.initialValue) || Number(candidate.initialValue) < 0)) return false;
        if (candidate.max !== undefined && (!Number.isInteger(candidate.max) || Number(candidate.max) < 0)) return false;
        return candidate.quantity === undefined || isGameMarkerQuantityValid(candidate.quantity);
      }
      if (candidate.kind === "stored-dice") {
        if (candidate.reset !== "session" || candidate.gainTrigger !== "hope-roll" || !isGameMarkerQuantityValid(candidate.quantity) || !["d4", "d6", "d8", "d10", "d12", "d20"].includes(String(candidate.die))) return false;
        if (candidate.resetRecovery === undefined) return true;
        if (!candidate.resetRecovery || typeof candidate.resetRecovery !== "object") return false;
        const recovery = candidate.resetRecovery as { resourceId?: unknown; amountPerDie?: unknown };
        return typeof recovery.resourceId === "string" && Boolean(recovery.resourceId) && Number.isInteger(recovery.amountPerDie) && Number(recovery.amountPerDie) > 0;
      }
      return candidate.kind === "dice"
        && ["d4", "d6", "d8", "d10", "d12", "d20"].includes(String(candidate.die))
        && isGameMarkerQuantityValid(candidate.quantity);
    });
  }

  function isGameMarkerQuantityValid(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const candidate = value as { kind?: unknown; value?: unknown; attributeId?: unknown };
    if (candidate.kind === "fixed") return Number.isInteger(candidate.value) && Number(candidate.value) >= 0;
    if (candidate.kind === "attribute") return ["for", "dex", "con", "int", "wil", "cha"].includes(String(candidate.attributeId));
    return candidate.kind === "spellcast-trait" || candidate.kind === "proficiency" || candidate.kind === "character-level";
  }
  for (const community of definitions.filter((definition) => definition.type === "community")) {
    if (!Array.isArray(community.adjectives) || community.adjectives.length !== 6 || community.adjectives.some((value) => typeof value !== "string" || !value.trim())) {
      throw new Error(`A comunidade “${community.name}” precisa declarar exatamente seis adjetivos.`);
    }
    const feature = definitions.find((definition) => definition.id === community.featureId);
    if (!feature || feature.type !== "feature" || feature.sourceType !== "community" || feature.sourceId !== community.id) {
      throw new Error(`A comunidade “${community.name}” precisa incluir sua Feature de comunidade vinculada.`);
    }
  }
  for (const transformation of definitions.filter((definition) => definition.type === "transformation")) {
    if (typeof transformation.benefit !== "string" || !transformation.benefit.trim() || typeof transformation.drawback !== "string" || !transformation.drawback.trim() || !Array.isArray(transformation.narrativeQuestions) || !transformation.narrativeQuestions.length || transformation.narrativeQuestions.some((question) => typeof question !== "string" || !question.trim()) || (transformation.image !== undefined && (typeof transformation.image !== "string" || !transformation.image.trim())) || (transformation.rulesNotes !== undefined && (!Array.isArray(transformation.rulesNotes) || transformation.rulesNotes.some((note) => typeof note !== "string" || !note.trim())))) {
      throw new Error(`A transformação “${transformation.name}” precisa declarar benefício, desvantagem e perguntas narrativas.`);
    }
    if (!isGameMarkerListValid(transformation.gameMarkers)) throw new Error(`A transformação “${transformation.name}” possui marcadores de jogo inválidos.`);
  }
  return { format: "soulforge-pack-v1", manifest: manifest as PackManifest, definitions };

  function isDefinitionShapeValid(definition: unknown, candidateManifest: Partial<PackManifest>): definition is { id: string; name: string; summary: string; packId: string; type: string } {
    if (!definition || typeof definition !== "object") return false;
    const candidate = definition as { type?: string; id?: string; name?: string; summary?: string; packId?: string };
    return Boolean(knownTypes.has(candidate.type ?? "") && candidate.id && candidate.name && candidate.summary && candidate.packId === candidateManifest.id);
  }

  function hasSourceMetadata(value: object): boolean {
    const source = value as { name?: unknown; url?: unknown; version?: unknown; reviewedAt?: unknown };
    return typeof source.name === "string" && Boolean(source.name.trim()) && typeof source.url === "string" && /^https:\/\//.test(source.url) && typeof source.version === "string" && Boolean(source.version.trim()) && typeof source.reviewedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt);
  }

  function isSheetModifierListValid(value: unknown): boolean {
    if (value === undefined) return true;
    if (!Array.isArray(value)) return false;
    return value.every((modifier) => {
      if (!modifier || typeof modifier !== "object") return false;
      const candidate = modifier as { kind?: string; resourceId?: unknown; attributeId?: unknown; field?: unknown; amount?: unknown; multiplier?: unknown; divisor?: unknown; condition?: unknown };
      if (!isSheetModifierConditionValid(candidate.condition)) return false;
      if (candidate.kind === "resource-max") return typeof candidate.resourceId === "string" && Boolean(candidate.resourceId) && Number.isFinite(candidate.amount);
      if (candidate.kind === "attribute") return ["for", "dex", "con", "int", "wil", "cha"].includes(String(candidate.attributeId)) && Number.isFinite(candidate.amount);
      if (candidate.kind === "defense-per-attribute") return ["evasion", "armor", "minor", "major"].includes(String(candidate.field)) && ["for", "dex", "con", "int", "wil", "cha"].includes(String(candidate.attributeId)) && (candidate.multiplier === undefined || Number.isFinite(candidate.multiplier)) && (candidate.divisor === undefined || Number.isFinite(candidate.divisor) && Number(candidate.divisor) > 0);
      if (!Number.isFinite(candidate.amount)) return false;
      if (candidate.kind === "defense") return typeof candidate.field === "string" && ["evasion", "armor", "minor", "major"].includes(candidate.field);
      return candidate.kind === "defense-per-proficiency" && (candidate.field === "minor" || candidate.field === "major");
    });
  }

  function isSheetModifierConditionValid(value: unknown): boolean {
    if (value === undefined) return true;
    if (!value || typeof value !== "object") return false;
    const condition = value as { kind?: unknown; domainId?: unknown; minimum?: unknown };
    if (condition.kind === "equipped-armor") return true;
    return condition.kind === "active-domain-cards" && typeof condition.domainId === "string" && Boolean(condition.domainId) && Number.isInteger(condition.minimum) && Number(condition.minimum) > 0;
  }

  function isFeatureActivationValid(value: unknown): boolean {
    if (value === undefined) return true;
    if (!value || typeof value !== "object") return false;
    const candidate = value as { label?: unknown; costs?: unknown; endsOn?: unknown; modifiers?: unknown; reminders?: unknown; tokens?: unknown; target?: unknown };
    if (candidate.target !== undefined && candidate.target !== "self-or-ally") return false;
    if (typeof candidate.label !== "string" || !candidate.label.trim() || !Array.isArray(candidate.costs) || !Array.isArray(candidate.endsOn) || !Array.isArray(candidate.modifiers)) return false;
    if (!candidate.costs.every((cost) => {
      if (!cost || typeof cost !== "object") return false;
      const entry = cost as { kind?: unknown; resourceId?: unknown; sourceDefinitionId?: unknown; markerId?: unknown; amount?: unknown };
      if ((entry.amount !== "per-token") && (!Number.isInteger(entry.amount) || Number(entry.amount) < 1)) return false;
      if (entry.kind === "resource") return typeof entry.resourceId === "string" && Boolean(entry.resourceId);
      return entry.kind === "game-marker" && typeof entry.sourceDefinitionId === "string" && Boolean(entry.sourceDefinitionId) && typeof entry.markerId === "string" && Boolean(entry.markerId);
    })) return false;
    if (!candidate.endsOn.every((condition) => ["scene-end", "severe-damage", "short-rest", "long-rest", "next-successful-attack"].includes(String(condition)))) return false;
    if (!candidate.modifiers.every((modifier) => {
      if (!modifier || typeof modifier !== "object") return false;
      const entry = modifier as { kind?: unknown; fields?: unknown; amount?: unknown };
      if (!Array.isArray(entry.fields) || !entry.fields.length) return false;
      if (entry.kind === "defense") return Number.isFinite(entry.amount) && entry.fields.every((field) => ["evasion", "armor", "minor", "major"].includes(String(field)));
      return entry.kind === "defense-per-tier" && entry.fields.every((field) => field === "minor" || field === "major");
    })) return false;
    if (candidate.reminders !== undefined && (!Array.isArray(candidate.reminders) || candidate.reminders.some((reminder) => typeof reminder !== "string" || !reminder.trim()))) return false;
    return isFeatureActivationTokensValid(candidate.tokens);
  }

  function isFeatureActivationTokensValid(value: unknown): boolean {
    if (value === undefined) return true;
    if (!value || typeof value !== "object") return false;
    const tokens = value as { label?: unknown; initial?: unknown };
    if (typeof tokens.label !== "string" || !tokens.label.trim() || !tokens.initial || typeof tokens.initial !== "object") return false;
    const initial = tokens.initial as { kind?: unknown; value?: unknown; die?: unknown; bonus?: unknown; min?: unknown; maximumResourceId?: unknown };
    if (initial.kind === "fixed") return Number.isInteger(initial.value) && Number(initial.value) >= 0;
    if (initial.kind === "spellcast-trait") return true;
    if (initial.kind === "roll") return ["d4", "d6", "d8", "d10", "d12", "d20"].includes(String(initial.die)) && (initial.bonus === undefined || Number.isInteger(initial.bonus));
    return initial.kind === "manual" && (initial.min === undefined || Number.isInteger(initial.min) && Number(initial.min) >= 0) && (initial.maximumResourceId === undefined || typeof initial.maximumResourceId === "string" && Boolean(initial.maximumResourceId));
  }
}
