import type { ItemDefinition, PackManifest } from "../../domain/types";
import type { ItemOverrideValues, ItemPersonalOverride } from "../../storage/compendiumRepository";

const fields = ["summary", "image", "combatModifiers", "derivedDefenseModifiers", "armorProfile"] as const;

export function applyItemPersonalOverride(item: ItemDefinition, override?: ItemPersonalOverride): ItemDefinition {
  if (!override || override.definitionId !== item.id) return item;
  const next: ItemDefinition = { ...item };
  for (const field of fields) {
    if (!(field in override.changes)) continue;
    const value = override.changes[field];
    if (value === null) delete next[field as keyof ItemDefinition];
    else Object.assign(next, { [field]: structuredClone(value) });
  }
  return next;
}

export function createItemPersonalOverride(item: ItemDefinition, pack: PackManifest, changes: ItemOverrideValues, previous?: ItemPersonalOverride): ItemPersonalOverride {
  const baseline: ItemOverrideValues = previous ? { ...previous.baseline } : {};
  for (const field of fields) {
    if (field in changes && !(field in baseline)) Object.assign(baseline, { [field]: structuredClone(item[field]) ?? null });
  }
  return { id: `item-personal:${item.id}`, kind: "item-personal", definitionId: item.id, sourcePackVersion: pack.version, changes: structuredClone(changes), baseline, updatedAt: new Date().toISOString() };
}

export function getStaleItemOverrideFields(item: ItemDefinition, override: ItemPersonalOverride): Array<keyof ItemOverrideValues> {
  return fields.filter((field) => field in override.changes && !sameValue(item[field], override.baseline[field])) as Array<keyof ItemOverrideValues>;
}

export function rebaseItemPersonalOverride(item: ItemDefinition, pack: PackManifest, override: ItemPersonalOverride): ItemPersonalOverride {
  const baseline: ItemOverrideValues = {};
  for (const field of fields) if (field in override.changes) Object.assign(baseline, { [field]: structuredClone(item[field]) ?? null });
  return { ...override, sourcePackVersion: pack.version, baseline, updatedAt: new Date().toISOString() };
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}
