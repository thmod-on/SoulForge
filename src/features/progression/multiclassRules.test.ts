import { describe, expect, it } from "vitest";
import type { Character } from "../../domain/types";
import { canChooseMulticlass, canLearnMulticlassDomainCard, isSubclassAdvanceBlockedByMulticlass } from "./multiclassRules";

const character = {
  identity: { primaryClassId: "class.guardian", className: "Guardião", level: 4 },
  progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation"], advancementSelections: [], history: [] }
} as unknown as Character;

describe("regras de multiclasse", () => {
  it("só permite multiclasse a partir do Tier 3 e uma única vez", () => {
    expect(canChooseMulticlass(character, 2, [])).toBe(false);
    expect(canChooseMulticlass(character, 3, [])).toBe(true);
    expect(canChooseMulticlass({ ...character, progression: { ...character.progression!, multiclass: { classId: "class.seraph" } as never } }, 3, [])).toBe(false);
  });

  it("bloqueia subclasse e multiclasse no mesmo Tier", () => {
    expect(canChooseMulticlass(character, 3, [{ kind: "subclass", tier: 3, label: "Especialização" }])).toBe(false);
    expect(isSubclassAdvanceBlockedByMulticlass(3, [{ kind: "multiclass", tier: 3, label: "Serafim" }])).toBe(true);
  });

  it("limita cartas do domínio secundário à metade do próximo nível", () => {
    const withMulticlass = { ...character, progression: { ...character.progression!, multiclass: { domainId: "domain.arcana" } as never } };
    expect(canLearnMulticlassDomainCard({ domainId: "domain.arcana", tier: 3 } as never, withMulticlass)).toBe(true);
    expect(canLearnMulticlassDomainCard({ domainId: "domain.arcana", tier: 4 } as never, withMulticlass)).toBe(false);
  });
});
