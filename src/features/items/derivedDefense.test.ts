import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { resolveDerivedDefenseModifier } from "./derivedDefense";

describe("derived item defenses", () => {
  it.each([
    [{ field: "armor", source: { kind: "attribute", attributeId: "con" }, multiplier: 2 } as const, 6],
    [{ field: "minor", source: { kind: "character-level" }, divisor: 2, rounding: "ceil" } as const, 1],
    [{ field: "major", source: { kind: "character-tier" } } as const, 1]
  ])("resolves safe declarative sources", (modifier, expected) => {
    expect(resolveDerivedDefenseModifier(modifier, { ...demoCharacter, identity: { ...demoCharacter.identity, level: 1 } }).value).toBe(expected);
  });

  it("falls back to zero when spellcast is unavailable", () => {
    expect(resolveDerivedDefenseModifier({ field: "minor", source: { kind: "spellcast-attribute" } }, { ...demoCharacter, identity: { ...demoCharacter.identity, primarySubclassId: undefined } })).toEqual({ value: 0, unavailableSpellcast: true });
  });
});
