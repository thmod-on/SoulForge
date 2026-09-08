import { baseCatalog } from "./content/installedPacks";
import packageJson from "../package.json";
import { syncScrollAffordances } from "./app/scrollAffordance";
import { readLocalImage } from "./app/media";
import { getSpellcastAttributeId } from "./content/spellcastAttributes";
import { applyCardContentDefaults } from "./content/cardArtwork";
import { createCatalog, findDefinition, findDomain } from "./domain/catalog";
import { demoCharacter } from "./domain/demoCharacter";
import type { Attribute, CardDefinition, Character, ClassDefinition, ItemDefinition, PackBundle, PackManifest, ProgressionAdvanceKind, SubclassDefinition } from "./domain/types";
import { deleteCharacter as deleteStoredCharacter, ensureDemoCharacter, ensureDemoKaelII, listCharacters, loadCharacter, saveCharacter as persistCharacter } from "./storage/characterRepository";
import { getActiveGameMarkers, synchronizeGameMarkers } from "./features/game-markers/gameMarkerSync";
import { handleGameMarkerAction } from "./features/game-markers/gameMarkerActions";
import { renderGameMarkerDiceDialog } from "./features/game-markers/renderDiceDialog";
import { handleStoredDiceAction, renderStoredDiceDialog, type StoredDiceDialogState } from "./features/game-markers/storedDice";
import { deleteCustomDefinition, loadCardMarkerOverrides, loadCustomDefinitions, saveCardMarkerOverride, saveCustomDefinition, type CardMarkerOverride } from "./storage/compendiumRepository";
import { loadInstalledPacks } from "./storage/packRepository";
import { renderSettings as renderSettingsPage } from "./features/settings/renderSettings";
import { getPackDisplayDescription, getPackDisplayName, getPackOriginName } from "./features/compendium/packPresentation";
import { renderCompendiumIndex as renderCompendiumIndexView } from "./features/compendium/renderCompendiumIndex";
import { getOriginalClassName } from "./features/compendium/classPresentation";
import { getTierForLevel, progressionAdvanceLabels } from "./features/progression/progressionRules";
import { buildMulticlassChoice, canChooseMulticlass, getEligibleMulticlassClasses } from "./features/progression/multiclassRules";
import { addProgressionChoice, applyProgression, getAdvanceSlotsUsed, getNextSubclassAdvance, getPrimaryDomainIds, getProgression, getProgressionCardCandidates, getProgressionChoiceCount, requiresTierExperience } from "./features/progression/progressionActions";
import { nextCharacterCreationStep, previousCharacterCreationStep, type CharacterCreationStep } from "./features/character-creation/creationFlow";
import { buildCharacterFromDraft, getCreationClasses } from "./features/character-creation/characterCreationRules";
import { closeCharacterCreation, getCharacterCreationDraft, openCharacterCreation, selectCharacterCreationClass, selectCharacterCreationTopFeature, syncCharacterCreationDraftFromForm, toggleCharacterCreationAncestry, toggleCharacterCreationCard, validateCharacterCreationState } from "./features/character-creation/characterCreationState";
import { renderCharacterCreationModal as renderCharacterCreationModalView, type CharacterCreationRenderDependencies } from "./features/character-creation/renderCharacterCreation";
import { renderCharacterCreationInPlace as renderCharacterCreationSurface } from "./features/character-creation/renderInPlace";
import { createEmptyCreationAttributeValues, handleCreationAttributeAllocation } from "./features/character-creation/attributeAllocation";
import { handleCommunityAction, renderCompendiumCommunityFormModal, renderCompendiumCommunitiesManager as renderCompendiumCommunitiesManagerView } from "./features/compendium/communities";
import { handleTransformationAction, renderTransformationFormModal, renderCompendiumTransformationsManager as renderCompendiumTransformationsManagerView, renderCompendiumTransformationsSpread as renderCompendiumTransformationsSpreadView, type TransformationFeatureDependencies, type TransformationFeatureState } from "./features/compendium/transformations";
import { handlePackManagementAction, readPackImportFiles, renderPackManagementDialogs, type PackManagementDependencies } from "./features/packs/packManagement";
import { renderCharacterSelection as renderCharacterSelectionView } from "./features/character-selection/renderCharacterSelection";
import { confirmStagedCharacterImport, downloadCharacterExport, renderCharacterImportModal, stageCharacterImport } from "./features/character-transfer/characterTransfer";
import { renderProgression as renderProgressionView, type ProgressionRenderDependencies } from "./features/progression/renderProgression";
import { renderProgressionDialogInPlace, renderProgressionInPlace as renderProgressionSurface } from "./features/progression/renderInPlace";
import { renderProgressionCardPickerModal as renderProgressionCardPickerModalView, renderProgressionHistoryModal as renderProgressionHistoryModalView, renderProgressionPickerModal as renderProgressionPickerModalView, renderProgressionMulticlassModal as renderProgressionMulticlassModalView, renderTierExperienceModal as renderTierExperienceModalView, type ProgressionDialogDependencies } from "./features/progression/renderProgressionDialogs";
import {
  renderProgressionAdvanceSummary as renderProgressionAdvanceSummaryView,
  renderProgressionDomainStep as renderProgressionDomainStepView,
  renderProgressionOptions as renderProgressionOptionsView,
  renderProgressionReview as renderProgressionReviewView,
  renderTierExperienceStep as renderTierExperienceStepView,
  type ProgressionWorkspaceDependencies
} from "./features/progression/renderProgressionWorkspace";
import { advanceProgressionFlow, goBackInProgressionFlow } from "./features/progression/progressionFlow";
import { handleProgressionCardPickerAction } from "./features/progression/cardPickerActions";
import {
  renderDeleteNoteModal as renderDeleteNoteModalView,
  renderNoteModal as renderNoteModalView,
  renderNotes as renderNotesView,
  renderViewNoteModal as renderViewNoteModalView,
  type NotesRenderDependencies
} from "./features/notes/renderNotes";
import { handleNoteAction, handleNoteEscape } from "./features/notes/noteActions";
import {
  renderAddItemToContainerModal as renderAddItemToContainerModalView,
  renderDeleteItemModal as renderDeleteItemModalView,
  renderInventory as renderInventoryView,
  renderItemModal as renderItemModalView,
  renderItemVisual as renderItemVisualView,
  type InventoryRenderDependencies
} from "./features/inventory/renderInventory";
import {
  addItemToContainer as addItemToContainerAction,
  createInventoryContainer as createInventoryContainerAction,
  deleteInventoryContainer as deleteInventoryContainerAction,
  deleteInventoryItem as deleteInventoryItemAction,
  mergeInventoryStacks as mergeInventoryStacksAction,
  moveItemToCompartment as moveItemToCompartmentAction,
  prepareDeleteInventoryItem as prepareDeleteInventoryItemAction,
  splitInventoryItem as splitInventoryItemAction,
  type InventoryActionDependencies
} from "./features/inventory/inventoryActions";
import { canAddItemToCompartment, canCompartmentAcceptItem, getCompartmentWeight, getEntryCompartmentId, getInventoryCompartments, getInventoryItemEntries, wouldFitCompartment } from "./features/inventory/inventoryModel";
import { renderContainerDialogs } from "./features/inventory/renderContainerDialogs";
import {
  bindInventoryDragEvents,
  consumeInventoryDragClickSuppression,
  type InventoryDragDependencies
} from "./features/inventory/bindInventoryDrag";
import { getEffectiveDefense, synchronizeArmorResource } from "./features/inventory/combatModifiers";
import { getActiveSheetModifierEffects, synchronizeCharacterSheetModifiers } from "./features/player/sheetModifiers";
import { getActiveFeatureEffectDefenseModifiers, getActiveFeatureEffects, getFeatureActivationForCharacter } from "./features/feature-effects/featureEffects";
import { handleFeatureEffectAction, renderFeatureTokenActivationDialog, type FeatureTokenActivationDialogState } from "./features/feature-effects/featureTokenActivation";
import { renderCharacterIdentityModal as renderCharacterIdentityModalView } from "./features/character-identity/renderCharacterIdentityModal";
import { getSubclassStageSkills } from "./features/player/subclassTrack";
import type { RestKind, RestMoveChoice } from "./features/rest/restRules";
import { renderRestModal as renderRestModalView } from "./features/rest/renderRest";
import { handleRestAction, handleRestRollInput } from "./features/rest/restActions";
import {
  renderEditorHeader as renderEditorHeaderView,
  renderResourceIndicator as renderResourceIndicatorView,
  renderResources as renderResourcesView,
  renderSidebar as renderSidebarView,
  renderTopbar as renderTopbarView,
  type PlayerShellDependencies
} from "./features/player/renderPlayerShell";
import {
  renderOverview as renderOverviewView,
  renderStoredCards as renderStoredCardsView,
  type PlayerOverviewDependencies
} from "./features/player/renderPlayerOverview";
import { renderTraits as renderTraitsView } from "./features/player/renderTraits";
import {
  removeCompendiumDomain as removeCompendiumDomainAction,
  renderCompendiumDomainsManager as renderCompendiumDomainsManagerView,
  renderDeleteDomainModal as renderDeleteDomainModalView,
  renderDomainModal as renderDomainModalView,
  saveCompendiumDomain as saveCompendiumDomainAction,
  type DomainFeatureDependencies
} from "./features/compendium/domains";
import {
  removeCompendiumCard as removeCompendiumCardAction,
  renderCardModal as renderCardModalView,
  renderCompendiumCardFormModal as renderCompendiumCardFormModalView,
  renderCompendiumCardsManager as renderCompendiumCardsManagerView,
  renderDeleteCompendiumCardModal as renderDeleteCompendiumCardModalView,
  savePackCardMarkerOverride as savePackCardMarkerOverrideAction,
  saveCompendiumCard as saveCompendiumCardAction,
  type CardFeatureDependencies
} from "./features/compendium/cards";
import { readGameMarker, renderGameMarkerFields } from "./features/compendium/gameMarkerForm";
import {
  removeCompendiumItem as removeCompendiumItemAction,
  renderCompendiumItemFormModal as renderCompendiumItemFormModalView,
  renderCompendiumItemPreviewModal as renderCompendiumItemPreviewModalView,
  renderCompendiumItemsManager as renderCompendiumItemsManagerView,
  renderDeleteCompendiumItemModal as renderDeleteCompendiumItemModalView,
  saveCompendiumItem as saveCompendiumItemAction,
  type ItemFeatureDependencies
} from "./features/compendium/items";
import {
  removeCompendiumClass as removeCompendiumClassAction,
  renderCompendiumClassFormModal as renderCompendiumClassFormModalView,
  renderCompendiumClassesManager as renderCompendiumClassesManagerView,
  renderCompendiumClassPreviewModal as renderCompendiumClassPreviewModalView,
  renderDeleteCompendiumClassModal as renderDeleteCompendiumClassModalView,
  saveCompendiumClass as saveCompendiumClassAction,
  type ClassFeatureDependencies
} from "./features/compendium/classes";
import {
  handleAncestryAction,
  removeCompendiumAncestry as removeCompendiumAncestryAction,
  renderCompendiumAncestriesManager as renderCompendiumAncestriesManagerView,
  renderCompendiumAncestryFormModal as renderCompendiumAncestryFormModalView,
  renderDeleteCompendiumAncestryModal as renderDeleteCompendiumAncestryModalView,
  saveCompendiumAncestry as saveCompendiumAncestryAction,
  type AncestryFeatureDependencies
} from "./features/compendium/ancestries";
import type { CompendiumSpread, CompendiumView, InventoryFilter, Page, ProgressionDraftChoice, ProgressionFlowStep, ProgressionMulticlassDraft, ProgressionPicker, ProgressionTierNumber, SettingsSection } from "./app/types";
import { editorNavigation as sideNavItems, isEditorPage, playerNavigation as topNavItems } from "./app/navigation";
import "./styles.css";
function getAppRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");

  if (!element) {
    throw new Error("App root not found.");
  }

  return element;
}

const appRoot = getAppRoot();
let catalog = baseCatalog;
let cardMarkerOverrides: CardMarkerOverride[] = [];
let modalBackdropPointerDown = false;
let shouldAnimateCharacterCreationModal = false;

/** Centraliza a persistencia para que todo personagem salvo mantenha os marcadores sincronizados. */
async function saveCharacter(character: Character): Promise<void> {
  const withSynchronizedArmor = synchronizeArmorResource(character, getItemDefinition);
  const withSynchronizedSheet = synchronizeCharacterSheetModifiers(withSynchronizedArmor, catalog);
  const synchronized = synchronizeGameMarkers(withSynchronizedSheet, catalog);
  if (synchronized !== character) {
    Object.assign(character, synchronized);
  }
  await persistCharacter(synchronized);
}

