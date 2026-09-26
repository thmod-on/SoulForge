import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { ClassDefinition, FeatureDefinition } from "../../domain/types";
import { renderTraits } from "./renderTraits";

describe("Aptidões", () => {
  it("separa escolhas de classe das Experiências e permite editá-las", () => {
    const feature: FeatureDefinition = { id: "feature.test.pact", type: "feature", packId: "pack.test", name: "Pacto", summary: "Descrição completa da Feature.", sourceType: "class", sourceId: "class.test", tier: "class", characterFields: [{ id: "patron", kind: "text", label: "Patrono", required: true, help: "Orientação curta sobre a escolha." }] };
    const characterClass: ClassDefinition = { id: "class.test", type: "class", packId: "pack.test", name: "Bruxo", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [feature.id], hopeFeatureId: "feature.hope", subclassIds: ["subclass.one", "subclass.two"] };
    const catalog = createCatalog([], [characterClass, feature]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id }, definitionSelections: [{ sourceDefinitionId: feature.id, values: { patron: "A Tecelã" } }] };
    const html = renderTraits(character, { catalog, escapeHtml: (value) => value, renderEmptyInline: (message) => message });

    expect(html.indexOf("traits-class-choice-section")).toBeLessThan(html.indexOf("traits-experience-section"));
    expect(html).not.toContain("Classe · Bruxo");
    expect(html).toContain("Pacto");
    expect(html).toContain("Descrição completa da Feature.");
    expect(html.match(/Orientação curta sobre a escolha\./g)).toHaveLength(1);
    expect(html).toContain("A Tecelã");
    expect(html).toContain("Editar escolhas");
    expect(html).toContain("data-character-field-view");
    expect(html).toContain("data-character-field-editor hidden");
    expect(html).toContain('data-character-field-action="save"');
  });

  it("identifica escolhas ainda não definidas sem expor o formulário", () => {
    const feature: FeatureDefinition = { id: "feature.test.choice", type: "feature", packId: "pack.test", name: "Escolha", summary: "", sourceType: "class", sourceId: "class.test", tier: "class", characterFields: [{ id: "answer", kind: "text", label: "Resposta", required: true }] };
    const characterClass: ClassDefinition = { id: "class.test", type: "class", packId: "pack.test", name: "Classe", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [feature.id], hopeFeatureId: "feature.hope", subclassIds: ["subclass.one", "subclass.two"] };
    const html = renderTraits({ ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id }, definitionSelections: [] }, { catalog: createCatalog([], [characterClass, feature]), escapeHtml: (value) => value, renderEmptyInline: (message) => message });

    expect(html).toContain("Não definido");
    expect(html).toContain("Definir escolhas");
    expect(html).toContain("data-character-field-editor hidden");
  });
});
