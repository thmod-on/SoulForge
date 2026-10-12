import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { CardDefinition, ClassDefinition, DomainDefinition, SubclassDefinition } from "../../domain/types";
import { createEmptyCreationAttributeValues } from "./attributeAllocation";
import type { CharacterCreationState } from "./characterCreationState";
import { renderCharacterCreationModal } from "./renderCharacterCreation";

const packId = "pack.card-choice";
const domains: DomainDefinition[] = [
  { id: "domain.one", type: "domain", packId, name: "Arcano", summary: "", color: "#fff" },
  { id: "domain.two", type: "domain", packId, name: "Graça", summary: "", color: "#fff" }
];
const characterClass: ClassDefinition = {
  id: "class.one", type: "class", packId, name: "Classe", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [], hopeFeatureId: "feature.hope", subclassIds: ["subclass.one", "subclass.two"]
};
const subclass: SubclassDefinition = { id: "subclass.one", type: "subclass", packId, name: "Subclasse", summary: "", classId: characterClass.id, foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [] };
const cards: CardDefinition[] = [
  { id: "card.one", type: "card", packId, name: "Carta Um", summary: "Resumo um", domainId: "domain.one", tier: 1, cardType: "acao", effect: "Efeito completo um" },
  { id: "card.two", type: "card", packId, name: "Carta Dois", summary: "Resumo dois", domainId: "domain.two", tier: 1, cardType: "acao", effect: "Efeito completo dois" },
  { id: "card.three", type: "card", packId, name: "Carta Três", summary: "Resumo três", domainId: "domain.one", tier: 1, cardType: "acao", effect: "Efeito completo três" }
];
const catalog = createCatalog([], [...domains, characterClass, subclass, ...cards]);

function state(): CharacterCreationState {
  return {
    characterCreationOpen: true,
    characterCreationStep: 7,
    characterCreationName: "",
    characterCreationCommunity: "",
    characterCreationCommunitySearch: "",
    characterCreationCommunityPackId: "todos",
    characterCreationClassId: characterClass.id,
    characterCreationSubclassId: subclass.id,
    characterCreationAncestryIds: [],
    characterCreationAncestrySearch: "",
    characterCreationCardIds: ["card.one", "card.two"],
    characterCreationCardDomainId: "domain.one",
    characterCreationExpandedCardId: "card.three",
    characterCreationExperiences: [{ name: "", description: "" }, { name: "", description: "" }],
    characterCreationDefinitionSelections: {},
    characterCreationAttributeValues: createEmptyCreationAttributeValues()
  };
}

describe("escolha de cartas na criação", () => {
  it("mantém seleção, resumo e detalhes como informações independentes", () => {
    const html = renderCharacterCreationModal({ state: state(), catalog, animate: false, escapeHtml: (value) => value });

    expect(html).toContain("2 / 2 selecionadas");
    expect(html).toContain("Carta Um · Carta Dois");
    expect(html.match(/card-choice-selected-badge/g)).toHaveLength(1);
    expect(html).toContain('data-action="toggle-character-starting-card-details" data-character-starting-card-id="card.three" aria-expanded="true"');
    expect(html).toContain("Efeito completo três");
    expect(html).toContain('data-action="toggle-character-starting-card" data-character-starting-card-id="card.three" aria-pressed="false" disabled');
  });
});