const state: {
  page: Page;
  inventoryFilter: InventoryFilter;
  inventorySearch: string;
  compendiumView: CompendiumView;
  compendiumSpread: CompendiumSpread;
  compendiumCardSearch: string;
  compendiumDomainFilter: string;
  compendiumTierFilter: string;
  compendiumItemSearch: string;
  compendiumItemFilter: InventoryFilter; compendiumItemTierFilter: string;
  compendiumAncestrySearch: string;
  compendiumCommunitySearch: string;
  compendiumCommunityPackId: string;
  transformationState: TransformationFeatureState;
  lastPlayerPage: Page;
  selectedItemId?: string;
  selectedCardId: string;
  featureActivationError?: string;
  featureTokenActivation?: FeatureTokenActivationDialogState;
  progressionStep: ProgressionFlowStep;
  modalCardId?: string;
  resourceModalId?: string;
  addResourceModalOpen: boolean;
  progressionHistoryOpen: boolean;
  progressionPicker?: ProgressionPicker;
  progressionPickerTier?: ProgressionTierNumber;
  progressionPickerIds: string[];
  progressionDraft: ProgressionDraftChoice[];
  progressionError?: string;
  progressionCompletionLevel?: number;
  progressionCardPickerMode?: "mandatory" | "advance";
  progressionCardTierFilter: "todos" | number; progressionCardDomainFilter?: string;
  progressionCardPickerTier?: ProgressionTierNumber;
  progressionCardId?: string; progressionCardPickerSelectionId?: string; progressionCardPickerScrollTop?: number;
  progressionTierExperienceOpen: boolean;
  progressionTierExperience?: { name: string; description: string };
  progressionTierExperienceError?: string;
  progressionMulticlassOpen: boolean;
  progressionMulticlassTier?: ProgressionTierNumber;
  progressionMulticlassDraft: ProgressionMulticlassDraft;
  addContainerOpen: boolean;
  deleteContainerId?: string;
  deletingItemId?: string;
  deletingItemQuantity?: number;
  noteModalOpen: boolean;
  editingNoteId?: string;
  viewingNoteId?: string;
  deletingNoteId?: string;
  domainModalOpen: boolean;
  editingDomainId?: string;
  deletingDomainId?: string;
  cardModalOpen: boolean;
  editingCompendiumCardId?: string;
  deletingCompendiumCardId?: string;
  itemDefinitionModalOpen: boolean;
  editingCompendiumItemId?: string;
  deletingCompendiumItemId?: string;
  compendiumItemPreviewId?: string;
  compendiumClassPreviewId?: string;
  activatingStoredCardId?: string;
  cardActivationError?: string;
  addItemToCompartmentId?: string;
  addingDefinitionItemId?: string;
  addItemCatalogFilter: InventoryFilter; addItemCatalogTierFilter: string; addItemCatalogSearch: string; addItemPreviewDefinitionId?: string; addItemCatalogScrollTop?: number;
  addItemError?: string;
  classModalOpen: boolean;
  ancestryModalOpen: boolean;
  communityModalOpen: boolean; editingCompendiumCommunityId?: string; deletingCompendiumCommunityId?: string;
  editingCompendiumAncestryId?: string;
  deletingCompendiumAncestryId?: string;
  compendiumAncestryPreviewId?: string;
  compendiumCommunityPreviewId?: string;
  characterSelectionOpen: boolean;
  deletingCharacterId?: string;
  characterPortraitModalOpen: boolean;
  characterPortraitPreviewOpen: boolean;
  characterIdentityModalSection?: "character" | "class" | "ancestry" | "community";
  gameMarkerDieDialog?: { markerKey: string; dieId: string; mode: "result" | "consume" };
  storedDiceDialog?: StoredDiceDialogState;
  restDialogKind?: RestKind;
  restChoices: RestMoveChoice[];
  restError?: string;
  characterCreationOpen: boolean;
  characterCreationStep: CharacterCreationStep;
  characterCreationName: string;
  characterCreationCommunity: string; characterCreationCommunityId?: string;
  characterCreationCommunitySearch: string;
  characterCreationCommunityPackId: string;
  characterCreationClassId?: string;
  characterCreationSubclassId?: string;
  characterCreationAncestryIds: string[];
  characterCreationAncestrySearch: string;
  characterCreationCardIds: string[];
  characterCreationCardDomainId?: string; characterCreationFocusedCardId?: string;
  characterCreationExperiences: Array<{ name: string; description: string }>;
  characterCreationAttributeValues: Record<Attribute["id"], number>;
  characterCreationSelectedAttributeValue?: number;
  characterCreationPortraitImage?: string;
  characterCreationTopFeatureId?: string;
  characterCreationBottomFeatureId?: string;
  characterCreationError?: string;
  characters: Character[];
  editingCompendiumClassId?: string;
  deletingCompendiumClassId?: string;
  installedPacks: PackManifest[];
  packImportOpen: boolean;
  pendingPackBundles?: PackBundle[];
  packImportError?: string;
  removeAllInstalledPacksOpen: boolean;
  removeAllInstalledPacksError?: string;
  characterImportOpen: boolean;
  pendingCharacterImport?: Character;
  characterImportError?: string;
  deletingInstalledPackId?: string;
  openSettingsSections: Record<SettingsSection, boolean>;
  character?: Character;
} = {
  page: "overview",
  inventoryFilter: "todos",
  inventorySearch: "",
  compendiumView: "index",
  compendiumSpread: 1,
  compendiumCardSearch: "",
  compendiumDomainFilter: "todos",
  compendiumTierFilter: "todos",
  compendiumItemSearch: "",
  compendiumItemFilter: "todos", compendiumItemTierFilter: "todos",
  compendiumAncestrySearch: "",
  compendiumCommunitySearch: "",
  compendiumCommunityPackId: "todos",
  transformationState: { compendiumTransformationSearch: "", transformationModalOpen: false },
  lastPlayerPage: "overview",
  selectedCardId: "card.demo.dread-veil",
  progressionStep: "advances",
  addResourceModalOpen: false,
  progressionHistoryOpen: false,
  progressionPickerIds: [],
  progressionDraft: [],
  progressionCardTierFilter: "todos", progressionCardDomainFilter: undefined,
  progressionTierExperienceOpen: false,
  progressionMulticlassOpen: false,
  progressionMulticlassDraft: {},
  addContainerOpen: false,
  noteModalOpen: false,
  domainModalOpen: false,
  cardModalOpen: false,
  itemDefinitionModalOpen: false,
  addItemCatalogFilter: "todos", addItemCatalogTierFilter: "todos", addItemCatalogSearch: "",
  classModalOpen: false,
  ancestryModalOpen: false,
  communityModalOpen: false,
  characterSelectionOpen: true,
  characterPortraitModalOpen: false,
  characterPortraitPreviewOpen: false,
  restChoices: [],
  characterCreationOpen: false,
  characterCreationStep: 1,
  characterCreationName: "",
  characterCreationCommunity: "", characterCreationCommunityId: undefined,
  characterCreationCommunitySearch: "",
  characterCreationCommunityPackId: "todos",
  characterCreationAncestryIds: [],
  characterCreationAncestrySearch: "",
  characterCreationCardIds: [],
  characterCreationExperiences: [{ name: "", description: "" }, { name: "", description: "" }],
  characterCreationAttributeValues: createEmptyCreationAttributeValues(),
  characterCreationSelectedAttributeValue: undefined,
  characters: [],
  installedPacks: [],
  packImportOpen: false,
  removeAllInstalledPacksOpen: false,
  characterImportOpen: false,
  openSettingsSections: {
    general: true,
    localData: false,
    loadRules: false,
    appearance: false,
    progression: false
  }
};

const appVersion = packageJson.version;

const itemFilterLabels: Record<InventoryFilter, string> = {
  todos: "Tudo",
  arma: "Armas",
  armadura: "Armaduras",
  consumivel: "Consumiveis",
  equipamento: "Equipamentos",
  loot: "Loot"
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function progressPercent(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}

function attributeTitle(label: string): string {
  const labels: Record<string, string> = {
    AGI: "Agilidade",
    FOR: "Forca",
    FIN: "Finesse",
    INS: "Instinto",
    PRE: "Presenca",
    CON: "Conhecimento"
  };

  return labels[label] ?? label;
}

function getItemDefinition(definitionId: string): ItemDefinition | undefined {
  const definition = findDefinition(catalog, definitionId);
  return definition?.type === "item" ? definition : undefined;
}

function getActiveCards(character: Character): CardDefinition[] {
  return character.deck.activeCardIds
    .map((cardId) => findDefinition(catalog, cardId))
    .filter((definition): definition is CardDefinition => definition?.type === "card");
}

function getInactiveCardCount(character: Character): number {
  const learnedCardIds = character.deck.learnedCardIds ?? character.deck.activeCardIds;
  const activeCardIds = new Set(character.deck.activeCardIds);

  return learnedCardIds.filter((cardId) => !activeCardIds.has(cardId)).length;
}

function getStoredCards(character: Character): CardDefinition[] {
  const activeCardIds = new Set(character.deck.activeCardIds);
  const learnedCardIds = character.deck.learnedCardIds ?? character.deck.activeCardIds;

  return learnedCardIds
    .filter((cardId) => !activeCardIds.has(cardId))
    .map((cardId) => findDefinition(catalog, cardId))
    .filter((definition): definition is CardDefinition => definition?.type === "card");
}

function getPlayerShellDependencies(): PlayerShellDependencies {
  return {
    state,
    appVersion,
    topNavigation: topNavItems,
    editorNavigation: sideNavItems,
    escapeHtml,
    attributeTitle,
    progressPercent,
    getSpellcastAttributeId: (character) => getSpellcastAttributeId(character.identity.primarySubclassId, catalog.subclasses.find((subclass) => subclass.id === character.identity.primarySubclassId)),
    getCommunityName: (character) => catalog.communities.find((community) => community.id === character.identity.primaryCommunityId)?.name ?? (character.identity.community || "Não definida"),
    getEffectiveDefense: (character) => getEffectiveDefense(character, (definitionId) => {
      const definition = findDefinition(catalog, definitionId);
      return definition?.type === "item" ? definition : undefined;
    }, getActiveFeatureEffectDefenseModifiers(character, catalog))
  };
}

function getPlayerOverviewDependencies(): PlayerOverviewDependencies {
  return {
    escapeHtml,
    renderResources: (character) => renderResourcesView(character, getPlayerShellDependencies()),
    renderEmptyInline,
    getActiveCards, getInactiveCardCount, getStoredCards,
    getDomainInfo: (domainId) => {
      const domain = findDomain(catalog, domainId);
      return domain ? { name: domain.name, color: domain.color } : undefined;
    },
    getAcquiredSubclassTiers: (character) => getProgression(character).acquiredSubclassTiers,
    getActiveFeatureEffects: (character) => getActiveFeatureEffects(character, catalog),
    getActiveSheetModifierEffects: (character) => getActiveSheetModifierEffects(character, catalog),
    getFeatureActivation: (character, featureId) => getFeatureActivationForCharacter(character, catalog, featureId),
    featureActivationError: state.featureActivationError,
    getActiveGameMarkers: (character) => getActiveGameMarkers(character, catalog), getSubclassStageSkills: (character, tier) => getSubclassStageSkills(character, catalog, tier), modalCardId: state.modalCardId
  };
}

function getDomainFeatureDependencies(): DomainFeatureDependencies {
  return {
    state,
    catalog,
    escapeHtml,
    getPackOriginName: (packId) => getPackOriginName(packId, catalog.packs),
    saveCustomDefinition,
    deleteCustomDefinition,
    refreshCatalog,
    render
  };
}

function getCardFeatureDependencies(): CardFeatureDependencies {
  return {
    state,
    catalog,
    escapeHtml,
    renderEmptyInline,
    saveCustomDefinition,
    saveCardMarkerOverride,
    deleteCustomDefinition,
    refreshCatalog,
    render
  };
}

function getItemFeatureDependencies(): ItemFeatureDependencies {
  return {
    state,
    catalog,
    itemFilterLabels,
    escapeHtml,
    renderEmptyInline,
    renderItemVisual: (item, variant) => renderItemVisualView(item, variant, escapeHtml),
    saveCustomDefinition,
    deleteCustomDefinition,
    refreshCatalog,
    render
  };
}

function getClassFeatureDependencies(): ClassFeatureDependencies {
  return {
    state,
    catalog,
    escapeHtml,
    renderEmptyInline,
    saveCustomDefinition: async (definition) => {
      if (definition.type === "class") {
        const marker = readGameMarker("class");
        if (!(marker instanceof Error) && marker) {
          await saveCustomDefinition({ ...definition, gameMarkers: [marker] });
          return;
        }
      }
      await saveCustomDefinition(definition);
    },
    deleteCustomDefinition,
    refreshCatalog,
    render
  };
}

function getAncestryFeatureDependencies(): AncestryFeatureDependencies {
  return {
    state,
    catalog,
    escapeHtml,
    renderEmptyInline,
    getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs),
    saveCustomDefinition,
    deleteCustomDefinition,
    refreshCatalog,
    render
  };
}

function getTransformationFeatureDependencies(): TransformationFeatureDependencies { return { state: state.transformationState, catalog, escapeHtml, getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs), saveCustomDefinition, deleteCustomDefinition, refreshCatalog, render: () => render({ preserveMainScroll: true }) }; }

function renderSettings(character: Character): string {
  return renderSettingsPage({
    character,
    appVersion,
    state,
    hasActiveCharacter: Boolean(state.character),
    escapeHtml,
    getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs),
    getPackDisplayDescription
  });
}

function getPackManagementDependencies(): PackManagementDependencies {
  return {
    state,
    getCatalog: () => catalog,
    refreshCatalog,
    escapeHtml,
    render: () => render({ preserveMainScroll: true }),
    afterImport: async () => {
      if (state.character?.id !== demoCharacter.id) return;
      await ensureDemoCharacter();
      state.character = await loadCharacter(demoCharacter.id);
      state.characters = await listCharacters();
    }
  };
}

function renderEmptyInline(message: string): string { return `<p class="empty-inline sf-state sf-state--empty sf-state--inline">${escapeHtml(message)}</p>`; }

function getNotesRenderDependencies(): NotesRenderDependencies {
  return { state, escapeHtml, renderEmptyInline };
}

function getProgressionRenderDependencies(): ProgressionRenderDependencies {
  return {
    state,
    escapeHtml,
    requiresTierExperience,
    renderProgressionOptions: (character) => renderProgressionOptionsView(character, getProgressionWorkspaceDependencies()),
    renderProgressionAdvanceSummary: () => renderProgressionAdvanceSummaryView(getProgressionWorkspaceDependencies()),
    renderProgressionDomainStep: (character) => renderProgressionDomainStepView(character, getProgressionWorkspaceDependencies()),
    renderTierExperienceStep: (character) => renderTierExperienceStepView(character, getProgressionWorkspaceDependencies()),
    renderProgressionReview: (character) => renderProgressionReviewView(character, getProgressionWorkspaceDependencies())
  };
}

function getProgressionDialogDependencies(): ProgressionDialogDependencies {
  return {
    state,
    escapeHtml,
    attributeTitle,
    getTierForLevel,
    getProgression,
    getProgressionCardCandidates: (character) => getProgressionCardCandidates(character, catalog, state),
    getPrimaryDomainIds: (character) => getPrimaryDomainIds(character, catalog),
    requiresTierExperience,
    getEligibleMulticlassClasses: (character) => getEligibleMulticlassClasses(character, catalog),
    subclasses: catalog.subclasses,
    features: catalog.features,
    findCard: (cardId) => {
      const definition = findDefinition(catalog, cardId);
      return definition?.type === "card" ? definition : undefined;
    },
    findDomainName: (domainId) => findDomain(catalog, domainId)?.name
  };
}

