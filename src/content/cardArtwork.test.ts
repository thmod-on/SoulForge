import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CardDefinition } from "../domain/types";
import { getCardArtwork } from "./cardArtwork";

const card: CardDefinition = {
  id: "card.hope-fear.dread.voice-of-dread",
  type: "card",
  packId: "test",
  name: "Voz do Pavor",
  summary: "",
  domainId: "domain.hope-fear.dread",
  tier: 1,
  cardType: "acao",
  effect: ""
};

describe("card artwork", () => {
  it.each([
    ["card.core.arcana.p1-1", "rune-ward.webp"],
    ["card.core.arcana.p1-2", "unleash-chaos.webp"],
    ["card.core.arcana.p1-3", "wall-walk.webp"],
    ["card.core.blade.p1-4", "get-back-up.webp"],
    ["card.core.blade.p1-5", "not-good-enough.webp"],
    ["card.core.blade.p1-6", "whirlwind.webp"],
    ["card.core.codex.p2-1", "book-of-ava.webp"],
    ["card.core.codex.p2-2", "book-of-illiat.webp"],
    ["card.core.codex.p2-3", "book-of-tyfar.webp"],
    ["card.core.grace.p2-4", "deft-deceiver.webp"],
    ["card.core.grace.p2-5", "enrapture.webp"],
    ["card.core.grace.p2-6", "inspirational-words.jpg"],
    ["card.core.sage.p3-1", "gifted-tracker.webp"],
    ["card.core.sage.p3-2", "natures-tongue.webp"],
    ["card.core.sage.p3-3", "vicious-entangle.webp"],
    ["card.core.splendor.p3-4", "bolt-beacon.webp"],
    ["card.core.splendor.p3-5", "mending-touch.webp"],
    ["card.core.splendor.p3-6", "reassurance.webp"],
    ["card.core.valor.p3-7", "barebones.webp"],
    ["card.core.valor.p3-8", "forceful-push.webp"],
    ["card.core.valor.p3-9", "i-am-your-shield.webp"],
    ["card.hope-fear.dread.voice-of-dread", "voice-of-dread.jpg"],
    ["card.hope-fear.dread.blighting-strike", "blighting-strike.webp"],
    ["card.hope-fear.dread.umbral-veil", "umbral-veil.webp"],
    ["card.hope-fear.dread.siphon-essence", "siphon-essence.jpg"],
    ["card.core.grace.p6-9", "hypnotic-shimmer.jpg"],
    ["card.hope-fear.dread.chains-of-affliction", "chains-of-affliction.jpg"],
    ["card.hope-fear.dread.spectral-mist", "spectral-mist.jpg"]
  ])("resolves %s to an existing original asset", (id, file) => {
    expect(getCardArtwork({ ...card, id })).toContain(file);
    expect(existsSync(new URL(`../../public/assets/cards/generic/${file}`, import.meta.url))).toBe(true);
  });

  it.each([
    ["card.core.arcana.p1-1", "20261026-r2"],
    ["card.core.arcana.p1-3", "20261026-r2"],
    ["card.core.blade.p1-4", "20261026-r2"],
    ["card.core.blade.p1-5", "20261026-r3"],
    ["card.core.blade.p1-6", "20261026-r7"],
    ["card.core.codex.p2-1", "20261011-r2"],
    ["card.core.splendor.p3-6", "20261011-r3"],
    ["card.core.valor.p3-7", "20261017-r3"],
    ["card.core.sage.p3-1", "20261027-r3"],
    ["card.core.sage.p3-2", "20261027-r2"],
    ["card.core.sage.p3-3", "20261027-r2"],
    ["card.hope-fear.dread.blighting-strike", "20261027-r1"],
    ["card.hope-fear.dread.umbral-veil", "20261027-r2"]
  ])("versions the revised fallback artwork for %s", (id, revision) => {
    expect(getCardArtwork({ ...card, id })).toContain(`?v=${revision}`);
  });

  it("preserves artwork provided by a definition", () => {
    expect(getCardArtwork({ ...card, image: "custom.webp" })).toBe("custom.webp");
  });

  it("does not assign artwork to an unrelated card", () => {
    expect(getCardArtwork({ ...card, id: "card.other" })).toBeUndefined();
  });
});
