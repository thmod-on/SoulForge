import { describe, expect, it } from "vitest";
import type { AncestryDefinition, FeatureDefinition } from "../../domain/types";
import { renderCreationAncestryFeaturePreview } from "./renderCreationSteps";

const ancestry: AncestryDefinition = {
  id: "ancestry.test.orc",
  type: "ancestry",
  packId: "test",
  name: "Orc",
  summary: "Uma ancestralidade resistente.",
  topFeatureId: "feature.test.orc.top",
  bottomFeatureId: "feature.test.orc.bottom"
};

const features: FeatureDefinition[] = [
  { id: ancestry.topFeatureId, type: "feature", packId: "test", name: "Fúria", summary: "Aumente sua força por um instante.", sourceType: "ancestry", sourceId: ancestry.id, tier: "top" },
  { id: ancestry.bottomFeatureId, type: "feature", packId: "test", name: "Presas", summary: "Cause dano extra com suas presas.", sourceType: "ancestry", sourceId: ancestry.id, tier: "bottom" }
];

describe("prévia de Features de ancestralidade", () => {
  it("permite consultar Top e Bottom antes de selecionar a ancestralidade", () => {
    const html = renderCreationAncestryFeaturePreview(ancestry, features, (value) => value);

    expect(html).toContain("<details");
    expect(html).toContain('aria-label="Consultar Features Top e Bottom de Orc"');
    expect(html).toContain("Feature Top");
    expect(html).toContain("Fúria");
    expect(html).toContain("Feature Bottom");
    expect(html).toContain("Presas");
  });

  it("explicita quando o Pack não oferece uma das Features declaradas", () => {
    const html = renderCreationAncestryFeaturePreview(ancestry, features.slice(0, 1), (value) => value);

    expect(html).toContain("Feature indisponível");
    expect(html).toContain("Esta Feature não está disponível no Pack atual.");
  });
});
