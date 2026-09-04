export type DefinitionType = "domain" | "card" | "item" | "class" | "subclass" | "feature" | "ancestry" | "community" | "transformation";

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
  /** Quantidade acompanha a Proficiência atual do personagem. */
  | { kind: "proficiency" }
  /** Quantidade acompanha o nível atual do personagem. */
  | { kind: "character-level" };

export type GameMarkerDie = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

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
  die: GameMarkerDie;
  quantity: GameMarkerQuantity;
  reset?: "session";
};

/**
 * Dados armazenados sem resultado. São conquistados durante a sessão e só
 * rolam quando gastos, como os Dados do Matador.
 */
export type StoredDiceGameMarkerDefinition = {
  id: string;
  kind: "stored-dice";
  label: string;
  die: GameMarkerDie;
  quantity: GameMarkerQuantity;
  /** Evento narrativo que permite guardar um dado vazio. */
  gainTrigger: "hope-roll";
  reset: "session";
  /** Recuperação aplicada por dado ainda guardado ao encerrar a sessão. */
  resetRecovery?: { resourceId: string; amountPerDie: number };
};

/** Declaracao reutilizavel do conteudo; nunca guarda dados de uma sessao. */
export type GameMarkerDefinition = CounterGameMarkerDefinition | DiceGameMarkerDefinition | StoredDiceGameMarkerDefinition;

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
  die: GameMarkerDie;
  results: Array<{ id: string; value: number; used: boolean }>;
};

export type StoredDiceGameMarkerState = {
  key: string;
  sourceDefinitionId: string;
  markerId: string;
  kind: "stored-dice";
  die: GameMarkerDie;
  available: number;
  max: number;
};

/** Estado variavel do personagem. E preservado mesmo se a fonte ficar inativa. */
export type CharacterGameMarkerState = CounterGameMarkerState | DiceGameMarkerState | StoredDiceGameMarkerState;

/** Estado persistido de uma Feature temporariamente ativa na ficha. */
export type CharacterActiveFeatureEffect = {
  target?: "self" | "ally";
  featureId: string;
  activatedAt: string;
  /** Fichas efêmeras vinculadas a esta ativação, jamais à Definition. */
  tokens?: { label: string; value: number };
};

export type Attribute = {
  id: "for" | "dex" | "con" | "int" | "wil" | "cha";
  label: string;
  /** Valor permanente antes de modificadores declarados pelo Loadout. */
  baseValue?: number;
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
/** Condição verificável pela ficha para manter um bônus de Loadout ativo. */
export type SheetModifierCondition =
  /** Exige ao menos uma armadura equipada; escudos e acessórios não contam. */
  | { kind: "equipped-armor" }
  /** Exige uma quantidade mínima de cartas de um domínio no Loadout. */
  | { kind: "active-domain-cards"; domainId: string; minimum: number };

type ConditionalSheetModifier = { condition?: SheetModifierCondition };

export type CharacterSheetModifier =
  | ({ kind: "resource-max"; resourceId: string; amount: number } & ConditionalSheetModifier)
  | ({ kind: "attribute"; attributeId: Attribute["id"]; amount: number } & ConditionalSheetModifier)
  | ({ kind: "defense"; field: keyof Defense; amount: number } & ConditionalSheetModifier)
  | ({ kind: "defense-per-attribute"; field: keyof Defense; attributeId: Attribute["id"]; multiplier?: number; divisor?: number } & ConditionalSheetModifier)
  | ({ kind: "defense-per-proficiency"; field: "minor" | "major"; amount: number } & ConditionalSheetModifier);

/** Custo declarativo de uma Feature que permanece ativa na ficha. */
export type FeatureActivationCost =
  | { kind: "resource"; resourceId: string; amount: number | "per-token" }
  | { kind: "game-marker"; sourceDefinitionId: string; markerId: string; amount: number | "per-token" };

/** Como uma Feature ativa cria as fichas que mantém durante a cena. */
export type FeatureActivationTokens = {
  label: string;
  initial:
    | { kind: "fixed"; value: number }
    | { kind: "spellcast-trait" }
    | { kind: "roll"; die: GameMarkerDie; bonus?: number }
    | { kind: "manual"; min?: number; maximumResourceId?: string };
};

/** Modificadores temporários que dependem do tier atual do personagem. */
export type FeatureActivationModifier =
  | { kind: "defense"; fields: Array<keyof Defense>; amount: number }
  | { kind: "defense-per-tier"; fields: Array<"minor" | "major"> };

export type FeatureEffectEndCondition = "scene-end" | "severe-damage" | "short-rest" | "long-rest" | "next-successful-attack";

/**
 * Metadados de uma Feature ativável. A Definition descreve a regra; a ficha
 * guardará o estado temporário da ativação em uma etapa posterior.
 */
export type FeatureActivationDefinition = {
  target?: "self-or-ally";
  label: string;
  costs: FeatureActivationCost[];
  endsOn: FeatureEffectEndCondition[];
  modifiers: FeatureActivationModifier[];
  reminders?: string[];
  /** Fichas consumidas manualmente enquanto o efeito estiver ativo. */
  tokens?: FeatureActivationTokens;
};

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
  source?: { name: string; url: string; version: string; reviewedAt: string };
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
  /** Bônus passivos aplicados automaticamente enquanto a carta está no Loadout. */
  sheetModifiers?: CharacterSheetModifier[];
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

/** Escolha opcional de identidade; a aplicação na ficha será tratada em uma etapa posterior. */
export type TransformationDefinition = BaseDefinition & {
  type: "transformation";
  /** Ilustração opcional, normalmente incorporada ao pack como data URL. */
  image?: string;
  benefit: string;
  drawback: string;
  narrativeQuestions: string[];
  gameMarkers?: GameMarkerDefinition[];
  /** Observações mecânicas que não cabem nos controles atuais da ficha. */
  rulesNotes?: string[];
};

export type FeatureDefinition = BaseDefinition & {
  type: "feature";
  sourceType: "class" | "subclass" | "ancestry" | "community";
  sourceId: string;
  tier: "class" | "hope" | "foundation" | "specialization" | "mastery" | "top" | "bottom" | "community";
  hopeCost?: number;
  gameMarkers?: GameMarkerDefinition[];
  sheetModifiers?: CharacterSheetModifier[];
  activation?: FeatureActivationDefinition;
};

export type Definition = DomainDefinition | CardDefinition | ItemDefinition | ClassDefinition | SubclassDefinition | AncestryDefinition | CommunityDefinition | TransformationDefinition | FeatureDefinition;

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
  /** Effects temporários ativados a partir de Features declaradas pelo Compendium. */
  activeFeatureEffects?: CharacterActiveFeatureEffect[];
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
