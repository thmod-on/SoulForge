import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { ConditionDefinition } from "../../domain/types";
import { renderCompendiumConditionsManager, renderCompendiumConditionsSpread, type ConditionFeatureDependencies } from "./conditions";

const vulnerable: ConditionDefinition = {
  id: "condition.core.vulnerable",
  type: "condition",
  packId: "test",
  name: "Vulnerável",
  summary: "A criatura está exposta a ataques.",
  category: "standard",
  effect: "Todas as rolagens contra a criatura têm vantagem.",
  clearing: "Uma personagem também encerra esta condição ao limpar ao menos 1 Estresse depois de marcar seu último espaço.",
  rulesNotes: ["A mesma Condição não se acumula."]
};

const dependencies = (): ConditionFeatureDependencies => ({
  state: { compendiumConditionSearch: "", conditionModalOpen: false, compendiumConditionPreviewId: vulnerable.id },
  catalog: createCatalog([], [vulnerable]),
  escapeHtml: (value: string) => value,
  getPackDisplayName: () => "Core - Condições",
  saveCustomDefinition: vi.fn(),
  deleteCustomDefinition: vi.fn(),
  refreshCatalog: vi.fn(),
  render: vi.fn()
});

describe("condições no Compendium", () => {
  it("mostra descrição, efeito, encerramento e fonte no detalhe", () => {
    const html = renderCompendiumConditionsManager(dependencies());
    expect(html).toContain(vulnerable.summary);
    expect(html).toContain(vulnerable.effect);
    expect(html).toContain("limpar ao menos 1 Estresse");
    expect(html).toContain("Core - Condições");
    expect(html).toContain("assets/conditions/generic/vulnerable.jpg");
  });

  it("explica a relação de Vulnerável com o último Estresse no capítulo", () => {
    const html = renderCompendiumConditionsSpread(dependencies(), () => "capítulo");
    expect(html).toContain("último Estresse");
    expect(html).toContain("Vulnerável");
  });

  it("oferece um estado vazio útil quando o Pack não está instalado", () => {
    const deps = dependencies();
    deps.catalog = createCatalog([], []);
    deps.state.compendiumConditionPreviewId = undefined;
    const html = renderCompendiumConditionsManager(deps);
    expect(html).toContain("Importe um Pack de condições");
  });
});
