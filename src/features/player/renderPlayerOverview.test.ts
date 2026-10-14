import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { createCatalog } from "../../domain/catalog";
import type { CardDefinition, ConditionDefinition } from "../../domain/types";
import { renderOverview, renderStoredCards, type PlayerOverviewDependencies } from "./renderPlayerOverview";

const card: CardDefinition = {
  id: "card.test.sifonar-essencia",
  type: "card",
  packId: "test",
  name: "Sifonar Essência",
  summary: "Um resumo propositalmente longo para representar uma carta traduzida.",
  domainId: "domain.dread",
  tier: 2,
  cardType: "acao",
  recallCost: 1,
  effect: "Efeito completo."
};

const vulnerable: ConditionDefinition = { id: "condition.core.vulnerable", type: "condition", packId: "test", name: "Vulnerável", summary: "A criatura está exposta.", category: "standard", effect: "Rolagens contra a criatura têm vantagem.", clearing: "Limpe Estresse." };

function dependencies(cards: CardDefinition[]): PlayerOverviewDependencies {
  return {
    catalog: createCatalog([], []),
    escapeHtml: (value) => value,
    renderResources: () => "",
    renderEmptyInline: (message) => `<p>${message}</p>`,
    getActiveCards: () => cards,
    renderTransformation: () => "",
    getDomainInfo: () => ({ name: "Pavor", color: "#8e4fc4" }),
    getInactiveCardCount: () => cards.length,
    getStoredCards: () => cards,
    getAcquiredSubclassTiers: () => [],
    getActiveGameMarkers: () => [],
    getActiveFeatureEffects: () => [],
    getActiveSheetModifierEffects: () => [],
    getFeatureActivation: () => undefined,
    getSubclassStageSkills: () => []
  };
}

describe("renderStoredCards", () => {
  it("mantém o detalhe da carta e integra uma ação textual para o Loadout", () => {
    const html = renderStoredCards(demoCharacter, dependencies([card]));

    expect(html).toContain('class="card-row stored-card-row"');
    expect(html).toContain(`data-card-modal-id="${card.id}"`);
    expect(html).toContain('class="sf-action sf-action--secondary stored-card-action"');
    expect(html).toContain(`data-card-id="${card.id}"`);
    expect(html).toContain("Mover para o Loadout");
    expect(html).toContain(`aria-label="Mover ${card.name} para o Loadout"`);
    expect(html).toContain(card.summary);
    expect(html).not.toContain(card.effect);
  });

  it("preserva o estado vazio do Vault", () => {
    const html = renderStoredCards(demoCharacter, dependencies([]));

    expect(html).toContain("O Vault esta vazio por enquanto.");
    expect(html).not.toContain("stored-card-action");
  });
});

describe("renderOverview", () => {
  it("apresenta o atalho de Descanso com nome acessível consistente", () => {
    const html = renderOverview(demoCharacter, dependencies([]));

    expect(html).toContain('data-action="open-rest"');
    expect(html).toContain('aria-label="Abrir descanso"');
    expect(html).toContain('title="Descanso"');
    expect(html).not.toMatch(/downtime/i);
    expect(html).toContain("Estados em cena");
    expect(html).toContain("Nenhuma condição ou efeito ativo.");
  });

  it("mostra uma condição ativa antes dos efeitos e mantém seu detalhe acessível", () => {
    const character = { ...demoCharacter, activeConditions: [{ conditionId: vulnerable.id, fallbackName: vulnerable.name, origins: [{ id: "scene", kind: "scene" as const, label: "Ataque inimigo", appliedAt: "2026-10-13T00:00:00.000Z" }] }] };
    const deps = dependencies([]);
    deps.catalog = createCatalog([], [vulnerable]);
    const html = renderOverview(character, deps);

    expect(html).toContain("Condições");
    expect(html).toContain(vulnerable.name);
    expect(html).toContain(vulnerable.effect);
    expect(html).toContain(`data-character-condition-detail-id="${vulnerable.id}"`);
  });

  it("mostra o verso da carta indisponível e mantém o detalhe acessível", () => {
    const character = { ...demoCharacter, deck: { activeCardIds: [card.id], learnedCardIds: [card.id], unavailableCards: [{ cardId: card.id, reactivation: "session" as const, deactivatedAt: "2026-09-13T12:00:00.000Z" }] } };
    const html = renderOverview(character, dependencies([card]));

    expect(html).toContain('class="ability-card is-unavailable"');
    expect(html).toContain(`data-card-modal-id="${card.id}"`);
    expect(html).toContain('class="unavailable-card-watermark"');
    expect(html).toContain(`class="unavailable-card-name">${card.name}</strong>`);
    expect(html).toContain("Carta indisponível");
    expect(html).not.toContain(card.summary);
    expect(html).toContain("Nova sessao");
  });
});
