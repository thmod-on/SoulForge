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
};

export type Defense = {
  evasion: number;
  armor: number;
  minor: number;
  major: number;
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
};

export type ItemDefinition = BaseDefinition & {
  type: "item";
  category: "arma" | "armadura" | "consumivel" | "equipamento" | "loot";
  tier?: number;
  weight: number;
  value?: number;
  traits?: string[];
};

export type Definition = DomainDefinition | CardDefinition | ItemDefinition;

export type InventoryEntry = {
  definitionId: string;
  quantity: number;
  equipped?: boolean;
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
  deck: {
    activeCardIds: string[];
    learnedCardIds: string[];
  };
  inventory: {
    capacity: number;
    entries: InventoryEntry[];
  };
};