function getProgressionWorkspaceDependencies(): ProgressionWorkspaceDependencies {
  return {
    state,
    escapeHtml,
    getTierForLevel,
    getProgressionChoiceCount: () => getProgressionChoiceCount(state.progressionDraft),
    getAdvanceSlotsUsed: (character, tier, kind) => getAdvanceSlotsUsed(character, tier, kind, state.progressionDraft),
    getNextSubclassAdvance: (character, tier) => getNextSubclassAdvance(character, tier, state.progressionDraft),
    canChooseMulticlass: (character, tier) => canChooseMulticlass(character, tier, state.progressionDraft),
    getProgressionCardCandidates: (character) => getProgressionCardCandidates(character, catalog, state),
    findCard: (cardId) => {
      const definition = findDefinition(catalog, cardId);
      return definition?.type === "card" ? definition : undefined;
    }
  };
}

function getInventoryRenderDependencies(): InventoryRenderDependencies {
  return {
    state,
    catalog,
    itemFilterLabels,
    escapeHtml,
    progressPercent,
    renderEmptyInline,
    renderResourceIndicator: (resource) => renderResourceIndicatorView(resource, getPlayerShellDependencies()),
    getItemEntries: (character) => getInventoryItemEntries(character, catalog),
    getInventoryCompartments,
    getEntryCompartmentId,
    getCompartmentWeight,
    canCompartmentAcceptItem,
    wouldFitCompartment,
    findDefinition: (activeCatalog, definitionId) => {
      const definition = findDefinition(activeCatalog, definitionId);
      return definition?.type === "item" ? definition : undefined;
    }
  };
}

function getInventoryActionDependencies(): InventoryActionDependencies {
  return {
    state,
    getItemEntries: (character) => getInventoryItemEntries(character, catalog),
    getInventoryCompartments,
    getEntryCompartmentId,
    canCompartmentAcceptItem,
    wouldFitCompartment,
    canAddItemToCompartment,
    findItem: (definitionId) => {
      const definition = findDefinition(catalog, definitionId);
      return definition?.type === "item" ? definition : undefined;
    },
    saveCharacter,
    render
  };
}

function getInventoryDragDependencies(): InventoryDragDependencies {
  return {
    getCharacter: () => state.character,
    getItemEntries: (character) => getInventoryItemEntries(character, catalog),
    getInventoryCompartments,
    getEntryCompartmentId,
    canCompartmentAcceptItem,
    wouldFitCompartment,
    moveItemToCompartment: (entryId, targetCompartmentId) =>
      moveItemToCompartmentAction(entryId, targetCompartmentId, getInventoryActionDependencies()),
    mergeInventoryStacks: (sourceEntryId, targetEntryId) =>
      mergeInventoryStacksAction(sourceEntryId, targetEntryId, getInventoryActionDependencies())
  };
}

function renderCompendium(): string {
  if (state.compendiumView === "cards") {
    return renderCompendiumCardsManagerView(getCardFeatureDependencies());
  }
  if (state.compendiumView === "domains") {
    return renderCompendiumDomainsManagerView(getDomainFeatureDependencies());
  }
  if (state.compendiumView === "items") {
    return renderCompendiumItemsManagerView(getItemFeatureDependencies());
  }
  if (state.compendiumView === "classes") {
    return renderCompendiumClassesManagerView(getClassFeatureDependencies());
  }
  if (state.compendiumView === "ancestries") {
    return renderCompendiumAncestriesManagerView(getAncestryFeatureDependencies());
  }
  if (state.compendiumView === "communities") return renderCompendiumCommunitiesManagerView({ state, catalog, escapeHtml, getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs), saveCustomDefinition, deleteCustomDefinition, refreshCatalog, render });
  if (state.compendiumView === "transformations") return renderCompendiumTransformationsManagerView(getTransformationFeatureDependencies());

  return renderCompendiumIndexView({
    spread: state.compendiumSpread,
    catalog,
    escapeHtml,
    renderTransformationsSpread: (renderChapterCard) => renderCompendiumTransformationsSpreadView(getTransformationFeatureDependencies(), renderChapterCard)
  }) + renderCompendiumCommunityFormModal({ state, catalog, escapeHtml, getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs), saveCustomDefinition, deleteCustomDefinition, refreshCatalog, render }) + renderTransformationFormModal(getTransformationFeatureDependencies());
}

function renderActivateStoredCardModal(): string {
  const character = state.character;
  const definition = state.activatingStoredCardId ? findDefinition(catalog, state.activatingStoredCardId) : undefined;
  if (!character || definition?.type !== "card") {
    return "";
  }
  const activeCards = getActiveCards(character);
  const recallCost = definition.recallCost ?? 0;
  const stress = character.resources.find((resource) => resource.id === "stress");
  const loadoutFull = activeCards.length >= 5;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal card-activation-modal" role="dialog" aria-modal="true" aria-labelledby="activate-card-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar ativação">x</button><span class="resource-modal-label">Vault para Loadout</span><h2 id="activate-card-title">Ativar ${escapeHtml(definition.name)}?</h2><div class="card-activation-frame"><p>Esta carta passará a ficar ativa no Loadout.</p>${loadoutFull ? `<label class="form-field"><span>O Loadout já possui cinco cartas. Escolha uma para guardar *</span><select data-recall-swap-card><option value="">Selecione uma carta ativa</option>${activeCards.map((card) => `<option value="${card.id}">${escapeHtml(card.name)}</option>`).join("")}</select></label>` : ""}<div class="card-activation-options"><button class="card-activation-option" type="button" data-action="activate-stored-card-free"><span><strong>Durante um descanso</strong><small>A troca é gratuita.</small></span><i aria-hidden="true">›</i></button><button class="card-activation-option card-activation-option--immediate" type="button" data-action="activate-stored-card-stress"><span><strong>Agora</strong><small>Marque ${recallCost} Stress.${stress ? ` Disponível: ${stress.value}/${stress.max}.` : ""}</small></span><i aria-hidden="true">›</i></button></div></div>${state.cardActivationError ? `<p class="form-error" data-card-activation-error>${escapeHtml(state.cardActivationError)}</p>` : ""}</section></div>`;
}

const fallbackCharacterClass: ClassDefinition = {
  id: "class.demo.guardian",
  type: "class",
  packId: "demo",
  name: "Guardiao",
  summary: "Defensor firme que protege seus aliados.",
  domainIds: ["domain.core.blade", "domain.core.valor"],
  startingEvasion: 12,
  startingHitPoints: 28,
  featureIds: [],
  hopeFeatureId: "",
  subclassIds: ["subclass.demo.vengeance", "subclass.demo.vengeance"]
};

const fallbackCharacterSubclass: SubclassDefinition = {
  id: "subclass.demo.vengeance",
  type: "subclass",
  packId: "demo",
  name: "Vengeance",
  summary: "Transforme golpes recebidos em retribuicao.",
  classId: fallbackCharacterClass.id,
  foundationFeatureIds: [],
  specializationFeatureIds: [],
  masteryFeatureIds: []
};

function getCharacterCreationClasses(): ClassDefinition[] {
  return getCreationClasses(catalog, { classDefinition: fallbackCharacterClass, subclassDefinition: fallbackCharacterSubclass, skills: demoCharacter.skills });
}

function getCharacterCreationRenderDependencies(): CharacterCreationRenderDependencies {
  return { state, catalog, fallback: getCharacterCreationFallback(), animate: shouldAnimateCharacterCreationModal, escapeHtml };
}

function renderDeleteCharacterModal(): string {
  const character = state.characters.find((entry) => entry.id === state.deletingCharacterId);
  if (!character) return "";

  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-character-title"><h2 id="delete-character-title">Excluir personagem?</h2><p>A ficha de <strong>${escapeHtml(character.identity.name)}</strong>, incluindo inventário, anotações e progresso, será removida deste dispositivo.</p><div class="danger-summary"><strong>!</strong><span>Esta ação não pode ser desfeita.</span></div><div class="confirmation-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="cancel-delete-character">Cancelar</button><button class="sf-action sf-action--danger danger-action" type="button" data-action="confirm-delete-character">Excluir personagem</button></div></section></div>`;
}

function renderAddResourceModal(): string {
  if (!state.addResourceModalOpen) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal resource-create-modal" role="dialog" aria-modal="true" aria-labelledby="add-resource-title"><div class="container-modal-heading"><h2 id="add-resource-title">Novo recurso</h2><button class="modal-close modal-close-inline" type="button" data-modal-close aria-label="Fechar">x</button></div><p>Crie um controle próprio para esta ficha. Ele ficará salvo somente neste personagem.</p><div class="resource-form-grid"><label class="form-field resource-form-wide"><span>Nome *</span><input data-add-resource-label type="text" maxlength="40" placeholder="Ex.: Cargas Arcanas" /></label><label class="form-field"><span>Valor atual *</span><input data-add-resource-value type="number" min="0" value="0" /></label><label class="form-field"><span>Valor máximo *</span><input data-add-resource-max type="number" min="1" value="1" /></label><label class="form-field resource-form-wide"><span>Cor</span><select data-add-resource-tone><option value="focus">Azul</option><option value="hope">Esperança</option><option value="stress">Estresse</option><option value="hp">PV</option><option value="shadow">Essência</option></select></label></div><p class="form-error" data-add-resource-error hidden></p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="save-resource">Criar recurso</button></div></section></div>`;
}

function renderCharacterPortraitModal(): string {
  if (!state.characterPortraitModalOpen || !state.character) return "";
  const portrait = state.character.identity.portraitImage;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="container-modal portrait-modal" role="dialog" aria-modal="true" aria-labelledby="portrait-modal-title"><div class="container-modal-heading"><h2 id="portrait-modal-title">Foto do personagem</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar">x</button></div><p>A imagem fica salva somente nesta ficha, neste dispositivo.</p>${portrait ? `<img class="portrait-modal-preview" src="${escapeHtml(portrait)}" alt="Retrato atual de ${escapeHtml(state.character.identity.name)}" />` : ""}<label class="form-field"><span>Escolher nova foto</span><input data-character-portrait-replace type="file" accept="image/png,image/jpeg,image/webp" /><small>PNG, JPG ou WebP; até 1,5 MB.</small></label>${portrait ? '<button class="sf-action sf-action--danger danger-action" type="button" data-action="remove-character-portrait">Remover foto</button>' : ""}</section></div>`;
}

function renderCharacterPortraitPreviewModal(): string {
  const character = state.character;
  const portrait = character?.identity.portraitImage;
  if (!state.characterPortraitPreviewOpen || !character || !portrait) return "";
  return `<div class="modal-backdrop portrait-preview-backdrop" data-modal-backdrop><section class="portrait-preview-modal" role="dialog" aria-modal="true" aria-labelledby="portrait-preview-title"><button class="modal-close" type="button" data-modal-close aria-label="Fechar foto ampliada">x</button><h2 id="portrait-preview-title">${escapeHtml(character.identity.name)}</h2><img src="${escapeHtml(portrait)}" alt="Retrato ampliado de ${escapeHtml(character.identity.name)}" /></section></div>`;
}


function renderPlaceholder(page: Page): string {
  const labels: Record<Page, string> = {
    overview: "Ficha",
    skills: "Aptidoes",
    inventory: "Inventario",
    progression: "Progressao",
    notes: "Anotacoes",
    compendium: "Compendium",
    settings: "Configuracoes",
    storedCards: "Vault"
  };

  return `
    <main class="content">
      <section class="empty-state">
        <span>...</span>
        <h1>${labels[page]}</h1>
        <p>Esta tela ja esta ligada na navegacao e sera preenchida no proximo ciclo.</p>
      </section>
    </main>
  `;
}

function injectGameMarkerAuthoringFields(): void {
  const card = state.editingCompendiumCardId ? catalog.cards.find((entry) => entry.id === state.editingCompendiumCardId) : undefined;
  const cardEffect = appRoot.querySelector<HTMLElement>("[data-compendium-card-effect]");
  if (state.cardModalOpen && cardEffect && !appRoot.querySelector('[data-game-marker-label="card"]')) {
    cardEffect.closest("label")?.insertAdjacentHTML("afterend", renderGameMarkerFields("card", card?.gameMarkers?.[0], escapeHtml));
  }

  const characterClass = state.editingCompendiumClassId ? catalog.classes.find((entry) => entry.id === state.editingCompendiumClassId) : undefined;
  const classSummary = appRoot.querySelector<HTMLElement>("[data-compendium-class-summary]");
  if (state.classModalOpen && classSummary && !appRoot.querySelector('[data-game-marker-label="class"]')) {
    classSummary.closest("label")?.insertAdjacentHTML("afterend", renderGameMarkerFields("class", characterClass?.gameMarkers?.[0], escapeHtml));
  }

  appRoot.querySelectorAll<HTMLElement>(".game-marker-form").forEach(configureGameMarkerAuthoringForm);
}

function enhanceCompendiumClassResults(): void {
  appRoot.querySelectorAll<HTMLElement>("[data-compendium-class-preview-id]").forEach((button) => {
    const definition = catalog.classes.find((entry) => entry.id === button.dataset.compendiumClassPreviewId);
    if (!definition) return;
    const body = button.querySelector<HTMLElement>(".compendium-class-body");
    const source = body?.querySelector<HTMLElement>(":scope > span");
    if (source) source.textContent = definition.packId === "local" ? "Local" : getPackDisplayName(definition.packId, catalog.packs);
    const originalName = getOriginalClassName(definition.id);
    const title = body?.querySelector<HTMLElement>("h2");
    if (title && originalName) title.textContent = `${definition.name} (${originalName})`;
    const readonly = button.parentElement?.querySelector<HTMLElement>(".readonly-label");
    if (readonly) readonly.textContent = "Conteúdo não editável";
  });
}

