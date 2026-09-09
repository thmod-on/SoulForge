import type { ClassDefinition } from "../domain/types";

const artworkByClassId: Readonly<Record<string, string>> = {
  "class.core.bardo": "bard.webp",
  "class.core.druida": "druid.webp",
  "class.core.guardiao": "guardian.webp",
  "class.core.ranger": "ranger.webp",
  "class.core.ladino": "rogue.webp",
  "class.core.feiticeiro": "sorcerer.webp",
  "class.core.guerreiro": "warrior.webp",
  "class.core.mago": "wizard.webp",
  "class.core.serafim": "seraph-emblem.webp",
  "class.hope-fear.assassin": "assassin.webp",
  "class.hope-fear.brawler": "brawler.webp",
  "class.hope-fear.warlock": "warlock.webp",
  "class.hope-fear.witch": "witch.webp"
};

const detailArtworkByClassId: Readonly<Record<string, string>> = {
  "class.core.bardo": "bard-banner.webp",
  "class.core.druida": "druid-banner.webp",
  "class.core.guardiao": "guardian-banner.webp",
  "class.core.ranger": "ranger-banner.webp",
  "class.core.ladino": "rogue-banner.webp",
  "class.core.feiticeiro": "sorcerer-banner.webp",
  "class.core.guerreiro": "warrior-banner.webp",
  "class.core.mago": "wizard-banner.webp",
  "class.core.serafim": "seraph-banner.webp",
  "class.hope-fear.assassin": "assassin-banner.webp",
  "class.hope-fear.brawler": "brawler-banner.webp",
  "class.hope-fear.warlock": "warlock-banner.webp",
  "class.hope-fear.witch": "witch-banner.webp"
};

/** Arte autoral de apresentação; imagens declaradas pela Definition sempre têm prioridade. */
export function getClassArtwork(definition: ClassDefinition): string | undefined {
  if (definition.image?.trim()) return definition.image;
  const file = artworkByClassId[definition.id];
  return file ? `${import.meta.env.BASE_URL}assets/classes/generic/${file}` : undefined;
}

/** Banner finalizado do detalhe; faz fallback para a arte de preview nas classes sem composição própria. */
export function getClassDetailArtwork(definition: ClassDefinition): string | undefined {
  if (definition.image?.trim()) return definition.image;
  const file = detailArtworkByClassId[definition.id];
  return file ? `${import.meta.env.BASE_URL}assets/classes/generic/${file}` : getClassArtwork(definition);
}
