import { describe, expect, it, vi } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { createCatalog } from "../../domain/catalog";
import type { AncestryDefinition, FeatureDefinition, TransformationDefinition } from "../../domain/types";
const { patchSurface } = vi.hoisted(() => ({ patchSurface: vi.fn(() => true) }));
vi.mock("../../app/patchSurface", () => ({ patchSurface }));
import { renderRestLoadoutCardDetailModal, renderRestModal, renderRestModalInPlace } from "./renderRest";

describe("renderRestModal", () => {
  it("usa a nomenclatura de descanso sem alterar os contratos de rest", () => {
    const html = renderRestModal(demoCharacter, "short", [], undefined, { escapeHtml: (value) => value, catalog: createCatalog([], []) });

    expect(html).toContain('<h2 id="rest-modal-title">Descanso</h2>');
    expect(html).toContain('aria-label="Fechar descanso"');
    expect(html).toContain('aria-label="Tipo de descanso"');
    expect(html).toContain("movimentos de descanso");
    expect(html).toContain('data-rest-kind="short"');
    expect(html).not.toMatch(/downtime/i);
    expect(html).toContain("Mudar de forma");
    expect(html).toContain("Disponível quando uma transformação permitir mudar de forma.");
    expect(html).toContain('aria-disabled="true"');
  });

  it("apresenta a organização gratuita antes dos movimentos quando há cartas no Vault", () => {
    const learnedCardIds = ["card-a", "card-b"];
    const activeCardIds = ["card-a"];
    const catalog = createCatalog([], learnedCardIds.map((id, index) => ({ id, type: "card" as const, packId: "test", name: `Carta ${index + 1}`, summary: "Resumo", domainId: "test", tier: 1, cardType: "acao" as const, recallCost: 0, effect: "Efeito", image: "/art.webp" })));
    const character = { ...demoCharacter, deck: { ...demoCharacter.deck, learnedCardIds, activeCardIds } };
    const html = renderRestModal(character, "short", [], undefined, { escapeHtml: (value) => value, catalog }, "loadout", activeCardIds);

    expect(html).toContain("Organizar Loadout");
    expect(html).toContain("Arraste as cartas entre o Vault e o Loadout");
    expect(html).toContain('data-action="continue-rest-moves"');
    expect(html).toContain('data-action="rest-loadout-add"');
    expect(html.match(/data-rest-loadout-slot-index/g) ?? []).toHaveLength(5);
    expect(html.match(/data-rest-loadout-slot-empty="true"/g) ?? []).toHaveLength(4);
    expect(html).toContain('<img src="/art.webp" alt="" draggable="false" />');
    expect(html).toContain('class="rest-modal-heading rest-modal-heading--loadout"');
    expect(html).toContain('class="rest-modal rest-modal--loadout sf-scroll-region"');
    expect(html).toContain('class="rest-guidance rest-loadout-guidance"');
    expect(html).not.toContain("INÍCIO DO DESCANSO");
    expect(html).not.toContain('data-action="confirm-rest"');
  });

  it("abre o detalhe isolado da carta sem reutilizar o fechamento do descanso", () => {
    const card = { id: "card-a", type: "card" as const, packId: "test", name: "Carta A", summary: "Resumo", domainId: "domain-a", tier: 2, cardType: "acao" as const, recallCost: 1, effect: "Efeito completo." };
    const catalog = createCatalog([{ id: "domain-a", name: "Domínio A", version: "1.0.0", description: "Teste" }], [card, { id: "domain-a", type: "domain" as const, packId: "test", name: "Domínio A", summary: "", color: "#fff" }]);
    const html = renderRestLoadoutCardDetailModal(card.id, { escapeHtml: (value) => value, catalog });
    expect(html).toContain('data-rest-loadout-detail-backdrop');
    expect(html).toContain('data-action="close-rest-loadout-card-detail"');
    expect(html).toContain("Efeito completo.");
    expect(html).not.toContain('data-modal-close');
  });

  it("habilita a ação declarada e apresenta as escolhas dependentes", () => {
    const top: FeatureDefinition = { id: "feature.test.ancestry.top", type: "feature", packId: "test", name: "Feature Top", summary: "Efeito da Feature.", sourceType: "ancestry", sourceId: "ancestry.test", tier: "top" };
    const bottom: FeatureDefinition = { ...top, id: "feature.test.ancestry.bottom", name: "Feature Bottom", tier: "bottom" };
    const ancestry: AncestryDefinition = { id: "ancestry.test", type: "ancestry", packId: "test", name: "Ancestralidade", summary: "Uma forma possível.", topFeatureId: top.id, bottomFeatureId: bottom.id };
    const transformation: TransformationDefinition = { id: "transformation.test", type: "transformation", packId: "test", name: "Metamorfo", summary: "Muda.", benefit: "Forma.", drawback: "Uma Feature.", narrativeQuestions: ["Quem?"], choices: [{ id: "ancestry", kind: "definition", label: "Ancestralidade assumida", definitionType: "ancestry" }, { id: "feature", kind: "feature-from-definition", label: "Feature assumida", sourceChoiceId: "ancestry", application: "reference" }], restActions: [{ id: "change", label: "Mudar de forma", description: "Escolha a forma.", timing: "any-rest", choiceIds: ["ancestry", "feature"] }] };
    const catalog = createCatalog([], [top, bottom, ancestry, transformation]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    const choice = { id: "definition-action" as const, sourceDefinitionId: transformation.id, actionId: "change", values: { ancestry: ancestry.id, feature: top.id } };
    const html = renderRestModal(character, "long", [choice], undefined, { escapeHtml: (value) => value, catalog });

    expect(html).toContain('data-action="choose-definition-rest-action"');
    expect(html).toContain("Ancestralidade assumida");
    expect(html).toContain("Feature assumida");
    expect(html).toContain("Feature Top");
  });

  it("apresenta e exige o limite ampliado por uma Feature de ancestralidade", () => {
    const trance: FeatureDefinition = { id: "feature.test.elf.bottom", type: "feature", packId: "test", name: "Transe Celestial", summary: "Um movimento adicional.", sourceType: "ancestry", sourceId: "ancestry.test.elf", tier: "bottom", sheetModifiers: [{ kind: "rest-move-bonus", amount: 1 }] };
    const catalog = createCatalog([], [trance]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, ancestryFeatureIds: { bottom: trance.id } } };
    const twoChoices = [{ id: "prepare" as const }, { id: "clear-stress" as const }];
    const threeChoices = [...twoChoices, { id: "repair-armor" as const }];

    const incomplete = renderRestModal(character, "long", twoChoices, undefined, { escapeHtml: (value) => value, catalog });
    const complete = renderRestModal(character, "long", threeChoices, undefined, { escapeHtml: (value) => value, catalog });

    expect(incomplete).toContain("Escolha 3 movimentos.");
    expect(incomplete).toContain("2/3");
    expect(incomplete).toContain('data-action="confirm-rest" disabled');
    expect(complete).toContain("3/3");
    expect(complete).not.toContain('data-action="confirm-rest" disabled');
  });

  it("orienta atualizar o Pack quando a transformação ativa ainda não declara a ação", () => {
    const transformation: TransformationDefinition = { id: "transformation.legacy", type: "transformation", packId: "legacy", name: "Transformação antiga", summary: "Resumo.", benefit: "Benefício.", drawback: "Desvantagem.", narrativeQuestions: ["Quem?"] };
    const catalog = createCatalog([{ id: "legacy", name: "Transformações", version: "1.0.0", description: "Pack antigo." }], [transformation]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    const html = renderRestModal(character, "short", [], undefined, { escapeHtml: (value) => value, catalog });

    expect(html).toContain("A transformação ativa não oferece esta ação.");
    expect(html).toContain("Verifique se o Pack “Transformações” está atualizado.");
  });

  it("atualiza somente o modal aberto e preserva sua rolagem", () => {
    const root = {} as HTMLElement;
    const catalog = createCatalog([], []);

    expect(renderRestModalInPlace(root, demoCharacter, "short", [], undefined, { escapeHtml: (value) => value, catalog })).toBe(true);
    expect(patchSurface).toHaveBeenCalledWith(root, ".rest-modal", expect.stringContaining('class="rest-modal'), { scrollSelector: ".rest-modal" });
  });
});
