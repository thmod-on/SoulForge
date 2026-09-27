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

  it("preserva a referência quando o Pack da comunidade não está instalado", () => {
    const characterWithMissingPack = { identity: { primaryCommunityId: community.id, community: "Vigília de Tristelo" } } as Character;
    const catalog = createCatalog([], []);

    expect(getCharacterCommunity(characterWithMissingPack, catalog)).toBeUndefined();
    expect(getCharacterCommunityFeature(characterWithMissingPack, catalog)).toBeUndefined();
    expect(characterWithMissingPack.identity.primaryCommunityId).toBe(community.id);
  });

  it("resolve da mesma forma comunidades locais e importadas", () => {
    const localFeature = { ...feature, id: "feature.community.local", packId: "local", sourceId: "community.local" };
    const localCommunity = { ...community, id: "community.local", packId: "local", featureId: localFeature.id };
    const importedCharacter = { identity: { primaryCommunityId: community.id } } as Character;
    const localCharacter = { identity: { primaryCommunityId: localCommunity.id } } as Character;
    const catalog = createCatalog([], [community, feature, localCommunity, localFeature]);

    expect(getCharacterCommunity(importedCharacter, catalog)?.packId).toBe("test");
    expect(getCharacterCommunityFeature(importedCharacter, catalog)?.id).toBe(feature.id);
    expect(getCharacterCommunity(localCharacter, catalog)?.packId).toBe("local");
    expect(getCharacterCommunityFeature(localCharacter, catalog)?.id).toBe(localFeature.id);
  });
});
