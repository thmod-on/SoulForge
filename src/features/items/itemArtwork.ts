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

/** Presentation-only fallback: never writes generated art into user definitions. */
export function getItemArtwork(item: ItemDefinition): string | undefined {
  if (item.image?.trim()) return item.image;
  if (item.id === "item.demo.rope") {
    return `${import.meta.env.BASE_URL}assets/items/generic/rope.webp`;
  }
  if (item.category === "arma" && genericDaggerIds.has(item.id)) {
    return `${import.meta.env.BASE_URL}assets/items/generic/dagger.webp`;
  }
  const name = normalize(item.name);
  const match = art.find((entry) => entry.category === item.category && entry.names.some((alias) => alias === name));
  return match ? `${import.meta.env.BASE_URL}assets/items/generic/${match.file}` : undefined;
}
