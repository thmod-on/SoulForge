import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { AncestryDefinition, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { createEmptyCreationAttributeValues } from "./attributeAllocation";
import {
  openCharacterCreation,
  selectCharacterCreationClass,
  selectCharacterCreationTopFeature,
  toggleCharacterCreationCard,
  type CharacterCreationState
} from "./characterCreationState";

const packId = "pack.creation-state";
const ancestries: AncestryDefinition[] = [
  { id: "ancestry.one", type: "ancestry", packId, name: "Uma", summary: "", topFeatureId: "feature.one.top", bottomFeatureId: "feature.one.bottom" },
  { id: "ancestry.two", type: "ancestry", packId, name: "Duas", summary: "", topFeatureId: "feature.two.top", bottomFeatureId: "feature.two.bottom" }
];
const ancestryFeatures: FeatureDefinition[] = ancestries.flatMap((ancestry, index) => ([
  { id: ancestry.topFeatureId, type: "feature", packId, name: `Topo ${index}`, summary: "", sourceType: "ancestry", sourceId: ancestry.id, tier: "top" },
  { id: ancestry.bottomFeatureId, type: "feature", packId, name: `Base ${index}`, summary: "", sourceType: "ancestry", sourceId: ancestry.id, tier: "bottom" }
]));
const classes: ClassDefinition[] = [
  { id: "class.one", type: "class", packId, name: "Uma", summary: "", domainIds: ["domain.one", "domain.shared"], startingEvasion: 10, startingHitPoints: 6, featureIds: [], hopeFeatureId: "feature.hope.one", subclassIds: ["subclass.one", "subclass.one.alternative"] },
  { id: "class.two", type: "class", packId, name: "Duas", summary: "", domainIds: ["domain.two", "domain.shared"], startingEvasion: 11, startingHitPoints: 7, featureIds: [], hopeFeatureId: "feature.hope.two", subclassIds: ["subclass.two", "subclass.two.alternative"] }
];
const subclasses: SubclassDefinition[] = classes.map((definition, index) => ({
  id: definition.subclassIds[0], type: "subclass", packId, name: `Subclasse ${index}`, summary: "", classId: definition.id,
  foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: []
}));
const catalog = createCatalog([], [...ancestries, ...ancestryFeatures, ...classes, ...subclasses]);
const fallback = { classDefinition: classes[0], subclassDefinition: subclasses[0], skills: [] };

function createState(): CharacterCreationState {
  return {
    characterCreationOpen: false,
    characterCreationStep: 8,
    characterCreationName: "Anterior",
    characterCreationCommunity: "Anterior",
    characterCreationCommunitySearch: "busca",
    characterCreationCommunityPackId: "pack.anterior",
    characterCreationAncestryIds: [ancestries[0].id],
    characterCreationAncestrySearch: "origem",
    characterCreationCardIds: ["card.one", "card.two"],
    characterCreationExperiences: [{ name: "Uma", description: "" }, { name: "Duas", description: "" }],
    characterCreationAttributeValues: createEmptyCreationAttributeValues(),
    characterCreationPortraitImage: "data:image/png;base64,test",
    characterCreationError: "Erro anterior"
  };
}

describe("estado da criação de personagem", () => {
  it("abre um fluxo limpo e seleciona a primeira classe e subclasse", () => {
    const state = createState();

    openCharacterCreation(state, catalog, fallback);

    expect(state).toMatchObject({
      characterCreationOpen: true,
      characterCreationStep: 1,
      characterCreationName: "",
      characterCreationClassId: classes[0].id,
      characterCreationSubclassId: subclasses[0].id,
      characterCreationCardIds: [],
      characterCreationAncestryIds: []
    });
    expect(state.characterCreationPortraitImage).toBeUndefined();
    expect(state.characterCreationError).toBeUndefined();
  });

  it("combina a Feature Top escolhida com a Bottom da outra ancestralidade", () => {
    const state = createState();
    state.characterCreationAncestryIds = ancestries.map((ancestry) => ancestry.id);

    selectCharacterCreationTopFeature(state, catalog, ancestries[1].topFeatureId);

    expect(state.characterCreationTopFeatureId).toBe(ancestries[1].topFeatureId);
    expect(state.characterCreationBottomFeatureId).toBe(ancestries[0].bottomFeatureId);
  });

  it("limita a seleção inicial a duas cartas e mantém um foco válido", () => {
    const state = createState();
    state.characterCreationCardIds = [];

    toggleCharacterCreationCard(state, "card.one");
    toggleCharacterCreationCard(state, "card.two");
    toggleCharacterCreationCard(state, "card.three");

    expect(state.characterCreationCardIds).toEqual(["card.one", "card.two"]);
    expect(state.characterCreationFocusedCardId).toBe("card.one");
  });

  it("limpa escolhas de cartas ao trocar de classe", () => {
    const state = createState();
    state.characterCreationFocusedCardId = "card.two";
    state.characterCreationCardDomainId = "domain.one";

    selectCharacterCreationClass(state, catalog, fallback, classes[1].id);

    expect(state.characterCreationClassId).toBe(classes[1].id);
    expect(state.characterCreationSubclassId).toBe(subclasses[1].id);
    expect(state.characterCreationCardIds).toEqual([]);
    expect(state.characterCreationFocusedCardId).toBeUndefined();
    expect(state.characterCreationCardDomainId).toBeUndefined();
  });
});
