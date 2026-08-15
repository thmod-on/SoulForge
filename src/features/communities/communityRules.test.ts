import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { Character, CommunityDefinition, FeatureDefinition } from "../../domain/types";
import { getCharacterCommunity, getCharacterCommunityFeature } from "./communityRules";

const feature: FeatureDefinition = { id: "feature.community.test", type: "feature", packId: "test", name: "Erudito", summary: "", sourceType: "community", sourceId: "community.test", tier: "community" };
const community: CommunityDefinition = { id: "community.test", type: "community", packId: "test", name: "Loreborne", summary: "", adjectives: ["curioso"], featureId: feature.id };
const character = { identity: { primaryCommunityId: community.id } } as Character;

describe("comunidades", () => {
  it("resolve a comunidade e sua Feature apenas pelo ID persistido", () => {
    const catalog = createCatalog([], [community, feature]);
    expect(getCharacterCommunity(character, catalog)?.name).toBe("Loreborne");
    expect(getCharacterCommunityFeature(character, catalog)?.name).toBe("Erudito");
  });

  it("mantém fichas legadas sem comunidade mecânica válidas", () => {
    const catalog = createCatalog([], [community, feature]);
    expect(getCharacterCommunity({ identity: {} } as Character, catalog)).toBeUndefined();
  });
});
