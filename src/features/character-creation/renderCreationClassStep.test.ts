import { describe, expect, it } from "vitest";
import type { ClassDefinition, SubclassDefinition } from "../../domain/types";
import { renderCreationClassStep } from "./renderCreationSteps";

const escapeHtml = (value: string) => value;

const characterClass: ClassDefinition = {
  id: "class.core.guerreiro",
  type: "class",
  packId: "core",
  name: "Guerreiro",
  summary: "Especialista em combate.",
  domainIds: ["domain.osso", "domain.lamina"],
  startingEvasion: 10,
  startingHitPoints: 6,
  featureIds: [],
  hopeFeatureId: "feature.guerreiro.esperanca",
  subclassIds: ["subclass.guerreiro.1", "subclass.guerreiro.2"]
};

const subclass: SubclassDefinition = {
  id: "subclass.guerreiro.1",
  type: "subclass",
  packId: "core",
  classId: characterClass.id,
  name: "Chamado da Bravura",
  summary: "Avança sem hesitar.",
  foundationFeatureIds: [],
  specializationFeatureIds: [],
  masteryFeatureIds: []
};

describe("renderCreationClassStep", () => {
  it("exibe o estandarte resolvido da classe selecionada", () => {
    const html = renderCreationClassStep({ classes: [characterClass], selectedClass: characterClass, subclasses: [subclass], selectedSubclassId: subclass.id, features: [] }, escapeHtml);

    expect(html).toContain('class="character-class-banner has-image"');
    expect(html).toContain("assets/classes/generic/warrior-banner.webp");
    expect(html).toContain("Estandarte de Guerreiro");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("character-subclass-tab is-selected");
    expect((html.match(/class="character-subclass-panel"/g) ?? [])).toHaveLength(1);
  });

  it("preserva um fallback quando a classe não possui arte", () => {
    const withoutArtwork = { ...characterClass, id: "class.local.sem-arte", packId: "local", name: "Sem Arte" };
    const html = renderCreationClassStep({ classes: [withoutArtwork], selectedClass: withoutArtwork, subclasses: [], features: [] }, escapeHtml);

    expect(html).toContain('class="character-class-banner "');
    expect(html).toContain("character-class-banner-placeholder");
    expect(html).not.toContain("<img");
  });
});
