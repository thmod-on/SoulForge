export type DefinitionType = "domain" | "card" | "item" | "class" | "subclass" | "feature" | "ancestry" | "community";

export type ResourceTrack = {
  id: string;
  label: string;
  value: number;
  max: number;
  /** Máximo próprio da ficha, antes dos bônus declarados pelas suas fontes. */
  baseMax?: number;
  tone: "hope" | "stress" | "hp" | "shadow" | "focus";
};

export type GameMarkerReset = "session" | "short-rest" | "long-rest";

export type GameMarkerQuantity =
  | { kind: "fixed"; value: number }
  | { kind: "attribute"; attributeId: Attribute["id"] }
  | { kind: "spellcast-trait" }
  /** Quantidade acompanha o nível atual do personagem. */
  | { kind: "character-level" };

export type CounterGameMarkerDefinition = {
  id: string;
  kind: "counter";
  label: string;
  /**
   * Quantidade declarativa para contadores que acompanham um atributo ou
   * outra regra conhecida. Quando presente, define o maximo e a reposicao.
   */
  quantity?: GameMarkerQuantity;
  initialValue?: number;
  max?: number;
  reset?: GameMarkerReset;
};

export type DiceGameMarkerDefinition = {
  id: string;
  kind: "dice";
  label: string;
  die: "d4" | "d6";
  quantity: GameMarkerQuantity;
  reset?: "session";
};

/** Declaracao reutilizavel do conteudo; nunca guarda dados de uma sessao. */
export type GameMarkerDefinition = CounterGameMarkerDefinition | DiceGameMarkerDefinition;

export type CounterGameMarkerState = {
  key: string;
  sourceDefinitionId: string;
  markerId: string;
  kind: "counter";
  value: number;
  max?: number;
};

export type DiceGameMarkerState = {
  key: string;
  sourceDefinitionId: string;
  markerId: string;
  kind: "dice";
  die: "d4" | "d6";
  results: Array<{ id: string; value: number; used: boolean }>;
};

/** Estado variavel do personagem. E preservado mesmo se a fonte ficar inativa. */
export type CharacterGameMarkerState = CounterGameMarkerState | DiceGameMarkerState;

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

/**
 * Efeito mecânico declarado por uma definição do Compendium.
 *
 * A definição descreve o bônus; a ficha preserva apenas seus valores atuais.
 * Novas fontes (cartas, classes e itens) podem reutilizar os mesmos tipos.
 */
export type CharacterSheetModifier =
  | { kind: "resource-max"; resourceId: string; amount: number }
  | { kind: "defense"; field: keyof Defense; amount: number }
  | { kind: "defense-per-proficiency"; field: "minor" | "major"; amount: number };

/** Bônus declarados por um item enquanto ele estiver em Equipados. */
export type ItemCombatModifiers = Partial<Defense>;

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

export type ProgressionAdvanceKind = "attributes" | "hp" | "stress" | "experiences" | "domain" | "evasion" | "subclass" | "proficiency" | "multiclass";

/** A segunda classe escolhida uma única vez por meio do avanço de Multiclasse. */
export type CharacterMulticlass = {
  classId: string;
  className: string;
  domainId: string;
  domainName: string;
  featureId: string;
  featureName: string;
  subclassId: string;
  subclassName: string;
  foundationFeatureId: string;
  foundationFeatureName: string;
  spellcastAttributeId?: Attribute["id"];
};

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
  multiclass?: CharacterMulticlass;
  history: CharacterProgressionEntry[];
};

export type PackManifest = {
  id: string;
  name: string;
  version: string;
  description: string;
  distribution?: "private-local-only" | "shared";
  contentFormat?: string;
};

export type PackBundle = {
  format: "soulforge-pack-v1";
  manifest: PackManifest;
  definitions: Definition[];
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
  gameMarkers?: GameMarkerDefinition[];
};

export type ItemDefinition = BaseDefinition & {
  type: "item";
  category: "arma" | "armadura" | "consumivel" | "equipamento" | "loot";
  image?: string;
  tier?: number;
  weight: number;
  value?: number;
  traits?: string[];
  combatModifiers?: ItemCombatModifiers;
  weaponProfile?: WeaponProfile;
  armorProfile?: ArmorProfile;
};

/** Dados oficiais de ataque; a interface ainda pode apresentar esses valores como propriedades do item. */
export type WeaponProfile = {
  category: "primaria" | "secundaria";
  attackTrait: Attribute["id"] | "conjuracao";
  range: "corpo-a-corpo" | "muito-proximo" | "proximo" | "longe" | "muito-longe";
  damage: string;
  damageType: "fisico" | "magico" | "fisico-ou-magico";
  burden: 1 | 2;
};

/** Valores-base da armadura antes de bônus de classe, nível ou outros equipamentos. */
export type ArmorProfile = {
  armor: number;
  minorThreshold: number;
  majorThreshold: number;
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
  gameMarkers?: GameMarkerDefinition[];
};

export type SubclassDefinition = BaseDefinition & {
  type: "subclass";
  classId: string;
  foundationFeatureIds: string[];
  specializationFeatureIds: string[];
  masteryFeatureIds: string[];
  spellcastAttributeId?: Attribute["id"];
};

export type AncestryDefinition = BaseDefinition & {
  type: "ancestry";
  image?: string;
  topFeatureId: string;
  bottomFeatureId: string;
};

/** Origem cultural, social ou ambiental que concede uma única Feature. */
export type CommunityDefinition = BaseDefinition & {
  type: "community";
  adjectives: string[];
  featureId: string;
  image?: string;
};

export type FeatureDefinition = BaseDefinition & {
  type: "feature";
  sourceType: "class" | "subclass" | "ancestry" | "community";
  sourceId: string;
  tier: "class" | "hope" | "foundation" | "specialization" | "mastery" | "top" | "bottom" | "community";
  hopeCost?: number;
  gameMarkers?: GameMarkerDefinition[];
  sheetModifiers?: CharacterSheetModifier[];
};

export type Definition = DomainDefinition | CardDefinition | ItemDefinition | ClassDefinition | SubclassDefinition | AncestryDefinition | CommunityDefinition | FeatureDefinition;

export type InventoryEntry = {
  /** Identificador da pilha no inventário. Ausente em fichas antigas e atribuído na próxima alteração. */
  id?: string;
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
    primaryAncestryId?: string;
    ancestryIds?: string[];
    ancestryFeatureIds?: {
      top?: string;
      bottom?: string;
    };
    className: string;
    primaryClassId?: string;
    subclassName?: string;
    primarySubclassId?: string;
    primaryDomainIds?: [string, string];
    community: string;
    /** Comunidade mecânica declarada por um Pack; `community` preserva a origem narrativa livre. */
    primaryCommunityId?: string;
    /** Parâmetros estruturados solicitados pela Feature de comunidade, quando existirem. */
    communityFeatureChoiceValues?: Record<string, unknown>;
    level: number;
    xp: number;
    nextLevelXp: number;
    quote: string;
    portraitImage?: string;
  };
  attributes: Attribute[];
  defense: Defense;
  /** Defesa sem efeitos declarados por ancestralidades, classes ou cartas. */
  baseDefense?: Defense;
  proficiency: number;
  progression?: CharacterProgression;
  resources: ResourceTrack[];
  /** Estado de marcadores de jogo, separado das definicoes do Compendium. */
  gameMarkers?: CharacterGameMarkerState[];
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
