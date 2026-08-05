import type { Character } from "./types";

export const demoCharacter: Character = {
  id: "character.kael-ironheart",
  identity: {
    name: "Kael Ironheart",
    ancestry: "Humano",
    primaryAncestryId: "ancestry.core.human",
    ancestryIds: ["ancestry.core.human"],
    ancestryFeatureIds: {
      top: "feature.core.human.top",
      bottom: "feature.core.human.bottom"
    },
    className: "Guardiao",
    primaryClassId: "class.demo.guardian",
    subclassName: "Vengeance",
    primarySubclassId: "subclass.demo.vengeance",
    primaryDomainIds: ["domain.demo.guardian", "domain.demo.test"],
    community: "Vigilia de Tristelo",
    level: 1,
    xp: 0,
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
  proficiency: 1,
  progression: {
    demoBaselineVersion: 4,
    attributeMarks: {},
    acquiredSubclassTiers: ["foundation"],
    advancementSelections: [],
    history: []
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
      id: "skill.demo.vengeance-revenge",
      name: "Revenge",
      source: "class",
      tier: "foundation",
      description: "Quando um adversario em alcance Corpo a Corpo acerta um ataque contra voce, marque 2 Stress para faze-lo marcar 1 PV."
    },
    {
      id: "skill.demo.vengeance-act-of-reprisal",
      name: "Act of Reprisal",
      source: "class",
      tier: "specialized",
      description: "Quando um adversario causa dano a um aliado em alcance Corpo a Corpo, ganhe +1 em Proficiencia no proximo ataque bem-sucedido contra ele."
    },
    {
      id: "skill.demo.vengeance-nemesis",
      name: "Nemesis",
      source: "class",
      tier: "mastery",
      description: "Gaste 2 Esperanca para Priorizar um adversario ate seu proximo descanso e, ao ataca-lo, poder trocar os resultados dos Dados de Esperanca e Medo."
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
  notes: [
    {
      id: "note.demo.blacksmith-promise",
      title: "Promessa do ferreiro",
      content: "Encontrar pistas sobre o minerio escuro que desapareceu das caravanas ao norte.",
      category: "quest",
      createdAt: "2026-07-22T19:00:00.000Z",
      updatedAt: "2026-07-22T19:00:00.000Z"
    },
    {
      id: "note.demo.tristelo-watch",
      title: "Vigilia de Tristelo",
      content: "Os sinais antigos nas torres da fronteira ainda sao usados por alguns veteranos.",
      category: "place",
      createdAt: "2026-07-22T19:10:00.000Z",
      updatedAt: "2026-07-22T19:10:00.000Z"
    }
  ],
  deck: {
    activeCardIds: ["card.demo.shield-block", "card.demo.stalwart-advance"],
    learnedCardIds: ["card.demo.shield-block", "card.demo.stalwart-advance"]
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