function configureGameMarkerAuthoringForm(form: HTMLElement): void {
  const kind = form.querySelector<HTMLSelectElement>("[data-game-marker-kind]");
  const quantityKind = form.querySelector<HTMLSelectElement>("[data-game-marker-quantity-kind]");
  const die = form.querySelector<HTMLSelectElement>("[data-game-marker-die]");
  const quantityValue = form.querySelector<HTMLInputElement | HTMLSelectElement>("[data-game-marker-quantity-value]");
  if (!kind || !quantityKind || !die || !quantityValue) return;

  const isDice = kind.value === "dice";
  const isCounter = !isDice;
  form.querySelectorAll<HTMLInputElement>("[data-game-marker-initial], [data-game-marker-max]").forEach((control) => {
    control.disabled = !isCounter;
    control.closest("label")?.classList.toggle("is-disabled", !isCounter);
  });
  [die, quantityKind, quantityValue].forEach((control) => {
    control.disabled = !isDice;
    control.closest("label")?.classList.toggle("is-disabled", !isDice);
  });

  const quantityLabel = quantityValue.closest("label");
  const quantityTitle = quantityLabel?.querySelector("span");
  if (!isDice || quantityKind.value === "spellcast-trait") {
    if (quantityTitle) quantityTitle.textContent = "Atributo de Conjuração";
    quantityValue.disabled = true;
    quantityValue.value = "";
    return;
  }

  if (quantityKind.value === "fixed") {
    if (quantityTitle) quantityTitle.textContent = "Quantidade de dados";
    quantityValue.disabled = false;
    if (quantityValue instanceof HTMLInputElement) {
      quantityValue.type = "number";
      quantityValue.min = "1";
      quantityValue.step = "1";
      if (!quantityValue.value || Number(quantityValue.value) < 1) quantityValue.value = "1";
    } else {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.step = "1";
      input.value = "1";
      input.dataset.gameMarkerQuantityValue = quantityValue.dataset.gameMarkerQuantityValue;
      quantityValue.replaceWith(input);
    }
    return;
  }

  if (quantityTitle) quantityTitle.textContent = "Atributo que define a quantidade";
  if (quantityValue instanceof HTMLInputElement) {
    const select = document.createElement("select");
    select.dataset.gameMarkerQuantityValue = quantityValue.dataset.gameMarkerQuantityValue;
    const attributes = [["dex", "Agilidade"], ["for", "Força"], ["cha", "Finesse"], ["wil", "Instinto"], ["con", "Presença"], ["int", "Conhecimento"]] as const;
    select.innerHTML = attributes.map(([id, label]) => `<option value="${id}" ${quantityValue.value === id ? "selected" : ""}>${label}</option>`).join("");
    quantityValue.replaceWith(select);
  }
}

function updateGameMarkerAuthoringForm(target: HTMLSelectElement): void {
  const form = target.closest<HTMLElement>(".game-marker-form");
  if (!form) return;
  configureGameMarkerAuthoringForm(form);
}

function render(options: { preserveMainScroll?: boolean; resetCreationScroll?: boolean } = {}): void {
  const previousCharacterCreationScrollTop = !options.resetCreationScroll && state.characterSelectionOpen && state.characterCreationOpen
    ? appRoot.querySelector<HTMLElement>(".character-creation-scroll")?.scrollTop
    : undefined;
  const previousMainScrollTop = options.preserveMainScroll
    ? appRoot.querySelector<HTMLElement>(".main-shell")?.scrollTop
    : undefined;
  const previousContentScrollTop = options.preserveMainScroll
    ? appRoot.querySelector<HTMLElement>(".content")?.scrollTop
    : undefined;
  const previousDocumentScrollTop = options.preserveMainScroll ? window.scrollY : undefined;
  const previousSidebarScrollTop = options.preserveMainScroll ? appRoot.querySelector<HTMLElement>(".sidebar")?.scrollTop : undefined;
  const currentCharacter = state.character;
  if (state.characterSelectionOpen && isEditorPage(state.page)) {
    const editorContextCharacter = currentCharacter ?? state.characters[0] ?? demoCharacter;
    const editorScreen = state.page === "compendium" ? renderCompendium() : renderSettings(editorContextCharacter);
    appRoot.innerHTML = `<div class="editor-shell">${renderEditorHeaderView(getPlayerShellDependencies())}${editorScreen}</div>${renderPackManagementDialogs(getPackManagementDependencies())}${renderCharacterImportModal({ isOpen: state.characterImportOpen, character: state.pendingCharacterImport, error: state.characterImportError, escapeHtml })}${renderCardModalView(state.modalCardId, getCardFeatureDependencies())}${renderDomainModalView(getDomainFeatureDependencies())}${renderDeleteDomainModalView(getDomainFeatureDependencies())}${renderCompendiumCardFormModalView(getCardFeatureDependencies())}${renderDeleteCompendiumCardModalView(getCardFeatureDependencies())}${renderCompendiumItemFormModalView(getItemFeatureDependencies())}${renderDeleteCompendiumItemModalView(getItemFeatureDependencies())}${renderCompendiumItemPreviewModalView(getItemFeatureDependencies())}${renderCompendiumClassPreviewModalView(getClassFeatureDependencies())}${renderCompendiumClassFormModalView(getClassFeatureDependencies())}${renderDeleteCompendiumClassModalView(getClassFeatureDependencies())}${renderCompendiumAncestryFormModalView(getAncestryFeatureDependencies())}${renderDeleteCompendiumAncestryModalView(getAncestryFeatureDependencies())}`;
    document.body.classList.toggle("has-modal", state.packImportOpen || state.removeAllInstalledPacksOpen || state.characterImportOpen || Boolean(state.deletingInstalledPackId) || Boolean(state.modalCardId) || state.domainModalOpen || Boolean(state.deletingDomainId) || state.cardModalOpen || Boolean(state.deletingCompendiumCardId) || state.itemDefinitionModalOpen || Boolean(state.deletingCompendiumItemId) || Boolean(state.compendiumItemPreviewId) || state.classModalOpen || Boolean(state.deletingCompendiumClassId) || Boolean(state.compendiumClassPreviewId) || state.ancestryModalOpen || Boolean(state.deletingCompendiumAncestryId) || Boolean(state.compendiumAncestryPreviewId) || Boolean(state.compendiumCommunityPreviewId) || state.transformationState.transformationModalOpen || Boolean(state.transformationState.deletingCompendiumTransformationId) || Boolean(state.transformationState.compendiumTransformationPreviewId));
    if (options.preserveMainScroll) requestAnimationFrame(() => { const content = appRoot.querySelector<HTMLElement>(".content"); if (content && previousContentScrollTop !== undefined) content.scrollTop = previousContentScrollTop; if (previousDocumentScrollTop !== undefined) window.scrollTo({ top: previousDocumentScrollTop, behavior: "auto" }); });
    return;
  }

  if (state.characterSelectionOpen) {
    appRoot.innerHTML = `${renderCharacterSelectionView(state.characters, demoCharacter.id, escapeHtml)}${renderCharacterCreationModalView(getCharacterCreationRenderDependencies())}${renderDeleteCharacterModal()}${renderCharacterImportModal({ isOpen: state.characterImportOpen, character: state.pendingCharacterImport, error: state.characterImportError, escapeHtml })}`;
    document.body.classList.toggle("has-modal", state.characterCreationOpen || state.characterImportOpen || Boolean(state.deletingCharacterId));
    if (previousCharacterCreationScrollTop !== undefined) {
      requestAnimationFrame(() => {
        const creationScroll = appRoot.querySelector<HTMLElement>(".character-creation-scroll");
        if (creationScroll) creationScroll.scrollTop = previousCharacterCreationScrollTop;
      });
    }
    shouldAnimateCharacterCreationModal = false;
    return;
  }

  if (!currentCharacter) {
    appRoot.innerHTML = `<div class="boot-screen sf-state sf-state--loading" role="status"><i aria-hidden="true"></i><span>Carregando SoulForge...</span></div>`;
    return;
  }
  const characterWithSynchronizedArmor = synchronizeArmorResource(currentCharacter, getItemDefinition);
  const characterWithSynchronizedSheet = synchronizeCharacterSheetModifiers(characterWithSynchronizedArmor, catalog);
  const synchronizedCharacter = synchronizeGameMarkers(characterWithSynchronizedSheet, catalog);
  if (synchronizedCharacter !== currentCharacter) {
    state.character = synchronizedCharacter;
    void persistCharacter(synchronizedCharacter);
  }
  const character = synchronizedCharacter;

  const screen = state.page === "overview"
    ? renderOverviewView(character, getPlayerOverviewDependencies())
    : state.page === "skills"
      ? renderTraitsView(character, { escapeHtml, renderEmptyInline, catalog, featureActivationError: state.featureActivationError })
      : state.page === "storedCards"
          ? renderStoredCardsView(character, getPlayerOverviewDependencies())
          : state.page === "progression"
            ? renderProgressionView(character, getProgressionRenderDependencies())
            : state.page === "notes"
              ? renderNotesView(character, getNotesRenderDependencies())
              : state.page === "inventory"
                ? renderInventoryView(character, getInventoryRenderDependencies())
                : state.page === "compendium"
                  ? renderCompendium()
                  : state.page === "settings"
                    ? renderSettings(character)
                    : renderPlaceholder(state.page);

  const shell = isEditorPage(state.page)
    ? `
      <div class="editor-shell">
        ${renderEditorHeaderView(getPlayerShellDependencies())}
        ${screen}
      </div>
    `
    : `
      <div class="app-shell">
        ${renderSidebarView(character, getPlayerShellDependencies())}
        <div class="main-shell">
          ${renderTopbarView(character, getPlayerShellDependencies())}
          ${screen}
        </div>
      </div>
    `;

  appRoot.innerHTML = `
    ${shell}
    ${renderCardModalView(state.modalCardId, getCardFeatureDependencies())}
    ${renderActivateStoredCardModal()}
    ${renderItemModalView(getInventoryRenderDependencies())}
    ${renderDeleteItemModalView(getInventoryRenderDependencies())}
    ${renderAddResourceModal()}
    ${renderProgressionHistoryModalView(getProgressionDialogDependencies())}
    ${renderProgressionPickerModalView(getProgressionDialogDependencies())}
    ${renderProgressionMulticlassModalView(getProgressionDialogDependencies())}
    ${renderProgressionCardPickerModalView(getProgressionDialogDependencies())}
    ${renderTierExperienceModalView(getProgressionDialogDependencies())}
    ${renderContainerDialogs(state, catalog, escapeHtml)}
    ${renderNoteModalView(getNotesRenderDependencies())}
    ${renderViewNoteModalView(getNotesRenderDependencies())}
    ${renderDeleteNoteModalView(getNotesRenderDependencies())}
    ${renderDomainModalView(getDomainFeatureDependencies())}
    ${renderDeleteDomainModalView(getDomainFeatureDependencies())}
    ${renderCompendiumCardFormModalView(getCardFeatureDependencies())}
    ${renderDeleteCompendiumCardModalView(getCardFeatureDependencies())}
    ${renderCompendiumItemFormModalView(getItemFeatureDependencies())}
    ${renderDeleteCompendiumItemModalView(getItemFeatureDependencies())}
    ${renderCompendiumItemPreviewModalView(getItemFeatureDependencies())}
    ${renderAddItemToContainerModalView(getInventoryRenderDependencies())}
    ${renderCompendiumClassPreviewModalView(getClassFeatureDependencies())}
    ${renderCompendiumClassFormModalView(getClassFeatureDependencies())}
    ${renderDeleteCompendiumClassModalView(getClassFeatureDependencies())}
    ${renderCompendiumAncestryFormModalView(getAncestryFeatureDependencies())}
    ${renderDeleteCompendiumAncestryModalView(getAncestryFeatureDependencies())}
    ${renderCharacterPortraitModal()}
    ${renderCharacterPortraitPreviewModal()}
    ${renderCharacterIdentityModalView({
      character: state.character,
      section: state.characterIdentityModalSection,
      catalog,
      escapeHtml,
      getFeatureActivation: (character, featureId) => getFeatureActivationForCharacter(character, catalog, featureId),
      activeFeatureIds: new Set(state.character ? getActiveFeatureEffects(state.character, catalog).map((effect) => effect.feature.id) : []),
      featureActivationError: state.featureActivationError
    })}
    ${renderGameMarkerDiceDialog(state.gameMarkerDieDialog, state.character, catalog, escapeHtml)}
    ${renderStoredDiceDialog({ state, catalog, escapeHtml })}
    ${renderFeatureTokenActivationDialog({ state, catalog, escapeHtml })}
    ${renderRestModalView(character, state.restDialogKind, state.restChoices, state.restError, { escapeHtml })}
      ${renderPackManagementDialogs(getPackManagementDependencies())}
    ${renderCharacterImportModal({ isOpen: state.characterImportOpen, character: state.pendingCharacterImport, error: state.characterImportError, escapeHtml })}
  `;
  injectGameMarkerAuthoringFields();
  enhanceCompendiumClassResults();
  syncScrollAffordances(appRoot);
  document.body.classList.toggle("has-modal", Boolean(appRoot.querySelector(".modal-backdrop")));
  if (state.addItemToCompartmentId && state.addItemCatalogScrollTop) requestAnimationFrame(() => { const catalog = appRoot.querySelector<HTMLElement>(".add-item-catalog"); if (catalog) catalog.scrollTop = state.addItemCatalogScrollTop ?? 0; });
  if (state.progressionCardPickerMode && state.progressionCardPickerScrollTop !== undefined) requestAnimationFrame(() => { const list = appRoot.querySelector<HTMLElement>(".progression-card-choice-list"); if (list) list.scrollTop = state.progressionCardPickerScrollTop ?? 0; });
  if (options.preserveMainScroll) {
    requestAnimationFrame(() => {
      const mainShell = appRoot.querySelector<HTMLElement>(".main-shell");
      const sidebar = appRoot.querySelector<HTMLElement>(".sidebar");
      if (sidebar && previousSidebarScrollTop !== undefined) sidebar.scrollTop = previousSidebarScrollTop;
      if (mainShell && previousMainScrollTop !== undefined) {
        mainShell.scrollTop = previousMainScrollTop;
      }
      const content = appRoot.querySelector<HTMLElement>(".content");
      if (content && previousContentScrollTop !== undefined) {
        content.scrollTop = previousContentScrollTop;
      }
      if (previousDocumentScrollTop !== undefined) {
        window.scrollTo({ top: previousDocumentScrollTop, behavior: "auto" });
      }
    });
  }
}

