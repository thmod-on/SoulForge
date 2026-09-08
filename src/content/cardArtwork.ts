import type { CardDefinition, GameMarkerDefinition } from "../domain/types";
import { getOfficialCardMarkers } from "./officialCardMarkers";

const artworkByCardId: Readonly<Record<string, string>> = {
  "card.hope-fear.dread.voice-of-dread": "voice-of-dread.jpg",
  "card.core.grace.p2-6": "inspirational-words.jpg",
  "card.hope-fear.dread.siphon-essence": "siphon-essence.jpg",
  "card.core.grace.p6-9": "hypnotic-shimmer.jpg",
  "card.hope-fear.dread.chains-of-affliction": "chains-of-affliction.jpg",
  "card.hope-fear.dread.spectral-mist": "spectral-mist.jpg"
};

/** Presentation-only fallback for original SoulForge artwork; never persists it in imported definitions. */
export function getCardArtwork(card: CardDefinition): string | undefined {
  if (card.image?.trim()) return card.image;
  const file = artworkByCardId[card.id];
  return file ? `${import.meta.env.BASE_URL}assets/cards/generic/${file}` : undefined;
}

export function applyCardContentDefaults(card: CardDefinition, markerOverride?: GameMarkerDefinition[]): CardDefinition {
  return {
    ...card,
    image: getCardArtwork(card),
    gameMarkers: markerOverride ?? getOfficialCardMarkers(card) ?? card.gameMarkers
  };
}
