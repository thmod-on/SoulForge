import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { CardDefinition, Character, ClassDefinition } from "../../domain/types";
import { applyProgression, type ProgressionActionState } from "./progressionActions";

const packId = "pack.progression";
const characterClass: ClassDefinition = { id: "class.test", type: "class", packId, name: "Classe", summary: "", domainIds: ["domain.one", "domain.two"], startingEvasion: 10, startingHitPoints: 6, featureIds: [], hopeFeatureId: "feature.hope", subclassIds: ["subclass.one", "subclass.two"] };
const card: CardDefinition = { id: "card.new", type: "card", packId, name: "Nova carta", summary: "", effect: "", domainId: "domain.one", tier: 1, cardType: "acao" };
const catalog = createCatalog([], [characterClass, card]);

function createCharacter(): Character {
  return {
    id: "character.test",
    identity: { name: "Teste", ancestry: "Humano", community: "", className: characterClass.name, primaryClassId: characterClass.id, subclassName: "Subclasse", level: 1, xp: 0, nextLevelXp: 10, quote: "" },
    attributes: [{ id: "dex", label: "AGI", value: 1 }, { id: "for", label: "FOR", value: 1 }, { id: "cha", label: "FIN", value: 0 }, { id: "wil", label: "INS", value: 0 }, { id: "con", label: "PRE", value: 0 }, { id: "int", label: "CON", value: -1 }],
    defense: { evasion: 10, armor: 0, minor: 1, major: 2 },
    proficiency: 1,
    progression: { attributeMarks: { "2": ["dex"] }, acquiredSubclassTiers: ["foundation"], advancementSelections: [], history: [] },
    resources: [{ id: "hp", label: "PV", value: 0, max: 6, tone: "hp" }, { id: "stress", label: "Estresse", value: 0, max: 6, tone: "stress" }],
    skills: [], experiences: [], notes: [], deck: { activeCardIds: [], learnedCardIds: [] }, inventory: { capacity: 30, compartments: [], entries: [] }
  };
}

describe("aplicação da progressão", () => {
  it("aplica recursos, evasão, conquista de Tier e carta obrigatória", async () => {
    const state: ProgressionActionState = {
      character: createCharacter(),
      progressionDraft: [{ kind: "hp", tier: 2, label: "PV" }, { kind: "evasion", tier: 2, label: "Evasão" }],
      progressionCardId: card.id,
      progressionTierExperience: { name: "Veterano", description: "Sobreviveu" },
      progressionStep: "review"
    };
    let saved: Character | undefined;

    const result = await applyProgression({ state, catalog, saveCharacter: async (character) => { saved = character; }, now: () => "2026-09-07T00:00:00.000Z", createId: () => "fixed" });

    expect(result?.identity.level).toBe(2);
    expect(result?.defense.evasion).toBe(11);
    expect(result?.resources.find((resource) => resource.id === "hp")?.max).toBe(7);
    expect(result?.proficiency).toBe(2);
    expect(result?.deck.learnedCardIds).toContain(card.id);
    expect(result?.progression?.attributeMarks).toEqual({});
    expect(result?.experiences[0]).toMatchObject({ id: "experience.tier.2.fixed", name: "Veterano", value: 2 });
    expect(saved).toBe(result);
    expect(state.progressionDraft).toEqual([]);
    expect(state.progressionCompletionLevel).toBe(2);
  });
});
