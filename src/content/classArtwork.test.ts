import { describe, expect, it } from "vitest";
import type { ClassDefinition } from "../domain/types";
import { getClassArtwork, getClassDetailArtwork } from "./classArtwork";

const warrior: ClassDefinition = {
  id: "class.core.guerreiro", type: "class", packId: "test", name: "Guerreiro", summary: "",
  domainIds: ["domain.test.one", "domain.test.two"], startingEvasion: 10, startingHitPoints: 6,
  featureIds: [], hopeFeatureId: "feature.test.hope", subclassIds: ["subclass.test.one", "subclass.test.two"]
};

describe("getClassArtwork", () => {
  it("associa a arte autoral pelo ID estável da classe", () => {
    expect(getClassArtwork(warrior)).toContain("assets/classes/generic/warrior.webp");
  });

  it("preserva a imagem fornecida pela Definition", () => {
    expect(getClassArtwork({ ...warrior, image: "custom.webp" })).toBe("custom.webp");
  });

  it("não associa por nome nem por correspondência parcial", () => {
    expect(getClassArtwork({ ...warrior, id: "class.local.guerreiro" })).toBeUndefined();
  });

  it("usa o brasão isolado do Serafim nos previews", () => {
    expect(getClassArtwork({ ...warrior, id: "class.core.serafim" })).toContain("assets/classes/generic/seraph-emblem.webp");
  });
});

describe("getClassDetailArtwork", () => {
  it("associa o banner finalizado ao detalhe do Serafim", () => {
    expect(getClassDetailArtwork({ ...warrior, id: "class.core.serafim" })).toContain("assets/classes/generic/seraph-banner.webp");
  });

  it("faz fallback para a arte comum nas classes sem banner próprio", () => {
    expect(getClassDetailArtwork(warrior)).toContain("assets/classes/generic/warrior.webp");
  });

  it("preserva uma imagem fornecida pela Definition", () => {
    expect(getClassDetailArtwork({ ...warrior, id: "class.core.serafim", image: "custom.webp" })).toBe("custom.webp");
  });
});
