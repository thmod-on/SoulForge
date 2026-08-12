import type { CardDefinition, GameMarkerDefinition } from "../domain/types";

/**
 * Metadados revisados manualmente contra a regra publicada.
 *
 * Esta lista e deliberadamente pequena: ela nao e derivada de `summary` ou
 * `effect`. Cada inclusao precisa ter uma fonte de regra confirmada.
 */
const markersByCardId: Record<string, GameMarkerDefinition[]> = {
  "card.core.grace.p2-6": [{
    id: "inspirational-words-uses",
    kind: "counter",
    label: "Palavras Inspiradoras",
    quantity: { kind: "attribute", attributeId: "con" },
    reset: "long-rest"
  }]
};

export function getOfficialCardMarkers(card: CardDefinition): GameMarkerDefinition[] | undefined {
  return markersByCardId[card.id];
}

export const officiallyReviewedCardMarkerIds = Object.keys(markersByCardId);
