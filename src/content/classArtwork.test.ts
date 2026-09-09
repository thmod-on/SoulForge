import { describe, expect, it } from "vitest";
import type { ClassDefinition } from "../domain/types";
import { getClassArtwork, getClassDetailArtwork } from "./classArtwork";

const warrior: ClassDefinition = {
  id: "class.core.guerreiro", type: "class", packId: "test", name: "Guerreiro", summary: "",
  domainIds: ["domain.test.one", "domain.test.two"], startingEvasion: 10, startingHitPoints: 6,
  featureIds: [], hopeFeatureId: "feature.test.hope", subclassIds: ["subclass.test.one", "subclass.test.two"]
};

const coreArtwork = [
  ["class.core.bardo", "bard.webp", "bard-banner.webp"],
  ["class.core.druida", "druid.webp", "druid-banner.webp"],
  ["class.core.guardiao", "guardian.webp", "guardian-banner.webp"],
  ["class.core.ranger", "ranger.webp", "ranger-banner.webp"],
  ["class.core.ladino", "rogue.webp", "rogue-banner.webp"],
  ["class.core.feiticeiro", "sorcerer.webp", "sorcerer-banner.webp"],
  ["class.core.guerreiro", "warrior.webp", "warrior-banner.webp"],
  ["class.core.mago", "wizard.webp", "wizard-banner.webp"],
  ["class.core.serafim", "seraph-emblem.webp", "seraph-banner.webp"],
  ["class.hope-fear.assassin", "assassin.webp", "assassin-banner.webp"],
  ["class.hope-fear.brawler", "brawler.webp", "brawler-banner.webp"],
  ["class.hope-fear.warlock", "warlock.webp", "warlock-banner.webp"],
  ["class.hope-fear.witch", "witch.webp", "witch-banner.webp"]
] as const;

describe("getClassArtwork", () => {
  it.each(coreArtwork)("associa o preview autoral de %s", (id, preview) => {
    expect(getClassArtwork({ ...warrior, id })).toContain(`assets/classes/generic/${preview}`);
  });

  it("preserva a imagem fornecida pela Definition", () => {
    expect(getClassArtwork({ ...warrior, image: "custom.webp" })).toBe("custom.webp");
  });

  it("não associa por nome nem por correspondência parcial", () => {
    expect(getClassArtwork({ ...warrior, id: "class.local.guerreiro" })).toBeUndefined();
  });

});

describe("getClassDetailArtwork", () => {
  it.each(coreArtwork)("associa o banner finalizado de %s", (id, _preview, banner) => {
    expect(getClassDetailArtwork({ ...warrior, id })).toContain(`assets/classes/generic/${banner}`);
  });

  it("preserva uma imagem fornecida pela Definition", () => {
    expect(getClassDetailArtwork({ ...warrior, id: "class.core.serafim", image: "custom.webp" })).toBe("custom.webp");
  });
});
