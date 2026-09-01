import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { AncestryDefinition, CardDefinition, ClassDefinition, CommunityDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { buildCharacterFromDraft } from "./characterCreationRules";

const packId = "pack.test";
const ancestry: AncestryDefinition = { id: "ancestry.test", type: "ancestry", packId, name: "Humano", summary: "", topFeatureId: "feature.ancestry.top", bottomFeatureId: "feature.ancestry.bottom" };
const topFeature: FeatureDefinition = { id: "feature.ancestry.top", type: "feature", packId, name: "Adaptável", summary: "", sourceType: "ancestry", sourceId: ancestry.id, tier: "top" };
const bottomFeature: FeatureDefinition = { id: "feature.ancestry.bottom", type: "feature", packId, name: "Persistente", summary: "", sourceType: "ancestry", sourceId: ancestry.id, tier: "bottom", sheetModifiers: [{ kind: "resource-max", resourceId: "stress", amount: 1 }] };
const community: CommunityDefinition = { id: "community.test", type: "community", packId, name: "Vila", summary: "", adjectives: [], featureId: "feature.community" };
const communityFeature: FeatureDefinition = { id: "feature.community", type: "feature", packId, name: "Entre vizinhos", summary: "", sourceType: "community", sourceId: community.id, tier: "community" };
const characterClass: ClassDefinition = { id: "class.test", type: "class", packId, name: "Guardião", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [], hopeFeatureId: "feature.hope", subclassIds: ["subclass.test", "subclass.other"] };
const subclass: SubclassDefinition = { id: "subclass.test", type: "subclass", packId, name: "Defensor", summary: "", classId: characterClass.id, foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [] };
const hopeFeature: FeatureDefinition = { id: "feature.hope", type: "feature", packId, name: "Esperança", summary: "", sourceType: "class", sourceId: characterClass.id, tier: "hope" };
const cards: CardDefinition[] = ["one", "two"].map((id) => ({ id: `card.${id}`, type: "card", packId, name: id, summary: "", domainId: "domain.one", tier: 1, cardType: "acao", effect: "" }));
const catalog = createCatalog([], [ancestry, topFeature, bottomFeature, community, communityFeature, characterClass, subclass, hopeFeature, ...cards]);
const fallback = { classDefinition: characterClass, subclassDefinition: subclass, skills: [] };

describe("criação de personagem", () => {
  it("inicia os recursos-base sem marcas, inclusive após aplicar bônus de ancestralidade", () => {
    const created = buildCharacterFromDraft({
      name: "Nova ficha", community: "", communityId: community.id, classId: characterClass.id, subclassId: subclass.id,
      ancestryIds: [ancestry.id], topFeatureId: topFeature.id, bottomFeatureId: bottomFeature.id,
      cardIds: cards.map((card) => card.id), attributeValues: { dex: 2, for: 1, cha: 1, wil: 0, con: 0, int: -1 }, experiences: [{ name: "Exploradora", description: "" }, { name: "Diplomata", description: "" }]
    }, catalog, fallback);

    expect(created).not.toBeInstanceOf(Error);
    if (created instanceof Error) return;
    expect(created.resources.find((resource) => resource.id === "hp")).toMatchObject({ value: 0, max: 6 });
    expect(created.resources.find((resource) => resource.id === "stress")).toMatchObject({ value: 0, max: 7 });
    expect(created.resources.find((resource) => resource.id === "hope")).toMatchObject({ value: 0, max: 6 });
  });
});
