import type { Catalog } from "../../domain/catalog";
import type { Character, CommunityDefinition, FeatureDefinition } from "../../domain/types";

/** Resolve exclusivamente pela referência persistida; nunca interpreta a origem narrativa livre. */
export function getCharacterCommunity(character: Character, catalog: Catalog): CommunityDefinition | undefined {
  return catalog.communities.find((community) => community.id === character.identity.primaryCommunityId);
}

export function getCharacterCommunityFeature(character: Character, catalog: Catalog): FeatureDefinition | undefined {
  const community = getCharacterCommunity(character, catalog);
  return community ? catalog.features.find((feature) => feature.id === community.featureId && feature.sourceType === "community" && feature.sourceId === community.id) : undefined;
}
