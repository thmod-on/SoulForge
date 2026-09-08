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
    ["card.hope-fear.dread.voice-of-dread", "voice-of-dread.jpg"],
    ["card.core.grace.p2-6", "inspirational-words.jpg"],
    ["card.hope-fear.dread.siphon-essence", "siphon-essence.jpg"],
    ["card.core.grace.p6-9", "hypnotic-shimmer.jpg"],
    ["card.hope-fear.dread.chains-of-affliction", "chains-of-affliction.jpg"],
    ["card.hope-fear.dread.spectral-mist", "spectral-mist.jpg"]
  ])("resolves %s to an existing original asset", (id, file) => {
    expect(getCardArtwork({ ...card, id })).toContain(file);
    expect(existsSync(new URL(`../../public/assets/cards/generic/${file}`, import.meta.url))).toBe(true);
  });

  it("preserves artwork provided by a definition", () => {
    expect(getCardArtwork({ ...card, image: "custom.webp" })).toBe("custom.webp");
  });

  it("does not assign artwork to an unrelated card", () => {
    expect(getCardArtwork({ ...card, id: "card.other" })).toBeUndefined();
  });
});
