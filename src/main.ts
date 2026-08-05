import { baseCatalog } from "./content/installedPacks";
import { createCatalog, findDefinition, findDomain } from "./domain/catalog";
import { demoCharacter } from "./domain/demoCharacter";
import type { AncestryDefinition, CardDefinition, Character, CharacterNote, CharacterNoteCategory, CharacterSkill, CharacterProgressionEntry, ClassDefinition, Definition, FeatureDefinition, InventoryCompartment, ItemDefinition, PackBundle, PackManifest, ProgressionAdvanceKind, SubclassDefinition } from "./domain/types";
import { ensureDemoCharacter, listCharacters, loadCharacter, saveCharacter } from "./storage/characterRepository";
import { deleteCustomDefinition, loadCustomDefinitions, saveCustomDefinition } from "./storage/compendiumRepository";
import { installLocalPack, loadInstalledPacks, removeLocalPack } from "./storage/packRepository";
import { renderSettings as renderSettingsPage, getPackDefinitionSummary } from "./features/settings/renderSettings";
import { getPackDisplayDescription, getPackDisplayName, getPackOriginName } from "./features/compendium/packPresentation";
import { getTierForLevel, progressionAdvanceLabels } from "./features/progression/progressionRules";
import { isFinalCharacterCreationStep, nextCharacterCreationStep, previousCharacterCreationStep, type CharacterCreationStep } from "./features/character-creation/creationFlow";
import { renderProgression as renderProgressionView, type ProgressionRenderDependencies } from "./features/progression/renderProgression";
import {
  renderProgressionCardPickerModal as renderProgressionCardPickerModalView,
  renderProgressionConfirmationModal as renderProgressionConfirmationModalView,
  renderProgressionHistoryModal as renderProgressionHistoryModalView,
  renderProgressionPickerModal as renderProgressionPickerModalView,
  renderTierExperienceModal as renderTierExperienceModalView,
  type ProgressionDialogDependencies
} from "./features/progression/renderProgressionDialogs";
import {
  renderProgressionDomainStep as renderProgressionDomainStepView,
  renderProgressionDraft as renderProgressionDraftView,
  renderProgressionOptions as renderProgressionOptionsView,
  type ProgressionWorkspaceDependencies
} from "./features/progression/renderProgressionWorkspace";
import {
  renderDeleteNoteModal as renderDeleteNoteModalView,
  renderNoteModal as renderNoteModalView,
  renderNotes as renderNotesView,
  renderViewNoteModal as renderViewNoteModalView,
  type NotesRenderDependencies
} from "./features/notes/renderNotes";
import {
  renderAddItemToContainerModal as renderAddItemToContainerModalView,
  renderDeleteItemModal as renderDeleteItemModalView,
  renderInventory as renderInventoryView,
  renderItemModal as renderItemModalView,
  renderItemVisual as renderItemVisualView,
  renderResourceModal as renderResourceModalView,
  type InventoryRenderDependencies
} from "./features/inventory/renderInventory";
import {
  addItemToContainer as addItemToContainerAction,
  createInventoryContainer as createInventoryContainerAction,
  deleteInventoryContainer as deleteInventoryContainerAction,
  deleteInventoryItem as deleteInventoryItemAction,
  moveItemToCompartment as moveItemToCompartmentAction,
  type InventoryActionDependencies
} from "./features/inventory/inventoryActions";
import {
  bindInventoryDragEvents,
  consumeInventoryDragClickSuppression,
  type InventoryDragDependencies
} from "./features/inventory/bindInventoryDrag";
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
  saveCompendiumCard as saveCompendiumCardAction,
  type CardFeatureDependencies
} from "./features/compendium/cards";
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
  removeCompendiumAncestry as removeCompendiumAncestryAction,
  renderCompendiumAncestriesManager as renderCompendiumAncestriesManagerView,
  renderCompendiumAncestryFormModal as renderCompendiumAncestryFormModalView,
  renderDeleteCompendiumAncestryModal as renderDeleteCompendiumAncestryModalView,
  saveCompendiumAncestry as saveCompendiumAncestryAction,
  type AncestryFeatureDependencies
} from "./features/compendium/ancestries";
import type { CompendiumSpread, CompendiumView, InventoryFilter, Page, ProgressionDraftChoice, ProgressionPicker, ProgressionTierNumber, SettingsSection } from "./app/types";
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
const activeCharacterStorageKey = "soulforge.active-character-id";
let catalog = baseCatalog;
let modalBackdropPointerDown = false;

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
  compendiumItemFilter: InventoryFilter;
  compendiumAncestrySearch: string;
  lastPlayerPage: Page;
  selectedItemId?: string;
  selectedCardId: string;
  selectedProgressionTier: ProgressionTierNumber;
  modalCardId?: string;
  resourceModalId?: string;
  progressionHistoryOpen: boolean;
  progressionPicker?: ProgressionPicker;
  progressionPickerTier?: ProgressionTierNumber;
  progressionPickerIds: string[];
  progressionDraft: ProgressionDraftChoice[];
  progressionConfirmationOpen: boolean;
  progressionError?: string;
  progressionCardPickerMode?: "mandatory" | "advance";
  progressionCardPickerTier?: ProgressionTierNumber;
  progressionCardId?: string;
  progressionCardDestination: "loadout" | "vault";
  progressionTierExperienceOpen: boolean;
  progressionTierExperience?: { name: string; description: string };
  progressionTierExperienceError?: string;
  addContainerOpen: boolean;
  deleteContainerId?: string;
  deletingItemId?: string;
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
  addItemCatalogFilter: InventoryFilter;
  addItemError?: string;
  classModalOpen: boolean;
  ancestryModalOpen: boolean;
  editingCompendiumAncestryId?: string;
  deletingCompendiumAncestryId?: string;
  characterSelectionOpen: boolean;
  characterCreationOpen: boolean;
  characterCreationStep: CharacterCreationStep;
  characterCreationName: string;
  characterCreationCommunity: string;
  characterCreationClassId?: string;
  characterCreationSubclassId?: string;
  characterCreationAncestryIds: string[];
  characterCreationAncestrySearch: string;
  characterCreationTopFeatureId?: string;
  characterCreationBottomFeatureId?: string;
  characterCreationError?: string;
  characters: Character[];
  editingCompendiumClassId?: string;
  deletingCompendiumClassId?: string;
  installedPacks: PackManifest[];
  packImportOpen: boolean;
  pendingPackBundle?: PackBundle;
  packImportError?: string;
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
  compendiumItemFilter: "todos",
  compendiumAncestrySearch: "",
  lastPlayerPage: "overview",
  selectedCardId: "card.demo.dread-veil",
  selectedProgressionTier: 2,
  progressionHistoryOpen: false,
  progressionPickerIds: [],
  progressionDraft: [],
  progressionConfirmationOpen: false,
  progressionCardDestination: "loadout",
  progressionTierExperienceOpen: false,
  addContainerOpen: false,
  noteModalOpen: false,
  domainModalOpen: false,
  cardModalOpen: false,
  itemDefinitionModalOpen: false,
  addItemCatalogFilter: "todos",
  classModalOpen: false,
  ancestryModalOpen: false,
  characterSelectionOpen: true,
  characterCreationOpen: false,
  characterCreationStep: 1,
  characterCreationName: "",
  characterCreationCommunity: "",
  characterCreationAncestryIds: [],
  characterCreationAncestrySearch: "",
  characters: [],
  installedPacks: [],
  packImportOpen: false,
  openSettingsSections: {
    general: true,
    localData: false,
    loadRules: false,
    appearance: false,
    progression: false
  }
};

const appVersion = "0.10.0";

const itemFilterLabels: Record<InventoryFilter, string> = {
  todos: "Tudo",
  arma: "Armas",
  armadura: "Armaduras",
  consumivel: "Consumiveis",
  equipamento: "Equipamentos",
  loot: "Loot"
};

const skillSourceLabels: Record<Character["skills"][number]["source"], string> = {
  class: "Classe",
  ancestry: "Ancestralidade",
  community: "Comunidade"
};

const noteCategoryLabels: Record<CharacterNoteCategory, string> = {
  session: "Sessao",
  npc: "NPC",
  place: "Local",
  quest: "Missao",
  item: "Item",
  free: "Livre"
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

function getItemEntries(character: Character) {
  return character.inventory.entries
    .map((entry) => {
      const definition = findDefinition(catalog, entry.definitionId);
      return definition?.type === "item" ? { entry, item: definition } : undefined;
    })
    .filter((entry): entry is { entry: Character["inventory"]["entries"][number]; item: ItemDefinition } => Boolean(entry));
}

function getInventoryCompartments(character: Character): InventoryCompartment[] {
  return character.inventory.compartments?.length
    ? character.inventory.compartments
    : [
        { id: "equipped", name: "Equipados", source: "character" },
        { id: "backpack", name: "Mochila", capacity: character.inventory.capacity, source: "character" }
      ];
}

function getEntryCompartmentId(entry: Character["inventory"]["entries"][number]): string {
  return entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack");
}

function getCompartmentWeight(entries: ReturnType<typeof getItemEntries>, compartmentId: string): number {
  return entries
    .filter(({ entry }) => getEntryCompartmentId(entry) === compartmentId)
    .reduce((total, { entry, item }) => total + entry.quantity * item.weight, 0);
}

function canCompartmentAcceptItem(compartment: InventoryCompartment, item: ItemDefinition): boolean {
  return !compartment.accepts?.length || compartment.accepts.includes(item.category);
}

function wouldFitCompartment(
  compartment: InventoryCompartment,
  entries: ReturnType<typeof getItemEntries>,
  item: ItemDefinition,
  quantity: number,
  currentCompartmentId: string
): boolean {
  if (!compartment.capacity || compartment.id === currentCompartmentId) {
    return true;
  }

  const currentWeight = getCompartmentWeight(entries, compartment.id);
  return currentWeight + item.weight * quantity <= compartment.capacity;
}

function canAddItemToCompartment(
  compartment: InventoryCompartment,
  entries: ReturnType<typeof getItemEntries>,
  item: ItemDefinition,
  quantity: number
): boolean {
  return canCompartmentAcceptItem(compartment, item) && (!compartment.capacity || getCompartmentWeight(entries, compartment.id) + item.weight * quantity <= compartment.capacity);
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
    progressPercent
  };
}

