import type { ClassDefinition } from "../../domain/types";

const originalNames: Record<string, string> = {
  "class.core.bardo": "Bard", "class.core.druida": "Druid", "class.core.guardiao": "Guardian",
  "class.core.ranger": "Ranger", "class.core.ladino": "Rogue", "class.core.serafim": "Seraph",
  "class.core.feiticeiro": "Sorcerer", "class.core.guerreiro": "Warrior", "class.core.mago": "Wizard",
  "class.hope-fear.assassin": "Assassin", "class.hope-fear.brawler": "Brawler",
  "class.hope-fear.warlock": "Warlock", "class.hope-fear.witch": "Witch"
};

export function getOriginalClassName(classId: string): string | undefined {
  return originalNames[classId];
}

export function getClassDisplayName(definition: Pick<ClassDefinition, "id" | "name">): string {
  const original = getOriginalClassName(definition.id);
  return original ? `${definition.name} (${original})` : definition.name;
}
