import { describe, expect, it } from "vitest";
import type { CommunityDefinition, FeatureDefinition } from "../../domain/types";
import { renderCreationCommunityStep } from "./renderCreationSteps";

const escapeHtml = (value: string) => value;
const importedCommunity: CommunityDefinition = {
  id: "community.imported",
  type: "community",
  packId: "pack.community",
  name: "Loreborne",
  summary: "Conhecimento compartilhado.",
  adjectives: ["curioso"],
  featureId: "feature.imported"
};
const importedFeature: FeatureDefinition = {
  id: importedCommunity.featureId,
  type: "feature",
  packId: importedCommunity.packId,
  name: "Erudito",
  summary: "Você conhece muitas histórias.",
  sourceType: "community",
  sourceId: importedCommunity.id,
  tier: "community"
};

describe("etapa de comunidade na criação", () => {
  it("explica como prosseguir quando não há Pack de comunidades", () => {
    const html = renderCreationCommunityStep({ communities: [], features: [], search: "", packId: "todos", getPackDisplayName: (packId) => packId }, escapeHtml);

    expect(html).toContain("Importe um Pack de comunidades antes de criar a ficha.");
    expect(html).not.toContain("data-character-community-id");
  });

  it("apresenta a comunidade importada e sua Feature", () => {
    const html = renderCreationCommunityStep({ communities: [importedCommunity], features: [importedFeature], selectedId: importedCommunity.id, search: "", packId: "todos", getPackDisplayName: () => "Comunidades Core" }, escapeHtml);

    expect(html).toContain("Loreborne");
    expect(html).toContain("Erudito");
    expect(html).toContain("Benefício da comunidade");
  });

  it("apresenta conteúdo local com a mesma seleção por ID", () => {
    const localFeature: FeatureDefinition = { ...importedFeature, id: "feature.local", packId: "local", sourceId: "community.local", name: "Rede local" };
    const localCommunity: CommunityDefinition = { ...importedCommunity, id: "community.local", packId: "local", name: "Aldeia local", featureId: localFeature.id };
    const html = renderCreationCommunityStep({ communities: [localCommunity], features: [localFeature], selectedId: localCommunity.id, search: "", packId: "local", getPackDisplayName: (packId) => packId }, escapeHtml);

    expect(html).toContain('data-character-community-id="community.local"');
    expect(html).toContain("Aldeia local");
    expect(html).toContain("Rede local");
  });
});
