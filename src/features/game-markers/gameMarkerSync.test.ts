import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { CardDefinition, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import { getActiveGameMarkers, resetGameMarkers, synchronizeGameMarkers } from "./gameMarkerSync";

describe("marcadores de jogo", () => {
  it("cria contador para carta ativa e preserva estado quando a carta fica inativa", () => {
    const card: CardDefinition = { id: "card.test.charges", type: "card", packId: "test", name: "Carta de cargas", summary: "", domainId: "domain.test", tier: 1, cardType: "acao", effect: "", gameMarkers: [{ id: "charges", kind: "counter", label: "Cargas", initialValue: 3, max: 3, reset: "long-rest" }] };
    const catalog = createCatalog([], [card]);
    const character = { ...demoCharacter, deck: { activeCardIds: [card.id], learnedCardIds: [card.id] }, gameMarkers: undefined };
    const synchronized = synchronizeGameMarkers(character, catalog);
    expect(getActiveGameMarkers(synchronized, catalog)).toHaveLength(1);
    const spent = { ...synchronized, gameMarkers: synchronized.gameMarkers?.map((marker) => marker.kind === "counter" ? { ...marker, value: 1 } : marker) };
    const preserved = synchronizeGameMarkers(spent, catalog);
    expect(preserved.gameMarkers?.[0]).toMatchObject({ kind: "counter", value: 1 });
    const reset = resetGameMarkers(preserved, catalog, "long-rest");
    expect(reset.gameMarkers?.[0]).toMatchObject({ kind: "counter", value: 3 });
    const inactive = { ...preserved, deck: { activeCardIds: [], learnedCardIds: [card.id] } };
    expect(getActiveGameMarkers(inactive, catalog)).toHaveLength(0);
    expect(inactive.gameMarkers).toHaveLength(1);
  });

  it("resolve contador declarativo pelo atributo e o repoe no descanso", () => {
    const card: CardDefinition = { id: "card.test.presence", type: "card", packId: "test", name: "Palavras", summary: "", domainId: "domain.test", tier: 1, cardType: "acao", effect: "", gameMarkers: [{ id: "uses", kind: "counter", label: "Usos", quantity: { kind: "attribute", attributeId: "con" }, reset: "long-rest" }] };
    const catalog = createCatalog([], [card]);
    const character = { ...demoCharacter, attributes: demoCharacter.attributes.map((attribute) => attribute.id === "con" ? { ...attribute, value: 3 } : attribute), deck: { activeCardIds: [card.id], learnedCardIds: [card.id] }, gameMarkers: undefined };
    const synchronized = synchronizeGameMarkers(character, catalog);
    expect(synchronized.gameMarkers?.[0]).toMatchObject({ kind: "counter", value: 3, max: 3 });
    const spent = { ...synchronized, gameMarkers: synchronized.gameMarkers?.map((marker) => marker.kind === "counter" ? { ...marker, value: 1 } : marker) };
    expect(resetGameMarkers(spent, catalog, "long-rest").gameMarkers?.[0]).toMatchObject({ value: 3, max: 3 });
  });

  it("resolve dados pela caracteristica de Conjuracao declarada pela subclasse", () => {
    const feature: FeatureDefinition = { id: "feature.test.prayer", type: "feature", packId: "test", name: "Dados de Oração", summary: "", sourceType: "class", sourceId: "class.test.seraph", tier: "class", gameMarkers: [{ id: "prayer-dice", kind: "dice", label: "Dados de Oração", die: "d4", quantity: { kind: "spellcast-trait" }, reset: "session" }] };
    const subclass: SubclassDefinition = { id: "subclass.test.seraph", type: "subclass", packId: "test", name: "Sentinela", summary: "", classId: "class.test.seraph", foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [], spellcastAttributeId: "for" };
    const characterClass: ClassDefinition = { id: "class.test.seraph", type: "class", packId: "test", name: "Serafim", summary: "", domainIds: ["domain.a", "domain.b"], startingEvasion: 9, startingHitPoints: 7, featureIds: [feature.id], hopeFeatureId: "", subclassIds: [subclass.id, subclass.id] };
    const catalog = createCatalog([], [feature, subclass, characterClass]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: characterClass.id, primarySubclassId: subclass.id }, gameMarkers: undefined };
    const synchronized = synchronizeGameMarkers(character, catalog);
    expect(synchronized.gameMarkers?.[0]).toMatchObject({ kind: "dice", die: "d4" });
    expect(synchronized.gameMarkers?.[0]?.kind === "dice" ? synchronized.gameMarkers[0].results : []).toHaveLength(2);
  });

  it("resolve contador declarativo pelo nível do personagem", () => {
    const feature: FeatureDefinition = { id: "feature.test.tide", type: "feature", packId: "test", name: "Conhecer a Maré", summary: "", sourceType: "community", sourceId: "community.test.seaborne", tier: "community", gameMarkers: [{ id: "tide", kind: "counter", label: "Maré", quantity: { kind: "character-level" }, reset: "session" }] };
    const community = { id: "community.test.seaborne", type: "community" as const, packId: "test", name: "Marítima", summary: "", adjectives: [], featureId: feature.id };
    const catalog = createCatalog([], [feature, community]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, level: 3, primaryCommunityId: community.id }, gameMarkers: undefined };
    expect(synchronizeGameMarkers(character, catalog).gameMarkers?.[0]).toMatchObject({ kind: "counter", value: 3, max: 3 });
  });

  it("mantem a fonte ativa quando uma ficha local possui IDs antigos, mas os mesmos nomes", () => {
    const feature: FeatureDefinition = { id: "feature.legacy.serafim.class", type: "feature", packId: "test", name: "Dados de Oração", summary: "", sourceType: "class", sourceId: "class.legacy.serafim", tier: "class", gameMarkers: [{ id: "prayer-dice", kind: "dice", label: "Dados de Oração", die: "d4", quantity: { kind: "spellcast-trait" }, reset: "session" }] };
    const subclass: SubclassDefinition = { id: "subclass.legacy.serafim.portador-divino", type: "subclass", packId: "test", name: "Portador Divino", summary: "", classId: "class.legacy.serafim", foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [], spellcastAttributeId: "for" };
    const characterClass: ClassDefinition = { id: "class.legacy.serafim", type: "class", packId: "test", name: "Serafim", summary: "", domainIds: ["domain.a", "domain.b"], startingEvasion: 9, startingHitPoints: 7, featureIds: [feature.id], hopeFeatureId: "", subclassIds: [subclass.id, subclass.id] };
    const catalog = createCatalog([], [feature, subclass, characterClass]);
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, primaryClassId: "class.core.serafim", primarySubclassId: "subclass.core.serafim.portador-divino" }, gameMarkers: undefined };

    const synchronized = synchronizeGameMarkers(character, catalog);

    expect(getActiveGameMarkers(synchronized, catalog)).toEqual(expect.arrayContaining([
      expect.objectContaining({ definition: expect.objectContaining({ id: "prayer-dice" }) })
    ]));
    expect(synchronized.gameMarkers?.find((marker) => marker.kind === "dice")?.kind === "dice" ? synchronized.gameMarkers.find((marker) => marker.kind === "dice")?.results : []).toHaveLength(2);
  });
});
