import type { CardDefinition, GameMarkerDefinition } from "../domain/types";
import { getOfficialCardMarkers } from "./officialCardMarkers";

const artworkByCardId: Readonly<Record<string, string>> = {
  "card.core.arcana.p1-1": "rune-ward.webp",
  "card.core.arcana.p1-2": "unleash-chaos.webp",
  "card.core.arcana.p1-3": "wall-walk.webp",
  "card.core.blade.p1-4": "get-back-up.webp",
  "card.core.blade.p1-5": "not-good-enough.webp",
  "card.core.blade.p1-6": "whirlwind.webp",
  "card.core.codex.p2-1": "book-of-ava.webp",
  "card.core.codex.p2-2": "book-of-illiat.webp",
  "card.core.codex.p2-3": "book-of-tyfar.webp",
  "card.core.codex.p4-7": "book-of-sitil.webp",
  "card.core.codex.p4-8": "book-of-vagras.webp",
  "card.core.bone.p1-7": "deft-maneuvers.webp",
  "card.core.bone.p1-8": "i-see-it-coming.webp",
  "card.core.bone.p1-9": "untouchable.webp",
  "card.core.grace.p2-4": "deft-deceiver.webp",
  "card.core.grace.p2-5": "enrapture.webp",
  "card.core.grace.p2-6": "inspirational-words.jpg",
  "card.core.sage.p3-1": "gifted-tracker.webp",
  "card.core.sage.p3-2": "natures-tongue.webp",
  "card.core.sage.p3-3": "vicious-entangle.webp",
  "card.core.splendor.p3-4": "bolt-beacon.webp",
  "card.core.splendor.p3-5": "mending-touch.webp",
  "card.core.splendor.p3-6": "reassurance.webp",
  "card.core.valor.p3-7": "barebones.webp",
  "card.core.valor.p3-8": "forceful-push.webp",
  "card.core.valor.p3-9": "i-am-your-shield.webp",
  "card.hope-fear.dread.voice-of-dread": "voice-of-dread.jpg",
  "card.hope-fear.dread.blighting-strike": "blighting-strike.webp",
  "card.hope-fear.dread.umbral-veil": "umbral-veil.webp",
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
  "card.core.arcana.p1-1": "20261026-r2",
  "card.core.arcana.p1-2": "20261026-r1",
  "card.core.arcana.p1-3": "20261026-r2",
  "card.core.blade.p1-4": "20261026-r2",
  "card.core.blade.p1-5": "20261026-r3",
  "card.core.blade.p1-6": "20261027-r8",
  "card.core.codex.p2-1": "20261011-r2",
  "card.core.codex.p2-2": "20261011-r2",
  "card.core.codex.p2-3": "20261011-r2",
  "card.core.codex.p4-7": "20261027-r1",
  "card.core.codex.p4-8": "20261027-r1",
  "card.core.bone.p1-7": "20261027-r1",
  "card.core.bone.p1-8": "20261027-r1",
  "card.core.bone.p1-9": "20261027-r1",
  "card.core.splendor.p3-4": "20261010-r2",
  "card.core.splendor.p3-5": "20261010-r2",
  "card.core.splendor.p3-6": "20261011-r3",
  "card.core.valor.p3-7": "20261017-r3",
  "card.core.valor.p3-8": "20261017-r2",
  "card.core.valor.p3-9": "20261017-r1",
  "card.core.sage.p3-1": "20261027-r3",
  "card.core.sage.p3-2": "20261027-r2",
  "card.core.sage.p3-3": "20261027-r2",
  "card.hope-fear.dread.blighting-strike": "20261027-r1",
  "card.hope-fear.dread.umbral-veil": "20261027-r2"
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
