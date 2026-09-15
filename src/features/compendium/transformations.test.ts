import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { TransformationDefinition } from "../../domain/types";
import { renderCompendiumTransformationsManager } from "./transformations";

const transformation: TransformationDefinition = {
  id: "transformation.test.werewolf",
  type: "transformation",
  packId: "test",
  name: "Lobisomem",
  summary: "Uma forma lupina sobrenatural.",
  benefit: "Forma de Lobo concede +1d10.",
  drawback: "Fúria Uivante atinge todas as criaturas em alcance Muito Próximo.",
  narrativeQuestions: [
    "Quem transformou você?",
    "Como sua forma se diferencia?",
    "Que medo você não pode ignorar?",
    "Quem sofreu quando perdeu o controle?",
    "O que recorda sua humanidade?",
    "Como se sente depois da transformação?"
  ],
  rulesNotes: ["Rolar com Esperança marca 1 Estresse."]
};

describe("transformações no Compendium", () => {
  it("exibe regras, lembretes e todas as perguntas no detalhe", () => {
    const html = renderCompendiumTransformationsManager({
      state: {
        compendiumTransformationSearch: "",
        transformationModalOpen: false,
        compendiumTransformationPreviewId: transformation.id
      },
      catalog: createCatalog([], [transformation]),
      escapeHtml: (value) => value,
      getPackDisplayName: () => "Hope & Fear",
      saveCustomDefinition: vi.fn(),
      deleteCustomDefinition: vi.fn(),
      refreshCatalog: vi.fn(),
      render: vi.fn()
    });

    expect(html).toContain("Forma de Lobo concede +1d10");
    expect(html).toContain("Rolar com Esperança marca 1 Estresse");
    for (const question of transformation.narrativeQuestions) expect(html).toContain(question);
  });
});
