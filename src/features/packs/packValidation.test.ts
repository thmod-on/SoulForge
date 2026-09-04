import { describe, expect, it } from "vitest";
import { validatePackBundle } from "./packValidation";

const manifest = { id: "test-pack", name: "Pack de teste", version: "1.0.0", description: "Validação de metadados." };
const feature = {
  id: "feature.test.mantle", type: "feature" as const, packId: manifest.id, name: "Manto de teste", summary: "Efeito temporário.", sourceType: "subclass" as const, sourceId: "subclass.test", tier: "foundation" as const,
  activation: {
    label: "Ativar Manto",
    costs: [{ kind: "game-marker" as const, sourceDefinitionId: "feature.test.favor", markerId: "favor", amount: 1 }],
    endsOn: ["scene-end", "severe-damage"] as const,
    modifiers: [{ kind: "defense-per-tier" as const, fields: ["minor", "major"] as const }],
    reminders: ["Vantagem para intimidar."]
  }
};

describe("validação de Packs", () => {
  it("aceita metadados válidos de Feature ativável", () => {
    expect(validatePackBundle({ format: "soulforge-pack-v1", manifest, definitions: [feature] }).definitions).toHaveLength(1);
  });

  it("rejeita custo inválido em Feature ativável", () => {
    const invalidFeature = { ...feature, activation: { ...feature.activation, costs: [{ kind: "game-marker", sourceDefinitionId: "feature.test.favor", markerId: "favor", amount: 0 }] } };
    expect(() => validatePackBundle({ format: "soulforge-pack-v1", manifest, definitions: [invalidFeature] })).toThrow("metadados de ativação inválidos");
  });

  it("aceita pools de dados declarados com Proficiência", () => {
    const diceFeature = {
      ...feature,
      id: "feature.test.dados",
      gameMarkers: [{ id: "dados", kind: "dice", label: "Dados do Matador", die: "d8", quantity: { kind: "proficiency" }, reset: "session" }]
    };
    expect(validatePackBundle({ format: "soulforge-pack-v1", manifest, definitions: [diceFeature] }).definitions).toHaveLength(1);
  });

  it("aceita modificador passivo em carta enquanto ela estiver no Loadout", () => {
    const card = {
      id: "card.test.intocavel", type: "card" as const, packId: manifest.id, name: "Intocável", summary: "Bônus de Evasão.",
      domainId: "domain.test.bone", tier: 1, cardType: "passiva" as const, effect: "Ganhe bônus na Evasão.",
      sheetModifiers: [{ kind: "defense-per-attribute" as const, field: "evasion" as const, attributeId: "dex" as const, divisor: 2 }]
    };
    expect(validatePackBundle({ format: "soulforge-pack-v1", manifest, definitions: [card] }).definitions).toHaveLength(1);
  });

  it("aceita uma transformação com fonte e metadados de marcador", () => {
    const transformation = {
      id: "transformation.test.vampiro", type: "transformation" as const, packId: manifest.id, name: "Vampiro de teste", summary: "Identidade sobrenatural.",
      benefit: "Pode se alimentar.", drawback: "Sofre sem alimento.", narrativeQuestions: ["Quem o transformou?"],
      gameMarkers: [{ id: "sangue", kind: "counter", label: "Sangue", initialValue: 0, max: 6 }]
    };
    const pack = validatePackBundle({ format: "soulforge-pack-v1", manifest: { ...manifest, source: { name: "Fonte oficial", url: "https://www.daggerheart.com/srd/", version: "2.0", reviewedAt: "2026-08-30" } }, definitions: [transformation] });
    expect(pack.definitions[0]?.type).toBe("transformation");
  });
});
