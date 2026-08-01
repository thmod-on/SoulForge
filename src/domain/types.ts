export type DefinitionType = "domain" | "card" | "item" | "class" | "subclass" | "feature";

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

export type ProgressionAdvanceKind = "attributes" | "hp" | "stress" | "experiences" | "domain" | "evasion" | "subclass" | "proficiency";

export type CharacterProgressionEntry = {
  level: number;
  appliedAt: string;
  choices: string[];
  advances?: Array<{ kind: ProgressionAdvanceKind; label: string }>;
  tierAchievement?: string;
};

export type CharacterProgression = {
  demoBaselineVersion?: number;
  attributeMarks: Record<string, string[]>;
  acquiredSubclassTiers: Array<"foundation" | "specialized" | "mastery">;
  advancementSelections: Array<{ kind: ProgressionAdvanceKind; tier: number; level: number }>;
  history: CharacterProgressionEntry[];
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
  recallCost?: number;
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

export type ClassDefinition = BaseDefinition & {
  type: "class";
  domainIds: [string, string];
  startingEvasion: number;
  startingHitPoints: number;
  featureIds: string[];
  hopeFeatureId: string;
  subclassIds: [string, string];
  image?: string;
};

export type SubclassDefinition = BaseDefinition & {
  type: "subclass";
  classId: string;
  foundationFeatureIds: string[];
  specializationFeatureIds: string[];
  masteryFeatureIds: string[];
};

export type FeatureDefinition = BaseDefinition & {
  type: "feature";
  sourceType: "class" | "subclass";
  sourceId: string;
  tier: "class" | "hope" | "foundation" | "specialization" | "mastery";
  hopeCost?: number;
};

export type Definition = DomainDefinition | CardDefinition | ItemDefinition | ClassDefinition | SubclassDefinition | FeatureDefinition;

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
    primaryClassId?: string;
    subclassName?: string;
    primarySubclassId?: string;
    primaryDomainIds?: [string, string];
    community: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    quote: string;
  };
  attributes: Attribute[];
  defense: Defense;
  proficiency: number;
  progression?: CharacterProgression;
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
