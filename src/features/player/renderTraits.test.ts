import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { ClassDefinition, FeatureDefinition } from "../../domain/types";
import { renderTraits } from "./renderTraits";

describe("Aptidões", () => {
  it("separa escolhas de classe das Experiências e permite editá-las", () => {
    const feature: FeatureDefinition = { id: "feature.test.pact", type: "feature", packId: "pack.test", name: "Pacto", summary: "", sourceType: "class", sourceId: "class.test", tier: "class", characterFields: [{ id: "patron", kind: "text", label: "Patrono", required: true }] };
    const characterClass: ClassDefinition = { id: "class.test", type: "class", packId: "pack.test", name: "Bruxo", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [feature.id], hopeFeatureId: "feature.hope", subclassIds: ["subclass.one", "subclass.two"] };
    const catalog = createCatalog([], [characterClass, feature]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id }, definitionSelections: [{ sourceDefinitionId: feature.id, values: { patron: "A Tecelã" } }] };
    const html = renderTraits(character, { catalog, escapeHtml: (value) => value, renderEmptyInline: (message) => message });

    expect(html.indexOf("traits-class-choice-section")).toBeLessThan(html.indexOf("traits-experience-section"));
    expect(html).not.toContain("Classe · Bruxo");
    expect(html).toContain("Pacto");
    expect(html).toContain('value="A Tecelã"');
    expect(html).toContain('data-action="save-character-feature-fields"');
  });
});
