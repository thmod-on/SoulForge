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
    { id: "dex", label: "AGI", value: 1 },
    { id: "for", label: "FOR", value: 2 },
    { id: "cha", label: "FIN", value: 1 },
    { id: "wil", label: "INS", value: 1 },
    { id: "con", label: "PRE", value: 3 },
    { id: "int", label: "CON", value: 0 }
  ],
  defense: {
    evasion: 12,
    armor: 16,
    minor: 12,
    major: 20
  },
  resources: [
    { id: "hp", label: "PV", value: 28, max: 28, tone: "hp" },
    { id: "stress", label: "Estresse", value: 2, max: 5, tone: "stress" },
    { id: "armor-slots", label: "Slot de Armadura", value: 3, max: 6, tone: "focus" },
    { id: "hope", label: "Esperanca", value: 3, max: 5, tone: "hope" },
    { id: "shadow", label: "Essencia Sombria", value: 2, max: 4, tone: "shadow" },
    { id: "focus", label: "Determinacao", value: 1, max: 3, tone: "focus" }
  ],
  skills: [
    {
      id: "skill.demo.guardian-oath",
      name: "Juramento do Guardiao",
      source: "class",
      tier: "foundation",
      description: "Quando um aliado proximo estiver em perigo, voce pode se colocar entre ele e a ameaca."
    },
    {
      id: "skill.demo.hold-the-line",
      name: "Segurar a Linha",
      source: "class",
      tier: "specialized",
      description: "Ao resistir a uma investida, aumente sua presenca narrativa na cena e proteja uma rota de fuga."
    },
    {
      id: "skill.demo.iron-heart",
      name: "Coracao de Ferro",
      source: "class",
      tier: "mastery",
      description: "Uma vez por sessao, transforme uma consequencia severa em uma oportunidade heroica."
    },
    {
      id: "skill.demo.human-resolve",
      name: "Resolucao Humana",
      source: "ancestry",
      description: "Quando tudo parece perdido, recupere o folego ao se agarrar a uma memoria importante."
    },
    {
      id: "skill.demo.vigil-bonds",
      name: "Lacos da Vigilia",
      source: "community",
      description: "Voce conhece sinais, rotas e juramentos usados por guardas de fronteira e sentinelas."
    }
  ],
  experiences: [
    {
      id: "experience.demo.border-watch",
      name: "Vigia de fronteira",
      value: 2,
      description: "Patrulhas longas, noites ruins e olhos atentos."
    },
    {
      id: "experience.demo.monster-lore",
      name: "Historias de monstros",
      value: 1,
      description: "Contos de taverna que as vezes salvam vidas."
    },
    {
      id: "experience.demo.oathkeeper",
      name: "Cumpridor de juramentos",
      value: 2,
      description: "Promessas pesam, mas tambem guiam."
    }
  ],
  deck: {
    activeCardIds: [
      "card.demo.shield-block",
      "card.demo.stalwart-advance",
      "card.demo.dread-veil",
      "card.demo.dread-mark",
      "card.demo.inspirational-words"
    ],
    learnedCardIds: [
      "card.demo.shield-block",
      "card.demo.stalwart-advance",
      "card.demo.dread-veil",
      "card.demo.dread-mark",
      "card.demo.inspirational-words",
      "card.demo.shadow-bargain",
      "card.demo.last-stand"
    ]
  },
  inventory: {
    capacity: 30,
    compartments: [
      { id: "equipped", name: "Equipados", source: "character" },
      { id: "backpack", name: "Mochila", capacity: 30, source: "character" },
      { id: "utility-belt", name: "Cinto de utilidades", capacity: 6, accepts: ["consumivel", "equipamento", "loot"], source: "item" }
    ],
    entries: [
      { definitionId: "item.demo.long-sword", quantity: 1, compartmentId: "equipped", equipped: true },
      { definitionId: "item.demo.steel-shield", quantity: 1, compartmentId: "equipped", equipped: true },
      { definitionId: "item.demo.leather-armor", quantity: 1, compartmentId: "equipped", equipped: true },
      { definitionId: "item.demo.vigil-amulet", quantity: 1, compartmentId: "equipped", equipped: true },
      { definitionId: "item.demo.healing-potion", quantity: 2, compartmentId: "utility-belt" },
      { definitionId: "item.demo.rope", quantity: 1, compartmentId: "backpack" },
      { definitionId: "item.demo.torch", quantity: 3, compartmentId: "utility-belt" },
      { definitionId: "item.demo.gold", quantity: 128, compartmentId: "backpack" },
      { definitionId: "item.demo.shadow-essence", quantity: 3, compartmentId: "utility-belt" }
    ]
  }
};