const renderCharacterCreationInPlace = (options: { resetScroll?: boolean } = {}): void => {
  if (!state.characterSelectionOpen || !state.characterCreationOpen || !renderCharacterCreationSurface(appRoot, renderCharacterCreationModalView(getCharacterCreationRenderDependencies()), options)) {
    render({ resetCreationScroll: options.resetScroll });
  }
};

function exportCharacter(): void {
  const character = state.character;
  if (character) downloadCharacterExport(character);
}

function focusInventorySearch(): void {
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>("[data-inventory-search]");
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}

function focusCompendiumCardSearch(): void {
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>("[data-compendium-card-search]");
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}

function focusCompendiumAncestrySearch(): void {
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>("[data-compendium-ancestry-search]");
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}

async function refreshCatalog(): Promise<void> {
  const customDefinitions = await loadCustomDefinitions();
  state.installedPacks = await loadInstalledPacks();
  cardMarkerOverrides = await loadCardMarkerOverrides();
  const overrideByDefinitionId = new Map(cardMarkerOverrides.map((override) => [override.definitionId, override]));
  const definitions = [...baseCatalog.definitions, ...customDefinitions].map((definition) => {
    if (definition.type !== "card") return definition;
    const override = overrideByDefinitionId.get(definition.id);
    return applyCardContentDefaults(definition, override?.gameMarkers);
  });
  catalog = createCatalog([...baseCatalog.packs, ...state.installedPacks], definitions);
}

async function openCharacter(characterId: string | undefined): Promise<void> {
  if (!characterId) {
    return;
  }

  if (characterId === demoCharacter.id) {
    await ensureDemoCharacter();
  }
  const character = await loadCharacter(characterId);
  if (!character) {
    return;
  }

  state.character = character;
  state.characterSelectionOpen = false;
  state.characterCreationOpen = false;
  render();
}

async function confirmDeleteCharacter(): Promise<void> {
  const characterId = state.deletingCharacterId;
  if (!characterId || characterId === demoCharacter.id) {
    state.deletingCharacterId = undefined;
    render();
    return;
  }

  await deleteStoredCharacter(characterId);
  state.characters = state.characters.filter((character) => character.id !== characterId);
  if (state.character?.id === characterId) {
    state.character = undefined;
    state.characterSelectionOpen = true;
  }
  state.deletingCharacterId = undefined;
  render();
}

async function readCharacterPortrait(file: File): Promise<string> {
  const image = await readLocalImage(file);
  if (!image) throw new Error("Não foi possível ler a imagem.");
  return image;
}

async function replaceCharacterPortrait(file: File): Promise<void> {
  const character = state.character;
  if (!character) return;
  try {
    const portraitImage = await readCharacterPortrait(file);
    state.character = { ...character, identity: { ...character.identity, portraitImage } };
    state.characterPortraitModalOpen = false;
    await saveCharacter(state.character);
    render();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Não foi possível usar a imagem.");
  }
}

async function createCharacter(): Promise<void> {
  syncCharacterCreationDraftFromForm(state);
  const builtCharacter = buildCharacterFromDraft(getCharacterCreationDraft(state), catalog, getCharacterCreationFallback());
  if (builtCharacter instanceof Error) {
    state.characterCreationError = builtCharacter.message;
    render();
    return;
  }
  await saveCharacter(builtCharacter);
  state.characters = [...state.characters, builtCharacter];
  await openCharacter(builtCharacter.id);
}

function validateCharacterCreationStep(): boolean {
  syncCharacterCreationDraftFromForm(state);
  return validateCharacterCreationState(state, catalog, getCharacterCreationFallback());
}

function getCharacterCreationFallback() { return { classDefinition: fallbackCharacterClass, subclassDefinition: fallbackCharacterSubclass, skills: demoCharacter.skills }; }
function getCardFormValue(selector: string): string {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
  return element?.value.trim() ?? "";
}

async function activateStoredCard(mode: "rest" | "stress"): Promise<void> {
  const character = state.character;
  const definition = state.activatingStoredCardId ? findDefinition(catalog, state.activatingStoredCardId) : undefined;
  if (!character || definition?.type !== "card") {
    return;
  }
  const activeCardIds = [...character.deck.activeCardIds];
  const swapCardId = getCardFormValue("[data-recall-swap-card]");
  if (activeCardIds.length >= 5 && !swapCardId) {
    state.cardActivationError = "Escolha uma carta ativa para mover ao Vault.";
    render();
    return;
  }
  const recallCost = definition.recallCost ?? 0;
  const stress = character.resources.find((resource) => resource.id === "stress");
  if (mode === "stress" && (!stress || stress.value + recallCost > stress.max)) {
    state.cardActivationError = "Nao ha espacos de Stress suficientes para ativar esta carta agora.";
    render();
    return;
  }
  const replacementIndex = swapCardId ? activeCardIds.indexOf(swapCardId) : -1;
  if (swapCardId && replacementIndex < 0) {
    state.cardActivationError = "A carta escolhida para guardar nao esta mais ativa.";
    render();
    return;
  }
  if (replacementIndex >= 0) {
    activeCardIds[replacementIndex] = definition.id;
  } else {
    activeCardIds.push(definition.id);
  }
  const resources = mode === "stress" && stress
    ? character.resources.map((resource) => resource.id === stress.id ? { ...resource, value: resource.value + recallCost } : resource)
    : character.resources;
  const updatedCharacter: Character = { ...character, resources, deck: { ...character.deck, activeCardIds } };
  state.character = updatedCharacter;
  await saveCharacter(updatedCharacter);
  state.activatingStoredCardId = undefined;
  state.cardActivationError = undefined;
  render();
}

async function adjustResource(resourceId: string | undefined, delta: number): Promise<void> {
  const character = state.character;

  if (!character || !resourceId) {
    return;
  }

  const resources = character.resources.map((resource) => {
    if (resource.id !== resourceId) {
      return resource;
    }

    return {
      ...resource,
      value: Math.min(resource.max, Math.max(0, resource.value + delta))
    };
  });

  const updatedCharacter = { ...character, resources };
  state.character = updatedCharacter;
  await saveCharacter(updatedCharacter);
  render({ preserveMainScroll: true });
}

async function createResource(): Promise<void> {
  const character = state.character;
  if (!character) return;
  const labelInput = document.querySelector<HTMLInputElement>("[data-add-resource-label]");
  const valueInput = document.querySelector<HTMLInputElement>("[data-add-resource-value]");
  const maxInput = document.querySelector<HTMLInputElement>("[data-add-resource-max]");
  const toneInput = document.querySelector<HTMLSelectElement>("[data-add-resource-tone]");
  const error = document.querySelector<HTMLElement>("[data-add-resource-error]");
  const label = labelInput?.value.trim() ?? "";
  const value = Number(valueInput?.value);
  const max = Number(maxInput?.value);
  const tone = toneInput?.value as Character["resources"][number]["tone"] | undefined;

  if (!label || !Number.isInteger(value) || !Number.isInteger(max) || value < 0 || max < 1 || value > max || !tone) {
    if (error) {
      error.textContent = "Informe um nome e valores inteiros entre 0 e o máximo definido.";
      error.removeAttribute("hidden");
    }
    labelInput?.classList.toggle("is-invalid", !label);
    valueInput?.classList.toggle("is-invalid", !Number.isInteger(value) || value < 0 || value > max);
    maxInput?.classList.toggle("is-invalid", !Number.isInteger(max) || max < 1 || value > max);
    return;
  }

  const updatedCharacter: Character = {
    ...character,
    resources: [...character.resources, { id: `resource.${crypto.randomUUID()}`, label, value, max, tone }]
  };
  state.character = updatedCharacter;
  state.addResourceModalOpen = false;
  await saveCharacter(updatedCharacter);
  render();
}

