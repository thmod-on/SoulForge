import type { ClassDefinition } from "../domain/types";

const artworkByClassId: Readonly<Record<string, string>> = {
  "class.core.guerreiro": "warrior.webp",
  "class.core.mago": "wizard.webp",
  "class.core.serafim": "seraph-emblem.webp"
};

const detailArtworkByClassId: Readonly<Record<string, string>> = {
  "class.core.serafim": "seraph-banner.webp"
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
