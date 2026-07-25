import type { Character } from "./types";

export const demoCharacter: Character = {
  id: "character.kael-ironheart",
  identity: {
    name: "Kael Ironheart",
    ancestry: "Humano",
    className: "Guardiao",
    community: "Vigilia de Tristelo",
    level: 3,
    xp: 6,
    nextLevelXp: 10,
    quote: "Protejo para que outros possam ter um amanha."
  },
  attributes: [
    { id: "for", label: "FOR", value: 2 },
    { id: "dex", label: "DEX", value: 1 },
    { id: "con", label: "CON", value: 3 },
    { id: "int", label: "INT", value: 0 },
    { id: "wil", label: "WIL", value: 1 },
    { id: "cha", label: "CHA", value: 1 }
  ],
  defense: {
    evasion: 12,
    armor: 16,
    minor: 12,
    major: 20
  },
  resources: [
    { id: "hope", label: "Hope", value: 3, max: 5, tone: "hope" },
    { id: "stress", label: "Stress", value: 2, max: 5, tone: "stress" },
    { id: "hp", label: "HP", value: 28, max: 28, tone: "hp" },
    { id: "shadow", label: "Essencia Sombria", value: 2, max: 4, tone: "shadow" },
    { id: "focus", label: "Determinacao", value: 1, max: 3, tone: "focus" }
  ],
  deck: {
    activeCardIds: [
      "card.demo.shield-block",
      "card.demo.stalwart-advance",
      "card.demo.dread-veil",
      "card.demo.dread-mark",
      "card.demo.inspirational-words"
    ]
  },
  inventory: {
    capacity: 30,
    entries: [
      { definitionId: "item.demo.long-sword", quantity: 1, equipped: true },
      { definitionId: "item.demo.steel-shield", quantity: 1, equipped: true },
      { definitionId: "item.demo.leather-armor", quantity: 1, equipped: true },
      { definitionId: "item.demo.vigil-amulet", quantity: 1, equipped: true },
      { definitionId: "item.demo.healing-potion", quantity: 2 },
      { definitionId: "item.demo.rope", quantity: 1 },
      { definitionId: "item.demo.torch", quantity: 3 },
      { definitionId: "item.demo.gold", quantity: 128 },
      { definitionId: "item.demo.shadow-essence", quantity: 3 }
    ]
  }
};
