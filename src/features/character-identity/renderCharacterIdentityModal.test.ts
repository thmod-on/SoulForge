import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { ClassDefinition } from "../../domain/types";
import { renderCharacterIdentityModal } from "./renderCharacterIdentityModal";

const characterClass: ClassDefinition = {
  id: "class.test.guardian",
  type: "class",
  packId: "pack.test",
  name: "Guardião",
  summary: "Uma classe dedicada a proteger seus aliados.",
  domainIds: ["domain.test.blade", "domain.test.valor"],
  startingEvasion: 9,
  startingHitPoints: 7,
  featureIds: [],
  hopeFeatureId: "feature.test.hope",
  subclassIds: ["subclass.test.a", "subclass.test.b"]
};

const character = {
  ...demoCharacter,
  identity: {
    ...demoCharacter.identity,
    className: characterClass.name,
    primaryClassId: characterClass.id,
    subclassName: undefined,
    primarySubclassId: undefined
  },
  defense: { ...demoCharacter.defense, evasion: 15 },
  resources: demoCharacter.resources.map((resource) => resource.id === "hp" ? { ...resource, max: 10 } : resource)
};

describe("detalhe da classe na ficha", () => {
  it("exibe apenas os valores iniciais declarados pela classe", () => {
    const html = renderCharacterIdentityModal({
      character,
      section: "class",
      catalog: createCatalog([], [characterClass]),
      escapeHtml: (value) => value
    });

    expect(html).toContain("Valores iniciais da classe");
    expect(html).toContain("Evasão inicial");
    expect(html).toContain("<strong>9</strong>");
    expect(html).toContain("PV inicial");
    expect(html).toContain("<strong>7</strong>");
    expect(html).not.toContain("<strong>15</strong>");
    expect(html).not.toContain("<strong>10</strong>");
  });

  it("localiza a Definition pelo nome para fichas legadas", () => {
    const html = renderCharacterIdentityModal({
      character: { ...character, identity: { ...character.identity, primaryClassId: undefined } },
      section: "class",
      catalog: createCatalog([], [characterClass]),
      escapeHtml: (value) => value
    });

    expect(html).toContain("<strong>9</strong>");
    expect(html).toContain("<strong>7</strong>");
  });

  it("explica quando os valores iniciais estão indisponíveis", () => {
    const html = renderCharacterIdentityModal({
      character,
      section: "class",
      catalog: createCatalog([], []),
      escapeHtml: (value) => value
    });

    expect(html).toContain("Valores iniciais da classe");
    expect(html).toContain("Definition da classe não foi encontrada");
  });
});
