import type { ConditionDefinition } from "../domain/types";

const artworkByConditionId: Readonly<Record<string, string>> = {
  "condition.core.hidden": "hidden.jpg",
  "condition.core.restrained": "restrained.jpg",
  "condition.core.vulnerable": "vulnerable.jpg"
};

/** Arte autoral de apresentação; imagens declaradas pela Definition sempre têm prioridade. */
export function getConditionArtwork(definition: ConditionDefinition): string | undefined {
  if (definition.image?.trim()) return definition.image;
  const file = artworkByConditionId[definition.id];
  return file ? `${import.meta.env.BASE_URL}assets/conditions/generic/${file}` : undefined;
}