function bindEvents(): void {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    modalBackdropPointerDown = event.button === 0 && target instanceof HTMLElement && target.matches("[data-modal-backdrop]");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (consumeInventoryDragClickSuppression()) {
      event.preventDefault();
      return;
    }

    if (handleAncestryAction(target, getAncestryFeatureDependencies())) return;
    if (handleCommunityAction(target, { state, catalog, escapeHtml, getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs), saveCustomDefinition, deleteCustomDefinition, refreshCatalog, render })) return;
    if (handleTransformationAction(target, getTransformationFeatureDependencies())) return;

    const attributeAllocation = target.closest<HTMLElement>("[data-character-attribute-allocation]");
    if (attributeAllocation) {
      const result = handleCreationAttributeAllocation({
        values: state.characterCreationAttributeValues, selectedValue: state.characterCreationSelectedAttributeValue,
        action: attributeAllocation.dataset.characterAttributeAllocation, attributeId: attributeAllocation.dataset.characterAttributeId,
        value: Number(attributeAllocation.dataset.characterAttributeValue)
      });
      state.characterCreationAttributeValues = result.values;
      state.characterCreationSelectedAttributeValue = result.selectedValue;
      state.characterCreationError = result.error;
      renderCharacterCreationInPlace();
      return;
    }

    const communityChoice = target.closest<HTMLElement>("[data-character-community-id]"); if (communityChoice) { state.characterCreationCommunityId = communityChoice.dataset.characterCommunityId; state.characterCreationError = undefined; renderCharacterCreationInPlace(); return; }

    const subclassTabButton = target.closest<HTMLButtonElement>('[data-action="select-class-subclass-tab"]');
    if (subclassTabButton) {
      const tabs = subclassTabButton.closest<HTMLElement>(".class-subclass-tabs");
      const tabIndex = subclassTabButton.dataset.subclassTab;
      if (tabs && tabIndex) {
        tabs.querySelectorAll<HTMLButtonElement>('[data-action="select-class-subclass-tab"]').forEach((button) => {
          const isActive = button === subclassTabButton;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", String(isActive));
        });
        tabs.querySelectorAll<HTMLElement>(".class-subclass-tab-panel").forEach((panel) => {
          panel.classList.toggle("is-active", panel.classList.contains(`class-subclass-tab-panel-${tabIndex}`));
        });
      }
      return;
    }

    const detailSubclassTabButton = target.closest<HTMLButtonElement>('[data-action="select-class-detail-subclass-tab"]');
    if (detailSubclassTabButton) {
      const tabs = detailSubclassTabButton.closest<HTMLElement>(".class-detail-subclass-tabs");
      const tabIndex = detailSubclassTabButton.dataset.subclassTab;
      if (tabs && tabIndex) {
        tabs.querySelectorAll<HTMLButtonElement>('[data-action="select-class-detail-subclass-tab"]').forEach((button) => {
          const isActive = button === detailSubclassTabButton;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", String(isActive));
        });
        tabs.querySelectorAll<HTMLElement>(".class-detail-subclass-panel").forEach((panel, index) => {
          panel.classList.toggle("is-active", index === Number(tabIndex));
        });
      }
      return;
    }

    if (target.closest('[data-action="close-add-item-preview"]')) {
      state.addItemPreviewDefinitionId = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.matches("[data-modal-backdrop]") && modalBackdropPointerDown && state.addItemPreviewDefinitionId) {
      modalBackdropPointerDown = false;
      state.addItemPreviewDefinitionId = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest("[data-modal-close]")) {
      state.modalCardId = undefined;
      state.featureActivationError = undefined;
      state.featureTokenActivation = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.addResourceModalOpen = false;
      state.progressionHistoryOpen = false;
      state.progressionPicker = undefined;
      state.progressionPickerIds = [];
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      state.progressionTierExperienceOpen = false;
      state.progressionTierExperienceError = undefined;
      state.progressionMulticlassOpen = false;
      state.progressionMulticlassTier = undefined;
      state.progressionMulticlassDraft = {};
      state.addContainerOpen = false;
      state.deleteContainerId = undefined;
      state.deletingItemId = undefined;
      state.noteModalOpen = false;
      state.editingNoteId = undefined;
      state.viewingNoteId = undefined;
      state.deletingNoteId = undefined;
      state.domainModalOpen = false;
      state.editingDomainId = undefined;
      state.deletingDomainId = undefined;
      state.cardModalOpen = false;
      state.editingCompendiumCardId = undefined;
      state.deletingCompendiumCardId = undefined;
      state.itemDefinitionModalOpen = false;
      state.editingCompendiumItemId = undefined;
      state.deletingCompendiumItemId = undefined;
      state.compendiumItemPreviewId = undefined;
      state.compendiumClassPreviewId = undefined;
      state.activatingStoredCardId = undefined;
      state.cardActivationError = undefined;
      state.addItemToCompartmentId = undefined; state.addItemPreviewDefinitionId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.ancestryModalOpen = false;
      state.editingCompendiumAncestryId = undefined;
      state.deletingCompendiumAncestryId = undefined;
      state.compendiumAncestryPreviewId = undefined;
      state.compendiumCommunityPreviewId = undefined; state.communityModalOpen = false; state.editingCompendiumCommunityId = undefined; state.deletingCompendiumCommunityId = undefined; state.transformationState.transformationModalOpen = false; state.transformationState.editingCompendiumTransformationId = undefined; state.transformationState.deletingCompendiumTransformationId = undefined; state.transformationState.compendiumTransformationPreviewId = undefined;
      state.packImportOpen = false;
      state.pendingPackBundles = undefined;
      state.packImportError = undefined;
      state.removeAllInstalledPacksOpen = false;
      state.removeAllInstalledPacksError = undefined;
      state.characterImportOpen = false;
      state.pendingCharacterImport = undefined;
      state.characterImportError = undefined;
      state.deletingInstalledPackId = undefined;
      state.deletingCharacterId = undefined;
      state.characterPortraitModalOpen = false;
      state.characterPortraitPreviewOpen = false;
      state.characterIdentityModalSection = undefined;
      state.gameMarkerDieDialog = undefined;
      state.storedDiceDialog = undefined;
      state.restDialogKind = undefined;
      state.restChoices = [];
      state.restError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.matches("[data-modal-backdrop]") && modalBackdropPointerDown && !state.characterCreationOpen) {
      modalBackdropPointerDown = false;
      state.characterCreationOpen = false;
      state.characterCreationError = undefined;
      state.modalCardId = undefined;
      state.featureTokenActivation = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.addResourceModalOpen = false;
      state.progressionHistoryOpen = false;
      state.progressionPicker = undefined;
      state.progressionPickerIds = [];
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      state.progressionTierExperienceOpen = false;
      state.progressionTierExperienceError = undefined;
      state.progressionMulticlassOpen = false;
      state.progressionMulticlassTier = undefined;
      state.progressionMulticlassDraft = {};
      state.addContainerOpen = false;
      state.deleteContainerId = undefined;
      state.deletingItemId = undefined;
      state.noteModalOpen = false;
      state.editingNoteId = undefined;
      state.viewingNoteId = undefined;
      state.deletingNoteId = undefined;
      state.domainModalOpen = false;
      state.editingDomainId = undefined;
      state.deletingDomainId = undefined;
      state.cardModalOpen = false;
      state.editingCompendiumCardId = undefined;
      state.deletingCompendiumCardId = undefined;
      state.itemDefinitionModalOpen = false;
      state.editingCompendiumItemId = undefined;
      state.deletingCompendiumItemId = undefined;
      state.compendiumItemPreviewId = undefined;
      state.compendiumClassPreviewId = undefined;
      state.activatingStoredCardId = undefined;
      state.cardActivationError = undefined;
      state.addItemToCompartmentId = undefined; state.addItemPreviewDefinitionId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.ancestryModalOpen = false;
      state.editingCompendiumAncestryId = undefined;
      state.deletingCompendiumAncestryId = undefined;
      state.compendiumAncestryPreviewId = undefined;
      state.compendiumCommunityPreviewId = undefined; state.communityModalOpen = false; state.editingCompendiumCommunityId = undefined; state.deletingCompendiumCommunityId = undefined; state.transformationState.transformationModalOpen = false; state.transformationState.editingCompendiumTransformationId = undefined; state.transformationState.deletingCompendiumTransformationId = undefined; state.transformationState.compendiumTransformationPreviewId = undefined;
      state.packImportOpen = false;
      state.pendingPackBundles = undefined;
      state.packImportError = undefined;
      state.removeAllInstalledPacksOpen = false;
      state.removeAllInstalledPacksError = undefined;
      state.characterImportOpen = false;
      state.pendingCharacterImport = undefined;
      state.characterImportError = undefined;
      state.deletingInstalledPackId = undefined;
      state.deletingCharacterId = undefined;
      state.characterPortraitModalOpen = false;
      state.characterPortraitPreviewOpen = false;
      state.characterIdentityModalSection = undefined;
      state.gameMarkerDieDialog = undefined;
      state.storedDiceDialog = undefined;
      state.restDialogKind = undefined;
      state.restChoices = [];
      state.restError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    modalBackdropPointerDown = false;

    const resourceAdjustButton = target.closest<HTMLElement>("[data-resource-adjust]");
    if (resourceAdjustButton) {
      const delta = Number(resourceAdjustButton.dataset.resourceAdjust);
      void adjustResource(resourceAdjustButton.dataset.resourceId, delta);
      return;
    }

    if (handleGameMarkerAction(target, { state, catalog, saveCharacter, render: () => render({ preserveMainScroll: true }) })) return;

    if (handleStoredDiceAction(target, { state, catalog, saveCharacter, render: () => render({ preserveMainScroll: true }), escapeHtml })) return;

    if (handleRestAction(target, state, { catalog, saveCharacter, render: () => render({ preserveMainScroll: true }) })) {
      return;
    }

    if (target.closest('[data-action="export-character"]')) {
      exportCharacter();
      return;
    }

    if (target.closest('[data-action="open-character-import"]')) {
      state.characterImportOpen = true;
      state.pendingCharacterImport = undefined;
      state.characterImportError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="choose-character-file"]')) {
      document.querySelector<HTMLInputElement>("[data-character-file]")?.click();
      return;
    }

    if (target.closest('[data-action="confirm-character-import"]')) {
      void confirmStagedCharacterImport(state, saveCharacter, listCharacters).then((imported) => {
        if (imported) state.characterImportOpen = false;
        render({ preserveMainScroll: true });
      });
      return;
    }

    if (handlePackManagementAction(target, getPackManagementDependencies())) return;

    if (target.closest('[data-action="open-character-select"]')) {
      state.characterSelectionOpen = true;
      state.characterCreationOpen = false;
      state.characterCreationError = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="open-character-sheet"]')) {
      state.progressionCompletionLevel = undefined;
      state.page = "overview";
      state.characterIdentityModalSection = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    const identityButton = target.closest<HTMLElement>('[data-action="open-character-identity"]');
    if (identityButton) {
      const section = identityButton.dataset.identitySection;
      if (section === "character" || section === "class" || section === "ancestry" || section === "community") {
        state.characterIdentityModalSection = section;
        render({ preserveMainScroll: true });
      }
      return;
    }

    if (target.closest('[data-action="open-character-portrait"]')) {
      state.characterPortraitModalOpen = true;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="open-character-portrait-preview"]')) {
      state.characterPortraitPreviewOpen = true;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="remove-character-portrait"]') && state.character) {
      const updatedCharacter = { ...state.character, identity: { ...state.character.identity, portraitImage: undefined } };
      state.character = updatedCharacter;
      state.characterPortraitModalOpen = false;
      void saveCharacter(updatedCharacter).then(() => render());
      return;
    }

    const requestDeleteCharacterButton = target.closest<HTMLElement>('[data-action="request-delete-character"]');
    if (requestDeleteCharacterButton) {
      state.deletingCharacterId = requestDeleteCharacterButton.dataset.characterId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-character"]')) {
      state.deletingCharacterId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-character"]')) {
      void confirmDeleteCharacter();
      return;
    }

    const selectCharacterButton = target.closest<HTMLElement>('[data-action="select-character"]');
    if (selectCharacterButton) {
      void openCharacter(selectCharacterButton.dataset.characterId);
      return;
    }

    if (target.closest('[data-action="new-character"]')) {
      shouldAnimateCharacterCreationModal = true;
      openCharacterCreation(state, catalog, getCharacterCreationFallback());
      render();
      return;
    }

    if (target.closest('[data-action="cancel-new-character"]')) {
      closeCharacterCreation(state);
      render();
      return;
    }

    if (target.closest('[data-action="character-creation-previous"]')) {
      syncCharacterCreationDraftFromForm(state);
      state.characterCreationStep = previousCharacterCreationStep(state.characterCreationStep);
      state.characterCreationError = undefined;
      renderCharacterCreationInPlace({ resetScroll: true });
      return;
    }

    if (target.closest('[data-action="character-creation-next"]')) {
      if (!validateCharacterCreationStep()) {
        renderCharacterCreationInPlace();
        return;
      }
      if (state.characterCreationStep === 5) {
        state.characterCreationCardDomainId = getCharacterCreationClasses().find((entry) => entry.id === state.characterCreationClassId)?.domainIds[0];
      }
      state.characterCreationStep = nextCharacterCreationStep(state.characterCreationStep);
      renderCharacterCreationInPlace({ resetScroll: true });
      return;
    }

    const characterCardDomainButton = target.closest<HTMLElement>("[data-character-card-domain-id]");
    if (characterCardDomainButton) {
      state.characterCreationCardDomainId = characterCardDomainButton.dataset.characterCardDomainId;
      renderCharacterCreationInPlace();
      return;
    }

    const characterStartingCardButton = target.closest<HTMLElement>("[data-character-starting-card-id]");
    if (characterStartingCardButton) {
      const cardId = characterStartingCardButton.dataset.characterStartingCardId;
      if (!cardId) return;
      toggleCharacterCreationCard(state, cardId);
      renderCharacterCreationInPlace();
      return;
    }

    if (target.closest('[data-action="save-new-character"]')) {
      void createCharacter();
      return;
    }

    const settingsSectionButton = target.closest<HTMLElement>("[data-settings-section]");
    if (settingsSectionButton) {
      const section = settingsSectionButton.dataset.settingsSection as SettingsSection;
      state.openSettingsSections[section] = !state.openSettingsSections[section];
      render();
      return;
    }

    const compendiumSpreadButton = target.closest<HTMLElement>("[data-compendium-spread]");
    if (compendiumSpreadButton) {
      const nextSpread = Number(compendiumSpreadButton.dataset.compendiumSpread) as CompendiumSpread;
      if (nextSpread === state.compendiumSpread) return;
      state.compendiumSpread = nextSpread;
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-cards"]')) {
      state.compendiumView = "cards";
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-domains"]')) {
      state.compendiumView = "domains";
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-items"]')) {
      state.compendiumView = "items";
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-classes"]')) {
      state.compendiumView = "classes";
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-ancestries"]')) {
      state.compendiumView = "ancestries";
      render();
      return;
    }

    if (target.closest('[data-action="manage-compendium-communities"]')) { state.compendiumView = "communities"; render(); return; }
    if (target.closest('[data-action="manage-compendium-transformations"]')) { state.compendiumView = "transformations"; render(); return; }

    if (target.closest('[data-action="new-compendium-domain"]')) {
      state.domainModalOpen = true;
      state.editingDomainId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="new-compendium-card"]')) {
      state.cardModalOpen = true;
      state.editingCompendiumCardId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="new-compendium-item"]')) {
      state.itemDefinitionModalOpen = true;
      state.editingCompendiumItemId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="new-compendium-class"]')) {
      state.classModalOpen = true;
      state.editingCompendiumClassId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="new-compendium-ancestry"]')) {
      state.ancestryModalOpen = true;
      state.editingCompendiumAncestryId = undefined;
      render();
      return;
    }

    const editCompendiumAncestryButton = target.closest<HTMLElement>('[data-action="edit-compendium-ancestry"]');
    if (editCompendiumAncestryButton) {
      state.ancestryModalOpen = true;
      state.editingCompendiumAncestryId = editCompendiumAncestryButton.dataset.ancestryId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-ancestry"]')) {
      void saveCompendiumAncestryAction(getAncestryFeatureDependencies());
      return;
    }

    const deleteCompendiumAncestryButton = target.closest<HTMLElement>('[data-action="delete-compendium-ancestry"]');
    if (deleteCompendiumAncestryButton) {
      state.deletingCompendiumAncestryId = deleteCompendiumAncestryButton.dataset.ancestryId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-compendium-ancestry"]')) {
      state.deletingCompendiumAncestryId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-compendium-ancestry"]')) {
      void removeCompendiumAncestryAction(getAncestryFeatureDependencies());
      return;
    }

    const editCompendiumClassButton = target.closest<HTMLElement>('[data-action="edit-compendium-class"]');
    if (editCompendiumClassButton) {
      state.classModalOpen = true;
      state.editingCompendiumClassId = editCompendiumClassButton.dataset.classId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-class"]')) {
      void saveCompendiumClassAction(getClassFeatureDependencies());
      return;
    }

    const deleteCompendiumClassButton = target.closest<HTMLElement>('[data-action="delete-compendium-class"]');
    if (deleteCompendiumClassButton) {
      state.deletingCompendiumClassId = deleteCompendiumClassButton.dataset.classId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-compendium-class"]')) {
      state.deletingCompendiumClassId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-compendium-class"]')) {
      void removeCompendiumClassAction(getClassFeatureDependencies());
      return;
    }

    const editCompendiumItemButton = target.closest<HTMLElement>('[data-action="edit-compendium-item"]');
    if (editCompendiumItemButton) {
      state.itemDefinitionModalOpen = true;
      state.editingCompendiumItemId = editCompendiumItemButton.dataset.itemId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-item"]')) {
      void saveCompendiumItemAction(getItemFeatureDependencies());
      return;
    }

    const deleteCompendiumItemButton = target.closest<HTMLElement>('[data-action="delete-compendium-item"]');
    if (deleteCompendiumItemButton) {
      state.deletingCompendiumItemId = deleteCompendiumItemButton.dataset.itemId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-compendium-item"]')) {
      state.deletingCompendiumItemId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-compendium-item"]')) {
      void removeCompendiumItemAction(getItemFeatureDependencies());
      return;
    }

    const compendiumClassPreviewButton = target.closest<HTMLElement>("[data-compendium-class-preview-id]");
    if (compendiumClassPreviewButton) {
      state.compendiumClassPreviewId = compendiumClassPreviewButton.dataset.compendiumClassPreviewId;
      render({ preserveMainScroll: true });
      return;
    }

    const compendiumItemPreviewButton = target.closest<HTMLElement>("[data-compendium-item-preview-id]");
    if (compendiumItemPreviewButton) {
      state.compendiumItemPreviewId = compendiumItemPreviewButton.dataset.compendiumItemPreviewId;
      render({ preserveMainScroll: true });
      return;
    }

    const compendiumItemFilterButton = target.closest<HTMLElement>("[data-compendium-item-filter],[data-compendium-item-tier-filter]");
    if (compendiumItemFilterButton) { const tier = compendiumItemFilterButton.dataset.compendiumItemTierFilter; if (tier) state.compendiumItemTierFilter = tier; else state.compendiumItemFilter = compendiumItemFilterButton.dataset.compendiumItemFilter as InventoryFilter; render(); return; }

    const editCompendiumCardButton = target.closest<HTMLElement>('[data-action="edit-compendium-card"]');
    if (editCompendiumCardButton) {
      state.cardModalOpen = true;
      state.editingCompendiumCardId = editCompendiumCardButton.dataset.cardId;
      render();
      return;
    }

    const editPackCardMarkerButton = target.closest<HTMLElement>('[data-action="edit-pack-card-marker"]');
    if (editPackCardMarkerButton) {
      state.cardModalOpen = true;
      state.editingCompendiumCardId = editPackCardMarkerButton.dataset.cardId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-card"]')) {
      void saveCompendiumCardAction(getCardFeatureDependencies());
      return;
    }

    if (target.closest('[data-action="save-pack-card-marker"]')) {
      void savePackCardMarkerOverrideAction(getCardFeatureDependencies());
      return;
    }

    const deleteCompendiumCardButton = target.closest<HTMLElement>('[data-action="delete-compendium-card"]');
    if (deleteCompendiumCardButton) {
      state.deletingCompendiumCardId = deleteCompendiumCardButton.dataset.cardId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-compendium-card"]')) {
      state.deletingCompendiumCardId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-compendium-card"]')) {
      void removeCompendiumCardAction(getCardFeatureDependencies());
      return;
    }

    const editDomainButton = target.closest<HTMLElement>('[data-action="edit-compendium-domain"]');
    if (editDomainButton) {
      state.domainModalOpen = true;
      state.editingDomainId = editDomainButton.dataset.domainId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-domain"]')) {
      void saveCompendiumDomainAction(getDomainFeatureDependencies());
      return;
    }

    const deleteDomainButton = target.closest<HTMLElement>('[data-action="delete-compendium-domain"]');
    if (deleteDomainButton) {
      state.deletingDomainId = deleteDomainButton.dataset.domainId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-domain"]')) {
      state.deletingDomainId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-domain"]')) {
      void removeCompendiumDomainAction(getDomainFeatureDependencies());
      return;
    }

    if (target.closest('[data-action="back-compendium-index"]')) {
      state.compendiumView = "index";
      render();
      return;
    }

    if (target.closest('[data-action="back-player-mode"]')) {
      state.page = state.lastPlayerPage;
      state.compendiumView = "index";
      state.modalCardId = undefined;
      render();
      return;
    }

    const compendiumDomainFilterButton = target.closest<HTMLElement>("[data-compendium-domain-filter]");
    if (compendiumDomainFilterButton) {
      state.compendiumDomainFilter = compendiumDomainFilterButton.dataset.compendiumDomainFilter ?? "todos";
      render();
      return;
    }

    const compendiumTierFilterButton = target.closest<HTMLElement>("[data-compendium-tier-filter]");
    if (compendiumTierFilterButton) {
      state.compendiumTierFilter = compendiumTierFilterButton.dataset.compendiumTierFilter ?? "todos";
      render();
      return;
    }

    const pageButton = target.closest<HTMLElement>("[data-page]");
    if (pageButton) {
      const nextPage = pageButton.dataset.page as Page;
      if (state.page === "progression" && nextPage !== "progression") state.progressionCompletionLevel = undefined;
      if (!isEditorPage(state.page) && !isEditorPage(nextPage)) {
        state.lastPlayerPage = state.page;
      }
      if (!isEditorPage(state.page) && isEditorPage(nextPage)) {
        state.lastPlayerPage = state.page;
      }
      state.page = nextPage;
      state.selectedItemId = undefined;
      state.deletingItemId = undefined;
      render();
      return;
    }

    const storedCardsButton = target.closest<HTMLElement>('[data-action="open-stored-cards"]');
    if (storedCardsButton) {
      if (state.page === "progression") state.progressionCompletionLevel = undefined;
      state.page = "storedCards";
      render();
      return;
    }

    const progressionHistoryButton = target.closest<HTMLElement>('[data-action="open-progression-history"]');
    if (progressionHistoryButton) {
      state.progressionHistoryOpen = true;
      render();
      return;
    }

    if (target.closest('[data-action="progression-step-back"]')) {
      if (state.character) {
        const transition = goBackInProgressionFlow(state.progressionStep, requiresTierExperience(state.character));
        state.progressionStep = transition.step;
        state.progressionError = transition.error;
      }
      renderProgressionSurface(appRoot, renderProgressionView(state.character!, getProgressionRenderDependencies()));
      return;
    }

    if (target.closest('[data-action="progression-step-next"]')) {
      if (state.character) {
        const transition = advanceProgressionFlow({
          step: state.progressionStep,
          choiceCount: getProgressionChoiceCount(state.progressionDraft),
          cardId: state.progressionCardId,
          requiresTierExperience: requiresTierExperience(state.character),
          tierExperienceName: state.progressionTierExperience?.name
        });
        state.progressionStep = transition.step;
        state.progressionError = transition.error;
      }
      renderProgressionSurface(appRoot, renderProgressionView(state.character!, getProgressionRenderDependencies()));
      return;
    }

    const progressionAdvanceButton = target.closest<HTMLElement>('[data-action="select-progression-advance"]');
    if (progressionAdvanceButton) {
      const kind = progressionAdvanceButton.dataset.progressionAdvance as ProgressionAdvanceKind;
      if (kind === "attributes" || kind === "experiences") {
        state.progressionPicker = kind;
        state.progressionPickerTier = Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber;
        state.progressionPickerIds = [];
      } else if (kind === "domain") {
        state.progressionCardPickerMode = "advance";
        state.progressionCardPickerTier = Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber;
        state.progressionCardTierFilter = "todos"; state.progressionCardDomainFilter = undefined;
        state.progressionCardPickerSelectionId = undefined;
        state.progressionCardPickerScrollTop = 0;
      } else if (kind === "subclass") {
        const character = state.character;
        if (character) {
          const tier = Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber;
          const next = getNextSubclassAdvance(character, tier, state.progressionDraft);
          if (next) {
            addProgressionChoice(state, { kind, tier, label: `Subclasse: ${next === "specialized" ? "Especializacao" : "Maestria"}` });
          }
        }
      } else if (kind === "multiclass") {
        const character = state.character;
        const tier = Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber;
        if (character && canChooseMulticlass(character, tier, state.progressionDraft)) {
          const initialClass = getEligibleMulticlassClasses(character, catalog)[0];
          const initialSubclass = catalog.subclasses.find((entry) => entry.classId === initialClass?.id);
          const initialFoundation = catalog.features.find((entry) => entry.sourceType === "subclass" && entry.sourceId === initialSubclass?.id && entry.tier === "foundation");
          const initialFeature = catalog.features.find((entry) => entry.sourceType === "class" && entry.sourceId === initialClass?.id && entry.tier === "class");
          state.progressionMulticlassOpen = true;
          state.progressionMulticlassTier = tier;
          state.progressionMulticlassDraft = {
            classId: initialClass?.id,
            domainId: initialClass?.domainIds[0],
            featureId: initialFeature?.id,
            subclassId: initialSubclass?.id,
            foundationFeatureId: initialFoundation?.id
          };
        }
      } else {
        addProgressionChoice(state, { kind, tier: Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber, label: progressionAdvanceLabels[kind] });
      }
      if (["attributes", "experiences", "domain", "multiclass"].includes(kind)) render({ preserveMainScroll: true }); else renderProgressionSurface(appRoot, renderProgressionView(state.character!, getProgressionRenderDependencies()));
      return;
    }

    if (target.closest('[data-action="confirm-progression-multiclass"]')) {
      const character = state.character;
      const tier = state.progressionMulticlassTier;
      if (character && tier) {
        const multiclass = buildMulticlassChoice(character, tier, state.progressionMulticlassDraft, catalog);
        if (multiclass) {
          const domainName = findDomain(catalog, multiclass.domainId)?.name ?? multiclass.domainId;
          addProgressionChoice(state, {
            kind: "multiclass",
            tier,
            multiclass: { ...multiclass, domainName },
            label: `Multiclasse: ${multiclass.className} · ${domainName} · ${multiclass.foundationFeatureName}`
          });
          state.progressionMulticlassOpen = false;
          state.progressionMulticlassTier = undefined;
          state.progressionMulticlassDraft = {};
        }
      }
      render({ preserveMainScroll: true });
      return;
    }

    const progressionPickerToggle = target.closest<HTMLElement>('[data-action="toggle-progression-picker"]');
    if (progressionPickerToggle) {
      const id = progressionPickerToggle.dataset.progressionPickerId;
      if (id) {
        state.progressionPickerIds = state.progressionPickerIds.includes(id)
          ? state.progressionPickerIds.filter((selectedId) => selectedId !== id)
          : state.progressionPickerIds.length < 2 ? [...state.progressionPickerIds, id] : state.progressionPickerIds;
        renderProgressionDialogInPlace(appRoot, ".progression-picker-modal", renderProgressionPickerModalView(getProgressionDialogDependencies()));
      }
      return;
    }

    if (target.closest('[data-action="confirm-progression-picker"]')) {
      const picker = state.progressionPicker;
      if (picker && state.progressionPickerIds.length === 2) {
        const character = state.character;
        const selected = picker === "attributes"
          ? character?.attributes.filter((attribute) => state.progressionPickerIds.includes(attribute.id)).map((attribute) => attributeTitle(attribute.label)).join(" e ")
          : character?.experiences.filter((experience) => state.progressionPickerIds.includes(experience.id)).map((experience) => experience.name).join(" e ");
        addProgressionChoice(state, {
          kind: picker,
          tier: state.progressionPickerTier ?? 2,
          label: `${progressionAdvanceLabels[picker]}: ${selected ?? ""}`,
          ...(picker === "attributes" ? { attributeIds: state.progressionPickerIds } : { experienceIds: state.progressionPickerIds })
        });
      }
      state.progressionPicker = undefined;
      state.progressionPickerTier = undefined;
      state.progressionPickerIds = [];
      render({ preserveMainScroll: true });
      return;
    }

    const removeProgressionChoiceButton = target.closest<HTMLElement>('[data-action="remove-progression-choice"]');
    if (removeProgressionChoiceButton) {
      const index = Number(removeProgressionChoiceButton.dataset.progressionChoiceIndex);
      state.progressionDraft = state.progressionDraft.filter((_, choiceIndex) => choiceIndex !== index);
      state.progressionError = undefined;
      renderProgressionSurface(appRoot, renderProgressionView(state.character!, getProgressionRenderDependencies()));
      return;
    }

    if (target.closest('[data-action="open-progression-card-picker"]')) {
      state.progressionCardPickerMode = "mandatory";
      state.progressionCardPickerTier = undefined;
      state.progressionCardTierFilter = "todos"; state.progressionCardDomainFilter = undefined;
      state.progressionCardPickerSelectionId = state.progressionCardId;
      state.progressionCardPickerScrollTop = 0;
      render({ preserveMainScroll: true });
      return;
    }

    const progressionCardTierFilter = target.closest<HTMLElement>('[data-action="filter-progression-card-tier"]');
    if (progressionCardTierFilter) {
      const value = progressionCardTierFilter.dataset.progressionCardTier;
      state.progressionCardTierFilter = value === "todos" || !value ? "todos" : Number(value);
      state.progressionCardPickerScrollTop = 0;
      renderProgressionDialogInPlace(appRoot, ".progression-card-picker-modal", renderProgressionCardPickerModalView(getProgressionDialogDependencies()));
      return;
    }

    if (target.closest('[data-action="open-tier-experience"]')) {
      state.progressionTierExperienceOpen = true;
      state.progressionTierExperienceError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="save-tier-experience"]')) {
      const name = getCardFormValue("[data-tier-experience-name]");
      const description = getCardFormValue("[data-tier-experience-description]");
      state.progressionTierExperience = { name, description };
      if (!name) {
        state.progressionTierExperienceError = "Informe o nome da nova Experiencia.";
      } else {
        state.progressionTierExperienceError = undefined;
        state.progressionTierExperienceOpen = false;
        state.progressionError = undefined;
      }
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="select-progression-card"]')) {
      state.progressionCardPickerScrollTop = appRoot.querySelector<HTMLElement>(".progression-card-choice-list")?.scrollTop ?? 0;
    }
    if (target.closest('[data-action="filter-progression-card-domain"]')) {
      state.progressionCardPickerScrollTop = 0;
    }
    if (handleProgressionCardPickerAction(target, { state, addChoice: (choice) => { addProgressionChoice(state, choice); }, findCard: (id) => findDefinition(catalog, id) as CardDefinition | undefined })) {
      if (state.progressionCardPickerMode) {
        renderProgressionDialogInPlace(appRoot, ".progression-card-picker-modal", renderProgressionCardPickerModalView(getProgressionDialogDependencies()));
      } else {
        render({ preserveMainScroll: true });
      }
      return;
    }

    if (target.closest('[data-action="apply-progression"]')) {
      void applyProgression({ state, catalog, saveCharacter }).then((updated) => { if (updated) render(); });
      return;
    }

    if (target.closest('[data-action="add-container"]')) {
      state.addContainerOpen = true;
      render();
      return;
    }

    const openAddItemButton = target.closest<HTMLElement>('[data-action="open-add-item-to-container"]');
    if (openAddItemButton) {
      state.addItemToCompartmentId = openAddItemButton.dataset.compartmentId;
      state.addingDefinitionItemId = undefined; state.addItemPreviewDefinitionId = undefined; state.addItemCatalogScrollTop = 0;
      state.addItemCatalogFilter = "todos"; state.addItemCatalogTierFilter = "todos"; state.addItemCatalogSearch = "";
      state.addItemError = undefined;
      render();
      return;
    }

    const addItemFilterButton = target.closest<HTMLElement>("[data-add-item-filter],[data-add-item-tier-filter]");
    if (addItemFilterButton) { const tier = addItemFilterButton.dataset.addItemTierFilter; if (tier) state.addItemCatalogTierFilter = tier; else state.addItemCatalogFilter = addItemFilterButton.dataset.addItemFilter as InventoryFilter; state.addingDefinitionItemId = undefined; state.addItemCatalogScrollTop = 0; state.addItemError = undefined; render({ preserveMainScroll: true }); return; }

    const addItemPreviewButton = target.closest<HTMLElement>("[data-add-item-preview-definition-id]");
    if (addItemPreviewButton) { state.addItemCatalogScrollTop = appRoot.querySelector<HTMLElement>(".add-item-catalog")?.scrollTop ?? 0; state.addItemPreviewDefinitionId = addItemPreviewButton.dataset.addItemPreviewDefinitionId; state.addItemError = undefined; render({ preserveMainScroll: true }); return; }

    const selectAddItemFromPreviewButton = target.closest<HTMLElement>('[data-action="select-add-item-from-preview"]');
    if (selectAddItemFromPreviewButton) { state.addingDefinitionItemId = selectAddItemFromPreviewButton.dataset.itemId; state.addItemPreviewDefinitionId = undefined; state.addItemError = undefined; render({ preserveMainScroll: true }); return; }

    if (target.closest('[data-action="confirm-add-item-to-container"]')) {
      void addItemToContainerAction(getInventoryActionDependencies());
      return;
    }

    if (target.closest('[data-action="create-container"]')) {
      void createInventoryContainerAction(getInventoryActionDependencies());
      return;
    }

    const deleteContainerButton = target.closest<HTMLElement>('[data-action="delete-container"]');
    if (deleteContainerButton) {
      state.deleteContainerId = deleteContainerButton.dataset.compartmentId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-container"]')) {
      state.deleteContainerId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-container"]')) {
      void deleteInventoryContainerAction(state.deleteContainerId, getInventoryActionDependencies());
      return;
    }

    const deleteItemButton = target.closest<HTMLElement>('[data-action="delete-item"]');
    if (deleteItemButton) {
      prepareDeleteInventoryItemAction(deleteItemButton.dataset.inventoryEntryId, getInventoryActionDependencies());
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-item"]')) {
      state.deletingItemId = undefined;
      state.deletingItemQuantity = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-item"]')) {
      void deleteInventoryItemAction(state.deletingItemId, getInventoryActionDependencies());
      return;
    }

    if (handleNoteAction(target, { state, saveCharacter, render: () => render({ preserveMainScroll: true }) })) return;

    const moveItemButton = target.closest<HTMLElement>('[data-action="move-item"]');
    if (moveItemButton) {
      void moveItemToCompartmentAction(moveItemButton.dataset.inventoryEntryId, moveItemButton.dataset.targetCompartmentId, getInventoryActionDependencies());
      return;
    }

    const splitItemButton = target.closest<HTMLElement>('[data-action="split-item"]');
    if (splitItemButton) {
      void splitInventoryItemAction(splitItemButton.dataset.inventoryEntryId, getInventoryActionDependencies());
      return;
    }

    const filterButton = target.closest<HTMLElement>("[data-inventory-filter]");
    if (filterButton) {
      state.inventoryFilter = filterButton.dataset.inventoryFilter as InventoryFilter;
      render();
      return;
    }

    const itemButton = target.closest<HTMLElement>("[data-item-id]");
    if (itemButton) {
      state.selectedItemId = itemButton.dataset.inventoryEntryId;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="add-resource"]')) {
      state.addResourceModalOpen = true;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="save-resource"]')) {
      void createResource();
      return;
    }

    if (handleFeatureEffectAction(target, { state, catalog, saveCharacter, render: () => render({ preserveMainScroll: true }) })) return;

    const cardModalButton = target.closest<HTMLElement>("[data-card-modal-id]");
    if (cardModalButton) {
      state.modalCardId = cardModalButton.dataset.cardModalId;
      state.featureActivationError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    const activateStoredCardButton = target.closest<HTMLElement>('[data-action="activate-stored-card"]');
    if (activateStoredCardButton) {
      state.activatingStoredCardId = activateStoredCardButton.dataset.cardId;
      state.cardActivationError = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="activate-stored-card-free"]')) {
      void activateStoredCard("rest");
      return;
    }

    if (target.closest('[data-action="activate-stored-card-stress"]')) {
      void activateStoredCard("stress");
      return;
    }

    const progressionOptionButton = target.closest<HTMLElement>('[data-action="progression-option"]');
    if (progressionOptionButton) {
      return;
    }

    const cardButton = target.closest<HTMLElement>("[data-card-id]");
    if (cardButton) {
      state.selectedCardId = cardButton.dataset.cardId ?? state.selectedCardId;
      render();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modalCardId) {
      state.modalCardId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.selectedItemId) {
      state.selectedItemId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.addItemToCompartmentId) {
      state.addItemToCompartmentId = undefined; state.addItemPreviewDefinitionId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.deletingItemId) {
      state.deletingItemId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.resourceModalId) {
      state.resourceModalId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.progressionHistoryOpen) {
      state.progressionHistoryOpen = false;
      render();
    }

    if (event.key === "Escape" && state.progressionPicker) {
      state.progressionPicker = undefined;
      state.progressionPickerIds = [];
      render();
    }

    if (event.key === "Escape" && state.progressionCardPickerMode) {
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      render();
    }

    if (event.key === "Escape" && state.progressionTierExperienceOpen) {
      state.progressionTierExperienceOpen = false;
      state.progressionTierExperienceError = undefined;
      render();
    }

    if (event.key === "Escape" && state.progressionMulticlassOpen) {
      state.progressionMulticlassOpen = false;
      state.progressionMulticlassTier = undefined;
      state.progressionMulticlassDraft = {};
      render();
    }

    if (handleNoteEscape(event, { state, saveCharacter, render: () => render({ preserveMainScroll: true }) })) return;

    if (event.key === "Escape" && (state.domainModalOpen || state.deletingDomainId)) {
      state.domainModalOpen = false;
      state.editingDomainId = undefined;
      state.deletingDomainId = undefined;
      render();
    }

    if (event.key === "Escape" && (state.cardModalOpen || state.deletingCompendiumCardId)) {
      state.cardModalOpen = false;
      state.editingCompendiumCardId = undefined;
      state.deletingCompendiumCardId = undefined;
      render();
    }

    if (event.key === "Escape" && (state.itemDefinitionModalOpen || state.deletingCompendiumItemId || state.compendiumItemPreviewId)) {
      state.itemDefinitionModalOpen = false;
      state.editingCompendiumItemId = undefined;
      state.deletingCompendiumItemId = undefined;
      state.compendiumItemPreviewId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && (state.classModalOpen || state.deletingCompendiumClassId || state.compendiumClassPreviewId)) {
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.compendiumClassPreviewId = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && (state.ancestryModalOpen || state.deletingCompendiumAncestryId || state.compendiumAncestryPreviewId || state.communityModalOpen || state.deletingCompendiumCommunityId || state.compendiumCommunityPreviewId || state.transformationState.transformationModalOpen || state.transformationState.deletingCompendiumTransformationId || state.transformationState.compendiumTransformationPreviewId)) { state.ancestryModalOpen = false; state.editingCompendiumAncestryId = undefined; state.deletingCompendiumAncestryId = undefined; state.compendiumAncestryPreviewId = undefined; state.communityModalOpen = false; state.editingCompendiumCommunityId = undefined; state.deletingCompendiumCommunityId = undefined; state.compendiumCommunityPreviewId = undefined; state.transformationState.transformationModalOpen = false; state.transformationState.editingCompendiumTransformationId = undefined; state.transformationState.deletingCompendiumTransformationId = undefined; state.transformationState.compendiumTransformationPreviewId = undefined; render({ preserveMainScroll: true }); }

    if (event.key === "Escape" && state.activatingStoredCardId) {
      state.activatingStoredCardId = undefined;
      state.cardActivationError = undefined;
      render({ preserveMainScroll: true });
    }

    if (event.key === "Escape" && state.characterImportOpen) {
      state.characterImportOpen = false;
      state.pendingCharacterImport = undefined;
      state.characterImportError = undefined;
      render({ preserveMainScroll: true });
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.matches("[data-inventory-search]")) {
      state.inventorySearch = target.value;
      render();
      focusInventorySearch();
    }

    if (target.matches("[data-compendium-card-search]")) {
      state.compendiumCardSearch = target.value;
      render();
      focusCompendiumCardSearch();
    }

    if (target.matches("[data-compendium-item-search]")) {
      state.compendiumItemSearch = target.value;
      render();
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>("[data-compendium-item-search]");
        input?.focus({ preventScroll: true });
        input?.setSelectionRange(input.value.length, input.value.length);
      });
    }

    if (target.matches("[data-add-item-catalog-search]")) { state.addItemCatalogSearch = target.value; state.addItemCatalogScrollTop = 0; render({ preserveMainScroll: true }); requestAnimationFrame(() => { const input = document.querySelector<HTMLInputElement>("[data-add-item-catalog-search]"); input?.focus({ preventScroll: true }); input?.setSelectionRange(input.value.length, input.value.length); }); }

    if (target.matches("[data-compendium-ancestry-search]")) {
      state.compendiumAncestrySearch = target.value;
      render({ preserveMainScroll: true });
      focusCompendiumAncestrySearch();
    }

    if (target.matches("[data-compendium-community-search]")) { state.compendiumCommunitySearch = target.value; render({ preserveMainScroll: true }); requestAnimationFrame(() => { const search = document.querySelector<HTMLInputElement>("[data-compendium-community-search]"); search?.focus({ preventScroll: true }); search?.setSelectionRange(search.value.length, search.value.length); }); }
    if (target.matches("[data-compendium-transformation-search]")) { state.transformationState.compendiumTransformationSearch = target.value; render({ preserveMainScroll: true }); requestAnimationFrame(() => { const search = document.querySelector<HTMLInputElement>("[data-compendium-transformation-search]"); search?.focus({ preventScroll: true }); search?.setSelectionRange(search.value.length, search.value.length); }); }

    if (target.matches("[data-character-ancestry-search]")) {
      state.characterCreationAncestrySearch = target.value;
      renderCharacterCreationInPlace();
      requestAnimationFrame(() => {
        const search = document.querySelector<HTMLInputElement>("[data-character-ancestry-search]");
        search?.focus({ preventScroll: true });
        search?.setSelectionRange(search.value.length, search.value.length);
      });
    }

    if (target.matches("[data-character-community-search]")) { state.characterCreationCommunitySearch = target.value; renderCharacterCreationInPlace(); requestAnimationFrame(() => { const search = document.querySelector<HTMLInputElement>("[data-character-community-search]"); search?.focus({ preventScroll: true }); search?.setSelectionRange(search.value.length, search.value.length); }); }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.matches("[data-rest-roll-index]")) {
      handleRestRollInput(target, state);
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-compendium-community-pack-filter]")) {
      state.compendiumCommunityPackId = target.value;
      render({ preserveMainScroll: true });
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-community-pack-filter]")) {
      state.characterCreationCommunityPackId = target.value;
      renderCharacterCreationInPlace();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-progression-multiclass-class]")) {
      const classDefinition = catalog.classes.find((entry) => entry.id === target.value);
      const subclass = catalog.subclasses.find((entry) => entry.classId === classDefinition?.id);
      const feature = catalog.features.find((entry) => entry.sourceType === "class" && entry.sourceId === classDefinition?.id && entry.tier === "class");
      const foundation = catalog.features.find((entry) => entry.sourceType === "subclass" && entry.sourceId === subclass?.id && entry.tier === "foundation");
      state.progressionMulticlassDraft = { classId: target.value, domainId: classDefinition?.domainIds[0], featureId: feature?.id, subclassId: subclass?.id, foundationFeatureId: foundation?.id };
      render({ preserveMainScroll: true });
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-progression-multiclass-domain]")) {
      state.progressionMulticlassDraft = { ...state.progressionMulticlassDraft, domainId: target.value };
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-progression-multiclass-feature]")) {
      state.progressionMulticlassDraft = { ...state.progressionMulticlassDraft, featureId: target.value };
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-progression-multiclass-subclass]")) {
      const foundation = catalog.features.find((entry) => entry.sourceType === "subclass" && entry.sourceId === target.value && entry.tier === "foundation");
      state.progressionMulticlassDraft = { ...state.progressionMulticlassDraft, subclassId: target.value, foundationFeatureId: foundation?.id };
      render({ preserveMainScroll: true });
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-progression-multiclass-foundation]")) {
      state.progressionMulticlassDraft = { ...state.progressionMulticlassDraft, foundationFeatureId: target.value };
      return;
    }
    if (target instanceof HTMLSelectElement && (target.matches("[data-game-marker-kind]") || target.matches("[data-game-marker-quantity-kind]"))) {
      updateGameMarkerAuthoringForm(target);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-pack-file]")) {
      const files = Array.from(target.files ?? []);
      if (files.length) void readPackImportFiles(files, getPackManagementDependencies()).then(() => render());
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-file]")) {
      const file = target.files?.[0];
      if (file) void stageCharacterImport(state, file).then(() => render({ preserveMainScroll: true }));
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-portrait]")) {
      const file = target.files?.[0];
      if (!file) return;
      // O upload provoca uma nova renderização para mostrar a prévia. Salva o
      // que ainda está apenas no DOM antes disso, para não perder a identidade.
      syncCharacterCreationDraftFromForm(state);
      void readCharacterPortrait(file).then((portraitImage) => {
        state.characterCreationPortraitImage = portraitImage;
        render({ preserveMainScroll: true });
      }).catch((error) => window.alert(error instanceof Error ? error.message : "Não foi possível usar a imagem."));
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-portrait-replace]")) {
      const file = target.files?.[0];
      if (file) void replaceCharacterPortrait(file);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-ancestry-id]")) {
      const ancestryId = target.dataset.characterAncestryId;
      if (!ancestryId) return;
      toggleCharacterCreationAncestry(state, ancestryId, target.checked);
      renderCharacterCreationInPlace();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-top-feature]")) {
      selectCharacterCreationTopFeature(state, catalog, target.value);
      renderCharacterCreationInPlace();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-bottom-feature]")) {
      state.characterCreationBottomFeatureId = target.value;
      state.characterCreationError = undefined;
      renderCharacterCreationInPlace();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-class]")) {
      selectCharacterCreationClass(state, catalog, getCharacterCreationFallback(), target.value);
      renderCharacterCreationInPlace();
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-subclass-id]")) {
      state.characterCreationSubclassId = target.dataset.characterSubclassId;
      state.characterCreationError = undefined;
      renderCharacterCreationInPlace();
      return;
    }
  });
}

async function boot(): Promise<void> {
  render();
  bindEvents();
  bindInventoryDragEvents(getInventoryDragDependencies());
  await refreshCatalog();
  await ensureDemoCharacter();
  await ensureDemoKaelII();
  state.characters = await listCharacters();
  // A sessão sempre começa no seletor: abrir uma ficha é uma ação consciente do jogador.
  state.character = undefined;
  state.characterSelectionOpen = true;
  render();
}

void boot();
