export type DefinitionType = "domain" | "card" | "item";

export type ResourceTrack = {
  id: string;
  label: string;
  value: number;
  max: number;
  tone: "hope" | "stress" | "hp" | "shadow" | "focus";
};

export type Attribute = {
  id: "for" | "dex" | "con" | "int" | "wil" | "cha";
  label: string;
  value: number;
  upgraded?: boolean;
};

export type Defense = {
  evasion: number;
  armor: number;
  minor: number;
  major: number;
};

export type CharacterSkill = {
  id: string;
  name: string;
  source: "class" | "ancestry" | "community";
  tier?: "foundation" | "specialized" | "mastery";
  description: string;
};

export type CharacterExperience = {
  id: string;
  name: string;
  value: number;
  description?: string;
};

export type CharacterNoteCategory = "session" | "npc" | "place" | "quest" | "item" | "free";

export type CharacterNote = {
  id: string;
  title: string;
  content: string;
  category: CharacterNoteCategory;
  createdAt: string;
  updatedAt: string;
};

export type PackManifest = {
  id: string;
  name: string;
  version: string;
  description: string;
};

export type BaseDefinition = {
  id: string;
  type: DefinitionType;
  packId: string;
  name: string;
  summary: string;
};

export type DomainDefinition = BaseDefinition & {
  type: "domain";
  color: string;
};

export type CardDefinition = BaseDefinition & {
  type: "card";
  domainId: string;
  tier: number;
  cardType: "acao" | "reacao" | "passiva";
  cost?: string;
  effect: string;
  image?: string;
};

export type ItemDefinition = BaseDefinition & {
  type: "item";
  category: "arma" | "armadura" | "consumivel" | "equipamento" | "loot";
  image?: string;
  tier?: number;
  weight: number;
  value?: number;
  traits?: string[];
};

export type Definition = DomainDefinition | CardDefinition | ItemDefinition;

export type InventoryEntry = {
  definitionId: string;
  quantity: number;
  compartmentId?: string;
  equipped?: boolean;
};

export type InventoryCompartment = {
  id: string;
  name: string;
  capacity?: number;
  accepts?: Array<ItemDefinition["category"]>;
  source?: "character" | "item" | "custom";
};

export type Character = {
  id: string;
  identity: {
    name: string;
    ancestry: string;
    className: string;
    community: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    quote: string;
  };
  attributes: Attribute[];
  defense: Defense;
  resources: ResourceTrack[];
  skills: CharacterSkill[];
  experiences: CharacterExperience[];
  notes: CharacterNote[];
  deck: {
    activeCardIds: string[];
    learnedCardIds: string[];
  };
  inventory: {
    capacity: number;
    compartments: InventoryCompartment[];
    entries: InventoryEntry[];
  };
};
