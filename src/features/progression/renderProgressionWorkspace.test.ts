import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import type { Character } from "../../domain/types";
import { canChooseMulticlass } from "./multiclassRules";
import { getAdvanceSlotsUsed, getNextSubclassAdvance, getProgressionChoiceCount } from "./progressionActions";
import { getTierForLevel } from "./progressionRules";
import { renderProgressionCardSwapStep, renderProgressionOptions, renderProgressionReview, type ProgressionWorkspaceDependencies } from "./renderProgressionWorkspace";

const tierThreeCharacter: Character = {
  ...demoCharacter,
  identity: { ...demoCharacter.identity, level: 4 }
};

function dependencies(progressionDraft: ProgressionWorkspaceDependencies["state"]["progressionDraft"] = []): ProgressionWorkspaceDependencies {
  const state = { progressionDraft };
  return {
    state,
    escapeHtml: (value) => value,
    getTierForLevel,
    getProgressionChoiceCount: () => getProgressionChoiceCount(state.progressionDraft),
    getAdvanceSlotsUsed: (current, tier, kind) => getAdvanceSlotsUsed(current, tier, kind, state.progressionDraft),
    getNextSubclassAdvance: (current, tier) => getNextSubclassAdvance(current, tier, state.progressionDraft),
    canChooseMulticlass: (current, tier) => canChooseMulticlass(current, tier, state.progressionDraft),
    getProgressionCardCandidates: () => [],
    findCard: () => undefined
  };
}

function progressedWith(kind: "subclass" | "multiclass"): Character {
  return {
    ...demoCharacter,
    identity: { ...demoCharacter.identity, level: 5 },
    progression: {
      ...demoCharacter.progression!,
      ...(kind === "multiclass" ? { multiclass: { classId: "class.other" } as never } : {}),
      advancementSelections: [{ kind, tier: 3, level: 5 }]
    }
  };
}

describe("opções de progressão com escolhas persistidas", () => {
  it("expõe o custo antes da seleção e destaca opções que usam o nível inteiro", () => {
    const html = renderProgressionOptions(tierThreeCharacter, dependencies());

    expect(html).toContain('aria-label="Custo: 1 avanço"');
    expect(html).toContain('aria-label="Custo: 2 avanços"');
    expect(html).toContain("Usa todos os avanços deste nível.");
    expect(html).toMatch(/class="progression-option is-full-level-cost"[^>]*data-progression-advance="proficiency"/);
    expect(html).toMatch(/class="progression-option is-full-level-cost"[^>]*data-progression-advance="multiclass"/);
  });

  it("desabilita uma opção sem saldo sem repetir custo e saldo em uma mensagem de erro", () => {
    const html = renderProgressionOptions(tierThreeCharacter, dependencies([{ kind: "hp", tier: 3, label: "PV" }]));
    const proficiency = html.match(/<button[^>]*data-progression-advance="proficiency"[\s\S]*?<\/button>/)?.[0];

    expect(proficiency).toContain("disabled");
    expect(proficiency).toContain("Custo: 2 avanços");
    expect(proficiency).not.toContain("Requer 2 avanços disponíveis");
  });

  it("representa usos e custos com grupos de caixinhas físicas", () => {
    const html = renderProgressionOptions(tierThreeCharacter, dependencies([{ kind: "hp", tier: 3, label: "PV" }]));
    const hp = html.match(/<button[^>]*data-progression-advance="hp"[\s\S]*?<\/button>/)?.[0] ?? "";
    const proficiency = html.match(/<button[^>]*data-progression-advance="proficiency"[\s\S]*?<\/button>/)?.[0] ?? "";

    expect(hp).toContain("1 de 2 usos no Tier");
    expect(hp.match(/class="progression-advance-use(?: is-used)?"/g)).toHaveLength(2);
    expect(hp.match(/class="progression-advance-box"/g)).toHaveLength(2);
    expect(hp.match(/progression-advance-use is-used/g)).toHaveLength(1);
    expect(proficiency).toContain("0 de 1 uso no Tier");
    expect(proficiency.match(/class="progression-advance-use(?: is-used)?"/g)).toHaveLength(1);
    expect(proficiency.match(/class="progression-advance-box"/g)).toHaveLength(2);
  });

  it("desabilita Multiclasse após aprimorar a subclasse no Tier atual", () => {
    const character = progressedWith("subclass");
    const html = renderProgressionOptions(character, dependencies());

    expect(html).toMatch(/data-progression-advance="multiclass"[^>]*disabled/);
  });

  it("desabilita o aprimoramento da subclasse após escolher Multiclasse no Tier atual", () => {
    const character = progressedWith("multiclass");
    const html = renderProgressionOptions(character, dependencies());

    expect(html).toMatch(/data-progression-advance="subclass"[^>]*disabled/);
  });

  it("apresenta a troca como opcional e registra a decisão na revisão", () => {
    const fromCard = { id: "card.old", name: "Carta antiga", tier: 2 } as never;
    const toCard = { id: "card.new", name: "Carta nova", tier: 1 } as never;
    const deps = dependencies();
    deps.state.progressionSwapFromCardId = "card.old";
    deps.state.progressionSwapToCardId = "card.new";
    deps.findCard = (id) => id === "card.old" ? fromCard : id === "card.new" ? toCard : undefined;

    const step = renderProgressionCardSwapStep(tierThreeCharacter, deps);
    const review = renderProgressionReview(tierThreeCharacter, deps);

    expect(step).toContain("Opcional");
    expect(step).toContain("Sai da coleção");
    expect(step).toContain("Entra no Vault");
    expect(review).toContain("Troca opcional: Carta antiga → Carta nova (Vault)");
  });
});
