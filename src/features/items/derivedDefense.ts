import { getSpellcastAttributeId } from "../../content/spellcastAttributes";
import type { Catalog } from "../../domain/catalog";
import type { Character, Defense, ItemDerivedDefenseModifier } from "../../domain/types";

export type DerivedDefenseResolution = { value: number; unavailableSpellcast: boolean };

export function getCharacterTier(level: number): number {
  return level >= 8 ? 4 : level >= 5 ? 3 : level >= 2 ? 2 : 1;
}

export function resolveDerivedDefenseModifier(modifier: ItemDerivedDefenseModifier, character: Character, catalog?: Pick<Catalog, "subclasses">): DerivedDefenseResolution {
  let sourceValue = 0;
  let unavailableSpellcast = false;
  if (modifier.source.kind === "attribute") {
    const attributeId = modifier.source.attributeId;
    sourceValue = character.attributes.find((entry) => entry.id === attributeId)?.value ?? 0;
  } else if (modifier.source.kind === "spellcast-attribute") {
    const subclass = catalog?.subclasses.find((entry) => entry.id === character.identity.primarySubclassId);
    const attributeId = getSpellcastAttributeId(character.identity.primarySubclassId, subclass);
    unavailableSpellcast = !attributeId;
    sourceValue = attributeId ? character.attributes.find((entry) => entry.id === attributeId)?.value ?? 0 : 0;
  } else if (modifier.source.kind === "character-level") {
    sourceValue = character.identity.level;
  } else {
    sourceValue = getCharacterTier(character.identity.level);
  }
  const raw = sourceValue * (modifier.multiplier ?? 1) / (modifier.divisor ?? 1);
  const value = modifier.rounding === "floor" ? Math.floor(raw) : modifier.rounding === "round" ? Math.round(raw) : Math.ceil(raw);
  return { value, unavailableSpellcast };
}

export function sumDerivedDefense(modifiers: ItemDerivedDefenseModifier[] | undefined, character: Character, catalog?: Pick<Catalog, "subclasses">): { defense: Partial<Defense>; unavailableSpellcast: boolean } {
  const defense: Partial<Defense> = {};
  let unavailableSpellcast = false;
  for (const modifier of modifiers ?? []) {
    const resolved = resolveDerivedDefenseModifier(modifier, character, catalog);
    defense[modifier.field] = (defense[modifier.field] ?? 0) + resolved.value;
    unavailableSpellcast ||= resolved.unavailableSpellcast;
  }
  return { defense, unavailableSpellcast };
}

export function describeDerivedDefenseModifier(modifier: ItemDerivedDefenseModifier): string {
  const field = ({ armor: "Armadura", evasion: "Evasão", minor: "Limiar menor", major: "Limiar maior" } as const)[modifier.field];
  const source = modifier.source.kind === "attribute"
    ? ({ for: "Força", dex: "Agilidade", cha: "Finesse", wil: "Instinto", con: "Presença", int: "Conhecimento" } as const)[modifier.source.attributeId]
    : ({ "spellcast-attribute": "Conjuração", "character-level": "nível", "character-tier": "tier" } as const)[modifier.source.kind];
  const multiplier = modifier.multiplier ?? 1;
  const divisor = modifier.divisor ?? 1;
  return `${field}: ${multiplier === 1 ? "" : `${multiplier} × `}${source}${divisor === 1 ? "" : ` ÷ ${divisor}`} (${modifier.rounding ?? "ceil"})`;
}
