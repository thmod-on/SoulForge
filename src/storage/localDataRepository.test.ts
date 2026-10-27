import { beforeEach, describe, expect, it } from "vitest";
import { demoCharacter } from "../domain/demoCharacter";
import type { Definition } from "../domain/types";
import { applyLocalDataCompatibility, loadLocalDataSnapshot, replaceLocalDataSnapshot } from "./localDataRepository";

describe("snapshot e compatibilidade dos dados locais", () => {
  beforeEach(async () => {
    localStorage.clear();
    await replaceLocalDataSnapshot({ characters: [], installedPacks: [], definitions: [], overrides: [] });
  });

  it("lê as coleções locais como um snapshot coerente", async () => {
    await replaceLocalDataSnapshot({
      characters: [demoCharacter],
      installedPacks: [{ id: "pack.test", name: "Teste", version: "1.0.0", description: "Pack de teste." }],
      definitions: [{ id: "domain.local.test", type: "domain", packId: "local", name: "Teste", summary: "Definition local.", color: "#7652a8" }],
      overrides: []
    });

    await expect(loadLocalDataSnapshot()).resolves.toMatchObject({
      characters: [{ id: demoCharacter.id }],
      installedPacks: [{ id: "pack.test" }],
      definitions: [{ id: "domain.local.test" }]
    });
  });

  it("aplica limpeza legada uma vez e só marca sucesso após a transação", async () => {
    const legacyFeature = { id: "feature.local.rest", type: "feature" as const, packId: "local", name: "Descanso", summary: "Teste.", sourceType: "class" as const, sourceId: "class.local", tier: "class" as const, activation: { label: "Ativar", costs: [], endsOn: ["short-rest", "long-rest"], modifiers: [] } } as unknown as Definition;
    await replaceLocalDataSnapshot({ characters: [{ ...demoCharacter, id: "character.kael-ironheart" }], installedPacks: [], definitions: [legacyFeature], overrides: [] });

    await expect(applyLocalDataCompatibility()).resolves.toBe(true);
    await expect(loadLocalDataSnapshot()).resolves.toMatchObject({ characters: [], definitions: [{ activation: { endsOn: ["any-rest"] } }] });
    await expect(applyLocalDataCompatibility()).resolves.toBe(false);
  });
});
