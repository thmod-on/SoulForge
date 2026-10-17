import type { ItemDefinition } from "../../domain/types";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
const potionArt = [
  { family: "life", portuguese: ["vida", "cura"], english: ["health", "healing"] },
  { family: "vigor", portuguese: ["vigor"], english: ["stamina", "vigor"] }
].flatMap(({ family, portuguese, english }) => [
  { size: "minor", pt: "menor", en: "minor" },
  { size: "normal", pt: "", en: "" },
  { size: "major", pt: "maior", en: "major" }
].map(({ size, pt, en }) => {
  const ptNames = portuguese.flatMap((name) => pt ? [`pocao de ${name} ${pt}`, `pocao ${pt} de ${name}`] : [`pocao de ${name}`, `pocao de ${name} normal`]);
  const enNames = english.map((name) => `${en ? `${en} ` : ""}${name} potion`);
  return { category: "consumivel", names: [...ptNames, ...enNames, ...ptNames.flatMap((name) => enNames.map((translation) => `${name} (${translation})`))], file: `${family}-potion-${size}.webp` };
}));
const art = [
  ...potionArt,
  { category: "equipamento", names: ["tocha", "torch", "tocha (torch)"], file: "torch.webp" },
  { category: "loot", names: ["ouro", "gold", "ouro (gold)", "moedas de ouro", "gold coins"], file: "gold.webp" },
  { category: "armadura", names: ["armadura de couro", "leather armor", "armadura de couro (leather armor)"], file: "leather-armor.webp" }
] as const;

const genericDaggerIds = new Set([
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
]);

const genericSwordIds = new Set([
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
]);

const genericStaffIds = new Set([
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
]);

const genericMetalArmorIds = new Set([
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
]);

const genericBowIds = new Set([
  "item.core.arco-curto-shortbow.n1",
  "item.core.aprimorada-arco-curto-aprimorada-shortbow.n2",
  "item.core.avancada-arco-curto-avancada-shortbow.n3",
  "item.core.lendaria-arco-curto-lendaria-shortbow.n4",
  "item.core.arco-longo-longbow.n1",
  "item.core.aprimorada-arco-longo-aprimorada-longbow.n2",
  "item.core.avancada-arco-longo-avancada-longbow.n3",
  "item.core.lendaria-arco-longo-lendaria-longbow.n4",
  "item.core.arco-grande-greatbow.n2"
]);

const genericRoundShieldIds = new Set([
  "item.core.escudo-redondo-round-shield.n1",
  "item.core.aprimorada-escudo-redondo-aprimorada-round-shield.n2",
  "item.core.avancada-escudo-redondo-avancada-round-shield.n3",
  "item.core.lendaria-escudo-redondo-lendaria-round-shield.n4",
  "item.core.broquel-buckler.n3"
]);

const genericBluntWeaponIds = new Set([
  "item.core.maca-mace.n1",
  "item.core.aprimorada-maca-aprimorada-mace.n2",
  "item.core.avancada-maca-avancada-mace.n3",
  "item.core.lendaria-maca-lendaria-mace.n4",
  "item.core.martelo-de-guerra-warhammer.n1",
  "item.core.aprimorada-martelo-de-guerra-aprimorada-warhammer.n2",
  "item.core.avancada-martelo-de-guerra-avancada-warhammer.n3",
  "item.core.lendaria-martelo-de-guerra-lendaria-warhammer.n4"
]);

const genericSpearIds = new Set([
  "item.core.lanca-spear.n1",
  "item.core.aprimorada-lanca-aprimorada-spear.n2",
  "item.core.avancada-lanca-avancada-spear.n3",
  "item.core.lendaria-lanca-lendaria-spear.n4"
]);

const genericBattleaxeIds = new Set([
  "item.core.machado-de-batalha-battleaxe.n1",
  "item.core.aprimorada-machado-de-batalha-aprimorada-battleaxe.n2",
  "item.core.avancada-machado-de-batalha-avancada-battleaxe.n3",
  "item.core.lendaria-machado-de-batalha-lendaria-battleaxe.n4"
]);

const genericCrossbowIds = new Set([
  "item.core.besta-crossbow.n1",
  "item.core.aprimorada-besta-aprimorada-crossbow.n2",
  "item.core.avancada-besta-avancada-crossbow.n3",
  "item.core.lendaria-besta-lendaria-crossbow.n4"
]);

/** Presentation-only fallback: never writes generated art into user definitions. */
export function getItemArtwork(item: ItemDefinition): string | undefined {
  if (item.image?.trim()) return item.image;
  if (item.category === "arma" && genericDaggerIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/dagger.webp`;
  }
  if (item.category === "arma" && genericSwordIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/sword.webp`;
  }
  if (item.category === "arma" && genericStaffIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/staff.webp`;
  }
  if (item.category === "armadura" && genericMetalArmorIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/metal-armor.webp`;
  }
  if (item.category === "arma" && genericBowIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/bow.webp`;
  }
  if (item.category === "arma" && genericRoundShieldIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/shield.webp`;
  }
  if (item.category === "arma" && genericBluntWeaponIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/blunt-weapon.webp`;
  }
  if (item.category === "arma" && genericSpearIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/spear.webp`;
  }
  if (item.category === "arma" && genericBattleaxeIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/battleaxe.webp`;
  }
  if (item.category === "arma" && genericCrossbowIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/crossbow.webp`;
  }
  const name = normalize(item.name);
  const match = art.find((entry) => entry.category === item.category && entry.names.some((alias) => alias === name));
  return match ? `${import.meta.env.BASE_URL}assets/items/generic/${match.file}` : undefined;
}
