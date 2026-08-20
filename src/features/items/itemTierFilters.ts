import type { ItemDefinition } from "../../domain/types";

export type ItemTierFilter = "todos" | "sem-tier" | `${number}`;

export type ItemTierFilterOption = {
  value: ItemTierFilter;
  label: string;
};

export function getItemTierFilterOptions(items: ItemDefinition[]): ItemTierFilterOption[] {
  const tiers = [...new Set(items.flatMap((item) => typeof item.tier === "number" ? [item.tier] : []))].sort((left, right) => left - right);
  const options: ItemTierFilterOption[] = [{ value: "todos", label: "Todos" }, ...tiers.map((tier) => ({ value: String(tier) as `${number}`, label: String(tier) }))];
  if (items.some((item) => item.tier === undefined)) options.push({ value: "sem-tier", label: "Sem Tier" });
  return options;
}

export function matchesItemTierFilter(item: ItemDefinition, filter: string): boolean {
  if (filter === "todos") return true;
  if (filter === "sem-tier") return item.tier === undefined;
  return item.tier === Number(filter);
}
