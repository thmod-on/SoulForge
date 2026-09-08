import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import type { Character } from "../../domain/types";
import { adjustGameMarkerCounter, consumeGameMarkerDie, setGameMarkerDieResult } from "./gameMarkerActions";

function characterWithMarkers(): Character {
  return {
    ...demoCharacter,
    gameMarkers: [
      { key: "charges", sourceDefinitionId: "card.test", markerId: "charges", kind: "counter", value: 2, max: 3 },
      { key: "dice", sourceDefinitionId: "card.test", markerId: "dice", kind: "dice", die: "d8", results: [{ id: "die.1", value: 0, used: false }] }
    ]
  };
}

describe("ações dos marcadores de jogo", () => {
  it("mantém contadores dentro dos limites declarados", () => {
    const filled = adjustGameMarkerCounter(characterWithMarkers(), "charges", 4);
    expect(filled.gameMarkers?.[0]).toMatchObject({ value: 3 });
    expect(adjustGameMarkerCounter(filled, "charges", -8).gameMarkers?.[0]).toMatchObject({ value: 0 });
  });

  it("aceita todas as faces do dado declarado, não apenas resultados de d6", () => {
    const rolled = setGameMarkerDieResult(characterWithMarkers(), "dice", "die.1", 8);
    expect(rolled.gameMarkers?.[1]).toMatchObject({ results: [{ id: "die.1", value: 8, used: false }] });
    const invalid = setGameMarkerDieResult(rolled, "dice", "die.1", 9);
    expect(invalid.gameMarkers?.[1]).toMatchObject({ results: [{ id: "die.1", value: 8, used: false }] });
  });

  it("marca como usado somente um dado que já possui resultado", () => {
    const empty = consumeGameMarkerDie(characterWithMarkers(), "dice", "die.1");
    expect(empty.gameMarkers?.[1]).toMatchObject({ results: [{ value: 0, used: false }] });
    const rolled = setGameMarkerDieResult(empty, "dice", "die.1", 7);
    expect(consumeGameMarkerDie(rolled, "dice", "die.1").gameMarkers?.[1]).toMatchObject({ results: [{ value: 7, used: true }] });
  });
});
