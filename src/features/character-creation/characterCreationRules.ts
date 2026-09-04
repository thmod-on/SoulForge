import type { Catalog } from "../../domain/catalog";
import type { AncestryDefinition, Attribute, Character, CharacterSkill, ClassDefinition, CommunityDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import type { CharacterCreationStep } from "./creationFlow";
import { synchronizeCharacterSheetModifiers } from "../player/sheetModifiers";

export type CharacterCreationDraft = {
  name: string;
  community: string;
  communityId?: string;
  classId?: string;
  subclassId?: string;
  ancestryIds: string[];
  topFeatureId?: string;
  bottomFeatureId?: string;
  cardIds: string[];
  attributeValues: Record<Attribute["id"], number>;
  portraitImage?: string;
  experiences: Array<{ name: string; description: string }>;
};

export type CharacterCreationFallback = {
  classDefinition: ClassDefinition;
  subclassDefinition: SubclassDefinition;
  skills: CharacterSkill[];
};

export function getCreationClasses(catalog: Catalog, fallback: CharacterCreationFallback): ClassDefinition[] {
  return catalog.classes.length ? catalog.classes : [fallback.classDefinition];
}

export function getCreationSubclasses(catalog: Catalog, classId: string, fallback: CharacterCreationFallback): SubclassDefinition[] {
  const subclasses = catalog.subclasses.filter((subclass) => subclass.classId === classId);
  return subclasses.length ? subclasses : classId === fallback.classDefinition.id ? [fallback.subclassDefinition] : [];
}

export function getCreationAncestries(catalog: Catalog): AncestryDefinition[] {
  return [...catalog.ancestries].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export function getCreationCommunities(catalog: Catalog): CommunityDefinition[] {
  return [...catalog.communities].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export function hasValidCreationAttributes(values: Record<Attribute["id"], number>): boolean {
  return Object.values(values).sort((left, right) => left - right).join(",") === "-1,0,0,1,1,2";
}

export function validateCreationStep(step: CharacterCreationStep, draft: CharacterCreationDraft, catalog: Catalog, _fallback: CharacterCreationFallback): string | undefined {
  if (step === 1 && !draft.name.trim()) return "Informe o nome do personagem.";
  if (step === 2 && (draft.ancestryIds.length < 1 || draft.ancestryIds.length > 2)) return "Escolha uma ou duas ancestralidades.";
  if (step === 3) {
    if (!draft.topFeatureId || !draft.bottomFeatureId) return "Defina as Features Top e Bottom.";
    const ancestries = draft.ancestryIds.slice(0, 2).map((id) => catalog.ancestries.find((entry) => entry.id === id)).filter((entry): entry is AncestryDefinition => Boolean(entry));
    const topOrigin = ancestries.find((entry) => entry.topFeatureId === draft.topFeatureId);
    const bottomOrigin = ancestries.find((entry) => entry.bottomFeatureId === draft.bottomFeatureId);
    if (ancestries.length === 2 && topOrigin?.id === bottomOrigin?.id) return "Em uma ancestralidade mista, escolha a Feature Top e a Bottom de origens diferentes.";
  }
  if (step === 4 && (!draft.communityId || !catalog.communities.some((community) => community.id === draft.communityId))) return "Escolha uma comunidade.";
  if (step === 5 && (!draft.classId || !draft.subclassId)) return "Escolha uma classe e uma subclasse.";
  if (step === 6 && !hasValidCreationAttributes(draft.attributeValues)) return "Distribua uma vez cada valor: +2, +1, +1, +0, +0 e −1.";
  if (step === 7 && draft.cardIds.length !== 2) return "Escolha exatamente duas cartas de Domínio de nível 1.";
  if (step === 8 && !hasValidStartingExperiences(draft.experiences)) return "Defina duas Experiências diferentes para o personagem.";
  return undefined;
}

export function buildCharacterFromDraft(draft: CharacterCreationDraft, catalog: Catalog, fallback: CharacterCreationFallback): Character | Error {
  const classes = getCreationClasses(catalog, fallback);
  const classDefinition = classes.find((entry) => entry.id === draft.classId);
  const subclassDefinition = classDefinition ? getCreationSubclasses(catalog, classDefinition.id, fallback).find((entry) => entry.id === draft.subclassId) : undefined;
  const ancestries = draft.ancestryIds.slice(0, 2).map((id) => catalog.ancestries.find((entry) => entry.id === id)).filter((entry): entry is AncestryDefinition => Boolean(entry));
  const community = catalog.communities.find((entry) => entry.id === draft.communityId);
  const communityFeature = community ? catalog.features.find((entry) => entry.id === community.featureId && entry.sourceType === "community" && entry.sourceId === community.id) : undefined;
  const validTop = ancestries.some((entry) => entry.topFeatureId === draft.topFeatureId);
  const validBottom = ancestries.some((entry) => entry.bottomFeatureId === draft.bottomFeatureId);
  const topOrigin = ancestries.find((entry) => entry.topFeatureId === draft.topFeatureId);
  const bottomOrigin = ancestries.find((entry) => entry.bottomFeatureId === draft.bottomFeatureId);
  const hasValidMixedAncestryFeatures = ancestries.length !== 2 || topOrigin?.id !== bottomOrigin?.id;
  const cards = classDefinition ? draft.cardIds.filter((id) => catalog.cards.some((card) => card.id === id && card.tier === 1 && classDefinition.domainIds.includes(card.domainId))) : [];
  const experiences = draft.experiences.map((entry) => ({ ...entry, name: entry.name.trim(), description: entry.description.trim() }));
  if (!draft.name.trim() || !community || !communityFeature || !classDefinition || !subclassDefinition || ancestries.length !== draft.ancestryIds.length || !ancestries.length || !validTop || !validBottom || !hasValidMixedAncestryFeatures || !hasValidCreationAttributes(draft.attributeValues) || cards.length !== 2 || !hasValidStartingExperiences(experiences)) {
    return new Error("Complete a ficha, escolha duas cartas de Domínio e defina duas Experiências diferentes.");
  }
  const features = catalog.features;
  const subclassSkills = getSubclassSkills(subclassDefinition, features);
  const skills = subclassSkills.length ? subclassSkills : subclassDefinition.id === fallback.subclassDefinition.id ? fallback.skills.filter((skill) => skill.source === "class") : [];
  const hp = classDefinition.startingHitPoints;
  const character: Character = {
    id: `character.local.${crypto.randomUUID()}`,
    identity: { name: draft.name.trim(), ancestry: ancestries.map((entry) => entry.name).join(" + "), primaryAncestryId: ancestries[0].id, ancestryIds: draft.ancestryIds.slice(0, 2), ancestryFeatureIds: { top: draft.topFeatureId, bottom: draft.bottomFeatureId }, className: classDefinition.name, primaryClassId: classDefinition.id, subclassName: subclassDefinition.name, primarySubclassId: subclassDefinition.id, primaryDomainIds: classDefinition.domainIds, community: draft.community.trim(), primaryCommunityId: community.id, level: 1, xp: 0, nextLevelXp: 10, quote: "", portraitImage: draft.portraitImage },
    attributes: [{ id: "dex", label: "AGI", value: draft.attributeValues.dex, baseValue: draft.attributeValues.dex }, { id: "for", label: "FOR", value: draft.attributeValues.for, baseValue: draft.attributeValues.for }, { id: "cha", label: "FIN", value: draft.attributeValues.cha, baseValue: draft.attributeValues.cha }, { id: "wil", label: "INS", value: draft.attributeValues.wil, baseValue: draft.attributeValues.wil }, { id: "con", label: "PRE", value: draft.attributeValues.con, baseValue: draft.attributeValues.con }, { id: "int", label: "CON", value: draft.attributeValues.int, baseValue: draft.attributeValues.int }],
    defense: { evasion: classDefinition.startingEvasion, armor: 0, minor: 0, major: 0 }, baseDefense: { evasion: classDefinition.startingEvasion, armor: 0, minor: 0, major: 0 }, proficiency: 1,
    progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation"], advancementSelections: [], history: [] },
    resources: [{ id: "hp", label: "PV", value: 0, max: hp, baseMax: hp, tone: "hp" }, { id: "stress", label: "Estresse", value: 0, max: 6, baseMax: 6, tone: "stress" }, { id: "armor-slots", label: "Armadura", value: 0, max: 0, baseMax: 0, tone: "focus" }, { id: "hope", label: "Esperanca", value: 0, max: 6, baseMax: 6, tone: "hope" }],
    skills: [...skills, { id: communityFeature.id, name: communityFeature.name, source: "community", description: communityFeature.summary }], experiences: experiences.map((entry) => ({ id: `experience.local.${crypto.randomUUID()}`, name: entry.name, value: 2, description: entry.description || undefined })), notes: [],
    deck: { activeCardIds: cards, learnedCardIds: cards }, inventory: { capacity: 30, compartments: [{ id: "equipped", name: "Equipados", source: "character" }, { id: "backpack", name: "Mochila", capacity: 30, source: "character" }], entries: [] }
  };
  return synchronizeCharacterSheetModifiers(character, catalog);
}

function hasValidStartingExperiences(experiences: Array<{ name: string }>): boolean {
  const names = experiences.map((entry) => entry.name.trim());
  return names.length === 2 && names.every(Boolean) && new Set(names.map((name) => name.toLocaleLowerCase("pt-BR"))).size === 2;
}

export function getSubclassSkills(subclass: SubclassDefinition, features: FeatureDefinition[]): CharacterSkill[] {
  return ([
    ["foundation", subclass.foundationFeatureIds], ["specialized", subclass.specializationFeatureIds], ["mastery", subclass.masteryFeatureIds]
  ] as const).flatMap(([tier, ids]) => ids.flatMap((id) => {
    const feature = features.find((entry) => entry.id === id);
    return feature ? [{ id: feature.id, name: feature.name, source: "class" as const, tier, description: feature.summary }] : [];
  }));
}
