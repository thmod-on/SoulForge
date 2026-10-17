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
    expect(getItemArtwork({ ...item, name: "Corda (15m)" })).toBeUndefined();
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
  it.each([
    "item.core.espada-larga-broadsword.n1",
    "item.core.aprimorada-espada-larga-aprimorada-broadsword.n2",
    "item.core.avancada-espada-larga-avancada-broadsword.n3",
    "item.core.lendaria-espada-larga-lendaria-broadsword.n4",
    "item.core.espada-longa-longsword.n1",
    "item.core.aprimorada-espada-longa-aprimorada-longsword.n2",
    "item.core.avancada-espada-longa-avancada-longsword.n3",
    "item.core.lendaria-espada-longa-lendaria-longsword.n4",
    "item.core.espada-grande-greatsword.n1",
    "item.core.aprimorada-espada-grande-aprimorada-greatsword.n2",
    "item.core.avancada-espada-grande-avancada-greatsword.n3",
    "item.core.lendaria-espada-grande-lendaria-greatsword.n4",
    "item.core.espada-curta-shortsword.n1",
    "item.core.aprimorada-espada-curta-aprimorada-shortsword.n2",
    "item.core.avancada-espada-curta-avancada-shortsword.n3",
    "item.core.lendaria-espada-curta-lendaria-shortsword.n4",
    "item.core.espada-larga-urok-urok-broadsword.n2"
  ])("assigns the generic sword to the known conventional sword family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Espada", category: "arma" })).toContain("sword.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/sword.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated sword artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.espada-longa-longsword.n1", name: "Espada Longa", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.bastao-quarterstaff.n1",
    "item.core.aprimorada-bastao-aprimorada-quarterstaff.n2",
    "item.core.avancada-bastao-avancada-quarterstaff.n3",
    "item.core.lendaria-bastao-lendaria-quarterstaff.n4",
    "item.core.bastao-curto-shortstaff.n1",
    "item.core.aprimorada-bastao-curto-aprimorada-shortstaff.n2",
    "item.core.avancada-bastao-curto-avancada-shortstaff.n3",
    "item.core.lendaria-bastao-curto-lendaria-shortstaff.n4",
    "item.core.bastao-duplo-dualstaff.n1",
    "item.core.aprimorada-bastao-duplo-aprimorada-dualstaff.n2",
    "item.core.avancada-bastao-duplo-avancada-dualstaff.n3",
    "item.core.lendaria-bastao-duplo-lendaria-dualstaff.n4",
    "item.core.grande-cajado-greatstaff.n1",
    "item.core.aprimorada-grande-cajado-aprimorada-greatstaff.n2",
    "item.core.avancada-grande-cajado-avancada-greatstaff.n3",
    "item.core.lendaria-grande-cajado-lendaria-greatstaff.n4"
  ])("assigns the generic staff to the known conventional staff family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Bastão", category: "arma" })).toContain("staff.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/staff.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated staff artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.bastao-quarterstaff.n1", name: "Bastão", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.cota-de-malha-chainmail-armor.n1",
    "item.core.aprimorada-cota-de-malha-aprimorada-chainmail-armor.n2",
    "item.core.avancada-cota-de-malha-avancada-chainmail-armor.n3",
    "item.core.lendaria-cota-de-malha-lendaria-chainmail-armor.n4",
    "item.core.armadura-de-placas-full-plate-armor.n1",
    "item.core.aprimorada-armadura-de-placas-aprimorada-full-plate-armor.n2",
    "item.core.avancada-armadura-de-placas-avancada-full-plate-armor.n3",
    "item.core.lendaria-armadura-de-placas-lendaria-full-plate-armor.n4",
    "item.hope-fear.armadura-brigandina",
    "item.hope-fear.aprimorada-armadura-brigandina",
    "item.hope-fear.avancada-armadura-brigandina",
    "item.hope-fear.lendaria-armadura-brigandina",
    "item.hope-fear.armadura-de-bandas",
    "item.hope-fear.aprimorada-armadura-de-bandas",
    "item.hope-fear.avancada-armadura-de-bandas",
    "item.hope-fear.lendaria-armadura-de-bandas",
    "item.hope-fear.cota-de-escamas",
    "item.hope-fear.aprimorada-cota-de-escamas",
    "item.hope-fear.avancada-cota-de-escamas",
    "item.hope-fear.lendaria-cota-de-escamas"
  ])("assigns the generic metal armor to the known conventional armor family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Armadura Metálica", category: "armadura" })).toContain("metal-armor.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/metal-armor.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated metal armor artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.cota-de-malha-chainmail-armor.n1", name: "Cota de Malha", category: "armadura", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.arco-curto-shortbow.n1",
    "item.core.aprimorada-arco-curto-aprimorada-shortbow.n2",
    "item.core.avancada-arco-curto-avancada-shortbow.n3",
    "item.core.lendaria-arco-curto-lendaria-shortbow.n4",
    "item.core.arco-longo-longbow.n1",
    "item.core.aprimorada-arco-longo-aprimorada-longbow.n2",
    "item.core.avancada-arco-longo-avancada-longbow.n3",
    "item.core.lendaria-arco-longo-lendaria-longbow.n4",
    "item.core.arco-grande-greatbow.n2"
  ])("assigns the generic bow to the known conventional bow family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Arco", category: "arma" })).toContain("bow.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/bow.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated bow artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.arco-longo-longbow.n1", name: "Arco Longo", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.escudo-redondo-round-shield.n1",
    "item.core.aprimorada-escudo-redondo-aprimorada-round-shield.n2",
    "item.core.avancada-escudo-redondo-avancada-round-shield.n3",
    "item.core.lendaria-escudo-redondo-lendaria-round-shield.n4",
    "item.core.broquel-buckler.n3"
  ])("assigns the generic round shield to the known conventional shield family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Escudo", category: "arma" })).toContain("shield.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/shield.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated shield artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.escudo-redondo-round-shield.n1", name: "Escudo Redondo", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.maca-mace.n1",
    "item.core.aprimorada-maca-aprimorada-mace.n2",
    "item.core.avancada-maca-avancada-mace.n3",
    "item.core.lendaria-maca-lendaria-mace.n4",
    "item.core.martelo-de-guerra-warhammer.n1",
    "item.core.aprimorada-martelo-de-guerra-aprimorada-warhammer.n2",
    "item.core.avancada-martelo-de-guerra-avancada-warhammer.n3",
    "item.core.lendaria-martelo-de-guerra-lendaria-warhammer.n4"
  ])("assigns the generic blunt weapon to the known conventional impact weapon family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Arma de Impacto", category: "arma" })).toContain("blunt-weapon.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/blunt-weapon.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated blunt weapon artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.maca-mace.n1", name: "Maça", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.lanca-spear.n1",
    "item.core.aprimorada-lanca-aprimorada-spear.n2",
    "item.core.avancada-lanca-avancada-spear.n3",
    "item.core.lendaria-lanca-lendaria-spear.n4"
  ])("assigns the generic spear to the known conventional spear family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Lança", category: "arma" })).toContain("spear.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/spear.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated spear artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.lanca-spear.n1", name: "Lança", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.machado-de-batalha-battleaxe.n1",
    "item.core.aprimorada-machado-de-batalha-aprimorada-battleaxe.n2",
    "item.core.avancada-machado-de-batalha-avancada-battleaxe.n3",
    "item.core.lendaria-machado-de-batalha-lendaria-battleaxe.n4"
  ])("assigns the generic battle axe to the known conventional axe family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Machado de Batalha", category: "arma" })).toContain("battleaxe.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/battleaxe.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated battle axe artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.machado-de-batalha-battleaxe.n1", name: "Machado de Batalha", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it.each([
    "item.core.besta-crossbow.n1",
    "item.core.aprimorada-besta-aprimorada-crossbow.n2",
    "item.core.avancada-besta-avancada-crossbow.n3",
    "item.core.lendaria-besta-lendaria-crossbow.n4"
  ])("assigns the generic crossbow to the known conventional crossbow family %s", (id) => {
    expect(getItemArtwork({ ...item, id, name: "Besta", category: "arma" })).toContain("crossbow.webp");
    expect(existsSync(new URL("../../../public/assets/items/generic/crossbow.webp", import.meta.url))).toBe(true);
  });
  it("keeps dedicated crossbow artwork when available", () => {
    expect(getItemArtwork({ ...item, id: "item.core.besta-crossbow.n1", name: "Besta", category: "arma", image: "dedicated.webp" })).toBe("dedicated.webp");
  });
  it("does not assign unrelated or special equipment a misleading illustration", () => {
    expect(getItemArtwork({ ...item, name: "Tocha Eterna" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Corda (15m)" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Dardo de Corda", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.espada-de-duas-pontas-dual-ended-sword.n4", name: "Espada de Duas Pontas", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.cajado-de-fogo-fire-staff.n3", name: "Cajado de Fogo", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.arco-espinhado-spiked-bow.n3", name: "Arco Espinhado", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.escudo-torre-tower-shield.n1", name: "Escudo Torre", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.hope-fear.escudo-runico", name: "Escudo Rúnico", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.mangual-duplo-double-flail.n3", name: "Mangual Duplo", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.hope-fear.maca-foguete", name: "Maça-Foguete", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Pingente de Adaga de Ferro", category: "loot" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Ouro", category: "arma" })).toBeUndefined();
    expect(getItemArtwork({ ...item, name: "Armadura de Couro Mágica", category: "armadura" })).toBeUndefined();
    expect(getItemArtwork({ ...item, id: "item.core.armadura-de-placas-espinhadas-spiked-plate-armor.n3", name: "Armadura de Placas Espinhadas", category: "armadura" })).toBeUndefined();
  });
});
