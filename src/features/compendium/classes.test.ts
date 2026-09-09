import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { ClassDefinition, PackManifest } from "../../domain/types";
import { getPackOriginName } from "./packPresentation";
import { renderCompendiumClassesManager, type ClassFeatureDependencies } from "./classes";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const characterClass: ClassDefinition = {
  id: "class.core.guerreiro",
  type: "class",
  packId: "daggerheart-core-classes-local",
  name: "Guerreiro",
  summary: "Especialista marcial.",
  domainIds: ["domain.a", "domain.b"],
  startingEvasion: 10,
  startingHitPoints: 6,
  featureIds: [],
  hopeFeatureId: "feature.hope",
  subclassIds: ["subclass.a", "subclass.b"]
};

function render(pack: PackManifest, definition: ClassDefinition): string {
  const catalog = createCatalog([pack], [definition]);
  const deps: ClassFeatureDependencies = {
    state: { classModalOpen: false },
    catalog,
    escapeHtml,
    getPackOriginName: (packId) => getPackOriginName(packId, catalog.packs),
    renderEmptyInline: (message) => message,
    saveCustomDefinition: async () => undefined,
    deleteCustomDefinition: async () => undefined,
    refreshCatalog: async () => undefined,
    render: () => undefined
  };
  return renderCompendiumClassesManager(deps);
}

describe("lista de classes do Compendium", () => {
  it("exibe a origem curta conhecida do Pack", () => {
    const pack = { id: characterClass.packId, name: "Core - Classes e Subclasses", version: "1", description: "" };

    expect(render(pack, characterClass)).toContain("Pack: Core");
  });

  it("usa o nome do manifesto para Packs futuros", () => {
    const pack = { id: "pack.future", name: "Crônicas do Vazio", version: "1", description: "" };

    expect(render(pack, { ...characterClass, id: "class.future", packId: pack.id })).toContain("Pack: Crônicas do Vazio");
  });
});
