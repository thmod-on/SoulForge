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

/** Presentation-only fallback: never writes generated art into user definitions. */
export function getItemArtwork(item: ItemDefinition): string | undefined {
  if (item.image?.trim()) return item.image;
  const name = normalize(item.name);
  const match = art.find((entry) => entry.category === item.category && entry.names.some((alias) => alias === name));
  return match ? `${import.meta.env.BASE_URL}assets/items/generic/${match.file}` : undefined;
}
