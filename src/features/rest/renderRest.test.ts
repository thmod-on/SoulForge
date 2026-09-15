import { describe, expect, it, vi } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { createCatalog } from "../../domain/catalog";
import type { AncestryDefinition, FeatureDefinition, TransformationDefinition } from "../../domain/types";
const { patchSurface } = vi.hoisted(() => ({ patchSurface: vi.fn(() => true) }));
vi.mock("../../app/patchSurface", () => ({ patchSurface }));
import { renderRestModal, renderRestModalInPlace } from "./renderRest";

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
