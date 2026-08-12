import type { CharacterMulticlass, ItemDefinition, PackBundle, PackManifest, ProgressionAdvanceKind } from "../domain/types";

export type Page = "overview" | "skills" | "inventory" | "progression" | "notes" | "compendium" | "settings" | "storedCards";
export type InventoryFilter = "todos" | ItemDefinition["category"];
export type ProgressionTierNumber = 2 | 3 | 4;
export type SettingsSection = "general" | "localData" | "loadRules" | "appearance" | "progression";
export type CompendiumView = "index" | "cards" | "domains" | "items" | "classes" | "ancestries";
export type CompendiumSpread = 1 | 2 | 3;
export type ProgressionPicker = "attributes" | "experiences";

export type ProgressionDraftChoice = {
  kind: ProgressionAdvanceKind;
  tier: ProgressionTierNumber;
  label: string;
  attributeIds?: string[];
  experienceIds?: string[];
  cardId?: string;
  multiclass?: CharacterMulticlass;
};

export type ProgressionMulticlassDraft = Partial<Pick<CharacterMulticlass, "classId" | "domainId" | "featureId" | "subclassId" | "foundationFeatureId">>;

export type SettingsViewState = {
  installedPacks: PackManifest[];
  openSettingsSections: Record<SettingsSection, boolean>;
  packImportOpen: boolean;
  pendingPackBundle?: PackBundle;
  packImportError?: string;
  deletingInstalledPackId?: string;
};
