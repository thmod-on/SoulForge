import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { CardDefinition, ClassDefinition, DomainDefinition, SubclassDefinition } from "../../domain/types";
import { createEmptyCreationAttributeValues } from "./attributeAllocation";
import type { CharacterCreationState } from "./characterCreationState";
import { renderCharacterCreationModal } from "./renderCharacterCreation";
import { renderCreationAttributesStep } from "./renderCreationSteps";

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
    characterCreationAttributeValues: createEmptyCreationAttributeValues(),
    characterCreationAttributeTokenIds: {}
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

describe("distribuição de atributos na criação", () => {
  it("orienta a começar pelo atributo e deixa as pedras inativas antes da escolha", () => {
    const html = renderCreationAttributesStep(createEmptyCreationAttributeValues(), undefined, {});

    expect(html).toContain("Escolha primeiro um atributo e depois defina o valor dele.");
    expect(html).toContain("0 de 6 definidos");
    expect(html).toContain("Toque em um atributo para escolher o valor dele.");
    expect(html.match(/data-character-attribute-allocation="activate"/g)).toHaveLength(6);
    expect(html.match(/data-character-attribute-allocation="assign-token"/g)).toHaveLength(6);
    expect(html.match(/data-character-attribute-allocation="assign-token"[^>]+disabled/g)).toHaveLength(6);
    expect(html).toContain("Escolher valor");
    expect(html).not.toContain("Liberar valor");
    expect(html).not.toContain("Recomeçar distribuição");
  });

  it("mantém o seletor aberto, identifica o valor atual e oferece liberação explícita", () => {
    const values = createEmptyCreationAttributeValues();
    values.dex = 2;
    const html = renderCreationAttributesStep(values, "dex", { dex: "attribute-token-5" });

    expect(html).toContain("1 de 6 definidos");
    expect(html).toContain("Valor para</small><strong>Agilidade");
    expect(html).toContain("Escolha o valor de Agilidade.");
    expect(html).toContain('data-character-attribute-token-id="attribute-token-5" aria-pressed="true"');
    expect(html).toContain("Valor atual");
    expect(html).toContain('data-character-attribute-allocation="release"');
    expect(html).toContain("Liberar valor");
    expect(html).toContain('data-character-attribute-id="dex" aria-pressed="true" aria-expanded="true"');
    expect(html).toContain('<b class="character-attribute-card-action">Selecionado</b>');
  });

  it("mostra pedras ocupadas sem torná-las selecionáveis por outro atributo", () => {
    const values = createEmptyCreationAttributeValues();
    values.dex = 2;
    const html = renderCreationAttributesStep(values, "for", { dex: "attribute-token-5" });

    expect(html).toContain('+2 — Em Agilidade" disabled');
    expect(html).toContain("Valor para</small><strong>Força");
    expect(html).toContain("Recomeçar distribuição");
  });

  it("comunica a conclusão e ainda permite revisar cada atributo", () => {
    const values = { dex: -1, for: 0, cha: 0, wil: 1, con: 1, int: 2 } as const;
    const html = renderCreationAttributesStep(values, undefined, {
      dex: "attribute-token-0", for: "attribute-token-1", cha: "attribute-token-2",
      wil: "attribute-token-3", con: "attribute-token-4", int: "attribute-token-5"
    });

    expect(html).toContain("6 de 6 definidos");
    expect(html).toContain("Distribuição completa. Toque em um atributo para revisar seu valor.");
    expect(html).not.toContain("Liberar valor");
  });
});
