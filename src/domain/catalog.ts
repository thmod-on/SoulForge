import type {
  AncestryDefinition,
  CommunityDefinition,
  CardDefinition,
  ClassDefinition,
  Definition,
  DomainDefinition,
  FeatureDefinition,
  ItemDefinition,
  PackManifest,
  SubclassDefinition
} from "./types";

export type Catalog = {
  packs: PackManifest[];
  definitions: Definition[];
  domains: DomainDefinition[];
  cards: CardDefinition[];
  classes: ClassDefinition[];
  ancestries: AncestryDefinition[];
  communities: CommunityDefinition[];
  subclasses: SubclassDefinition[];
  features: FeatureDefinition[];
  items: ItemDefinition[];
};

export function createCatalog(packs: PackManifest[], definitions: Definition[]): Catalog {
  return {
    packs,
    definitions,
    domains: definitions.filter((definition): definition is DomainDefinition => definition.type === "domain"),
    cards: definitions.filter((definition): definition is CardDefinition => definition.type === "card"),
    classes: definitions.filter((definition): definition is ClassDefinition => definition.type === "class"),
    ancestries: definitions.filter((definition): definition is AncestryDefinition => definition.type === "ancestry"),
    communities: definitions.filter((definition): definition is CommunityDefinition => definition.type === "community"),
    subclasses: definitions.filter((definition): definition is SubclassDefinition => definition.type === "subclass"),
    features: definitions.filter((definition): definition is FeatureDefinition => definition.type === "feature"),
    items: definitions.filter((definition): definition is ItemDefinition => definition.type === "item")
  };
}

export function findDefinition(catalog: Catalog, definitionId: string): Definition | undefined {
  return catalog.definitions.find((definition) => definition.id === definitionId);
}

export function findDomain(catalog: Catalog, domainId: string): DomainDefinition | undefined {
  return catalog.domains.find((domain) => domain.id === domainId);
}
