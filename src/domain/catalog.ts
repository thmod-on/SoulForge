import type {
  CardDefinition,
  Definition,
  DomainDefinition,
  ItemDefinition,
  PackManifest
} from "./types";

export type Catalog = {
  packs: PackManifest[];
  definitions: Definition[];
  domains: DomainDefinition[];
  cards: CardDefinition[];
  items: ItemDefinition[];
};

export function createCatalog(packs: PackManifest[], definitions: Definition[]): Catalog {
  return {
    packs,
    definitions,
    domains: definitions.filter((definition): definition is DomainDefinition => definition.type === "domain"),
    cards: definitions.filter((definition): definition is CardDefinition => definition.type === "card"),
    items: definitions.filter((definition): definition is ItemDefinition => definition.type === "item")
  };
}

export function findDefinition(catalog: Catalog, definitionId: string): Definition | undefined {
  return catalog.definitions.find((definition) => definition.id === definitionId);
}

export function findDomain(catalog: Catalog, domainId: string): DomainDefinition | undefined {
  return catalog.domains.find((domain) => domain.id === domainId);
}
