import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { CommunityDefinition } from "../../domain/types";
import { renderCompendiumCommunitiesManager, type CommunityFeatureDependencies } from "./communities";

const community: CommunityDefinition = {
  id: "community.test",
  type: "community",
  packId: "local",
  name: "Comunidade teste",
  summary: "Resumo",
  adjectives: ["Atenta"],
  featureId: "feature.test"
};

describe("pesquisa de comunidades", () => {
  it("mantém resultados em uma superfície separada da pesquisa e do filtro nativo", () => {
    const html = renderCompendiumCommunitiesManager({
      state: { compendiumCommunitySearch: "", compendiumCommunityPackId: "todos", communityModalOpen: false },
      catalog: createCatalog([], [community]),
      escapeHtml: (value) => value,
      getPackDisplayName: (packId) => packId,
      saveCustomDefinition: vi.fn(),
      deleteCustomDefinition: vi.fn(),
      refreshCatalog: vi.fn(),
      render: vi.fn()
    } as CommunityFeatureDependencies);

    expect(html).toContain("data-compendium-community-search");
    expect(html).toContain("data-compendium-community-pack-filter");
    expect(html).toContain("data-compendium-dynamic");
  });
});
