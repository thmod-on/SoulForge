import type { CardDefinition, GameMarkerDefinition } from "../domain/types";
import { getOfficialCardMarkers } from "./officialCardMarkers";

const artworkByCardId: Readonly<Record<string, string>> = {
  "card.core.codex.p2-1": "book-of-ava.webp",
  "card.core.codex.p2-2": "book-of-illiat.webp",
  "card.core.codex.p2-3": "book-of-tyfar.webp",
  "card.core.grace.p2-4": "deft-deceiver.webp",
  "card.core.grace.p2-5": "enrapture.webp",
  "card.core.grace.p2-6": "inspirational-words.jpg",
  "card.core.splendor.p3-4": "bolt-beacon.webp",
  "card.core.splendor.p3-5": "mending-touch.webp",
  "card.core.splendor.p3-6": "reassurance.webp",
  "card.core.valor.p3-7": "barebones.webp",
  "card.core.valor.p3-8": "forceful-push.webp",
  "card.core.valor.p3-9": "i-am-your-shield.webp",
  "card.hope-fear.dread.voice-of-dread": "voice-of-dread.jpg",
  "card.hope-fear.dread.siphon-essence": "siphon-essence.jpg",
  "card.core.grace.p6-9": "hypnotic-shimmer.jpg",
  "card.hope-fear.dread.chains-of-affliction": "chains-of-affliction.jpg",
  "card.hope-fear.dread.spectral-mist": "spectral-mist.jpg"
};

/**
 * Arquivos em `public/` preservam o nome entre releases. A revisão explícita
 * impede que uma resposta antiga do cache do navegador/PWA esconda a arte
 * aprovada mais recentemente. Imagens próprias do Pack ou da pessoa usuária
 * nunca passam por este fallback e continuam sem alteração.
 */
const artworkRevisionByCardId: Readonly<Record<string, string>> = {
  "card.core.codex.p2-1": "20261011-r2",
  "card.core.codex.p2-2": "20261011-r2",
  "card.core.codex.p2-3": "20261011-r2",
  "card.core.splendor.p3-4": "20261010-r2",
  "card.core.splendor.p3-5": "20261010-r2",
  "card.core.splendor.p3-6": "20261011-r3",
  "card.core.valor.p3-7": "20261017-r3",
  "card.core.valor.p3-8": "20261017-r2",
  "card.core.valor.p3-9": "20261017-r1"
};

/** Presentation-only fallback for original SoulForge artwork; never persists it in imported definitions. */
export function getCardArtwork(card: CardDefinition): string | undefined {
  if (card.image?.trim()) return card.image;
  const file = artworkByCardId[card.id];
  if (!file) return undefined;
  const revision = artworkRevisionByCardId[card.id];
  return `${import.meta.env.BASE_URL}assets/cards/generic/${file}${revision ? `?v=${revision}` : ""}`;
}

export function applyCardContentDefaults(card: CardDefinition, markerOverride?: GameMarkerDefinition[]): CardDefinition {
  return {
    ...card,
    image: getCardArtwork(card),
    gameMarkers: markerOverride ?? getOfficialCardMarkers(card) ?? card.gameMarkers
  };
}
