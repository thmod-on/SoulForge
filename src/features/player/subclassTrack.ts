import type { Catalog } from "../../domain/catalog";
import type { Character, CharacterSkill } from "../../domain/types";
import { getSubclassSkills } from "../character-creation/characterCreationRules";

/** Lê as features atuais da subclasse instalada, sem depender da cópia histórica da ficha. */
export function getSubclassStageSkills(character: Character, catalog: Catalog, tier: NonNullable<CharacterSkill["tier"]>): CharacterSkill[] {
  const subclass = catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId);
  const skills = subclass ? getSubclassSkills(subclass, catalog.features) : character.skills.filter((entry) => entry.source === "class");
  return skills.filter((entry) => entry.tier === tier);
}
