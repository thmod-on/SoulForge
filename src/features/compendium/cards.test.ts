import { describe, expect, it } from "vitest";
import type { Catalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { CardDefinition, DomainDefinition } from "../../domain/types";
import { renderCardModal, type CardFeatureDependencies } from "./cards";

const domain: DomainDefinition = {
  id: "domain.test",
  type: "domain",
  packId: "test",
  name: "Pavor",
  summary: "Domínio de teste.",
  color: "#8e4fc4"
};

const card: CardDefinition = {
  id: "card.test",
  type: "card",
  packId: "test",
  name: "Sifonar Essência",
  summary: "Resumo compacto que não deve aparecer no detalhe.",
  domainId: domain.id,
  tier: 2,
  cardType: "acao",
  recallCost: 1,
  effect: "Texto completo do efeito da carta."
};

function dependencies(definition: CardDefinition): CardFeatureDependencies {
  return {
    state: {
      compendiumCardSearch: "",
      compendiumDomainFilter: "todos",
      compendiumTierFilter: "todos",
      cardModalOpen: false
    },
    catalog: { cards: [definition], domains: [domain] } as Catalog,
    escapeHtml: (value) => value,
    renderEmptyInline: (message) => message,
    saveCustomDefinition: async () => undefined,
    saveCardMarkerOverride: async () => undefined,
    deleteCustomDefinition: async () => undefined,
    refreshCatalog: async () => undefined,
    render: () => undefined
  };
}

function activeDependencies(definition: CardDefinition, reactivation?: "rest" | "long-rest" | "session" | "manual"): CardFeatureDependencies {
  const result = dependencies(definition);
  result.state.character = {
    ...demoCharacter,
    deck: {
      activeCardIds: [definition.id],
      learnedCardIds: [definition.id],
      ...(reactivation ? { unavailableCards: [{ cardId: definition.id, reactivation, deactivatedAt: "2026-09-13T12:00:00.000Z" }] } : {})
    }
  };
  return result;
}

describe("renderCardModal", () => {
  it("exibe somente o efeito completo quando ele está disponível", () => {
    const html = renderCardModal(card.id, dependencies(card));

    expect(html).toContain("<h3>Efeito</h3>");
    expect(html).toContain(card.effect);
    expect(html).not.toContain(card.summary);
  });

  it("usa o resumo como descrição de fallback para cartas antigas sem efeito", () => {
    const legacyCard = { ...card, effect: undefined } as unknown as CardDefinition;
    const html = renderCardModal(legacyCard.id, dependencies(legacyCard));

    expect(html).toContain("<h3>Descrição</h3>");
    expect(html).toContain(card.summary);
    expect(html).not.toContain("<h3>Efeito</h3>");
  });

  it("oferece as quatro formas de reativação para uma carta disponível do Loadout", () => {
    const html = renderCardModal(card.id, activeDependencies(card));

    expect(html).toContain("Desativar carta");
    expect(html.match(/data-reactivation=/g)).toHaveLength(4);
    expect(html).toContain('data-reactivation="rest"');
    expect(html).toContain('data-reactivation="long-rest"');
    expect(html).toContain('data-reactivation="session"');
    expect(html).toContain('data-reactivation="manual"');
  });

  it("informa o evento escolhido e só permite reativação direta no modo manual", () => {
    const automatic = renderCardModal(card.id, activeDependencies(card, "long-rest"));
    const manual = renderCardModal(card.id, activeDependencies(card, "manual"));

    expect(automatic).toContain("Reativa no próximo descanso longo");
    expect(automatic).not.toContain('data-action="reactivate-loadout-card"');
    expect(manual).toContain('data-action="reactivate-loadout-card"');
  });
});
