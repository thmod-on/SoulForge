import { describe, expect, it } from "vitest";
import type { ItemDefinition, PackManifest } from "../../domain/types";
import { applyItemPersonalOverride, createItemPersonalOverride, getStaleItemOverrideFields, rebaseItemPersonalOverride } from "./itemPersonalOverrides";

const item: ItemDefinition = { id: "item.pack.robes", type: "item", packId: "pack.test", name: "Vestes", summary: "Oficial", category: "armadura", weight: 0, combatModifiers: { minor: 10, major: 31 } };
const pack: PackManifest = { id: "pack.test", name: "Pack", version: "1.0.0", description: "Teste" };

describe("item personal overrides", () => {
  it("applies only allowlisted sparse fields", () => {
    const override = createItemPersonalOverride(item, pack, { summary: "Pessoal", derivedDefenseModifiers: [{ field: "minor", source: { kind: "spellcast-attribute" } }] });
    expect(applyItemPersonalOverride(item, override)).toMatchObject({ id: item.id, name: item.name, summary: "Pessoal", derivedDefenseModifiers: [{ field: "minor" }] });
  });

  it("detects upstream changes and can rebase", () => {
    const override = createItemPersonalOverride(item, pack, { summary: "Pessoal" });
    const updated = { ...item, summary: "Nova descrição oficial" };
    expect(getStaleItemOverrideFields(updated, override)).toEqual(["summary"]);
    expect(getStaleItemOverrideFields(updated, rebaseItemPersonalOverride(updated, { ...pack, version: "1.1.0" }, override))).toEqual([]);
  });
});