function getPlayerOverviewDependencies(): PlayerOverviewDependencies {
  return {
    escapeHtml,
    renderResources: (character) => renderResourcesView(character, getPlayerShellDependencies()),
    renderEmptyInline,
    getActiveCards,
    getInactiveCardCount,
    getStoredCards,
    getAcquiredSubclassTiers: (character) => getProgression(character).acquiredSubclassTiers
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
    saveCustomDefinition,
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

function renderSkills(character: Character): string {
  const communitySkills = character.skills.filter((skill) => skill.source === "community");

  return `
    <main class="content">
      <div class="screen-title">
        <div>
          <h1>Tracos</h1>
          <p>Experiencias e habilidades de origem que definem o personagem fora do Loadout.</p>
        </div>
      </div>
      <section class="traits-experience-section">
        <div class="section-heading">
          <h2>Experiencias</h2>
        </div>
        ${renderExperienceList(character)}
      </section>
      <div class="traits-skill-layout">
        <section class="skill-column">
          <div class="section-heading">
            <h2>Ancestralidade</h2>
          </div>
          ${renderAncestryFeatureSelection(character)}
        </section>
        <section class="skill-column">
          <div class="section-heading">
            <h2>${skillSourceLabels.community}</h2>
          </div>
          ${renderSkillList(communitySkills)}
        </section>
      </div>
    </main>
  `;
}

function renderAncestryFeatureSelection(character: Character): string {
  const compactName = (value: string) => value.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLocaleLowerCase("pt-BR");
  const selectedAncestries = (character.identity.ancestryIds?.length
    ? character.identity.ancestryIds.map((id) => catalog.ancestries.find((ancestry) => ancestry.id === id))
    : [character.identity.primaryAncestryId
      ? catalog.ancestries.find((ancestry) => ancestry.id === character.identity.primaryAncestryId)
      : catalog.ancestries.find((ancestry) => compactName(ancestry.name) === compactName(character.identity.ancestry))]
  ).filter((ancestry): ancestry is AncestryDefinition => Boolean(ancestry));
  const primaryAncestry = selectedAncestries[0];
  const featureFor = (position: "top" | "bottom"): FeatureDefinition | undefined => {
    const selectedId = character.identity.ancestryFeatureIds?.[position];
    const defaultId = position === "top" ? primaryAncestry?.topFeatureId : primaryAncestry?.bottomFeatureId;
    return catalog.features.find((feature) => feature.id === (selectedId ?? defaultId));
  };
  const top = featureFor("top");
  const bottom = featureFor("bottom");

  if (!primaryAncestry || !top || !bottom) {
    return renderEmptyInline("Importe o Pack da ancestralidade para exibir as Features Top e Bottom deste personagem.");
  }
  const ancestryForFeature = (feature: FeatureDefinition) => selectedAncestries.find((ancestry) => ancestry.id === feature.sourceId) ?? primaryAncestry;
  const ancestryLabel = selectedAncestries.map((ancestry) => ancestry.name).join(" + ");

  return `
    <div class="ancestry-traits" aria-label="Features de ${escapeHtml(ancestryLabel)}">
      <div class="ancestry-traits-name">
        <span>${selectedAncestries.length === 1 ? "Ancestralidade selecionada" : "Ancestralidades selecionadas"}</span>
        <strong>${escapeHtml(ancestryLabel)}</strong>
      </div>
      <div class="ancestry-feature-grid">
        ${renderAncestryFeatureCard("Top", top, ancestryForFeature(top))}
        ${renderAncestryFeatureCard("Bottom", bottom, ancestryForFeature(bottom))}
      </div>
    </div>
  `;
}

function renderAncestryFeatureCard(position: "Top" | "Bottom", feature: FeatureDefinition, ancestry: AncestryDefinition): string {
  return `
    <article class="ancestry-feature-card ancestry-feature-${position.toLowerCase()}">
      <div><span>${position}</span><small>${escapeHtml(ancestry.name)}</small></div>
      <strong>${escapeHtml(feature.name)}</strong>
      <p>${escapeHtml(feature.summary)}</p>
    </article>
  `;
}

function renderSkillList(skills: Character["skills"]): string {
  if (!skills.length) {
    return renderEmptyInline("Nenhuma habilidade registrada.");
  }

  return `
    <div class="info-list">
      ${skills
        .map(
          (skill) => `
            <article class="info-card">
              <div>
                <strong>${escapeHtml(skill.name)}</strong>
                <span>${skillSourceLabels[skill.source]}</span>
              </div>
              <p>${escapeHtml(skill.description)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderExperienceList(character: Character): string {
  return character.experiences.length
    ? `<div class="experience-grid">
              ${character.experiences
                .map(
                  (experience) => `
                    <article class="experience-card">
                      <div>
                        <strong>${escapeHtml(experience.name)}</strong>
                        ${experience.description ? `<p>${escapeHtml(experience.description)}</p>` : ""}
                      </div>
                      <span>+${experience.value}</span>
                    </article>
                  `
                )
                .join("")}
            </div>`
    : renderEmptyInline("Nenhuma experiencia registrada.");
}

function renderSettings(character: Character): string {
  return renderSettingsPage({
    character,
    appVersion,
    state,
    escapeHtml,
    getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs),
    getPackDisplayDescription
  });
}

function renderPackImportModal(): string {
  if (!state.packImportOpen) return "";
  const bundle = state.pendingPackBundle;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal pack-import-modal" role="dialog" aria-modal="true" aria-labelledby="pack-import-title">
        <button class="modal-close" type="button" data-modal-close aria-label="Fechar importacao">x</button>
        <span class="resource-modal-label">Dados locais</span>
        <h2 id="pack-import-title">Importar Pack local</h2>
        ${bundle ? `
          <div class="pack-import-preview">
            <span>Pronto para instalar</span>
            <h3>${escapeHtml(bundle.manifest.name)}</h3>
            <p>v${escapeHtml(bundle.manifest.version)} · ${escapeHtml(bundle.manifest.description)}</p>
            <strong>${escapeHtml(getPackDefinitionSummary(bundle.definitions))}</strong>
          </div>
          <p class="settings-panel-copy">O conteúdo será salvo somente neste navegador e poderá ser removido depois com confirmação.</p>
          <div class="modal-actions">
            <button class="secondary-action" type="button" data-action="choose-pack-file">Escolher outro arquivo</button>
            <button class="primary-action" type="button" data-action="confirm-pack-import">Instalar Pack</button>
          </div>
        ` : `
          <p>Selecione um arquivo <strong>.soulforge-pack.json</strong>. O SoulForge exibirá uma prévia antes de instalar.</p>
          <button class="primary-action" type="button" data-action="choose-pack-file">Selecionar arquivo</button>
        `}
        <input type="file" accept="application/json,.json,.soulforge-pack.json" data-pack-file hidden>
        <p class="form-error" data-pack-import-error ${state.packImportError ? "" : "hidden"}>${escapeHtml(state.packImportError ?? "")}</p>
      </section>
    </div>
  `;
}

function renderRemoveInstalledPackModal(): string {
  const pack = state.installedPacks.find((entry) => entry.id === state.deletingInstalledPackId);
  if (!pack) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="remove-pack-title"><h2 id="remove-pack-title">Remover Pack?</h2><p><strong>${escapeHtml(pack.name)}</strong> e todas as suas Definitions serão removidos deste dispositivo. Personagens que usem esse conteúdo poderão ficar com referências indisponíveis.</p><div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-remove-installed-pack">Cancelar</button><button class="danger-action" type="button" data-action="confirm-remove-installed-pack">Remover Pack</button></div></section></div>`;
}

function getProgression(character: Character) {
  return character.progression ?? { attributeMarks: {}, acquiredSubclassTiers: ["foundation" as const], advancementSelections: [], history: [] };
}

function getAdvanceSlotsUsed(character: Character, tier: ProgressionTierNumber, kind: ProgressionAdvanceKind): number {
  const stored = getProgression(character).advancementSelections.filter((selection) => selection.tier === tier && selection.kind === kind).length;
  const draft = state.progressionDraft.filter((choice) => choice.tier === tier && choice.kind === kind).length;
  return stored + draft;
}

function getNextSubclassAdvance(character: Character, tier: ProgressionTierNumber): "specialized" | "mastery" | undefined {
  const acquired = getProgression(character).acquiredSubclassTiers;
  if (!acquired.includes("specialized") && tier >= 3) {
    return "specialized";
  }
  if (acquired.includes("specialized") && !acquired.includes("mastery") && tier >= 4) {
    return "mastery";
  }
  return undefined;
}

function getProgressionChoiceCost(choice: ProgressionDraftChoice): number {
  return choice.kind === "proficiency" ? 2 : 1;
}

function getProgressionChoiceCount(): number {
  return state.progressionDraft.reduce((total, choice) => total + getProgressionChoiceCost(choice), 0);
}

function getPrimaryDomainIds(character: Character): string[] {
  const byId = character.identity.primaryClassId ? catalog.classes.find((definition) => definition.id === character.identity.primaryClassId) : undefined;
  const byName = catalog.classes.find((definition) => definition.name.toLocaleLowerCase("pt-BR") === character.identity.className.toLocaleLowerCase("pt-BR"));
  return byId?.domainIds ?? byName?.domainIds ?? character.identity.primaryDomainIds ?? [];
}

function getProgressionCardCandidates(character: Character, includeReserved = false): CardDefinition[] {
  const nextLevel = Math.min(character.identity.level + 1, 10);
  const domainIds = getPrimaryDomainIds(character);
  const reservedCardIds = [state.progressionCardId, ...state.progressionDraft.map((choice) => choice.cardId)].filter(Boolean);
  return catalog.cards.filter((card) => domainIds.includes(card.domainId) && card.tier <= nextLevel && !character.deck.learnedCardIds.includes(card.id) && (includeReserved || !reservedCardIds.includes(card.id)));
}

function requiresTierExperience(character: Character): boolean {
  return [2, 5, 8].includes(character.identity.level + 1);
}

function renderAddContainerModal(): string {
  if (!state.addContainerOpen) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal" role="dialog" aria-modal="true" aria-labelledby="container-modal-title">
        <div class="container-modal-heading">
          <h2 id="container-modal-title">Novo container</h2>
          <button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar novo container">x</button>
        </div>
        <p>Defina um compartimento com capacidade propria para organizar os itens do personagem.</p>
        <p class="form-error" data-container-error hidden></p>
        <label>
          <span>Nome</span>
          <input data-container-name type="text" placeholder="Ex.: Sacola de couro" />
        </label>
        <label>
          <span>Capacidade</span>
          <input data-container-capacity type="number" min="1" step="1" placeholder="Ex.: 8" />
        </label>
        <fieldset>
          <legend>Tipos aceitos</legend>
          <label><input type="checkbox" data-container-accepts value="arma" /> Armas</label>
          <label><input type="checkbox" data-container-accepts value="armadura" /> Armaduras</label>
          <label><input type="checkbox" data-container-accepts value="consumivel" /> Consumiveis</label>
          <label><input type="checkbox" data-container-accepts value="equipamento" /> Equipamentos</label>
          <label><input type="checkbox" data-container-accepts value="loot" /> Loot</label>
        </fieldset>
        <p>Se nenhum tipo for marcado, o container aceitara qualquer item.</p>
        <button class="primary-action" type="button" data-action="create-container">Criar container</button>
      </section>
    </div>
  `;
}

function renderDeleteContainerModal(): string {
  const character = state.character;
  if (!character || !state.deleteContainerId) {
    return "";
  }

  const compartment = getInventoryCompartments(character).find((entry) => entry.id === state.deleteContainerId);
  if (!compartment) {
    return "";
  }

  const entriesInside = getItemEntries(character).filter(({ entry }) => getEntryCompartmentId(entry) === compartment.id);
  const itemCount = entriesInside.reduce((total, { entry }) => total + entry.quantity, 0);

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-container-title">
        <button class="modal-close" data-modal-close aria-label="Cancelar exclusao">x</button>
        <span class="resource-modal-label">Excluir container</span>
        <h2 id="delete-container-title">${escapeHtml(compartment.name)}</h2>
        <p>Esta acao removera o container e todos os itens guardados nele.</p>
        <div class="danger-summary">
          <strong>${itemCount}</strong>
          <span>${itemCount === 1 ? "item sera perdido" : "itens serao perdidos"}</span>
        </div>
        <div class="confirmation-actions">
          <button class="secondary-action" type="button" data-action="cancel-delete-container">Cancelar</button>
          <button class="danger-action" type="button" data-action="confirm-delete-container">Excluir container e itens</button>
        </div>
      </section>
    </div>
  `;
}

function addProgressionChoice(choice: ProgressionDraftChoice): void {
  if (getProgressionChoiceCount() + getProgressionChoiceCost(choice) > 2) {
    return;
  }
  state.progressionDraft = [...state.progressionDraft, choice];
  state.progressionError = undefined;
}

async function applyProgression(): Promise<void> {
  const character = state.character;
  if (!character || getProgressionChoiceCount() !== 2 || !state.progressionCardId || character.identity.level >= 10 || (requiresTierExperience(character) && !state.progressionTierExperience?.name.trim())) {
    return;
  }

  const nextLevel = character.identity.level + 1;
  const progression = getProgression(character);
  const choices = state.progressionDraft;
  const attributeIds = choices.flatMap((choice) => choice.attributeIds ?? []);
  const experienceIds = choices.flatMap((choice) => choice.experienceIds ?? []);
  const hpSlots = choices.filter((choice) => choice.kind === "hp").length;
  const stressSlots = choices.filter((choice) => choice.kind === "stress").length;
  const evasionBonus = choices.filter((choice) => choice.kind === "evasion").length;
  const proficiencyBonus = choices.some((choice) => choice.kind === "proficiency") ? 1 : 0;
  const subclassChoice = choices.find((choice) => choice.kind === "subclass");
  const subclassAdvance = subclassChoice ? getNextSubclassAdvance(character, subclassChoice.tier) : undefined;
  const additionalCardIds = choices.flatMap((choice) => choice.kind === "domain" && choice.cardId ? [choice.cardId] : []);
  const isTierAchievement = [2, 5, 8].includes(nextLevel);
  const tierExperience = isTierAchievement ? state.progressionTierExperience : undefined;
  const tierAchievement = tierExperience ? `Experiencia +2: ${tierExperience.name}; Proficiencia +1` : undefined;
  const chosenCard = findDefinition(catalog, state.progressionCardId) as CardDefinition | undefined;
  if (!chosenCard || !getProgressionCardCandidates(character, true).some((card) => card.id === chosenCard.id)) {
    return;
  }
  if (state.progressionCardDestination === "loadout" && getActiveCards(character).length >= 5) {
    return;
  }
  const historyEntry: CharacterProgressionEntry = {
    level: nextLevel,
    appliedAt: new Date().toISOString(),
    choices: [...choices.map((choice) => choice.label), `Carta de Dominio: ${chosenCard.name} → ${state.progressionCardDestination === "loadout" ? "Loadout" : "Vault"}`, ...(tierExperience ? [`Experiencia de Tier +2: ${tierExperience.name}`] : [])],
    advances: choices.map((choice) => ({ kind: choice.kind, label: choice.label })),
    tierAchievement
  };

  const resources = character.resources.map((resource) => {
    if (resource.id === "hp") {
      return { ...resource, max: resource.max + hpSlots };
    }
    if (resource.id === "stress") {
      return { ...resource, max: resource.max + stressSlots };
    }
    return resource;
  });
  const attributeMarks: Record<string, string[]> = isTierAchievement ? {} : { ...progression.attributeMarks };
  choices.filter((choice) => choice.attributeIds?.length).forEach((choice) => {
    const existing = attributeMarks[String(choice.tier)] ?? [];
    attributeMarks[String(choice.tier)] = [...new Set([...existing, ...(choice.attributeIds ?? [])])];
  });

  const updatedCharacter: Character = {
    ...character,
    identity: { ...character.identity, level: nextLevel },
    attributes: character.attributes.map((attribute) => {
      const wasSelected = attributeIds.includes(attribute.id);
      return {
        ...attribute,
        value: attribute.value + (wasSelected ? 1 : 0),
        upgraded: wasSelected ? true : isTierAchievement ? false : attribute.upgraded
      };
    }),
    defense: { ...character.defense, evasion: character.defense.evasion + evasionBonus },
    proficiency: character.proficiency + proficiencyBonus + (isTierAchievement ? 1 : 0),
    resources,
    deck: {
      activeCardIds: state.progressionCardDestination === "loadout" ? [...character.deck.activeCardIds, chosenCard.id] : character.deck.activeCardIds,
      learnedCardIds: [...character.deck.learnedCardIds, chosenCard.id, ...additionalCardIds]
    },
    experiences: character.experiences.map((experience) => experienceIds.includes(experience.id) ? { ...experience, value: experience.value + 1 } : experience).concat(tierExperience ? [{ id: `experience.tier.${nextLevel}.${crypto.randomUUID()}`, name: tierExperience.name, value: 2, description: tierExperience.description }] : []),
    progression: {
      attributeMarks,
      acquiredSubclassTiers: subclassAdvance ? [...progression.acquiredSubclassTiers, subclassAdvance] : progression.acquiredSubclassTiers,
      advancementSelections: [
        ...progression.advancementSelections,
        ...choices.map((choice) => ({ kind: choice.kind, tier: choice.tier, level: nextLevel }))
      ],
      history: [...progression.history, historyEntry]
    }
  };

  await saveCharacter(updatedCharacter);
  state.character = updatedCharacter;
  state.progressionDraft = [];
  state.progressionConfirmationOpen = false;
  state.progressionError = undefined;
  state.progressionCardId = undefined;
  state.progressionCardDestination = "loadout";
  state.progressionTierExperience = undefined;
  state.progressionTierExperienceError = undefined;
  state.selectedProgressionTier = getTierForLevel(Math.min(nextLevel + 1, 10));
  render();
}

function renderEmptyInline(message: string): string {
  return `<p class="empty-inline">${escapeHtml(message)}</p>`;
}

function getNotesRenderDependencies(): NotesRenderDependencies {
  return { state, noteCategoryLabels, escapeHtml, renderEmptyInline };
}

function getProgressionRenderDependencies(): ProgressionRenderDependencies {
  return {
    state,
    escapeHtml,
    progressPercent,
    getTierForLevel,
    renderProgressionOptions: (character, isCurrentTier) => renderProgressionOptionsView(character, isCurrentTier, getProgressionWorkspaceDependencies()),
    renderProgressionDomainStep: (character) => renderProgressionDomainStepView(character, getProgressionWorkspaceDependencies()),
    renderProgressionDraft: (character) => renderProgressionDraftView(character, getProgressionWorkspaceDependencies())
  };
}

function getProgressionDialogDependencies(): ProgressionDialogDependencies {
  return {
    state,
    escapeHtml,
    attributeTitle,
    getTierForLevel,
    getProgression,
    getProgressionCardCandidates,
    requiresTierExperience,
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
    getProgressionChoiceCount,
    getAdvanceSlotsUsed,
    getNextSubclassAdvance,
    requiresTierExperience,
    getProgressionCardCandidates,
    getActiveCards,
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
    getItemEntries,
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
    getItemEntries,
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
    getItemEntries,
    getInventoryCompartments,
    getEntryCompartmentId,
    canCompartmentAcceptItem,
    wouldFitCompartment,
    moveItemToCompartment: (itemId, targetCompartmentId, sourceCompartmentId) =>
      moveItemToCompartmentAction(itemId, targetCompartmentId, sourceCompartmentId, getInventoryActionDependencies())
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

  return `
    <main class="content compendium-content">
      <div class="screen-title">
        <div>
          <h1>Compendium</h1>
        </div>
      </div>

      <nav class="compendium-bookmarks" aria-label="Aberturas do Compendium">
        <button class="${state.compendiumSpread === 1 ? "is-active" : ""}" type="button" data-compendium-spread="1" aria-current="${state.compendiumSpread === 1 ? "page" : "false"}">Abertura 1 <span>Dominios | Cartas</span></button>
        <button class="${state.compendiumSpread === 2 ? "is-active" : ""}" type="button" data-compendium-spread="2" aria-current="${state.compendiumSpread === 2 ? "page" : "false"}">Abertura 2 <span>Itens | Classes</span></button>
        <button class="${state.compendiumSpread === 3 ? "is-active" : ""}" type="button" data-compendium-spread="3" aria-current="${state.compendiumSpread === 3 ? "page" : "false"}">Abertura 3 <span>Ancestralidades | Condicoes</span></button>
      </nav>

      ${state.compendiumSpread === 1 ? renderCompendiumFirstSpread() : state.compendiumSpread === 2 ? renderCompendiumSecondSpread() : renderCompendiumThirdSpread()}
    </main>
  `;
}

function renderCompendiumFirstSpread(): string {
  return `
      <section class="compendium-spread compendium-index-spread" aria-label="Dominios e cartas do Compendium">
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "",
            title: "Dominios",
            summary: "A identidade que organiza as cartas: nome, descricao e cor de cada vertente.",
            count: catalog.domains.length,
            countLabel: "Dominios cadastrados",
            primaryAction: "Novo dominio",
            primaryActionId: "new-compendium-domain",
            secondaryAction: "Pesquisar e gerenciar",
            secondaryActionId: "manage-compendium-domains",
            details: [
              "Dominios de packs sao protegidos e apenas podem ser consultados.",
              "Dominios locais ficam salvos neste dispositivo.",
              "Uma carta sempre devera pertencer a um dominio."
            ],
            emphasized: true
          })}
        </article>
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "",
            title: "Cartas",
            summary: "Cartas utilizaveis por personagens, organizadas por dominio, tier, custo e efeito.",
            count: catalog.cards.length,
            countLabel: "Cartas cadastradas",
            primaryAction: "Nova carta",
            primaryActionId: "new-compendium-card",
            secondaryAction: "Pesquisar e gerenciar",
            secondaryActionId: "manage-compendium-cards",
            details: [
              "Toda carta pertence obrigatoriamente a um dominio.",
              "Cartas locais podem ser criadas, editadas e excluidas.",
              "Conteudo de packs fica protegido para preservar sua origem."
            ]
          })}
        </article>
      </section>
  `;
}

function renderCompendiumSecondSpread(): string {
  return `
      <section class="compendium-spread compendium-index-spread" aria-label="Itens e classes do Compendium">
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "",
            title: "Itens",
            summary: "Armas, armaduras, consumiveis, equipamentos e loot que podem ser referenciados pelo inventario.",
            count: catalog.items.length,
            countLabel: "Definitions cadastradas",
            primaryAction: "Novo item",
            primaryActionId: "new-compendium-item",
            secondaryAction: "Pesquisar e gerenciar",
            secondaryActionId: "manage-compendium-items",
            details: [
              "Busca e filtros por tipo ficam na pagina interna.",
              "Itens locais podem ser criados, editados e excluidos.",
              "Itens continuam sendo Definitions, nao copias do personagem."
            ]
          })}
        </article>
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "",
            title: "Classes",
            summary: "Classes definem a identidade do personagem e os dominios que podem conceder cartas.",
            count: catalog.classes.length,
            countLabel: "Classes cadastradas",
            primaryAction: "Nova classe",
            primaryActionId: "new-compendium-class",
            secondaryAction: "Pesquisar e gerenciar",
            secondaryActionId: "manage-compendium-classes",
            details: [
              "Cada classe libera um ou mais dominios.",
              "Fundamento, especializacao e maestria serao conectados em seguida.",
              "Classes locais ficam salvas neste dispositivo."
            ]
          })}
        </article>
      </section>
  `;
}

function renderCompendiumThirdSpread(): string {
  return `
      <section class="compendium-spread compendium-index-spread" aria-label="Ancestralidades e condicoes do Compendium">
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "Heranca",
            title: "Ancestralidades",
            summary: "Linhagens que concedem duas features permanentes: uma Top Feature e uma Bottom Feature.",
            count: catalog.ancestries.length,
            countLabel: "Ancestralidades cadastradas",
            primaryAction: "Nova ancestralidade",
            primaryActionId: "new-compendium-ancestry",
            secondaryAction: "Pesquisar e gerenciar",
            secondaryActionId: "manage-compendium-ancestries",
            details: [
              "Uma ancestralidade unica concede as duas features da mesma Definition.",
              "Ancestralidades mistas combinam Top e Bottom de origens diferentes.",
              "A linhagem narrativa e as escolhas mecanicas permanecem separadas na ficha."
            ],
            emphasized: true
          })}
        </article>
        <article class="compendium-page">
          ${renderCompendiumChapterCard({
            eyebrow: "Em preparacao",
            title: "Condicoes",
            summary: "Efeitos oficiais e temporarios que serao introduzidos quando houver conteudo e fluxo de jogo suficientes.",
            count: 0,
            countLabel: "Condicoes cadastradas",
            primaryAction: "Implementacao futura",
            secondaryAction: "Sem capitulo disponivel",
            details: [
              "Condicoes sao reconhecidas pelo modelo de dominio.",
              "O SoulForge ainda nao oferece cadastro ou uso delas na ficha.",
              "O capitulo sera aberto com regras e conteudo de Pack adequados."
            ]
          })}
        </article>
      </section>
  `;
}

function renderCompendiumChapterCard(chapter: {
  eyebrow: string;
  title: string;
  summary: string;
  count: number;
  countLabel: string;
  primaryAction: string;
  primaryActionId?: string;
  secondaryAction: string;
  secondaryActionId?: string;
  details: string[];
  emphasized?: boolean;
}): string {
  return `
    <div class="compendium-index-card ${chapter.emphasized ? "is-priority" : ""}">
      <div class="compendium-page-heading">
        ${chapter.eyebrow ? `<span>${escapeHtml(chapter.eyebrow)}</span>` : ""}
        <h2>${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(chapter.summary)}</p>
      </div>
      <div class="compendium-chapter-count">
        <strong>${chapter.count}</strong>
        <span>${escapeHtml(chapter.countLabel)}</span>
      </div>
      <div class="compendium-actions compendium-index-actions">
        <button type="button" ${chapter.primaryActionId ? `data-action="${chapter.primaryActionId}"` : "disabled"}>${escapeHtml(chapter.primaryAction)}</button>
        <button type="button" ${chapter.secondaryActionId ? `data-action="${chapter.secondaryActionId}"` : "disabled"}>${escapeHtml(chapter.secondaryAction)}</button>
      </div>
      <ul class="compendium-chapter-notes">
        ${chapter.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}
      </ul>
    </div>
  `;
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
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal card-activation-modal" role="dialog" aria-modal="true" aria-labelledby="activate-card-title"><button class="modal-close" data-modal-close aria-label="Cancelar ativacao">x</button><span class="resource-modal-label">Vault para Loadout</span><h2 id="activate-card-title">Ativar ${escapeHtml(definition.name)}?</h2><p>Esta carta passara a ficar ativa no Loadout.</p>${loadoutFull ? `<label class="form-field"><span>O Loadout ja possui cinco cartas. Escolha uma para guardar *</span><select data-recall-swap-card><option value="">Selecione uma carta ativa</option>${activeCards.map((card) => `<option value="${card.id}">${escapeHtml(card.name)}</option>`).join("")}</select></label>` : ""}<div class="card-activation-rules"><p><strong>Durante um descanso:</strong> a troca e gratuita.</p><p><strong>Agora:</strong> marque ${recallCost} ${recallCost === 1 ? "Stress" : "Stress"}.${stress ? ` Disponivel: ${stress.value}/${stress.max}.` : ""}</p></div><p class="form-error" data-card-activation-error ${state.cardActivationError ? "" : "hidden"}>${escapeHtml(state.cardActivationError ?? "")}</p><div class="modal-actions"><button class="secondary-action" type="button" data-action="activate-stored-card-free">Ativar no descanso</button><button class="primary-action" type="button" data-action="activate-stored-card-stress">Ativar agora</button></div></section></div>`;
}

const fallbackCharacterClass: ClassDefinition = {
  id: "class.demo.guardian",
  type: "class",
  packId: "demo",
  name: "Guardiao",
  summary: "Defensor firme que protege seus aliados.",
  domainIds: ["domain.demo.guardian", "domain.demo.test"],
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
  return catalog.classes.length ? catalog.classes : [fallbackCharacterClass];
}

function getCharacterCreationSubclasses(classId: string): SubclassDefinition[] {
  const subclasses = catalog.subclasses.filter((subclass) => subclass.classId === classId);
  return subclasses.length ? subclasses : classId === fallbackCharacterClass.id ? [fallbackCharacterSubclass] : [];
}

function getCharacterCreationAncestries(): AncestryDefinition[] {
  return [...catalog.ancestries].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

function renderCharacterSelection(): string {
  const cards = state.characters.map((character) => `
    <button class="character-select-card" type="button" data-action="select-character" data-character-id="${escapeHtml(character.id)}">
      <span class="character-select-mark">${escapeHtml(character.identity.name.slice(0, 1).toUpperCase())}</span>
      <span><strong>${escapeHtml(character.identity.name)}</strong><small>${escapeHtml(character.identity.ancestry)} · ${escapeHtml(character.identity.className)}</small></span>
      <em>Nivel ${character.identity.level}</em>
    </button>
  `).join("");

  return `
    <main class="character-gate">
      <img class="character-gate-watermark" src="assets/brand/soulforge-symbol.png" alt="" aria-hidden="true" />
      <section class="character-gate-panel">
        <div class="character-gate-brand"><div><strong>SOULFORGE</strong><span>Escolha uma ficha para continuar</span></div></div>
        <div class="character-gate-heading"><div><h1>Personagens</h1><p>Suas fichas ficam salvas somente neste dispositivo.</p></div><button class="primary-action" type="button" data-action="new-character">Novo personagem</button></div>
        <div class="character-select-grid">${cards || `<div class="empty-state"><h2>Nenhuma ficha encontrada</h2><p>Crie seu primeiro personagem para iniciar a aventura.</p></div>`}</div>
      </section>
    </main>
  `;
}

function renderCharacterCreationModal(): string {
  if (!state.characterCreationOpen) {
    return "";
  }

  const classes = getCharacterCreationClasses();
  const classId = state.characterCreationClassId && classes.some((definition) => definition.id === state.characterCreationClassId)
    ? state.characterCreationClassId
    : classes[0].id;
  const selectedClass = classes.find((definition) => definition.id === classId) ?? classes[0];
  const subclasses = getCharacterCreationSubclasses(selectedClass.id);
  const ancestries = getCharacterCreationAncestries();
  const selectedAncestryIds = state.characterCreationAncestryIds.filter((id) => ancestries.some((ancestry) => ancestry.id === id)).slice(0, 2);
  const selectedAncestries = selectedAncestryIds.map((id) => ancestries.find((ancestry) => ancestry.id === id)).filter((ancestry): ancestry is AncestryDefinition => Boolean(ancestry));
  const topFeatures = selectedAncestries.map((ancestry) => catalog.features.find((feature) => feature.id === ancestry.topFeatureId)).filter((feature): feature is FeatureDefinition => Boolean(feature));
  const bottomFeatures = selectedAncestries.map((ancestry) => catalog.features.find((feature) => feature.id === ancestry.bottomFeatureId)).filter((feature): feature is FeatureDefinition => Boolean(feature));
  const topFeatureId = topFeatures.some((feature) => feature.id === state.characterCreationTopFeatureId) ? state.characterCreationTopFeatureId : topFeatures[0]?.id;
  const bottomFeatureId = bottomFeatures.some((feature) => feature.id === state.characterCreationBottomFeatureId) ? state.characterCreationBottomFeatureId : bottomFeatures[0]?.id;
  const ancestrySearch = state.characterCreationAncestrySearch.trim().toLocaleLowerCase("pt-BR");
  const visibleAncestries = ancestries.filter((ancestry) => !ancestrySearch || `${ancestry.name} ${ancestry.summary}`.toLocaleLowerCase("pt-BR").includes(ancestrySearch));
  const featureOptionLabel = (feature: FeatureDefinition, position: "top" | "bottom") => {
    const source = selectedAncestries.find((ancestry) => (position === "top" ? ancestry.topFeatureId : ancestry.bottomFeatureId) === feature.id);
    return `${escapeHtml(source?.name ?? "Ancestralidade")} - ${escapeHtml(feature.name)}`;
  };
  const selectedTopFeature = topFeatures.find((feature) => feature.id === topFeatureId);
  const selectedBottomFeature = bottomFeatures.find((feature) => feature.id === bottomFeatureId);

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <form class="modal character-creation-modal" data-creation-step="${state.characterCreationStep}" onsubmit="return false;" aria-labelledby="character-creation-title">
        <button class="modal-close" type="button" data-action="cancel-new-character" aria-label="Fechar">×</button>
        <div class="character-creation-scroll">
        <div class="character-creation-progress" aria-label="Etapa ${state.characterCreationStep} de 5">${["Identidade", "Ancestralidades", "Features", "Classe", "Revisão"].map((label, index) => `<span class="${index + 1 === state.characterCreationStep ? "is-current" : index + 1 < state.characterCreationStep ? "is-complete" : ""}">${index + 1}. ${label}</span>`).join("")}</div>
        <div class="modal-title"><span>Nova ficha${state.characterCreationStep > 1 ? ` · Etapa ${state.characterCreationStep} de 5` : ""}</span><h2 id="character-creation-title">${state.characterCreationStep === 1 ? "Criar personagem" : ["", "", "Ancestralidades", "Features", "Classe", "Revisão"][state.characterCreationStep]}</h2>${state.characterCreationStep === 1 ? "<p>Comece com o essencial. Os demais detalhes podem ser definidos durante a jornada.</p>" : ""}</div>
        <div class="form-grid character-creation-identity creation-step-panel" data-creation-panel="1">
          <label class="form-field"><span>Nome</span><input data-character-name required maxlength="60" value="${escapeHtml(state.characterCreationName)}" placeholder="Nome do personagem" /></label>
          <label class="form-field form-field-wide"><span>Comunidade</span><input data-character-community required maxlength="80" value="${escapeHtml(state.characterCreationCommunity)}" placeholder="Ex.: Vigilia de Tristelo" /></label>
        </div>
        <section class="character-ancestry-picker creation-step-panel" data-creation-panel="2" aria-labelledby="character-ancestry-title">
          <div><span>Origem</span><h3 id="character-ancestry-title">Ancestralidades</h3><p>Escolha uma ou duas. Com duas, combine livremente a Feature Top e a Feature Bottom.</p></div>
          <label class="search-box character-ancestry-search"><span aria-hidden="true">⌕</span><input type="search" data-character-ancestry-search value="${escapeHtml(state.characterCreationAncestrySearch)}" placeholder="Pesquisar ancestralidade" aria-label="Pesquisar ancestralidade" /></label>
          ${ancestries.length ? `<div class="character-ancestry-choice-grid">${visibleAncestries.map((ancestry) => { const selected = selectedAncestryIds.includes(ancestry.id); const disabled = !selected && selectedAncestryIds.length >= 2; return `<label class="character-ancestry-choice ${selected ? "is-selected" : ""}"><input type="checkbox" data-character-ancestry-id="${escapeHtml(ancestry.id)}" ${selected ? "checked" : ""} ${disabled ? "disabled" : ""}/><span><strong>${escapeHtml(ancestry.name)}</strong><small>${escapeHtml(ancestry.summary)}</small></span></label>`; }).join("") || `<p class="form-error">Nenhuma ancestralidade encontrada.</p>`}</div>` : `<p class="form-error">Importe um Pack de ancestralidades no Compendium antes de criar a ficha.</p>`}
          ${selectedAncestries.length ? `<div class="character-feature-choice-grid"><label class="form-field"><span>Feature Top</span>${topFeatures.length > 1 ? `<select data-character-top-feature>${topFeatures.map((feature) => { const origin = selectedAncestries.find((ancestry) => ancestry.topFeatureId === feature.id); return `<option value="${escapeHtml(feature.id)}" ${feature.id === topFeatureId ? "selected" : ""}>${escapeHtml(origin?.name ?? "Ancestralidade")} - ${escapeHtml(feature.name)}</option>`; }).join("")}</select>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(topFeatures[0]?.name ?? "Feature indisponivel")}</strong><small>${escapeHtml(topFeatures[0]?.summary ?? "")}</small></div>`}</label><label class="form-field"><span>Feature Bottom</span>${bottomFeatures.length > 1 ? `<select data-character-bottom-feature>${bottomFeatures.map((feature) => { const origin = selectedAncestries.find((ancestry) => ancestry.bottomFeatureId === feature.id); return `<option value="${escapeHtml(feature.id)}" ${feature.id === bottomFeatureId ? "selected" : ""}>${escapeHtml(origin?.name ?? "Ancestralidade")} - ${escapeHtml(feature.name)}</option>`; }).join("")}</select>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(bottomFeatures[0]?.name ?? "Feature indisponivel")}</strong><small>${escapeHtml(bottomFeatures[0]?.summary ?? "")}</small></div>`}</label></div>` : ""}
        </section>
        <section class="character-ancestry-picker creation-step-panel character-feature-step" data-creation-panel="3" aria-labelledby="character-feature-title">
          <div><span>Origem</span><h3 id="character-feature-title">Features da ancestralidade</h3><p>${selectedAncestries.length === 2 ? "Escolha uma Feature Top e uma Feature Bottom entre as ancestralidades selecionadas." : "As duas Features abaixo foram definidas pela sua ancestralidade."}</p></div>
          <div class="character-feature-choice-grid">
            <label class="form-field"><span>Feature Top</span>${topFeatures.length > 1 ? `<select data-character-top-feature>${topFeatures.map((feature) => `<option value="${escapeHtml(feature.id)}" ${feature.id === topFeatureId ? "selected" : ""}>${featureOptionLabel(feature, "top")}</option>`).join("")}</select><div class="selected-feature-description"><strong>${escapeHtml(selectedTopFeature?.name ?? "Feature indisponível")}</strong><p>${escapeHtml(selectedTopFeature?.summary ?? "")}</p></div>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(topFeatures[0]?.name ?? "Feature indisponível")}</strong><small>${escapeHtml(topFeatures[0]?.summary ?? "")}</small></div>`}</label>
            <label class="form-field"><span>Feature Bottom</span>${bottomFeatures.length > 1 ? `<select data-character-bottom-feature>${bottomFeatures.map((feature) => `<option value="${escapeHtml(feature.id)}" ${feature.id === bottomFeatureId ? "selected" : ""}>${featureOptionLabel(feature, "bottom")}</option>`).join("")}</select><div class="selected-feature-description"><strong>${escapeHtml(selectedBottomFeature?.name ?? "Feature indisponível")}</strong><p>${escapeHtml(selectedBottomFeature?.summary ?? "")}</p></div>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(bottomFeatures[0]?.name ?? "Feature indisponível")}</strong><small>${escapeHtml(bottomFeatures[0]?.summary ?? "")}</small></div>`}</label>
          </div>
        </section>
        <div class="form-grid creation-step-panel" data-creation-panel="4">
          <label class="form-field"><span>Classe</span><select data-character-class>${classes.map((definition) => `<option value="${escapeHtml(definition.id)}" ${definition.id === selectedClass.id ? "selected" : ""}>${escapeHtml(definition.name)}</option>`).join("")}</select><small>Evasao inicial: ${selectedClass.startingEvasion} · PV inicial: ${selectedClass.startingHitPoints}</small></label>
          <label class="form-field"><span>Subclasse</span><select data-character-subclass ${subclasses.length ? "" : "disabled"}>${subclasses.map((definition) => `<option value="${escapeHtml(definition.id)}">${escapeHtml(definition.name)}</option>`).join("") || "<option>Cadastre uma subclasse no Compendium</option>"}</select></label>
        </div>
        <section class="character-creation-review creation-step-panel" data-creation-panel="5"><div><span>Pronto para começar</span><h3>${escapeHtml(state.characterCreationName || "Sem nome")}</h3><p>${escapeHtml(state.characterCreationCommunity || "Comunidade não definida")}</p></div><div class="creation-review-grid"><article><span>Ancestralidades</span><strong>${escapeHtml(selectedAncestries.map((ancestry) => ancestry.name).join(" + ") || "Não definida")}</strong></article><article><span>Top</span><strong>${escapeHtml(topFeatures.find((feature) => feature.id === topFeatureId)?.name ?? "Não definida")}</strong></article><article><span>Bottom</span><strong>${escapeHtml(bottomFeatures.find((feature) => feature.id === bottomFeatureId)?.name ?? "Não definida")}</strong></article><article><span>Classe</span><strong>${escapeHtml(selectedClass.name)} · ${escapeHtml(subclasses.find((subclass) => subclass.id === state.characterCreationSubclassId)?.name ?? subclasses[0]?.name ?? "Sem subclasse")}</strong><small>PV ${selectedClass.startingHitPoints} · Evasão ${selectedClass.startingEvasion}</small></article></div></section>
        ${state.characterCreationError ? `<p class="form-error">${escapeHtml(state.characterCreationError)}</p>` : ""}
        </div>
        <div class="modal-actions character-creation-actions">${state.characterCreationStep > 1 ? `<button class="secondary-action character-creation-arrow" type="button" data-action="character-creation-previous" aria-label="Voltar à etapa anterior" title="Voltar">←</button>` : "<span></span>"}${isFinalCharacterCreationStep(state.characterCreationStep) ? `<button class="primary-action" type="button" data-action="save-new-character">Criar ficha</button>` : `<button class="primary-action character-creation-arrow" type="button" data-action="character-creation-next" aria-label="Avançar para a próxima etapa" title="Continuar">→</button>`}</div>
      </form>
    </div>
  `;
}

function renderPlaceholder(page: Page): string {
  const labels: Record<Page, string> = {
    overview: "Visao Geral",
    skills: "Tracos",
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

function render(options: { preserveMainScroll?: boolean } = {}): void {
  const previousMainScrollTop = options.preserveMainScroll
    ? appRoot.querySelector<HTMLElement>(".main-shell")?.scrollTop
    : undefined;
  const previousContentScrollTop = options.preserveMainScroll
    ? appRoot.querySelector<HTMLElement>(".content")?.scrollTop
    : undefined;
  const previousDocumentScrollTop = options.preserveMainScroll ? window.scrollY : undefined;
  const character = state.character;

  if (state.characterSelectionOpen) {
    appRoot.innerHTML = `${renderCharacterSelection()}${renderCharacterCreationModal()}`;
    document.body.classList.toggle("has-modal", state.characterCreationOpen);
    return;
  }

  if (!character) {
    appRoot.innerHTML = `<div class="boot-screen">Carregando SoulForge...</div>`;
    return;
  }

  const screen = state.page === "overview"
    ? renderOverviewView(character, getPlayerOverviewDependencies())
    : state.page === "skills"
      ? renderSkills(character)
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
          ${renderTopbarView(getPlayerShellDependencies())}
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
    ${renderResourceModalView(state.resourceModalId, getInventoryRenderDependencies())}
    ${renderProgressionHistoryModalView(getProgressionDialogDependencies())}
    ${renderProgressionPickerModalView(getProgressionDialogDependencies())}
    ${renderProgressionCardPickerModalView(getProgressionDialogDependencies())}
    ${renderTierExperienceModalView(getProgressionDialogDependencies())}
    ${renderProgressionConfirmationModalView(getProgressionDialogDependencies())}
    ${renderAddContainerModal()}
    ${renderDeleteContainerModal()}
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
    ${renderPackImportModal()}
    ${renderRemoveInstalledPackModal()}
  `;
  document.body.classList.toggle("has-modal", Boolean(appRoot.querySelector(".modal-backdrop")));
  if (previousMainScrollTop !== undefined) {
    requestAnimationFrame(() => {
      const mainShell = appRoot.querySelector<HTMLElement>(".main-shell");
      if (mainShell) {
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

function exportCharacter(): void {
  const character = state.character;

  if (!character) {
    return;
  }

  const serializedCharacter = JSON.stringify(character, null, 2);
  const blob = new Blob([serializedCharacter], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const safeName = character.identity.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `soulforge-${safeName || "personagem"}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
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
  catalog = createCatalog([...baseCatalog.packs, ...state.installedPacks], [...baseCatalog.definitions, ...customDefinitions]);
}

function validatePackBundle(value: unknown): PackBundle {
  if (!value || typeof value !== "object") throw new Error("O arquivo não contém um Pack válido.");
  const bundle = value as Partial<PackBundle>;
  const manifest = bundle.manifest;
  if (bundle.format !== "soulforge-pack-v1" || !manifest || typeof manifest !== "object" || !Array.isArray(bundle.definitions)) {
    throw new Error("Use um arquivo no formato .soulforge-pack.json.");
  }
  if (!manifest.id || !manifest.name || !manifest.version || !manifest.description) throw new Error("O manifesto do Pack está incompleto.");
  if (!bundle.definitions.length) throw new Error("O Pack não possui Definitions para importar.");
  const knownTypes = new Set(["domain", "card", "item", "class", "subclass", "feature", "ancestry"]);
  const ids = new Set<string>();
  for (const definition of bundle.definitions) {
    if (!definition || typeof definition !== "object" || !knownTypes.has(definition.type) || !definition.id || !definition.name || !definition.summary || definition.packId !== manifest.id) {
      throw new Error("Uma Definition é inválida ou não pertence ao Pack informado.");
    }
    if (ids.has(definition.id)) throw new Error("O Pack contém IDs de Definition repetidos.");
    ids.add(definition.id);
  }
  return { format: "soulforge-pack-v1", manifest: manifest as PackManifest, definitions: bundle.definitions as Definition[] };
}

async function readPackImportFile(file: File): Promise<void> {
  try {
    const bundle = validatePackBundle(JSON.parse(await file.text()));
    if (catalog.packs.some((pack) => pack.id === bundle.manifest.id)) throw new Error("Este Pack já está instalado neste dispositivo.");
    const existingDefinitionIds = new Set(catalog.definitions.map((definition) => definition.id));
    if (bundle.definitions.some((definition) => existingDefinitionIds.has(definition.id))) throw new Error("O Pack possui uma Definition que já existe neste dispositivo.");
    state.pendingPackBundle = bundle;
    state.packImportError = undefined;
  } catch (caught) {
    state.pendingPackBundle = undefined;
    state.packImportError = caught instanceof Error ? caught.message : "Não foi possível ler este arquivo.";
  }
  render();
}

async function confirmPackImport(): Promise<void> {
  const bundle = state.pendingPackBundle;
  if (!bundle) return;
  try {
    await installLocalPack(bundle.manifest, bundle.definitions);
    await refreshCatalog();
    state.packImportOpen = false;
    state.pendingPackBundle = undefined;
    state.packImportError = undefined;
  } catch {
    state.packImportError = "Não foi possível instalar este Pack. Ele pode já estar instalado.";
  }
  render();
}

async function confirmRemoveInstalledPack(): Promise<void> {
  if (!state.deletingInstalledPackId) return;
  await removeLocalPack(state.deletingInstalledPackId);
  state.deletingInstalledPackId = undefined;
  await refreshCatalog();
  render();
}

async function openCharacter(characterId: string | undefined): Promise<void> {
  if (!characterId) {
    return;
  }

  const character = await loadCharacter(characterId);
  if (!character) {
    return;
  }

  state.character = character;
  state.characterSelectionOpen = false;
  state.characterCreationOpen = false;
  localStorage.setItem(activeCharacterStorageKey, character.id);
  render();
}

async function createCharacter(): Promise<void> {
  const name = state.characterCreationName;
  const community = state.characterCreationCommunity;
  const classId = state.characterCreationClassId ?? "";
  const subclassId = state.characterCreationSubclassId ?? "";
  const ancestryIds = state.characterCreationAncestryIds.slice(0, 2);
  const selectedAncestries = ancestryIds.map((id) => catalog.ancestries.find((ancestry) => ancestry.id === id)).filter((ancestry): ancestry is AncestryDefinition => Boolean(ancestry));
  const topFeatureId = document.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-top-feature]')?.value ?? state.characterCreationTopFeatureId ?? selectedAncestries[0]?.topFeatureId;
  const bottomFeatureId = document.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-bottom-feature]')?.value ?? state.characterCreationBottomFeatureId ?? selectedAncestries[0]?.bottomFeatureId;
  const classDefinition = getCharacterCreationClasses().find((definition) => definition.id === classId);
  const subclassDefinition = getCharacterCreationSubclasses(classId).find((definition) => definition.id === subclassId);
  const validTopFeature = selectedAncestries.some((ancestry) => ancestry.topFeatureId === topFeatureId);
  const validBottomFeature = selectedAncestries.some((ancestry) => ancestry.bottomFeatureId === bottomFeatureId);

  if (!name || !community || !classDefinition || !subclassDefinition || selectedAncestries.length !== ancestryIds.length || !selectedAncestries.length || !topFeatureId || !bottomFeatureId || !validTopFeature || !validBottomFeature) {
    state.characterCreationError = "Preencha os dados obrigatorios, escolha uma ou duas ancestralidades e defina as Features Top e Bottom.";
    render();
    return;
  }

  const features = catalog.features;
  const subclassSkills: CharacterSkill[] = ([
    ["foundation", subclassDefinition.foundationFeatureIds],
    ["specialized", subclassDefinition.specializationFeatureIds],
    ["mastery", subclassDefinition.masteryFeatureIds]
  ] as const).flatMap(([tier, featureIds]) => featureIds.flatMap((featureId) => {
    const feature = features.find((entry) => entry.id === featureId);
    return feature ? [{ id: feature.id, name: feature.name, source: "class" as const, tier, description: feature.summary }] : [];
  }));
  const fallbackSkills = subclassDefinition.id === fallbackCharacterSubclass.id
    ? demoCharacter.skills.filter((skill) => skill.source === "class")
    : [];
  const hp = classDefinition.startingHitPoints;
  const character: Character = {
    id: `character.local.${crypto.randomUUID()}`,
    identity: {
      name,
      ancestry: selectedAncestries.map((ancestry) => ancestry.name).join(" + "),
      primaryAncestryId: selectedAncestries[0].id,
      ancestryIds,
      ancestryFeatureIds: { top: topFeatureId, bottom: bottomFeatureId },
      className: classDefinition.name,
      primaryClassId: classDefinition.id,
      subclassName: subclassDefinition.name,
      primarySubclassId: subclassDefinition.id,
      primaryDomainIds: classDefinition.domainIds,
      community,
      level: 1,
      xp: 0,
      nextLevelXp: 10,
      quote: ""
    },
    attributes: [
      { id: "dex", label: "AGI", value: 0 }, { id: "for", label: "FOR", value: 0 }, { id: "cha", label: "FIN", value: 0 },
      { id: "wil", label: "INS", value: 0 }, { id: "con", label: "PRE", value: 0 }, { id: "int", label: "CON", value: 0 }
    ],
    defense: { evasion: classDefinition.startingEvasion, armor: 0, minor: 0, major: 0 },
    proficiency: 1,
    progression: { attributeMarks: {}, acquiredSubclassTiers: ["foundation"], advancementSelections: [], history: [] },
    resources: [
      { id: "hp", label: "PV", value: hp, max: hp, tone: "hp" },
      { id: "stress", label: "Estresse", value: 0, max: 6, tone: "stress" },
      { id: "armor-slots", label: "Slot de Armadura", value: 0, max: 0, tone: "focus" },
      { id: "hope", label: "Esperanca", value: 2, max: 6, tone: "hope" }
    ],
    skills: subclassSkills.length ? subclassSkills : fallbackSkills,
    experiences: [],
    notes: [],
    deck: { activeCardIds: [], learnedCardIds: [] },
    inventory: { capacity: 30, compartments: [{ id: "equipped", name: "Equipados", source: "character" }, { id: "backpack", name: "Mochila", capacity: 30, source: "character" }], entries: [] }
  };

  await saveCharacter(character);
  state.characters = [...state.characters, character];
  await openCharacter(character.id);
}

function syncCharacterCreationDraft(): void {
  state.characterCreationName = document.querySelector<HTMLInputElement>("[data-character-name]")?.value.trim() ?? state.characterCreationName;
  state.characterCreationCommunity = document.querySelector<HTMLInputElement>("[data-character-community]")?.value.trim() ?? state.characterCreationCommunity;
  state.characterCreationTopFeatureId = document.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-top-feature]')?.value ?? state.characterCreationTopFeatureId;
  state.characterCreationBottomFeatureId = document.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-bottom-feature]')?.value ?? state.characterCreationBottomFeatureId;
  state.characterCreationSubclassId = document.querySelector<HTMLSelectElement>("[data-character-subclass]")?.value ?? state.characterCreationSubclassId;
}

function validateCharacterCreationStep(): boolean {
  syncCharacterCreationDraft();
  if (state.characterCreationStep === 1 && (!state.characterCreationName || !state.characterCreationCommunity)) {
    state.characterCreationError = "Informe o nome e a comunidade do personagem.";
    return false;
  }
  if (state.characterCreationStep === 2 && (state.characterCreationAncestryIds.length < 1 || state.characterCreationAncestryIds.length > 2)) {
    state.characterCreationError = "Escolha uma ou duas ancestralidades.";
    return false;
  }
  if (state.characterCreationStep === 2) {
    const primaryAncestry = catalog.ancestries.find((ancestry) => ancestry.id === state.characterCreationAncestryIds[0]);
    state.characterCreationTopFeatureId = primaryAncestry?.topFeatureId;
    state.characterCreationBottomFeatureId = primaryAncestry?.bottomFeatureId;
  }
  if (state.characterCreationStep === 3 && (!state.characterCreationTopFeatureId || !state.characterCreationBottomFeatureId)) {
    state.characterCreationError = "Defina as Features Top e Bottom.";
    return false;
  }
  if (state.characterCreationStep === 4 && (!state.characterCreationClassId || !state.characterCreationSubclassId)) {
    state.characterCreationError = "Escolha uma classe e uma subclasse.";
    return false;
  }
  state.characterCreationError = undefined;
  return true;
}

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

async function adjustResource(delta: number): Promise<void> {
  const character = state.character;
  const resourceId = state.resourceModalId;

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
  render();
}

async function saveNoteFromModal(): Promise<void> {
  const character = state.character;
  if (!character) return;

  const titleInput = document.querySelector<HTMLInputElement>("[data-note-title]");
  const categoryInput = document.querySelector<HTMLInputElement>("[data-note-category]");
  const contentInput = document.querySelector<HTMLTextAreaElement>("[data-note-content]");
  const title = titleInput?.value.trim() ?? "";
  const content = contentInput?.value.trim() ?? "";
  const category = (categoryInput?.value ?? "session") as CharacterNoteCategory;

  if (!title || !content) {
    const error = document.querySelector<HTMLElement>("[data-note-error]");
    error?.removeAttribute("hidden");
    if (error) error.textContent = "Informe um titulo e um conteudo para salvar a anotacao.";
    titleInput?.classList.toggle("is-invalid", !title);
    contentInput?.classList.toggle("is-invalid", !content);
    (!title ? titleInput : contentInput)?.focus();
    return;
  }

  const now = new Date().toISOString();
  const existingNote = character.notes.find((note) => note.id === state.editingNoteId);
  const note: CharacterNote = { id: existingNote?.id ?? `note.${crypto.randomUUID()}`, title, content, category, createdAt: existingNote?.createdAt ?? now, updatedAt: now };
  const notes = existingNote ? character.notes.map((entry) => entry.id === existingNote.id ? note : entry) : [note, ...character.notes];
  const updatedCharacter = { ...character, notes };
  state.character = updatedCharacter;
  state.noteModalOpen = false;
  state.editingNoteId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

async function deleteNote(noteId: string | undefined): Promise<void> {
  const character = state.character;
  if (!character || !noteId) return;
  const updatedCharacter = { ...character, notes: character.notes.filter((note) => note.id !== noteId) };
  state.character = updatedCharacter;
  if (state.viewingNoteId === noteId) state.viewingNoteId = undefined;
  state.deletingNoteId = undefined;
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

    if (target.closest("[data-modal-close]")) {
      state.modalCardId = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
      state.progressionPicker = undefined;
      state.progressionPickerIds = [];
      state.progressionConfirmationOpen = false;
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      state.progressionTierExperienceOpen = false;
      state.progressionTierExperienceError = undefined;
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
      state.addItemToCompartmentId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.ancestryModalOpen = false;
      state.editingCompendiumAncestryId = undefined;
      state.deletingCompendiumAncestryId = undefined;
      state.packImportOpen = false;
      state.pendingPackBundle = undefined;
      state.packImportError = undefined;
      state.deletingInstalledPackId = undefined;
      render();
      return;
    }

    if (target.matches("[data-modal-backdrop]") && modalBackdropPointerDown && !state.characterCreationOpen) {
      modalBackdropPointerDown = false;
      state.characterCreationOpen = false;
      state.characterCreationError = undefined;
      state.modalCardId = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
      state.progressionPicker = undefined;
      state.progressionPickerIds = [];
      state.progressionConfirmationOpen = false;
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      state.progressionTierExperienceOpen = false;
      state.progressionTierExperienceError = undefined;
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
      state.addItemToCompartmentId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.ancestryModalOpen = false;
      state.editingCompendiumAncestryId = undefined;
      state.deletingCompendiumAncestryId = undefined;
      state.packImportOpen = false;
      state.pendingPackBundle = undefined;
      state.packImportError = undefined;
      state.deletingInstalledPackId = undefined;
      render();
      return;
    }

    modalBackdropPointerDown = false;

    const resourceAdjustButton = target.closest<HTMLElement>("[data-resource-adjust]");
    if (resourceAdjustButton) {
      const delta = Number(resourceAdjustButton.dataset.resourceAdjust);
      void adjustResource(delta);
      return;
    }

    if (target.closest('[data-action="export-character"]')) {
      exportCharacter();
      return;
    }

    if (target.closest('[data-action="open-pack-import"]')) {
      state.packImportOpen = true;
      state.pendingPackBundle = undefined;
      state.packImportError = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="choose-pack-file"]')) {
      document.querySelector<HTMLInputElement>("[data-pack-file]")?.click();
      return;
    }

    if (target.closest('[data-action="confirm-pack-import"]')) {
      void confirmPackImport();
      return;
    }

    const removeInstalledPackButton = target.closest<HTMLElement>('[data-action="remove-installed-pack"]');
    if (removeInstalledPackButton) {
      state.deletingInstalledPackId = removeInstalledPackButton.dataset.packId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-remove-installed-pack"]')) {
      state.deletingInstalledPackId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-remove-installed-pack"]')) {
      void confirmRemoveInstalledPack();
      return;
    }

    if (target.closest('[data-action="open-character-select"]')) {
      state.characterSelectionOpen = true;
      state.characterCreationOpen = false;
      state.characterCreationError = undefined;
      render();
      return;
    }

    const selectCharacterButton = target.closest<HTMLElement>('[data-action="select-character"]');
    if (selectCharacterButton) {
      void openCharacter(selectCharacterButton.dataset.characterId);
      return;
    }

    if (target.closest('[data-action="new-character"]')) {
      state.characterCreationOpen = true;
      state.characterCreationClassId = getCharacterCreationClasses()[0]?.id;
      state.characterCreationSubclassId = getCharacterCreationSubclasses(state.characterCreationClassId ?? "")[0]?.id;
      state.characterCreationStep = 1;
      state.characterCreationName = "";
      state.characterCreationCommunity = "";
      state.characterCreationAncestryIds = getCharacterCreationAncestries().slice(0, 1).map((ancestry) => ancestry.id);
      state.characterCreationAncestrySearch = "";
      state.characterCreationTopFeatureId = undefined;
      state.characterCreationBottomFeatureId = undefined;
      state.characterCreationError = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-new-character"]')) {
      state.characterCreationOpen = false;
      state.characterCreationStep = 1;
      state.characterCreationAncestryIds = [];
      state.characterCreationAncestrySearch = "";
      state.characterCreationTopFeatureId = undefined;
      state.characterCreationBottomFeatureId = undefined;
      state.characterCreationError = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="character-creation-previous"]')) {
      syncCharacterCreationDraft();
      state.characterCreationStep = previousCharacterCreationStep(state.characterCreationStep);
      state.characterCreationError = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="character-creation-next"]')) {
      if (!validateCharacterCreationStep()) {
        render();
        return;
      }
      state.characterCreationStep = nextCharacterCreationStep(state.characterCreationStep);
      render();
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
      state.compendiumSpread = Number(compendiumSpreadButton.dataset.compendiumSpread) as CompendiumSpread;
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
      render();
      return;
    }

    const compendiumItemPreviewButton = target.closest<HTMLElement>("[data-compendium-item-preview-id]");
    if (compendiumItemPreviewButton) {
      state.compendiumItemPreviewId = compendiumItemPreviewButton.dataset.compendiumItemPreviewId;
      render();
      return;
    }

    const compendiumItemFilterButton = target.closest<HTMLElement>("[data-compendium-item-filter]");
    if (compendiumItemFilterButton) {
      state.compendiumItemFilter = compendiumItemFilterButton.dataset.compendiumItemFilter as InventoryFilter;
      render();
      return;
    }

    const editCompendiumCardButton = target.closest<HTMLElement>('[data-action="edit-compendium-card"]');
    if (editCompendiumCardButton) {
      state.cardModalOpen = true;
      state.editingCompendiumCardId = editCompendiumCardButton.dataset.cardId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-card"]')) {
      void saveCompendiumCardAction(getCardFeatureDependencies());
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

    const progressionTierButton = target.closest<HTMLElement>('[data-action="select-progression-tier"]');
    if (progressionTierButton) {
      state.selectedProgressionTier = Number(progressionTierButton.dataset.progressionTier) as ProgressionTierNumber;
      render();
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
      } else if (kind === "subclass") {
        const character = state.character;
        if (character) {
          const tier = Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber;
          const next = getNextSubclassAdvance(character, tier);
          if (next) {
            addProgressionChoice({ kind, tier, label: `Subclasse: ${next === "specialized" ? "Especializacao" : "Maestria"}` });
          }
        }
      } else {
        addProgressionChoice({ kind, tier: Number(progressionAdvanceButton.dataset.progressionTier) as ProgressionTierNumber, label: progressionAdvanceLabels[kind] });
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
        render({ preserveMainScroll: true });
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
        addProgressionChoice({
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
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="open-progression-card-picker"]')) {
      state.progressionCardPickerMode = "mandatory";
      state.progressionCardPickerTier = undefined;
      render({ preserveMainScroll: true });
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

    const progressionCardChoice = target.closest<HTMLElement>('[data-action="select-progression-card"]');
    if (progressionCardChoice) {
      const cardId = progressionCardChoice.dataset.progressionCardId;
      if (state.progressionCardPickerMode === "advance" && cardId) {
        addProgressionChoice({ kind: "domain", tier: state.progressionCardPickerTier ?? 2, cardId, label: `Carta adicional: ${(findDefinition(catalog, cardId) as CardDefinition | undefined)?.name ?? "Carta"}` });
      } else {
        state.progressionCardId = cardId;
        state.progressionError = undefined;
      }
      state.progressionCardPickerMode = undefined;
      state.progressionCardPickerTier = undefined;
      render({ preserveMainScroll: true });
      return;
    }

    const progressionCardDestination = target.closest<HTMLElement>('[data-action="set-progression-card-destination"]');
    if (progressionCardDestination) {
      state.progressionCardDestination = progressionCardDestination.dataset.progressionCardDestination === "vault" ? "vault" : "loadout";
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="open-progression-confirmation"]')) {
      const choiceCount = getProgressionChoiceCount();
      if (choiceCount !== 2) {
        state.progressionError = `Escolha ${2 - choiceCount} avanço${2 - choiceCount === 1 ? "" : "s"} antes de confirmar.`;
      } else if (!state.progressionCardId) {
        state.progressionError = "Escolha a carta obrigatoria de Dominio antes de confirmar.";
      } else if (state.character && requiresTierExperience(state.character) && !state.progressionTierExperience?.name.trim()) {
        state.progressionError = "Defina a nova Experiencia +2 recebida ao entrar no Tier.";
      } else if (state.progressionCardDestination === "loadout" && state.character && getActiveCards(state.character).length >= 5) {
        state.progressionError = "Seu Loadout esta cheio. Mova uma carta para o Vault ou escolha Vault como destino para a nova carta.";
      } else {
        state.progressionError = undefined;
        state.progressionConfirmationOpen = true;
      }
      render({ preserveMainScroll: true });
      return;
    }

    if (target.closest('[data-action="apply-progression"]')) {
      void applyProgression();
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
      state.addingDefinitionItemId = undefined;
      state.addItemCatalogFilter = "todos";
      state.addItemError = undefined;
      render();
      return;
    }

    const addItemFilterButton = target.closest<HTMLElement>("[data-add-item-filter]");
    if (addItemFilterButton) {
      state.addItemCatalogFilter = addItemFilterButton.dataset.addItemFilter as InventoryFilter;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      render();
      return;
    }

    const addItemDefinitionButton = target.closest<HTMLElement>("[data-add-item-definition-id]");
    if (addItemDefinitionButton) {
      state.addingDefinitionItemId = addItemDefinitionButton.dataset.addItemDefinitionId;
      state.addItemError = undefined;
      render();
      return;
    }

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
      state.deletingItemId = deleteItemButton.dataset.itemId;
      state.selectedItemId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-item"]')) {
      state.deletingItemId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-item"]')) {
      void deleteInventoryItemAction(state.deletingItemId, getInventoryActionDependencies());
      return;
    }

    if (target.closest('[data-action="open-note-modal"]')) {
      state.noteModalOpen = true;
      state.editingNoteId = undefined;
      render();
      return;
    }

    const editNoteButton = target.closest<HTMLElement>('[data-action="edit-note"]');
    if (editNoteButton) {
      state.noteModalOpen = true;
      state.editingNoteId = editNoteButton.dataset.noteId;
      state.viewingNoteId = undefined;
      render();
      return;
    }

    const noteCategoryButton = target.closest<HTMLElement>("[data-note-category-option]");
    if (noteCategoryButton) {
      const categoryInput = document.querySelector<HTMLInputElement>("[data-note-category]");
      const category = noteCategoryButton.dataset.noteCategoryOption;
      if (categoryInput && category) {
        categoryInput.value = category;
      }
      document.querySelectorAll("[data-note-category-option]").forEach((button) => button.classList.remove("is-active"));
      noteCategoryButton.classList.add("is-active");
      return;
    }

    if (target.closest('[data-action="save-note"]')) {
      void saveNoteFromModal();
      return;
    }

    const deleteNoteButton = target.closest<HTMLElement>('[data-action="delete-note"]');
    if (deleteNoteButton) {
      state.deletingNoteId = deleteNoteButton.dataset.noteId;
      render();
      return;
    }

    if (target.closest('[data-action="cancel-delete-note"]')) {
      state.deletingNoteId = undefined;
      render();
      return;
    }

    if (target.closest('[data-action="confirm-delete-note"]')) {
      void deleteNote(state.deletingNoteId);
      return;
    }

    const viewNoteCard = target.closest<HTMLElement>('[data-action="view-note"]');
    if (viewNoteCard) {
      state.viewingNoteId = viewNoteCard.dataset.noteId;
      render();
      return;
    }

    const moveItemButton = target.closest<HTMLElement>('[data-action="move-item"]');
    if (moveItemButton) {
      void moveItemToCompartmentAction(moveItemButton.dataset.itemId, moveItemButton.dataset.targetCompartmentId, moveItemButton.dataset.sourceCompartmentId, getInventoryActionDependencies());
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
      state.selectedItemId = itemButton.dataset.itemId;
      render();
      return;
    }

    const resourceButton = target.closest<HTMLElement>("[data-resource-id]");
    if (resourceButton) {
      state.resourceModalId = resourceButton.dataset.resourceId;
      render();
      return;
    }

    const cardModalButton = target.closest<HTMLElement>("[data-card-modal-id]");
    if (cardModalButton) {
      state.modalCardId = cardModalButton.dataset.cardModalId;
      render();
      return;
    }

    const activateStoredCardButton = target.closest<HTMLElement>('[data-action="activate-stored-card"]');
    if (activateStoredCardButton) {
      state.activatingStoredCardId = activateStoredCardButton.dataset.cardId;
      state.cardActivationError = undefined;
      render();
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
      render();
    }

    if (event.key === "Escape" && state.selectedItemId) {
      state.selectedItemId = undefined;
      render();
    }

    if (event.key === "Escape" && state.addItemToCompartmentId) {
      state.addItemToCompartmentId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      render();
    }

    if (event.key === "Escape" && state.deletingItemId) {
      state.deletingItemId = undefined;
      render();
    }

    if (event.key === "Escape" && state.resourceModalId) {
      state.resourceModalId = undefined;
      render();
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

    if (event.key === "Escape" && state.progressionConfirmationOpen) {
      state.progressionConfirmationOpen = false;
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

    if (event.key === "Escape" && state.noteModalOpen) {
      state.noteModalOpen = false;
      state.editingNoteId = undefined;
      render();
    }

    if (event.key === "Escape" && state.viewingNoteId) {
      state.viewingNoteId = undefined;
      render();
    }

    if (event.key === "Escape" && state.deletingNoteId) {
      state.deletingNoteId = undefined;
      render();
    }

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
      render();
    }

    if (event.key === "Escape" && (state.classModalOpen || state.deletingCompendiumClassId || state.compendiumClassPreviewId)) {
      state.classModalOpen = false;
      state.editingCompendiumClassId = undefined;
      state.deletingCompendiumClassId = undefined;
      state.compendiumClassPreviewId = undefined;
      render();
    }

    if (event.key === "Escape" && state.activatingStoredCardId) {
      state.activatingStoredCardId = undefined;
      state.cardActivationError = undefined;
      render();
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

    if (target.matches("[data-compendium-ancestry-search]")) {
      state.compendiumAncestrySearch = target.value;
      render({ preserveMainScroll: true });
      focusCompendiumAncestrySearch();
    }

    if (target.matches("[data-character-ancestry-search]")) {
      state.characterCreationAncestrySearch = target.value;
      render();
      requestAnimationFrame(() => {
        const search = document.querySelector<HTMLInputElement>("[data-character-ancestry-search]");
        search?.focus({ preventScroll: true });
        search?.setSelectionRange(search.value.length, search.value.length);
      });
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.matches("[data-pack-file]")) {
      const file = target.files?.[0];
      if (file) void readPackImportFile(file);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-character-ancestry-id]")) {
      const ancestryId = target.dataset.characterAncestryId;
      if (!ancestryId) return;
      state.characterCreationAncestryIds = target.checked
        ? [...new Set([...state.characterCreationAncestryIds, ancestryId])].slice(0, 2)
        : state.characterCreationAncestryIds.filter((id) => id !== ancestryId);
      state.characterCreationTopFeatureId = undefined;
      state.characterCreationBottomFeatureId = undefined;
      state.characterCreationError = undefined;
      render();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-top-feature]")) {
      state.characterCreationTopFeatureId = target.value;
      state.characterCreationError = undefined;
      render();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-bottom-feature]")) {
      state.characterCreationBottomFeatureId = target.value;
      state.characterCreationError = undefined;
      render();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-class]")) {
      state.characterCreationClassId = target.value;
      state.characterCreationSubclassId = getCharacterCreationSubclasses(target.value)[0]?.id;
      state.characterCreationError = undefined;
      render();
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-character-subclass]")) {
      state.characterCreationSubclassId = target.value;
      state.characterCreationError = undefined;
    }
  });
}

async function boot(): Promise<void> {
  render();
  bindEvents();
  bindInventoryDragEvents(getInventoryDragDependencies());
  await refreshCatalog();
  await ensureDemoCharacter();
  state.characters = await listCharacters();
  const activeCharacterId = localStorage.getItem(activeCharacterStorageKey);
  if (activeCharacterId) {
    state.character = await loadCharacter(activeCharacterId);
    state.characterSelectionOpen = !state.character;
  }
  render();
}

void boot();
