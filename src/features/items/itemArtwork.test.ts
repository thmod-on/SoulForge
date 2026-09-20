import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import type { ItemDefinition } from "../../domain/types";
import { getItemArtwork } from "./itemArtwork";

const item: ItemDefinition = { id: "test", type: "item", packId: "local", name: "Tocha", category: "equipamento", weight: 0, summary: "" };
describe("generic item artwork", () => {
  it.each([
    ["Poção de Vida Menor (Minor Health Potion)", "life-potion-minor.webp"],
    ["Poção de Cura", "life-potion-normal.webp"],
    ["Poção Maior de Vida", "life-potion-major.webp"],
    ["Poção de Vigor Menor (Minor Stamina Potion)", "vigor-potion-minor.webp"],
    ["Poção de Vigor", "vigor-potion-normal.webp"],
    ["Major Stamina Potion", "vigor-potion-major.webp"]
  ])("resolves %s to its own existing asset", (name, file) => {
    expect(getItemArtwork({ ...item, name, category: "consumivel" })).toContain(file);
    expect(existsSync(new URL(`../../../public/assets/items/generic/${file}`, import.meta.url))).toBe(true);
    expect(getItemArtwork({ ...item, name, category: "consumivel", image: "custom.webp" })).toBe("custom.webp");
    expect(getItemArtwork({ ...item, name, category: "arma" })).toBeUndefined();
  });
  it("does not match special potions by partial name", () => {
    expect(getItemArtwork({ ...item, name: "Poção de Vida Maior Eterna", category: "consumivel" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Poção de Vigor Superior", category: "consumivel" })).toBeUndefined();
  });
  it("preserves a user's own image", () => {
    expect(getItemArtwork({ ...item, image: "custom.webp" })).toBe("custom.webp");
  });
  it("matches known Portuguese and English names without mutating definitions", () => {
    expect(getItemArtwork(item)).toContain("torch.webp");
    expect(getItemArtwork({ ...item, name: "  TORCH  " })).toContain("torch.webp");
    expect(getItemArtwork({ ...item, id: "item.demo.rope", name: "Corda (15m)" })).toContain("rope.webp");
    expect(getItemArtwork({ ...item, name: "Ouro", category: "loot" })).toContain("gold.webp");
    expect(getItemArtwork({ ...item, name: "Armadura de Couro (Leather Armor)", category: "armadura" })).toContain("leather-armor.webp");
    expect(item.image).toBeUndefined();
  });
  it.each([
    "item.core.adaga-dagger.n1",
    "item.core.aprimorada-adaga-aprimorada-dagger.n2",
    "item.core.avancada-adaga-avancada-dagger.n3",
    "item.core.lendaria-adaga-lendaria-dagger.n4",
    "item.core.adaga-pequena-small-dagger.n1",
    "item.core.aprimorada-adaga-pequena-aprimorada-small-dagger.n2",
    "item.core.avancada-adaga-pequena-avancada-small-dagger.n3",
    "item.core.lendaria-adaga-pequena-lendaria-small-dagger.n4",
    "item.core.adaga-devoradora-devouring-dagger.n2",
    "item.core.adaga-curva-curved-dagger.n4",
    "item.core.adaga-de-aparar-parrying-dagger.n2",
    "item.hope-fear.adaga-retorcida",
    "item.hope-fear.aprimorada-adaga-retorcida",
    "item.hope-fear.avancada-adaga-retorcida",
    "item.hope-fear.lendaria-adaga-retorcida",
    "item.hope-fear.adaga-de-conjuracao",
    "item.hope-fear.aprimorada-adaga-de-conjuracao",
    "item.hope-fear.avancada-adaga-de-conjuracao",
    "item.hope-fear.lendaria-adaga-de-conjuracao"
  ])("assigns the generic dagger to the known dagger family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Adaga", category: "arma" })).toContain("dagger.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/dagger.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated dagger artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.adaga-dagger.n1", name: "Adaga", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it("does not assign unrelated or special equipment a misleading illustration", () => {
    expect(getItemArtwork({ ...item, name: "Tocha Eterna" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Corda (15m)" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Dardo de Corda", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Pingente de Adaga de Ferro", category: "loot" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Ouro", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Armadura de Couro Mágica", category: "armadura" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Armadura de Placas", category: "armadura" })).toBeUndefined();
  });
});
