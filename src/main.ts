import { baseCatalog } from "./content/installedPacks";
import { createCatalog, findDefinition, findDomain } from "./domain/catalog";
import type { CardDefinition, Character, CharacterNote, CharacterNoteCategory, DomainDefinition, InventoryCompartment, ItemDefinition } from "./domain/types";
import { ensureDemoCharacter, saveCharacter } from "./storage/characterRepository";
import { deleteCustomDefinition, loadCustomDefinitions, saveCustomDefinition } from "./storage/compendiumRepository";
import "./styles.css";

type Page = "overview" | "skills" | "experiences" | "inventory" | "progression" | "notes" | "compendium" | "settings" | "storedCards";
type InventoryFilter = "todos" | ItemDefinition["category"];
type ProgressionTierNumber = 2 | 3 | 4;
type SettingsSection = "general" | "localData" | "loadRules" | "appearance" | "progression";
type CompendiumView = "index" | "cards" | "domains" | "items";
type CompendiumSpread = 1 | 2;

function getAppRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");

  if (!element) {
    throw new Error("App root not found.");
  }

  return element;
}

const appRoot = getAppRoot();
let catalog = baseCatalog;

const dragState: {
  itemId?: string;
  sourceCompartmentId?: string;
  pointerId?: number;
  startX: number;
  startY: number;
  dragging: boolean;
  ghost?: HTMLDivElement;
  currentDropTargetId?: string;
  suppressNextClick: boolean;
} = {
  startX: 0,
  startY: 0,
  dragging: false,
  suppressNextClick: false
};

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
  lastPlayerPage: Page;
  selectedItemId?: string;
  selectedCardId: string;
  selectedProgressionTier: ProgressionTierNumber;
  modalCardId?: string;
  resourceModalId?: string;
  progressionHistoryOpen: boolean;
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
  addItemToCompartmentId?: string;
  addingDefinitionItemId?: string;
  addItemCatalogFilter: InventoryFilter;
  addItemError?: string;
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
  lastPlayerPage: "overview",
  selectedCardId: "card.demo.dread-veil",
  selectedProgressionTier: 2,
  progressionHistoryOpen: false,
  addContainerOpen: false,
  noteModalOpen: false,
  domainModalOpen: false,
  cardModalOpen: false,
  itemDefinitionModalOpen: false,
  addItemCatalogFilter: "todos",
  openSettingsSections: {
    general: true,
    localData: false,
    loadRules: false,
    appearance: false,
    progression: false
  }
};

const topNavItems: Array<{ page: Page; label: string }> = [
  { page: "overview", label: "Visao Geral" },
  { page: "skills", label: "Habilidades" },
  { page: "experiences", label: "Experiencias" },
  { page: "inventory", label: "Inventario" },
  { page: "progression", label: "Progressao" },
  { page: "notes", label: "Anotacoes" }
];

const sideNavItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "compendium", label: "Compendium", icon: "&#128214;" },
  { page: "settings", label: "Configuracoes", icon: "&#128220;" }
];

const appVersion = "0.6.0";

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

const skillTierLabels: Record<NonNullable<Character["skills"][number]["tier"]>, string> = {
  foundation: "Fundamento",
  specialized: "Especializada",
  mastery: "Maestria"
};

const noteCategoryLabels: Record<CharacterNoteCategory, string> = {
  session: "Sessao",
  npc: "NPC",
  place: "Local",
  quest: "Missao",
  item: "Item",
  free: "Livre"
};

function isEditorPage(page: Page): boolean {
  return page === "compendium" || page === "settings";
}

const progressionTiers = [
  {
    tier: 2,
    levels: "2-4",
    status: "available",
    headline: "Ao nivel 2, ganhe uma Experiencia adicional em +2 e +1 em Proficiencia.",
    choices: 2,
    options: [
      "Ganhe +1 em dois atributos ainda nao marcados.",
      "Ganhe permanentemente um slot de PV.",
      "Ganhe permanentemente um slot de Estresse.",
      "Ganhe +1 em duas Experiencias.",
      "Escolha uma carta de dominio adicional do seu nivel ou menor.",
      "Ganhe permanentemente +1 em Evasao."
    ],
    footer: "Atualize seu nivel e ajuste os limiares de dano quando aplicar a evolucao."
  },
  {
    tier: 3,
    levels: "5-7",
    status: "locked",
    headline: "Ao nivel 5, ganhe uma Experiencia adicional em +2, limpe marcacoes de atributos e ganhe +1 em Proficiencia.",
    choices: 2,
    options: [
      "Ganhe +1 em dois atributos ainda nao marcados.",
      "Ganhe permanentemente um slot de PV.",
      "Ganhe permanentemente um slot de Estresse.",
      "Ganhe +1 em duas Experiencias.",
      "Escolha uma carta de dominio adicional do seu nivel ou menor.",
      "Ganhe permanentemente +1 em Evasao.",
      "Escolha uma subclasse aprimorada.",
      "Multiclasse: escolha uma classe adicional."
    ],
    footer: "Opcoes de subclasse e multiclasse aparecem aqui como estrutura visual."
  },
  {
    tier: 4,
    levels: "8-10",
    status: "locked",
    headline: "Ao nivel 8, ganhe uma Experiencia adicional em +2, limpe marcacoes de atributos e ganhe +1 em Proficiencia.",
    choices: 2,
    options: [
      "Ganhe +1 em dois atributos ainda nao marcados.",
      "Ganhe permanentemente um slot de PV.",
      "Ganhe permanentemente um slot de Estresse.",
      "Ganhe +1 em duas Experiencias.",
      "Escolha uma carta de dominio adicional do seu nivel ou menor.",
      "Ganhe permanentemente +1 em Evasao.",
      "Escolha uma subclasse aprimorada.",
      "Multiclasse: escolha uma classe adicional."
    ],
    footer: "Esta area sera ligada futuramente as configuracoes de progressao."
  }
] as const;

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

function renderSidebar(character: Character): string {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-identity">
          <div class="brand-mark"><img src="assets/brand/soulforge-symbol.png" alt="" /></div>
          <strong>SOULFORGE</strong>
        </div>
        <nav class="side-nav brand-actions" aria-label="Menu secundario">
          ${sideNavItems
            .map(
              (item) => `
                <button
                  class="nav-button icon-nav-button ${state.page === item.page ? "is-active" : ""}"
                  data-page="${item.page}"
                  aria-label="${item.label}"
                  title="${item.label}"
                >
                  <span aria-hidden="true">${item.icon}</span>
                </button>
              `
            )
            .join("")}
        </nav>
      </div>
      <div class="portrait">
        <div class="portrait-art"></div>
        <div>
          <strong>${escapeHtml(character.identity.name)}</strong>
          <span>${escapeHtml(character.identity.ancestry)} - ${escapeHtml(character.identity.className)}</span>
          <div class="portrait-progress">
            <div>
              <span>Nivel ${character.identity.level}</span>
              <strong>${character.identity.xp} / ${character.identity.nextLevelXp} XP</strong>
            </div>
            <div class="bar"><i style="width: ${progressPercent(character.identity.xp, character.identity.nextLevelXp)}%"></i></div>
          </div>
        </div>
      </div>
      <section class="sidebar-section">
        <div class="sidebar-section-title">Atributos</div>
        <div class="sidebar-attribute-grid">
          ${character.attributes
            .map(
              (attribute) => `
                <div class="attribute-badge ${attribute.upgraded ? "is-upgraded" : ""}">
                  <span title="${attribute.label}">${attributeTitle(attribute.label)}</span>
                  <strong>${attribute.value}</strong>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="sidebar-section">
        <div class="sidebar-section-title">Defesa</div>
        <div class="sidebar-defense-grid">
          <div class="defense-badge defense-evasion"><strong>${character.defense.evasion}</strong><span>Evasao</span></div>
          <div class="defense-badge defense-armor"><strong>${character.defense.armor}</strong><span>Armadura</span></div>
          <div class="defense-badge defense-minor"><strong>${character.defense.minor}</strong><span>Dano menor</span></div>
          <div class="defense-badge defense-major"><strong>${character.defense.major}</strong><span>Dano maior</span></div>
        </div>
      </section>
    </aside>
  `;
}

function renderTopbar(): string {
  return `
    <header class="topbar">
      <nav class="top-nav" aria-label="Menu do personagem">
        ${topNavItems
          .map((item) => `<button class="top-link ${state.page === item.page ? "is-active" : ""}" data-page="${item.page}">${item.label}</button>`)
          .join("")}
      </nav>
      <span class="offline-pill" title="A PWA instala o app e guarda a casca offline.">Offline-ready</span>
    </header>
  `;
}

function renderEditorHeader(): string {
  return `
    <header class="editor-header">
      <div class="editor-brand">
        <div class="brand-mark"><img src="assets/brand/soulforge-symbol.png" alt="" /></div>
        <div>
          <strong>SOULFORGE</strong>
          <span>Modo Editor</span>
        </div>
      </div>
      <nav class="editor-nav" aria-label="Areas globais">
        ${sideNavItems
          .map(
            (item) => `
              <button class="editor-nav-button ${state.page === item.page ? "is-active" : ""}" type="button" data-page="${item.page}">
                <span aria-hidden="true">${item.icon}</span>
                ${item.label}
              </button>
            `
          )
          .join("")}
      </nav>
      <div class="editor-context">
        <button class="secondary-action" type="button" data-action="back-player-mode">Voltar a ficha</button>
      </div>
    </header>
  `;
}

function renderResources(character: Character): string {
  return `
    <section class="band resources-band" aria-labelledby="resources-title">
      <div class="section-heading">
        <h2 id="resources-title">Recursos</h2>
      </div>
      <div class="resource-grid">
        ${character.resources
          .map(
            (resource) => `
              <button class="resource-card tone-${resource.tone}" data-resource-id="${resource.id}">
                <div class="resource-card-header">
                  <span>${escapeHtml(resource.label)}</span>
                  <strong>${resource.value} / ${resource.max}</strong>
                </div>
                ${renderResourceIndicator(resource)}
              </button>
            `
          )
          .join("")}
        <button class="resource-add-card" data-action="add-resource">
          <span>+</span>
          Adicionar recurso
        </button>
      </div>
    </section>
  `;
}

function renderResourceIndicator(resource: Character["resources"][number]): string {
  if (resource.max > 10) {
    return `<div class="resource-meter" aria-hidden="true"><i style="width: ${progressPercent(resource.value, resource.max)}%"></i></div>`;
  }

  if (resource.id === "armor-slots") {
    return `
      <div class="shield-pips" aria-hidden="true">
        ${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}
      </div>
    `;
  }

  return `
    <div class="pips" aria-hidden="true">
      ${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}
    </div>
  `;
}

function renderOverview(character: Character): string {
  const activeCards = getActiveCards(character);
  const inactiveCards = getInactiveCardCount(character);

  return `
    <main class="content">
      ${renderResources(character)}
      <section class="band">
        <div class="section-heading">
          <h2>Cartas ativas</h2>
          <span>${activeCards.length} / 5 ativas</span>
        </div>
        <div class="card-row">
          ${activeCards.map(renderCardTile).join("")}
        </div>
        <button class="deck-drawer-button" data-action="open-stored-cards">
          Ver cartas guardadas (${inactiveCards})
        </button>
      </section>
      <section class="quick-actions">
        <button data-action="rest-short"><span>REST</span> Descansar breve</button>
        <button data-action="rest-long"><span>FULL</span> Descansar longo</button>
        <button data-page="experiences"><span>XP</span> Registrar experiencia</button>
      </section>
    </main>
  `;
}

function renderStoredCards(character: Character): string {
  const storedCards = getStoredCards(character);

  return `
    <main class="content">
      <section class="band">
        <div class="screen-title">
          <div>
            <h1>Cartas guardadas</h1>
            <p>Cartas aprendidas pelo personagem, mas que nao estao ativas no momento.</p>
          </div>
        </div>
        <div class="section-heading">
          <h2>Deck reserva</h2>
          <span>${storedCards.length} guardadas</span>
        </div>
        ${
          storedCards.length
            ? `<div class="card-row stored-card-row">${storedCards.map(renderStoredCardTile).join("")}</div>`
            : renderEmptyInline("Nenhuma carta guardada por enquanto.")
        }
      </section>
    </main>
  `;
}

function renderStoredCardTile(card: CardDefinition): string {
  return `
    <article class="stored-card">
      ${renderCardTile(card)}
      <button class="stored-card-action" type="button" data-action="activate-stored-card" data-card-id="${card.id}">
        Ativar carta
      </button>
    </article>
  `;
}

function renderSkills(character: Character): string {
  const classSkills = character.skills.filter((skill) => skill.source === "class");
  const ancestrySkills = character.skills.filter((skill) => skill.source === "ancestry");
  const communitySkills = character.skills.filter((skill) => skill.source === "community");

  return `
    <main class="content">
      <div class="screen-title">
        <div>
          <h1>Habilidades</h1>
          <p>Recursos narrativos e mecanicos do personagem, agrupados pela origem.</p>
        </div>
      </div>
      <div class="skill-layout">
        <section class="skill-column skill-column-wide">
          <div class="section-heading">
            <h2>${skillSourceLabels.class}</h2>
          </div>
          ${renderClassSkillGroup("foundation", classSkills)}
          ${renderClassSkillGroup("specialized", classSkills)}
          ${renderClassSkillGroup("mastery", classSkills)}
        </section>
        <section class="skill-column">
          <div class="section-heading">
            <h2>${skillSourceLabels.ancestry}</h2>
          </div>
          ${renderSkillList(ancestrySkills)}
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

function renderClassSkillGroup(tier: NonNullable<Character["skills"][number]["tier"]>, skills: Character["skills"]): string {
  const filteredSkills = skills.filter((skill) => skill.tier === tier);

  return `
    <div class="skill-group">
      <h3>${skillTierLabels[tier]}</h3>
      ${renderSkillList(filteredSkills)}
    </div>
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
                <span>${skill.tier ? skillTierLabels[skill.tier] : skillSourceLabels[skill.source]}</span>
              </div>
              <p>${escapeHtml(skill.description)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderExperiences(character: Character): string {
  return `
    <main class="content">
      <div class="screen-title">
        <div>
          <h1>Experiencias</h1>
          <p>Marcadores narrativos que podem apoiar testes quando fizer sentido na ficcao.</p>
        </div>
      </div>
      ${
        character.experiences.length
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
          : renderEmptyInline("Nenhuma experiencia registrada.")
      }
    </main>
  `;
}

function renderNotes(character: Character): string {
  const notes = [...character.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return `
    <main class="content">
      <div class="screen-title">
        <div>
          <h1>Anotacoes</h1>
          <p>Registre lembretes, pistas e detalhes importantes da campanha.</p>
        </div>
        <button class="primary-action screen-title-action" type="button" data-action="open-note-modal">Nova anotacao</button>
      </div>
      ${
        notes.length
          ? `<div class="notes-grid">${notes.map(renderNoteCard).join("")}</div>`
          : renderEmptyInline("Nenhuma anotacao registrada.")
      }
    </main>
  `;
}

function renderNoteCard(note: CharacterNote): string {
  return `
    <article class="note-card" data-action="view-note" data-note-id="${note.id}">
      <div class="note-card-heading">
        <span>${noteCategoryLabels[note.category]}</span>
        <small>${formatNoteDate(note.updatedAt)}</small>
      </div>
      <h2>${escapeHtml(note.title)}</h2>
      <p>${escapeHtml(note.content)}</p>
      <div class="note-actions">
        <button type="button" data-action="edit-note" data-note-id="${note.id}">Editar</button>
        <button type="button" data-action="delete-note" data-note-id="${note.id}">Excluir</button>
      </div>
    </article>
  `;
}

function formatNoteDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}

function renderSettings(character: Character): string {
  const activePack = catalog.packs[0];
  const offlineStatus = "PWA pronta para uso offline";

  return `
    <main class="content settings-content">
      <div class="screen-title">
        <div>
          <h1>Configuracoes</h1>
          <p>Ajustes da aplicacao, dados locais e regras que moldam novos personagens.</p>
        </div>
      </div>

      <div class="settings-grid">
        ${renderSettingsSection(
          "general",
          "Geral",
          "Versao, pacote ativo e disponibilidade offline.",
          `
            <dl class="settings-readable-list">
              ${renderReadableSetting("Versao do app", `v${appVersion}`)}
              ${renderReadableSetting("Pack ativo", `${activePack?.name ?? "Sem pack"} v${activePack?.version ?? "0.0.0"}`)}
              ${renderReadableSetting("Status offline/PWA", offlineStatus)}
            </dl>
          `
        )}

        ${renderSettingsSection(
          "localData",
          "Dados locais",
          "Exportar, importar e proteger os dados deste dispositivo.",
          `
            <p class="settings-panel-copy">Tudo fica salvo neste dispositivo. Exportar ja funciona; importacao e limpeza entram quando fecharmos o fluxo de seguranca.</p>
            <div class="settings-actions">
              <button class="settings-action settings-action-primary" type="button" data-action="export-character">Exportar personagem</button>
              <button class="settings-action" type="button" disabled>Importar personagem <span>Em breve</span></button>
              <button class="settings-action" type="button" disabled>Criar backup <span>Em breve</span></button>
              <button class="settings-action settings-action-danger" type="button" disabled>Apagar dados locais <span>Exige confirmacao</span></button>
            </div>
          `
        )}

        ${renderSettingsSection(
          "loadRules",
          "Regras de Carga",
          "Capacidade, peso e padroes usados por novos personagens.",
          `
            <div class="settings-list">
              ${renderSettingInfo("Containers padrao", "Equipados e Mochila")}
              ${renderSettingInfo("Capacidade padrao", `${character.inventory.capacity} espacos`)}
              ${renderSettingInfo("Regra de peso", "Peso por item")}
              ${renderSettingInfo("Aplicacao", "Novos personagens")}
            </div>
          `
        )}

        ${renderSettingsSection(
          "appearance",
          "Aparencia",
          "Tema, paleta, densidade e tamanho dos componentes.",
          `
            <div class="settings-option-grid">
              ${renderSettingOption("Tema", "Escuro", true)}
              ${renderSettingOption("Paleta", "SoulForge", true)}
              ${renderSettingOption("Densidade", "Confortavel", true)}
              ${renderSettingOption("Cartas e itens", "Medios", true)}
            </div>
          `
        )}

        ${renderSettingsSection(
          "progression",
          "Progressao",
          "Regras de tier e ganhos usados pela tela de Progressao.",
          `
            <p class="settings-panel-copy">Esta area vai concentrar quais opcoes existem por tier, ganhos automaticos e regras usadas pela tela de Progressao.</p>
            <div class="settings-option-grid settings-option-grid-wide">
              ${renderSettingOption("Tiers", "2, 3 e 4", true)}
              ${renderSettingOption("Escolhas por nivel", "Configuravel depois", false)}
              ${renderSettingOption("Ganhos automaticos", "Configuravel depois", false)}
            </div>
          `,
          true
        )}
      </div>
    </main>
  `;
}

function renderSettingsSection(section: SettingsSection, title: string, summary: string, content: string, wide = false): string {
  const isOpen = state.openSettingsSections[section];
  const contentId = `settings-section-${section}`;

  return `
    <section class="settings-panel ${wide ? "settings-panel-wide" : ""} ${isOpen ? "is-open" : "is-collapsed"}">
      <button
        class="settings-panel-toggle"
        type="button"
        data-settings-section="${section}"
        aria-expanded="${isOpen}"
        aria-controls="${contentId}"
      >
        <span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(summary)}</small>
        </span>
        <i aria-hidden="true">${isOpen ? "−" : "+"}</i>
      </button>
      ${
        isOpen
          ? `<div class="settings-panel-body" id="${contentId}">${content}</div>`
          : ""
      }
    </section>
  `;
}

function renderReadableSetting(label: string, value: string): string {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function renderSettingInfo(label: string, value: string): string {
  return `
    <div class="setting-info">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderSettingOption(label: string, value: string, active: boolean): string {
  return `
    <button class="setting-option ${active ? "is-active" : ""}" type="button" disabled>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${active ? "Atual" : "Em breve"}</small>
    </button>
  `;
}

function renderProgression(character: Character): string {
  const selectedTier = progressionTiers.find((tier) => tier.tier === state.selectedProgressionTier) ?? progressionTiers[0];

  return `
    <main class="content progression-content">
      <div class="screen-title">
        <div>
          <h1>Progressao</h1>
        </div>
      </div>
      <div class="progression-bar" aria-label="Resumo da progressao">
        <div class="progression-bar-summary">
          <span><strong>Proxima etapa</strong> Nivel ${character.identity.level + 1}</span>
          <span><strong>Escolhas</strong> 2 opcoes</span>
        </div>
        <div class="progression-tabs" role="tablist" aria-label="Tiers de progressao">
          ${progressionTiers
            .map(
              (tier) => `
                <button class="${state.selectedProgressionTier === tier.tier ? "is-active" : ""}" type="button" data-progression-tier="${tier.tier}">
                  <strong>Tier ${tier.tier}</strong>
                  <span>Niveis ${tier.levels}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <section class="progression-board">
        ${renderProgressionTier(selectedTier, character.identity.level)}
      </section>
    </main>
  `;
}

function renderProgressionTier(tier: (typeof progressionTiers)[number], currentLevel: number): string {
  const startLevel = Number(tier.levels.split("-")[0]);
  const endLevel = Number(tier.levels.split("-")[1]);
  const isCurrentTier = currentLevel >= startLevel && currentLevel <= endLevel;
  const isPastTier = currentLevel > endLevel;
  const statusLabel = isPastTier ? "Concluido" : isCurrentTier ? "Atual" : "Bloqueado";

  return `
    <article class="progression-tier ${isCurrentTier ? "is-current" : ""} ${isPastTier ? "is-complete" : ""}">
      <div class="progression-tier-header">
        <p class="progression-tier-headline">${escapeHtml(tier.headline)}</p>
        <button class="progression-history-button" type="button" data-action="open-progression-history">Ver historico</button>
      </div>
      <div class="progression-tier-meta">
        <span>${tier.choices} escolhas</span>
        <span>${statusLabel}</span>
      </div>
      <div class="progression-option-list">
        ${tier.options.map((option, index) => renderProgressionOption(option, index, isCurrentTier)).join("")}
      </div>
      <p class="progression-tier-footer">${escapeHtml(tier.footer)}</p>
    </article>
  `;
}

function renderProgressionHistoryModal(): string {
  if (!state.progressionHistoryOpen) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="progression-history-modal" role="dialog" aria-modal="true" aria-labelledby="progression-history-title">
        <button class="modal-close" data-modal-close aria-label="Fechar historico">x</button>
        <span class="resource-modal-label">Progressao</span>
        <h2 id="progression-history-title">Historico de escolhas</h2>
        <ol>
          <li>
            <strong>Nivel 2</strong>
            <span>Experiencia adicional +2 registrada.</span>
          </li>
          <li>
            <strong>Nivel 3</strong>
            <span>Escolhas permanentes pendentes de confirmacao.</span>
          </li>
          <li>
            <strong>Nivel 4</strong>
            <span>Aguardando nova progressao.</span>
          </li>
        </ol>
        <p>Este historico ainda e visual. Futuramente ele sera preenchido pelas escolhas aplicadas durante a evolucao.</p>
      </section>
    </div>
  `;
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

function renderNoteModal(): string {
  const character = state.character;
  if (!character || !state.noteModalOpen) {
    return "";
  }

  const note = character.notes.find((entry) => entry.id === state.editingNoteId);
  const selectedCategory = note?.category ?? "session";

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
        <div class="container-modal-heading">
          <h2 id="note-modal-title">${note ? "Editar anotacao" : "Nova anotacao"}</h2>
          <button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar anotacao">x</button>
        </div>
        <p class="form-error" data-note-error hidden></p>
        <label>
          <span>Titulo</span>
          <input data-note-title type="text" value="${escapeHtml(note?.title ?? "")}" placeholder="Ex.: Nome do contato misterioso" />
        </label>
        <div class="note-category-field">
          <span>Categoria</span>
          <div class="note-category-options">
            ${(Object.keys(noteCategoryLabels) as CharacterNoteCategory[])
              .map(
                (category) => `
                  <button
                    class="${selectedCategory === category ? "is-active" : ""}"
                    type="button"
                    data-note-category-option="${category}"
                  >
                    ${noteCategoryLabels[category]}
                  </button>
                `
              )
              .join("")}
          </div>
          <input data-note-category type="hidden" value="${selectedCategory}" />
        </div>
        <label>
          <span>Conteudo</span>
          <textarea data-note-content rows="8" placeholder="Anote pistas, promessas, NPCs ou ideias da sessao...">${escapeHtml(note?.content ?? "")}</textarea>
        </label>
        <button class="primary-action" type="button" data-action="save-note">Salvar anotacao</button>
      </section>
    </div>
  `;
}

function renderViewNoteModal(): string {
  const character = state.character;
  if (!character || !state.viewingNoteId) {
    return "";
  }

  const note = character.notes.find((entry) => entry.id === state.viewingNoteId);
  if (!note) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="note-view-modal" role="dialog" aria-modal="true" aria-labelledby="view-note-title">
        <div class="container-modal-heading">
          <div>
            <span class="resource-modal-label">${noteCategoryLabels[note.category]}</span>
            <h2 id="view-note-title">${escapeHtml(note.title)}</h2>
          </div>
          <button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar anotacao">x</button>
        </div>
        <small>Atualizado em ${formatNoteDate(note.updatedAt)}</small>
        <p>${escapeHtml(note.content)}</p>
        <button class="primary-action" type="button" data-action="edit-note" data-note-id="${note.id}">Editar anotacao</button>
      </section>
    </div>
  `;
}

function renderDeleteNoteModal(): string {
  const character = state.character;
  if (!character || !state.deletingNoteId) {
    return "";
  }

  const note = character.notes.find((entry) => entry.id === state.deletingNoteId);
  if (!note) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-note-title">
        <button class="modal-close" data-modal-close aria-label="Cancelar exclusao">x</button>
        <span class="resource-modal-label">Excluir anotacao</span>
        <h2 id="delete-note-title">${escapeHtml(note.title)}</h2>
        <p>Esta acao removera a anotacao permanentemente.</p>
        <div class="danger-summary">
          <strong>!</strong>
          <span>A anotacao nao podera ser recuperada neste momento.</span>
        </div>
        <div class="confirmation-actions">
          <button class="secondary-action" type="button" data-action="cancel-delete-note">Cancelar</button>
          <button class="danger-action" type="button" data-action="confirm-delete-note">Excluir anotacao</button>
        </div>
      </section>
    </div>
  `;
}

function renderProgressionOption(option: string, index: number, isCurrentTier: boolean): string {
  const selected = isCurrentTier && index < 2;

  return `
    <button class="progression-option ${selected ? "is-selected" : ""}" type="button" data-action="progression-option">
      <i aria-hidden="true"></i>
      <span>${escapeHtml(option)}</span>
    </button>
  `;
}

function renderEmptyInline(message: string): string {
  return `<p class="empty-inline">${escapeHtml(message)}</p>`;
}

function renderCardTile(card: CardDefinition): string {
  return `
    <button class="ability-card" data-card-modal-id="${card.id}">
      <div class="card-tier">${card.tier}</div>
      <div class="card-art"></div>
      <h3>${escapeHtml(card.name)}</h3>
      <span>${escapeHtml(card.cardType)}</span>
      <p>${escapeHtml(card.summary)}</p>
    </button>
  `;
}

function renderInventory(character: Character): string {
  const entries = getItemEntries(character);
  const selectedEntry = entries.find(({ item }) => item.id === state.selectedItemId);
  const selectedItem = selectedEntry?.item;
  const compartments = getInventoryCompartments(character);

  return `
    <main class="content inventory-layout">
      <section class="inventory-main">
        <div class="screen-title">
          <h1>Inventario</h1>
        </div>
        <div class="filter-row">
          ${(Object.keys(itemFilterLabels) as InventoryFilter[])
            .map(
              (filter) => `
                <button class="chip ${state.inventoryFilter === filter ? "is-active" : ""}" data-inventory-filter="${filter}">
                  ${itemFilterLabels[filter]}
                </button>
              `
            )
            .join("")}
          <button class="chip inventory-container-action" data-action="add-container" type="button">Novo container</button>
        </div>
        <div class="inventory-compartments">
          ${compartments.map((compartment) => renderInventoryCompartment(compartment, entries, selectedItem?.id)).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderInventoryCompartment(
  compartment: InventoryCompartment,
  entries: ReturnType<typeof getItemEntries>,
  selectedItemId?: string
): string {
  const compartmentEntries = entries.filter(({ entry, item }) => {
    const sameCompartment = getEntryCompartmentId(entry) === compartment.id;
    const sameFilter = state.inventoryFilter === "todos" || item.category === state.inventoryFilter;
    return sameCompartment && sameFilter;
  });
  const currentWeight = getCompartmentWeight(entries, compartment.id);
  const capacityLabel = compartment.capacity ? `${currentWeight} / ${compartment.capacity}` : `${compartmentEntries.length} itens`;

  return `
    <section class="inventory-compartment" data-compartment-id="${compartment.id}">
      <div class="compartment-heading">
        <div>
          <h2>${escapeHtml(compartment.name)}</h2>
          <span>${renderCompartmentHint(compartment)}</span>
        </div>
        <div class="compartment-actions">
          <strong>${capacityLabel}</strong>
          <button class="add-item-to-container" type="button" data-action="open-add-item-to-container" data-compartment-id="${compartment.id}">Adicionar item</button>
          <button type="button" data-action="delete-container" data-compartment-id="${compartment.id}" ${compartment.source === "character" ? "disabled" : ""}>
            Excluir
          </button>
        </div>
      </div>
      ${
        compartment.capacity
          ? `<div class="capacity-bar compartment-capacity"><i style="width: ${progressPercent(currentWeight, compartment.capacity)}%"></i></div>`
          : ""
      }
      ${
        compartmentEntries.length
          ? `<div class="item-grid ${compartment.id === "equipped" ? "equipped-grid" : ""}">
              ${compartmentEntries
                .map(({ entry, item }) =>
                  renderItemTile(entry.quantity, item, selectedItemId === item.id, Boolean(entry.equipped), compartment.id)
                )
                .join("")}
            </div>`
          : renderEmptyInline("Nenhum item neste compartimento.")
      }
    </section>
  `;
}

function canAddItemToCompartment(compartment: InventoryCompartment, entries: ReturnType<typeof getItemEntries>, item: ItemDefinition, quantity: number): boolean {
  if (!canCompartmentAcceptItem(compartment, item)) {
    return false;
  }
  if (!compartment.capacity) {
    return true;
  }
  return getCompartmentWeight(entries, compartment.id) + item.weight * quantity <= compartment.capacity;
}

function renderAddItemToContainerModal(): string {
  const character = state.character;
  const compartment = character && state.addItemToCompartmentId ? getInventoryCompartments(character).find((entry) => entry.id === state.addItemToCompartmentId) : undefined;
  if (!character || !compartment) {
    return "";
  }
  const entries = getItemEntries(character);
  const availableItems = catalog.items.filter((item) => canCompartmentAcceptItem(compartment, item) && (state.addItemCatalogFilter === "todos" || item.category === state.addItemCatalogFilter));
  const selectedDefinition = state.addingDefinitionItemId ? findDefinition(catalog, state.addingDefinitionItemId) : undefined;
  const selectedItem = selectedDefinition?.type === "item" ? selectedDefinition : undefined;
  const quantity = 1;
  const fitsSelected = selectedItem ? canAddItemToCompartment(compartment, entries, selectedItem, quantity) : false;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal add-item-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
        <div class="container-modal-heading"><h2 id="add-item-title">Adicionar item</h2><button class="modal-close modal-close-inline" data-modal-close aria-label="Fechar adicionar item">x</button></div>
        <p>Escolha um item do Compendium para adicionar em <strong>${escapeHtml(compartment.name)}</strong>.</p>
        <div class="filter-row add-item-filter-row">
          ${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip ${state.addItemCatalogFilter === category ? "is-active" : ""}" type="button" data-add-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}
        </div>
        <div class="add-item-catalog">
          ${availableItems.length ? availableItems.map((item) => `<button class="item-tile add-item-choice ${state.addingDefinitionItemId === item.id ? "is-active" : ""}" type="button" data-add-item-definition-id="${item.id}"><span class="item-media">${renderItemVisual(item, "tile")}</span><strong>${escapeHtml(item.name)}</strong><small>${item.tier ? `Tier ${item.tier} - ` : ""}${itemFilterLabels[item.category]} · Peso ${item.weight}</small></button>`).join("") : renderEmptyInline("Nenhum item compativel com este container.")}
        </div>
        ${selectedItem ? `<div class="add-item-confirm"><label><span>Quantidade</span><input type="number" min="1" step="1" value="1" data-add-item-quantity /></label><span>${fitsSelected ? "O item cabe neste container." : "Nao ha capacidade suficiente neste container."}</span><button class="primary-action" type="button" data-action="confirm-add-item-to-container">Adicionar</button></div>${state.addItemError ? `<p class="form-error">${escapeHtml(state.addItemError)}</p>` : ""}` : ""}
      </section>
    </div>
  `;
}

function renderCompartmentHint(compartment: InventoryCompartment): string {
  if (compartment.accepts?.length) {
    return `Aceita ${compartment.accepts.map((category) => itemFilterLabels[category]).join(", ")}`;
  }

  if (compartment.capacity) {
    return "Compartimento com capacidade propria";
  }

  return "Acesso rapido";
}

function renderItemTile(quantity: number, item: ItemDefinition, selected: boolean, equipped: boolean, compartmentId: string): string {
  return `
    <button class="item-tile ${selected ? "is-active" : ""}" data-item-id="${item.id}" data-item-compartment-id="${compartmentId}" draggable="false">
      <span class="item-media">
        ${renderItemVisual(item, "tile")}
        <span class="item-quantity">x${quantity}</span>
      </span>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]} - ${itemFilterLabels[item.category]}</small>
      ${equipped ? `<em>Equipado</em>` : ""}
    </button>
  `;
}

function renderItemVisual(item: ItemDefinition, variant: "tile" | "detail"): string {
  if (item.image) {
    return `<img src="${escapeHtml(item.image)}" alt="" />`;
  }

  return `<span class="item-icon item-icon-${variant}">${itemIcon(item.category)}</span>`;
}

function itemIcon(category: ItemDefinition["category"]): string {
  const icons: Record<ItemDefinition["category"], string> = {
    arma: "WPN",
    armadura: "ARM",
    consumivel: "POT",
    equipamento: "KIT",
    loot: "LOOT"
  };

  return icons[category];
}

function renderItemModal(): string {
  const character = state.character;

  if (!character || !state.selectedItemId) {
    return "";
  }

  const entries = getItemEntries(character);
  const selectedEntry = entries.find(({ item }) => item.id === state.selectedItemId);

  if (!selectedEntry) {
    return "";
  }

  const { item, entry } = selectedEntry;
  const compartments = getInventoryCompartments(character);
  const currentCompartmentId = getEntryCompartmentId(entry);
  const currentCompartment = compartments.find((compartment) => compartment.id === currentCompartmentId);

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar item">x</button>
        <div class="item-modal-art">
          ${renderItemVisual(item, "detail")}
        </div>
        <div class="item-modal-body">
          <span class="resource-modal-label">${itemFilterLabels[item.category]}</span>
          <div class="item-modal-heading">
            <div>
              <h2 id="item-modal-title">${escapeHtml(item.name)}</h2>
              <span>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</span>
            </div>
          </div>
          <p>${escapeHtml(item.summary)}</p>
          <dl class="detail-list item-modal-details">
            <div><dt>Qtd.</dt><dd>${entry.quantity}</dd></div>
            <div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div>
            <div><dt>Peso</dt><dd>${item.weight}</dd></div>
            <div><dt>Container</dt><dd>${escapeHtml(currentCompartment?.name ?? "Mochila")}</dd></div>
          </dl>
          <div class="trait-list">
            ${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}
          </div>
          <div class="move-list">
            <span>Mover para</span>
            ${compartments
              .map((compartment) => {
                const isCurrent = compartment.id === currentCompartmentId;
                const accepts = canCompartmentAcceptItem(compartment, item);
                const fits = wouldFitCompartment(compartment, entries, item, entry.quantity, currentCompartmentId);
                const disabled = isCurrent || !accepts || !fits;
                const reason = isCurrent ? "Atual" : !accepts ? "Incompativel" : !fits ? "Sem espaco" : "Mover";

                return `
                  <button
                    class="move-target ${isCurrent ? "is-current" : ""}"
                    type="button"
                    data-action="move-item"
                    data-item-id="${item.id}"
                    data-target-compartment-id="${compartment.id}"
                    data-source-compartment-id="${currentCompartmentId}"
                    ${disabled ? "disabled" : ""}
                  >
                    <strong>${escapeHtml(compartment.name)}</strong>
                    <small>${reason}</small>
                  </button>
                `;
              })
              .join("")}
          </div>
          <button class="danger-action" type="button" data-action="delete-item" data-item-id="${item.id}">Descartar</button>
        </div>
      </section>
    </div>
  `;
}

function renderDeleteItemModal(): string {
  const character = state.character;
  if (!character || !state.deletingItemId) {
    return "";
  }

  const selectedEntry = getItemEntries(character).find(({ item }) => item.id === state.deletingItemId);
  if (!selectedEntry) {
    return "";
  }

  const { item, entry } = selectedEntry;
  const compartment = getInventoryCompartments(character).find((container) => container.id === getEntryCompartmentId(entry));

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="container-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-item-title">
        <button class="modal-close" data-modal-close aria-label="Cancelar descarte">x</button>
        <span class="resource-modal-label">Descartar item</span>
        <h2 id="delete-item-title">${escapeHtml(item.name)}</h2>
        <p>Esta acao removera o item do inventario do personagem.</p>
        <div class="danger-summary">
          <strong>${entry.quantity}</strong>
          <span>${entry.quantity === 1 ? "unidade sera perdida" : "unidades serao perdidas"} em ${escapeHtml(compartment?.name ?? "Mochila")}</span>
        </div>
        <div class="confirmation-actions">
          <button class="secondary-action" type="button" data-action="cancel-delete-item">Cancelar</button>
          <button class="danger-action" type="button" data-action="confirm-delete-item">Descartar item</button>
        </div>
      </section>
    </div>
  `;
}

function renderResourceModal(resourceId?: string): string {
  const character = state.character;
  if (!character || !resourceId) {
    return "";
  }

  const resource = character.resources.find((entry) => entry.id === resourceId);
  if (!resource) {
    return "";
  }

  return `
    <div class="modal-backdrop resource-modal-backdrop" data-modal-backdrop>
      <section class="resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar recurso">x</button>
        <span class="resource-modal-label">Recurso</span>
        <h2 id="resource-modal-title">${escapeHtml(resource.label)}</h2>
        <div class="resource-stepper">
          <button data-resource-adjust="-1" aria-label="Diminuir ${escapeHtml(resource.label)}">-</button>
          <strong>${resource.value} / ${resource.max}</strong>
          <button data-resource-adjust="1" aria-label="Aumentar ${escapeHtml(resource.label)}">+</button>
        </div>
        ${renderResourceIndicator(resource)}
      </section>
    </div>
  `;
}

function renderCompendium(): string {
  if (state.compendiumView === "cards") {
    return renderCompendiumCardsManager();
  }
  if (state.compendiumView === "domains") {
    return renderCompendiumDomainsManager();
  }
  if (state.compendiumView === "items") {
    return renderCompendiumItemsManager();
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
        <button type="button" disabled>Abertura 3 <span>Comunidades | Condicoes</span></button>
      </nav>

      ${state.compendiumSpread === 1 ? renderCompendiumFirstSpread() : renderCompendiumSecondSpread()}
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
        <article class="compendium-page compendium-page-blank">
          <div class="compendium-page-heading">
            <h2>Classes</h2>
            <p>Classes e suas especializacoes serao organizadas aqui, preservando a relacao com as habilidades do personagem.</p>
          </div>
          <span>Capitulo em preparacao</span>
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

function isLocalDefinition(definition: DomainDefinition): boolean {
  return definition.packId === "local";
}

function renderCompendiumDomainsManager(): string {
  const sortedDomains = [...catalog.domains].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return `
    <main class="content compendium-content">
      <div class="screen-title">
        <div>
          <h1>Dominios</h1>
          <p>Organize as vertentes que classificam as cartas do seu Compendium.</p>
        </div>
        <button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button>
      </div>
      <section class="compendium-management-panel">
        <div class="compendium-management-toolbar">
          <div class="management-copy"><span>BASE DO COMPENDIUM</span><strong>${sortedDomains.length} ${sortedDomains.length === 1 ? "dominio" : "dominios"}</strong></div>
          <button class="primary-action" type="button" data-action="new-compendium-domain">Novo dominio</button>
        </div>
        <div class="compendium-domain-results">
          ${sortedDomains.map(renderCompendiumDomainResult).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderCompendiumDomainResult(domain: DomainDefinition): string {
  const linkedCards = catalog.cards.filter((card) => card.domainId === domain.id).length;
  const isLocal = isLocalDefinition(domain);
  return `
    <article class="compendium-domain-result" style="--domain-color: ${escapeHtml(domain.color)}">
      <div class="compendium-domain-swatch" aria-hidden="true"></div>
      <div>
        <div class="compendium-domain-result-meta"><span>${isLocal ? "Local" : "Pack"}</span><span>${linkedCards} ${linkedCards === 1 ? "carta" : "cartas"}</span></div>
        <h2>${escapeHtml(domain.name)}</h2>
        <p>${escapeHtml(domain.summary || "Sem descricao.")}</p>
      </div>
      <div class="compendium-card-result-actions">
        ${isLocal ? `<button type="button" data-action="edit-compendium-domain" data-domain-id="${domain.id}">Editar</button><button type="button" data-action="delete-compendium-domain" data-domain-id="${domain.id}">Excluir</button>` : `<span class="readonly-label">Conteudo do pack</span>`}
      </div>
    </article>
  `;
}

function renderDomainModal(): string {
  if (!state.domainModalOpen) {
    return "";
  }
  const existing = state.editingDomainId ? findDomain(catalog, state.editingDomainId) : undefined;
  const name = existing?.name ?? "";
  const summary = existing?.summary ?? "";
  const color = existing?.color ?? "#8e4fc4";
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="form-modal" role="dialog" aria-modal="true" aria-labelledby="domain-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar dominio">x</button>
        <span class="resource-modal-label">Compendium</span>
        <h2 id="domain-modal-title">${existing ? "Editar dominio" : "Novo dominio"}</h2>
        <p>O dominio sera oferecido como classificacao obrigatoria ao criar cartas.</p>
        <label class="form-field"><span>Nome *</span><input data-domain-name value="${escapeHtml(name)}" placeholder="Ex.: Arcano" /></label>
        <label class="form-field"><span>Descricao *</span><textarea data-domain-summary placeholder="Explique a proposta deste dominio.">${escapeHtml(summary)}</textarea></label>
        <label class="form-field form-color-field"><span>Cor de identidade</span><input data-domain-color type="color" value="${escapeHtml(color)}" /></label>
        <p class="form-error" data-domain-error hidden></p>
        <div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="primary-action icon-action" type="button" data-action="save-compendium-domain" aria-label="Gravar dominio" title="Gravar dominio">✒</button></div>
      </section>
    </div>
  `;
}

function renderDeleteDomainModal(): string {
  const domain = state.deletingDomainId ? findDomain(catalog, state.deletingDomainId) : undefined;
  if (!domain) {
    return "";
  }
  const linkedCards = catalog.cards.filter((card) => card.domainId === domain.id).length;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-domain-title">
        <h2 id="delete-domain-title">Excluir dominio?</h2>
        <p>${linkedCards ? `O dominio <strong>${escapeHtml(domain.name)}</strong> possui ${linkedCards} ${linkedCards === 1 ? "carta vinculada" : "cartas vinculadas"} e nao pode ser excluido antes de transferi-las.` : `O dominio <strong>${escapeHtml(domain.name)}</strong> sera removido deste dispositivo.`}</p>
        <div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-domain">Cancelar</button>${linkedCards ? "" : '<button class="danger-action" type="button" data-action="confirm-delete-domain">Excluir dominio</button>'}</div>
      </section>
    </div>
  `;
}

function renderCompendiumCardsManager(): string {
  const filteredCards = getFilteredCompendiumCards();
  const tiers = [...new Set(catalog.cards.map((card) => card.tier))].sort((a, b) => a - b);

  return `
    <main class="content compendium-content">
      <div class="screen-title">
        <div>
          <h1>Cartas</h1>
          <p>Crie e organize cartas locais, sempre vinculadas a um dominio do Compendium.</p>
        </div>
        <button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button>
      </div>

      <section class="compendium-management-panel">
        <div class="compendium-management-toolbar">
          <label class="search-box">
            <span>BUSCA</span>
            <input
              type="search"
              placeholder="Procurar carta..."
              aria-label="Procurar carta"
              data-compendium-card-search
              value="${escapeHtml(state.compendiumCardSearch)}"
            />
          </label>
          <button class="primary-action" type="button" data-action="new-compendium-card">Nova carta</button>
        </div>

        <div class="compendium-filter-block">
          <span>Dominio</span>
          <div class="domain-strip compendium-filter-row">
            <button class="domain-chip ${state.compendiumDomainFilter === "todos" ? "is-active" : ""}" type="button" data-compendium-domain-filter="todos" style="--domain-color: #d99a3d">Todos</button>
            ${catalog.domains
              .map(
                (domain) => `
                  <button
                    class="domain-chip ${state.compendiumDomainFilter === domain.id ? "is-active" : ""}"
                    type="button"
                    data-compendium-domain-filter="${domain.id}"
                    style="--domain-color: ${escapeHtml(domain.color)}"
                  >
                    ${escapeHtml(domain.name)}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="compendium-filter-block">
          <span>Tier</span>
          <div class="filter-row compendium-filter-row">
            <button class="chip ${state.compendiumTierFilter === "todos" ? "is-active" : ""}" type="button" data-compendium-tier-filter="todos">Todos</button>
            ${tiers
              .map(
                (tier) => `
                  <button class="chip ${state.compendiumTierFilter === String(tier) ? "is-active" : ""}" type="button" data-compendium-tier-filter="${tier}">
                    Tier ${tier}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="compendium-results-heading">
          <strong>${filteredCards.length}</strong>
          <span>${filteredCards.length === 1 ? "carta encontrada" : "cartas encontradas"}</span>
        </div>

        ${
          filteredCards.length
            ? `<div class="compendium-card-results">${filteredCards.map(renderCompendiumCardResult).join("")}</div>`
            : renderEmptyInline("Nenhuma carta encontrada com os filtros atuais.")
        }
      </section>
    </main>
  `;
}

function renderCompendiumItemsManager(): string {
  const filteredItems = getFilteredCompendiumItems();
  return `
    <main class="content compendium-content">
      <div class="screen-title">
        <div>
          <h1>Itens</h1>
          <p>Crie e organize os itens que poderao ser usados nos inventarios.</p>
        </div>
        <button class="secondary-action screen-title-action" type="button" data-action="back-compendium-index">Voltar ao indice</button>
      </div>
      <section class="compendium-management-panel">
        <div class="compendium-management-toolbar">
          <label class="search-box">
            <span>BUSCA</span>
            <input type="search" placeholder="Procurar item..." aria-label="Procurar item" data-compendium-item-search value="${escapeHtml(state.compendiumItemSearch)}" />
          </label>
          <button class="primary-action" type="button" data-action="new-compendium-item">Novo item</button>
        </div>
        <div class="compendium-filter-block">
          <span>Categoria</span>
          <div class="filter-row compendium-filter-row">
            ${(Object.keys(itemFilterLabels) as InventoryFilter[]).map((category) => `<button class="chip ${state.compendiumItemFilter === category ? "is-active" : ""}" type="button" data-compendium-item-filter="${category}">${itemFilterLabels[category]}</button>`).join("")}
          </div>
        </div>
        <div class="compendium-results-heading"><strong>${filteredItems.length}</strong><span>${filteredItems.length === 1 ? "item encontrado" : "itens encontrados"}</span></div>
        ${filteredItems.length ? `<div class="item-grid compendium-item-results">${filteredItems.map(renderCompendiumItemResult).join("")}</div>` : renderEmptyInline("Nenhum item encontrado com os filtros atuais.")}
      </section>
    </main>
  `;
}

function getFilteredCompendiumItems(): ItemDefinition[] {
  const search = state.compendiumItemSearch.trim().toLowerCase();
  return catalog.items.filter((item) => {
    const sameCategory = state.compendiumItemFilter === "todos" || item.category === state.compendiumItemFilter;
    const searchableText = [item.name, item.summary, itemFilterLabels[item.category], item.tier ?? "", item.weight, item.value ?? "", ...(item.traits ?? [])].join(" ").toLowerCase();
    return sameCategory && (!search || searchableText.includes(search));
  });
}

function renderCompendiumItemResult(item: ItemDefinition): string {
  const isLocal = item.packId === "local";
  return `
    <article class="compendium-item-result">
      <button class="item-tile compendium-item-tile" type="button" data-compendium-item-preview-id="${item.id}" aria-label="Ver detalhes de ${escapeHtml(item.name)}">
        <span class="item-media">${renderItemVisual(item, "tile")}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.tier ? `Tier ${item.tier} - ` : ""}${itemFilterLabels[item.category]} · Peso ${item.weight}</small>
      </button>
      <div class="compendium-card-result-actions">${isLocal ? `<button type="button" data-action="edit-compendium-item" data-item-id="${item.id}">Editar</button><button type="button" data-action="delete-compendium-item" data-item-id="${item.id}">Excluir</button>` : '<span class="readonly-label">Conteudo do pack</span>'}</div>
    </article>
  `;
}

function renderCompendiumItemFormModal(): string {
  if (!state.itemDefinitionModalOpen) {
    return "";
  }
  const existing = state.editingCompendiumItemId ? findDefinition(catalog, state.editingCompendiumItemId) : undefined;
  const item = existing?.type === "item" ? existing : undefined;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="form-modal item-form-modal" role="dialog" aria-modal="true" aria-labelledby="item-form-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar item">x</button>
        <h2 id="item-form-modal-title">${item ? "Editar item" : "Novo item"}</h2>
        <p>O item sera salvo localmente e podera ser adicionado ao inventario em uma proxima etapa.</p>
        <div class="form-grid">
          <label class="form-field"><span>Nome *</span><input data-compendium-item-name value="${escapeHtml(item?.name ?? "")}" placeholder="Ex.: Adaga lunar" /></label>
          <label class="form-field"><span>Categoria *</span><select data-compendium-item-category>${(Object.keys(itemFilterLabels).filter((key) => key !== "todos") as ItemDefinition["category"][]).map((category) => `<option value="${category}" ${category === item?.category ? "selected" : ""}>${itemFilterLabels[category]}</option>`).join("")}</select></label>
          <label class="form-field"><span>Tier</span><input data-compendium-item-tier type="number" min="1" max="4" value="${item?.tier ?? ""}" placeholder="Opcional" /></label>
          <label class="form-field"><span>Peso *</span><input data-compendium-item-weight type="number" min="0" step="0.1" value="${item?.weight ?? ""}" placeholder="Ex.: 1" /></label>
          <label class="form-field"><span>Valor</span><input data-compendium-item-value type="number" min="0" step="1" value="${item?.value ?? ""}" placeholder="Opcional" /></label>
          <label class="form-field"><span>Propriedades</span><input data-compendium-item-traits value="${escapeHtml((item?.traits ?? []).join(", "))}" placeholder="Ex.: versatil, leve" /></label>
        </div>
        <label class="form-field"><span>Imagem</span><input data-compendium-item-image type="file" accept="image/png,image/jpeg,image/webp" /><small>${item?.image ? "Uma imagem ja esta associada; envie outra para substitui-la." : "PNG, JPG ou WebP; ate 1,5 MB."}</small></label>
        <label class="form-field"><span>Descricao *</span><textarea data-compendium-item-summary placeholder="Descreva o item e seu uso.">${escapeHtml(item?.summary ?? "")}</textarea></label>
        <p class="form-error" data-compendium-item-error hidden></p>
        <div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="primary-action icon-action" type="button" data-action="save-compendium-item" aria-label="Gravar item" title="Gravar item">✒</button></div>
      </section>
    </div>
  `;
}

function renderDeleteCompendiumItemModal(): string {
  const definition = state.deletingCompendiumItemId ? findDefinition(catalog, state.deletingCompendiumItemId) : undefined;
  if (definition?.type !== "item") {
    return "";
  }
  const isInInventory = state.character?.inventory.entries.some((entry) => entry.definitionId === definition.id);
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-compendium-item-title">
        <h2 id="delete-compendium-item-title">Excluir item?</h2>
        <p>${isInInventory ? `O item <strong>${escapeHtml(definition.name)}</strong> esta presente no inventario atual e nao pode ser excluido antes de ser removido.` : `O item <strong>${escapeHtml(definition.name)}</strong> sera removido deste dispositivo.`}</p>
        <div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-compendium-item">Cancelar</button>${isInInventory ? "" : '<button class="danger-action" type="button" data-action="confirm-delete-compendium-item">Excluir item</button>'}</div>
      </section>
    </div>
  `;
}

function renderCompendiumItemPreviewModal(): string {
  const definition = state.compendiumItemPreviewId ? findDefinition(catalog, state.compendiumItemPreviewId) : undefined;
  if (definition?.type !== "item") {
    return "";
  }
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="item-modal compendium-item-preview" role="dialog" aria-modal="true" aria-labelledby="compendium-item-preview-title">
        <button class="modal-close" data-modal-close aria-label="Fechar item">x</button>
        <div class="item-modal-art">${renderItemVisual(definition, "detail")}</div>
        <div class="item-modal-body">
          <span class="resource-modal-label">${itemFilterLabels[definition.category]}</span>
          <h2 id="compendium-item-preview-title">${escapeHtml(definition.name)}</h2>
          <p>${escapeHtml(definition.summary)}</p>
          <dl class="detail-list item-modal-details"><div><dt>Tier</dt><dd>${definition.tier ?? "-"}</dd></div><div><dt>Valor</dt><dd>${definition.value ?? "-"}</dd></div><div><dt>Peso</dt><dd>${definition.weight}</dd></div></dl>
          <div class="trait-list">${(definition.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>
        </div>
      </section>
    </div>
  `;
}

function getFilteredCompendiumCards(): CardDefinition[] {
  const search = state.compendiumCardSearch.trim().toLowerCase();

  return catalog.cards.filter((card) => {
    const domain = findDomain(catalog, card.domainId);
    const sameDomain = state.compendiumDomainFilter === "todos" || card.domainId === state.compendiumDomainFilter;
    const sameTier = state.compendiumTierFilter === "todos" || String(card.tier) === state.compendiumTierFilter;
    const searchableText = [card.name, card.summary, card.effect, card.cardType, card.cost ?? "", domain?.name ?? ""].join(" ").toLowerCase();
    const sameSearch = !search || searchableText.includes(search);

    return sameDomain && sameTier && sameSearch;
  });
}

function renderCompendiumCardResult(card: CardDefinition): string {
  const domain = findDomain(catalog, card.domainId);
  const isLocal = card.packId === "local";

  return `
    <article class="compendium-card-result">
      <button class="compendium-card-result-open" type="button" data-card-modal-id="${card.id}" aria-label="Ver detalhes de ${escapeHtml(card.name)}">
        ${card.image ? `<span class="compendium-card-result-image" style="background-image: url('${escapeHtml(card.image)}')" aria-hidden="true"></span>` : ""}
        <div>
          <span>${escapeHtml(domain?.name ?? "Sem dominio")} - Tier ${card.tier} - ${escapeHtml(card.cardType)}</span>
          <h2>${escapeHtml(card.name)}</h2>
          <p>${escapeHtml(card.summary)}</p>
        </div>
        <div class="compendium-card-result-meta">
          <span>${escapeHtml(card.cost ?? "Sem custo")}</span>
        </div>
      </button>
      <div class="compendium-card-result-actions">
        ${isLocal ? `<button type="button" data-action="edit-compendium-card" data-card-id="${card.id}">Editar</button><button type="button" data-action="delete-compendium-card" data-card-id="${card.id}">Excluir</button>` : '<span class="readonly-label">Conteudo do pack</span>'}
      </div>
    </article>
  `;
}

function renderCompendiumCardFormModal(): string {
  if (!state.cardModalOpen) {
    return "";
  }

  const existing = state.editingCompendiumCardId ? findDefinition(catalog, state.editingCompendiumCardId) : undefined;
  const card = existing?.type === "card" ? existing : undefined;
  const domains = [...catalog.domains].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="form-modal card-form-modal" role="dialog" aria-modal="true" aria-labelledby="card-form-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar carta">x</button>
        <h2 id="card-form-modal-title">${card ? "Editar carta" : "Nova carta"}</h2>
        <p>A carta sera salva localmente e podera ser usada no catalogo do personagem futuramente.</p>
        <div class="form-grid">
          <label class="form-field"><span>Nome *</span><input data-compendium-card-name value="${escapeHtml(card?.name ?? "")}" placeholder="Ex.: Passo Sombrio" /></label>
          <label class="form-field"><span>Dominio *</span><select data-compendium-card-domain>${domains.map((domain) => `<option value="${domain.id}" ${domain.id === card?.domainId ? "selected" : ""}>${escapeHtml(domain.name)}</option>`).join("")}</select></label>
          <label class="form-field"><span>Tier *</span><select data-compendium-card-tier>${[1, 2, 3, 4].map((tier) => `<option value="${tier}" ${tier === (card?.tier ?? 1) ? "selected" : ""}>Tier ${tier}</option>`).join("")}</select></label>
          <label class="form-field"><span>Tipo *</span><select data-compendium-card-type>${(["acao", "reacao", "passiva"] as const).map((type) => `<option value="${type}" ${type === (card?.cardType ?? "acao") ? "selected" : ""}>${type}</option>`).join("")}</select></label>
          <label class="form-field"><span>Custo</span><input data-compendium-card-cost value="${escapeHtml(card?.cost ?? "")}" placeholder="Ex.: 1 Esperanca" /></label>
        </div>
        <label class="form-field"><span>Imagem</span><input data-compendium-card-image type="file" accept="image/png,image/jpeg,image/webp" /><small>${card?.image ? "Uma imagem ja esta associada; envie outra para substitui-la." : "PNG, JPG ou WebP; ate 1,5 MB."}</small></label>
        <label class="form-field"><span>Efeito *</span><textarea data-compendium-card-effect placeholder="Descreva a regra e o efeito completo da carta.">${escapeHtml(card?.effect ?? "")}</textarea></label>
        <p class="form-error" data-compendium-card-error hidden></p>
        <div class="modal-actions icon-modal-actions"><button class="secondary-action icon-action" type="button" data-modal-close aria-label="Cancelar" title="Cancelar">↩</button><button class="primary-action icon-action" type="button" data-action="save-compendium-card" aria-label="Gravar carta" title="Gravar carta">✒</button></div>
      </section>
    </div>
  `;
}

function renderDeleteCompendiumCardModal(): string {
  const definition = state.deletingCompendiumCardId ? findDefinition(catalog, state.deletingCompendiumCardId) : undefined;
  if (definition?.type !== "card") {
    return "";
  }
  const isInDeck = state.character?.deck.learnedCardIds.includes(definition.id) || state.character?.deck.activeCardIds.includes(definition.id);
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-card-title">
        <h2 id="delete-card-title">Excluir carta?</h2>
        <p>${isInDeck ? `A carta <strong>${escapeHtml(definition.name)}</strong> esta vinculada ao personagem atual e nao pode ser excluida antes de ser removida do deck.` : `A carta <strong>${escapeHtml(definition.name)}</strong> sera removida deste dispositivo.`}</p>
        <div class="modal-actions"><button class="secondary-action" type="button" data-action="cancel-delete-compendium-card">Cancelar</button>${isInDeck ? "" : '<button class="danger-action" type="button" data-action="confirm-delete-compendium-card">Excluir carta</button>'}</div>
      </section>
    </div>
  `;
}

function renderCardModal(cardId?: string): string {
  if (!cardId) {
    return "";
  }

  const definition = findDefinition(catalog, cardId);
  if (definition?.type !== "card") {
    return "";
  }

  const domain = findDomain(catalog, definition.domainId);

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="card-modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title">
        <button class="modal-close" data-modal-close aria-label="Fechar carta">x</button>
        <div class="modal-card-art ${definition.image ? "has-image" : ""}" ${definition.image ? `style="background-image: url('${escapeHtml(definition.image)}')"` : ""}></div>
        <div class="modal-card-body">
          <div class="modal-card-kicker">
            <span>${escapeHtml(domain?.name ?? "Sem dominio")}</span>
            <span>Tier ${definition.tier}</span>
          </div>
          <h2 id="card-modal-title">${escapeHtml(definition.name)}</h2>
          <div class="modal-card-meta">
            <span>${escapeHtml(definition.cardType)}</span>
            <span>${escapeHtml(definition.cost ?? "Sem custo")}</span>
          </div>
          <p>${escapeHtml(definition.summary)}</p>
          <h3>Efeito</h3>
          <p>${escapeHtml(definition.effect)}</p>
        </div>
      </section>
    </div>
  `;
}

function renderPlaceholder(page: Page): string {
  const labels: Record<Page, string> = {
    overview: "Visao Geral",
    skills: "Habilidades",
    experiences: "Experiencias",
    inventory: "Inventario",
    progression: "Progressao",
    notes: "Anotacoes",
    compendium: "Compendium",
    settings: "Configuracoes",
    storedCards: "Cartas guardadas"
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

function render(): void {
  const character = state.character;

  if (!character) {
    appRoot.innerHTML = `<div class="boot-screen">Carregando SoulForge...</div>`;
    return;
  }

  const screen = state.page === "overview"
    ? renderOverview(character)
    : state.page === "skills"
      ? renderSkills(character)
      : state.page === "experiences"
        ? renderExperiences(character)
        : state.page === "storedCards"
          ? renderStoredCards(character)
          : state.page === "progression"
            ? renderProgression(character)
            : state.page === "notes"
              ? renderNotes(character)
              : state.page === "inventory"
                ? renderInventory(character)
                : state.page === "compendium"
                  ? renderCompendium()
                  : state.page === "settings"
                    ? renderSettings(character)
                    : renderPlaceholder(state.page);

  const shell = isEditorPage(state.page)
    ? `
      <div class="editor-shell">
        ${renderEditorHeader()}
        ${screen}
      </div>
    `
    : `
      <div class="app-shell">
        ${renderSidebar(character)}
        <div class="main-shell">
          ${renderTopbar()}
          ${screen}
        </div>
      </div>
    `;

  appRoot.innerHTML = `
    ${shell}
    ${renderCardModal(state.modalCardId)}
    ${renderItemModal()}
    ${renderDeleteItemModal()}
    ${renderResourceModal(state.resourceModalId)}
    ${renderProgressionHistoryModal()}
    ${renderAddContainerModal()}
    ${renderDeleteContainerModal()}
    ${renderNoteModal()}
    ${renderViewNoteModal()}
    ${renderDeleteNoteModal()}
    ${renderDomainModal()}
    ${renderDeleteDomainModal()}
    ${renderCompendiumCardFormModal()}
    ${renderDeleteCompendiumCardModal()}
    ${renderCompendiumItemFormModal()}
    ${renderDeleteCompendiumItemModal()}
    ${renderCompendiumItemPreviewModal()}
    ${renderAddItemToContainerModal()}
  `;
  document.body.classList.toggle("has-modal", Boolean(appRoot.querySelector(".modal-backdrop")));
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

async function refreshCatalog(): Promise<void> {
  const customDefinitions = await loadCustomDefinitions();
  catalog = createCatalog(baseCatalog.packs, [...baseCatalog.definitions, ...customDefinitions]);
}

async function saveCompendiumDomain(): Promise<void> {
  const nameInput = document.querySelector<HTMLInputElement>("[data-domain-name]");
  const summaryInput = document.querySelector<HTMLTextAreaElement>("[data-domain-summary]");
  const colorInput = document.querySelector<HTMLInputElement>("[data-domain-color]");
  const name = nameInput?.value.trim() ?? "";
  const summary = summaryInput?.value.trim() ?? "";
  const color = colorInput?.value ?? "#8e4fc4";
  const error = document.querySelector<HTMLElement>("[data-domain-error]");
  const duplicate = catalog.domains.some((domain) => domain.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && domain.id !== state.editingDomainId);

  if (!name || !summary || duplicate) {
    if (error) {
      error.hidden = false;
      error.textContent = duplicate ? "Ja existe um dominio com este nome." : "Informe um nome e uma descricao para o dominio.";
    }
    nameInput?.classList.toggle("is-invalid", !name || duplicate);
    summaryInput?.classList.toggle("is-invalid", !summary);
    (!name || duplicate ? nameInput : summaryInput)?.focus();
    return;
  }

  const existing = state.editingDomainId ? findDomain(catalog, state.editingDomainId) : undefined;
  if (existing && !isLocalDefinition(existing)) {
    return;
  }
  const definition: DomainDefinition = {
    id: existing?.id ?? `domain.local.${crypto.randomUUID()}`,
    type: "domain",
    packId: "local",
    name,
    summary,
    color
  };
  await saveCustomDefinition(definition);
  await refreshCatalog();
  state.domainModalOpen = false;
  state.editingDomainId = undefined;
  render();
}

async function removeCompendiumDomain(): Promise<void> {
  const domainId = state.deletingDomainId;
  const domain = domainId ? findDomain(catalog, domainId) : undefined;
  if (!domain || !isLocalDefinition(domain) || catalog.cards.some((card) => card.domainId === domain.id)) {
    return;
  }
  await deleteCustomDefinition(domain.id);
  await refreshCatalog();
  state.deletingDomainId = undefined;
  render();
}

function getCardFormValue(selector: string): string {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
  return element?.value.trim() ?? "";
}

function readDefinitionImage(selector: string): Promise<string | undefined> {
  const input = document.querySelector<HTMLInputElement>(selector);
  const file = input?.files?.[0];
  if (!file) {
    return Promise.resolve(undefined);
  }
  if (file.size > 1_500_000) {
    return Promise.reject(new Error("A imagem deve ter no maximo 1,5 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem."));
    reader.readAsDataURL(file);
  });
}

async function saveCompendiumCard(): Promise<void> {
  const name = getCardFormValue("[data-compendium-card-name]");
  const domainId = getCardFormValue("[data-compendium-card-domain]");
  const tier = Number(getCardFormValue("[data-compendium-card-tier]"));
  const cardType = getCardFormValue("[data-compendium-card-type]") as CardDefinition["cardType"];
  const cost = getCardFormValue("[data-compendium-card-cost]");
  const effect = getCardFormValue("[data-compendium-card-effect]");
  const error = document.querySelector<HTMLElement>("[data-compendium-card-error]");
  const existingDefinition = state.editingCompendiumCardId ? findDefinition(catalog, state.editingCompendiumCardId) : undefined;
  const existing = existingDefinition?.type === "card" ? existingDefinition : undefined;
  const duplicate = catalog.cards.some((card) => card.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && card.id !== existing?.id);
  const validType = ["acao", "reacao", "passiva"].includes(cardType);

  if (!name || !domainId || !Number.isInteger(tier) || tier < 1 || !validType || !effect || duplicate) {
    if (error) {
      error.hidden = false;
      error.textContent = duplicate ? "Ja existe uma carta com este nome." : "Preencha nome, dominio, tier, tipo e efeito.";
    }
    return;
  }
  if (existing && existing.packId !== "local") {
    return;
  }
  let image = existing?.image;
  try {
    image = (await readDefinitionImage("[data-compendium-card-image]")) ?? image;
  } catch (imageError) {
    if (error) {
      error.hidden = false;
      error.textContent = imageError instanceof Error ? imageError.message : "Nao foi possivel usar a imagem.";
    }
    return;
  }

  const definition: CardDefinition = {
    id: existing?.id ?? `card.local.${crypto.randomUUID()}`,
    type: "card",
    packId: "local",
    name,
    summary: effect.length > 140 ? `${effect.slice(0, 137).trimEnd()}...` : effect,
    domainId,
    tier,
    cardType,
    cost: cost || undefined,
    effect,
    image
  };
  await saveCustomDefinition(definition);
  await refreshCatalog();
  state.cardModalOpen = false;
  state.editingCompendiumCardId = undefined;
  state.compendiumDomainFilter = domainId;
  render();
}

async function removeCompendiumCard(): Promise<void> {
  const cardId = state.deletingCompendiumCardId;
  const definition = cardId ? findDefinition(catalog, cardId) : undefined;
  const isInDeck = definition?.type === "card" && (state.character?.deck.learnedCardIds.includes(definition.id) || state.character?.deck.activeCardIds.includes(definition.id));
  if (definition?.type !== "card" || definition.packId !== "local" || isInDeck) {
    return;
  }
  await deleteCustomDefinition(definition.id);
  await refreshCatalog();
  state.deletingCompendiumCardId = undefined;
  if (state.compendiumDomainFilter === definition.domainId) {
    state.compendiumDomainFilter = "todos";
  }
  render();
}

async function saveCompendiumItem(): Promise<void> {
  const name = getCardFormValue("[data-compendium-item-name]");
  const category = getCardFormValue("[data-compendium-item-category]") as ItemDefinition["category"];
  const tierText = getCardFormValue("[data-compendium-item-tier]");
  const weight = Number(getCardFormValue("[data-compendium-item-weight]"));
  const valueText = getCardFormValue("[data-compendium-item-value]");
  const summary = getCardFormValue("[data-compendium-item-summary]");
  const traits = getCardFormValue("[data-compendium-item-traits]").split(",").map((trait) => trait.trim()).filter(Boolean);
  const error = document.querySelector<HTMLElement>("[data-compendium-item-error]");
  const existingDefinition = state.editingCompendiumItemId ? findDefinition(catalog, state.editingCompendiumItemId) : undefined;
  const existing = existingDefinition?.type === "item" ? existingDefinition : undefined;
  const tier = tierText ? Number(tierText) : undefined;
  const value = valueText ? Number(valueText) : undefined;
  const validCategory = ["arma", "armadura", "consumivel", "equipamento", "loot"].includes(category);
  const duplicate = catalog.items.some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && item.id !== existing?.id);

  if (!name || !validCategory || !Number.isFinite(weight) || weight < 0 || !summary || duplicate || (tier !== undefined && (!Number.isInteger(tier) || tier < 1 || tier > 4)) || (value !== undefined && (!Number.isFinite(value) || value < 0))) {
    if (error) {
      error.hidden = false;
      error.textContent = duplicate ? "Ja existe um item com este nome." : "Preencha nome, categoria, peso e descricao. Tier deve ficar entre 1 e 4.";
    }
    return;
  }
  if (existing && existing.packId !== "local") {
    return;
  }
  let image = existing?.image;
  try {
    image = (await readDefinitionImage("[data-compendium-item-image]")) ?? image;
  } catch (imageError) {
    if (error) {
      error.hidden = false;
      error.textContent = imageError instanceof Error ? imageError.message : "Nao foi possivel usar a imagem.";
    }
    return;
  }
  const definition: ItemDefinition = {
    id: existing?.id ?? `item.local.${crypto.randomUUID()}`,
    type: "item",
    packId: "local",
    name,
    summary,
    category,
    tier,
    weight,
    value,
    traits: traits.length ? traits : undefined,
    image
  };
  await saveCustomDefinition(definition);
  await refreshCatalog();
  state.itemDefinitionModalOpen = false;
  state.editingCompendiumItemId = undefined;
  render();
}

async function removeCompendiumItem(): Promise<void> {
  const itemId = state.deletingCompendiumItemId;
  const definition = itemId ? findDefinition(catalog, itemId) : undefined;
  const isInInventory = definition?.type === "item" && state.character?.inventory.entries.some((entry) => entry.definitionId === definition.id);
  if (definition?.type !== "item" || definition.packId !== "local" || isInInventory) {
    return;
  }
  await deleteCustomDefinition(definition.id);
  await refreshCatalog();
  state.deletingCompendiumItemId = undefined;
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

async function moveItemToCompartment(itemId: string | undefined, targetCompartmentId: string | undefined, sourceCompartmentId?: string): Promise<void> {
  const character = state.character;
  if (!character || !itemId || !targetCompartmentId) {
    return;
  }

  const entries = getItemEntries(character);
  const targetEntry = entries.find(({ item, entry }) => item.id === itemId && (!sourceCompartmentId || getEntryCompartmentId(entry) === sourceCompartmentId));
  const targetCompartment = getInventoryCompartments(character).find((compartment) => compartment.id === targetCompartmentId);

  if (!targetEntry || !targetCompartment) {
    return;
  }

  const currentCompartmentId = getEntryCompartmentId(targetEntry.entry);
  if (
    !canCompartmentAcceptItem(targetCompartment, targetEntry.item) ||
    !wouldFitCompartment(targetCompartment, entries, targetEntry.item, targetEntry.entry.quantity, currentCompartmentId)
  ) {
    return;
  }

  const updatedCharacter: Character = {
    ...character,
    inventory: {
      ...character.inventory,
      entries: character.inventory.entries.map((entry) =>
        entry.definitionId === itemId && getEntryCompartmentId(entry) === currentCompartmentId
          ? {
              ...entry,
              compartmentId: targetCompartmentId,
              equipped: targetCompartmentId === "equipped"
            }
          : entry
      )
    }
  };

  state.character = updatedCharacter;
  await saveCharacter(updatedCharacter);
  render();
}

async function addItemToContainer(): Promise<void> {
  const character = state.character;
  const compartmentId = state.addItemToCompartmentId;
  const definitionId = state.addingDefinitionItemId;
  const quantity = Number(document.querySelector<HTMLInputElement>("[data-add-item-quantity]")?.value ?? 0);
  if (!character || !compartmentId || !definitionId || !Number.isInteger(quantity) || quantity < 1) {
    state.addItemError = "Informe uma quantidade inteira maior que zero.";
    render();
    return;
  }
  const definition = findDefinition(catalog, definitionId);
  const compartment = getInventoryCompartments(character).find((entry) => entry.id === compartmentId);
  const entries = getItemEntries(character);
  if (definition?.type !== "item" || !compartment || !canAddItemToCompartment(compartment, entries, definition, quantity)) {
    state.addItemError = "Este item nao cabe no container com a quantidade informada.";
    render();
    return;
  }
  const existingEntry = character.inventory.entries.find((entry) => entry.definitionId === definition.id && getEntryCompartmentId(entry) === compartmentId);
  const updatedEntries = existingEntry
    ? character.inventory.entries.map((entry) => entry === existingEntry ? { ...entry, quantity: entry.quantity + quantity } : entry)
    : [...character.inventory.entries, { definitionId: definition.id, quantity, compartmentId, equipped: compartmentId === "equipped" }];
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: updatedEntries } };
  state.character = updatedCharacter;
  state.addItemToCompartmentId = undefined;
  state.addingDefinitionItemId = undefined;
  state.addItemCatalogFilter = "todos";
  state.addItemError = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

function clearDropTargetStyles(): void {
  document.querySelectorAll(".inventory-compartment").forEach((element) => {
    element.classList.remove("is-drop-target", "is-drop-invalid");
  });
}

function endItemDrag(): void {
  dragState.ghost?.remove();
  dragState.ghost = undefined;
  dragState.itemId = undefined;
  dragState.sourceCompartmentId = undefined;
  dragState.pointerId = undefined;
  dragState.currentDropTargetId = undefined;
  dragState.dragging = false;
  clearDropTargetStyles();
}

function findCompartmentAtPoint(clientX: number, clientY: number): HTMLElement | undefined {
  return document
    .elementsFromPoint(clientX, clientY)
    .find((element): element is HTMLElement => element instanceof HTMLElement && Boolean(element.closest("[data-compartment-id]")))
    ?.closest<HTMLElement>("[data-compartment-id]") ?? undefined;
}

function isValidDropTarget(targetCompartmentId: string | undefined): boolean {
  const character = state.character;
  if (!character || !dragState.itemId || !targetCompartmentId || targetCompartmentId === dragState.sourceCompartmentId) {
    return false;
  }

  const entries = getItemEntries(character);
  const draggedEntry = entries.find(({ item, entry }) => item.id === dragState.itemId && getEntryCompartmentId(entry) === dragState.sourceCompartmentId);
  const targetCompartment = getInventoryCompartments(character).find((compartment) => compartment.id === targetCompartmentId);

  if (!draggedEntry || !targetCompartment) {
    return false;
  }

  return (
    canCompartmentAcceptItem(targetCompartment, draggedEntry.item) &&
    wouldFitCompartment(targetCompartment, entries, draggedEntry.item, draggedEntry.entry.quantity, getEntryCompartmentId(draggedEntry.entry))
  );
}

function updateDragGhost(clientX: number, clientY: number): void {
  if (!dragState.ghost) {
    return;
  }

  dragState.ghost.style.transform = `translate(${clientX + 12}px, ${clientY + 12}px)`;
}

function updateDropTarget(clientX: number, clientY: number): void {
  clearDropTargetStyles();

  const target = findCompartmentAtPoint(clientX, clientY);
  const targetId = target?.dataset.compartmentId;
  dragState.currentDropTargetId = targetId;

  if (!target || !targetId) {
    return;
  }

  target.classList.add(isValidDropTarget(targetId) ? "is-drop-target" : "is-drop-invalid");
}

function startItemDrag(tile: HTMLElement, event: PointerEvent): void {
  dragState.itemId = tile.dataset.itemId;
  dragState.sourceCompartmentId = tile.dataset.itemCompartmentId;
  dragState.pointerId = event.pointerId;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.dragging = false;
  dragState.currentDropTargetId = undefined;
}

function createDragGhost(tile: HTMLElement, clientX: number, clientY: number): void {
  const title = tile.querySelector("strong")?.textContent ?? "Item";
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = title;
  document.body.append(ghost);
  dragState.ghost = ghost;
  updateDragGhost(clientX, clientY);
}

async function finishItemDrag(): Promise<void> {
  const targetCompartmentId = dragState.currentDropTargetId;
  const itemId = dragState.itemId;
  const sourceCompartmentId = dragState.sourceCompartmentId;
  const validDrop = isValidDropTarget(targetCompartmentId);

  endItemDrag();

  if (validDrop) {
    await moveItemToCompartment(itemId, targetCompartmentId, sourceCompartmentId);
  }
}

function bindDragEvents(): void {
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) {
      return;
    }

    const tile = event.target.closest<HTMLElement>("[data-item-id]");
    if (!tile || !tile.dataset.itemCompartmentId) {
      return;
    }

    startItemDrag(tile, event);
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState.itemId || dragState.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    if (!dragState.dragging && distance < 8) {
      return;
    }

    event.preventDefault();

    if (!dragState.dragging) {
      const tile = document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(dragState.itemId)}"]`);
      if (tile) {
        createDragGhost(tile, event.clientX, event.clientY);
      }
      dragState.dragging = true;
      dragState.suppressNextClick = true;
    }

    updateDragGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY);
  });

  document.addEventListener("pointerup", (event) => {
    if (!dragState.itemId || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (!dragState.dragging) {
      endItemDrag();
      return;
    }

    event.preventDefault();
    void finishItemDrag();
  });

  document.addEventListener("pointercancel", (event) => {
    if (dragState.pointerId === event.pointerId) {
      endItemDrag();
    }
  });
}

async function createInventoryContainer(): Promise<void> {
  const character = state.character;
  if (!character) {
    return;
  }

  const nameInput = document.querySelector<HTMLInputElement>("[data-container-name]");
  const capacityInput = document.querySelector<HTMLInputElement>("[data-container-capacity]");
  const acceptInputs = Array.from(document.querySelectorAll<HTMLInputElement>("[data-container-accepts]:checked"));
  const name = nameInput?.value.trim();
  const capacity = Number(capacityInput?.value);

  if (!name || !Number.isFinite(capacity) || capacity <= 0) {
    const error = document.querySelector<HTMLElement>("[data-container-error]");
    error?.removeAttribute("hidden");
    if (error) {
      error.textContent = "Informe um nome e uma capacidade maior que zero.";
    }

    nameInput?.classList.toggle("is-invalid", !name);
    capacityInput?.classList.toggle("is-invalid", !Number.isFinite(capacity) || capacity <= 0);

    if (!name) {
      nameInput?.focus();
    } else {
      capacityInput?.focus();
    }

    return;
  }

  const accepts = acceptInputs.map((input) => input.value as ItemDefinition["category"]);
  const id = `container.${crypto.randomUUID()}`;
  const updatedCharacter: Character = {
    ...character,
    inventory: {
      ...character.inventory,
      compartments: [
        ...getInventoryCompartments(character),
        {
          id,
          name,
          capacity,
          accepts: accepts.length ? accepts : undefined,
          source: "custom"
        }
      ]
    }
  };

  state.character = updatedCharacter;
  state.addContainerOpen = false;
  await saveCharacter(updatedCharacter);
  render();
}

async function deleteInventoryContainer(compartmentId: string | undefined): Promise<void> {
  const character = state.character;
  if (!character || !compartmentId) {
    return;
  }

  const compartments = getInventoryCompartments(character);
  const compartment = compartments.find((entry) => entry.id === compartmentId);
  if (!compartment || compartment.source === "character") {
    return;
  }

  const selectedEntryWasInDeletedCompartment = character.inventory.entries.some(
    (entry) => entry.definitionId === state.selectedItemId && getEntryCompartmentId(entry) === compartmentId
  );

  const updatedCharacter: Character = {
    ...character,
    inventory: {
      ...character.inventory,
      compartments: compartments.filter((entry) => entry.id !== compartmentId),
      entries: character.inventory.entries.filter((entry) => getEntryCompartmentId(entry) !== compartmentId)
    }
  };

  state.character = updatedCharacter;
  state.deleteContainerId = undefined;
  if (selectedEntryWasInDeletedCompartment) {
    state.selectedItemId = undefined;
  }
  await saveCharacter(updatedCharacter);
  render();
}

async function deleteInventoryItem(itemId: string | undefined): Promise<void> {
  const character = state.character;
  if (!character || !itemId) {
    return;
  }

  const updatedCharacter: Character = {
    ...character,
    inventory: {
      ...character.inventory,
      entries: character.inventory.entries.filter((entry) => entry.definitionId !== itemId)
    }
  };

  state.character = updatedCharacter;
  state.selectedItemId = undefined;
  state.deletingItemId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

async function saveNoteFromModal(): Promise<void> {
  const character = state.character;
  if (!character) {
    return;
  }

  const titleInput = document.querySelector<HTMLInputElement>("[data-note-title]");
  const categoryInput = document.querySelector<HTMLInputElement>("[data-note-category]");
  const contentInput = document.querySelector<HTMLTextAreaElement>("[data-note-content]");
  const title = titleInput?.value.trim() ?? "";
  const content = contentInput?.value.trim() ?? "";
  const category = (categoryInput?.value ?? "session") as CharacterNoteCategory;

  if (!title || !content) {
    const error = document.querySelector<HTMLElement>("[data-note-error]");
    error?.removeAttribute("hidden");
    if (error) {
      error.textContent = "Informe um titulo e um conteudo para salvar a anotacao.";
    }

    titleInput?.classList.toggle("is-invalid", !title);
    contentInput?.classList.toggle("is-invalid", !content);

    if (!title) {
      titleInput?.focus();
    } else {
      contentInput?.focus();
    }

    return;
  }

  const now = new Date().toISOString();
  const existingNote = character.notes.find((note) => note.id === state.editingNoteId);
  const note: CharacterNote = {
    id: existingNote?.id ?? `note.${crypto.randomUUID()}`,
    title,
    content,
    category,
    createdAt: existingNote?.createdAt ?? now,
    updatedAt: now
  };
  const notes = existingNote
    ? character.notes.map((entry) => (entry.id === existingNote.id ? note : entry))
    : [note, ...character.notes];

  const updatedCharacter = { ...character, notes };
  state.character = updatedCharacter;
  state.noteModalOpen = false;
  state.editingNoteId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

async function deleteNote(noteId: string | undefined): Promise<void> {
  const character = state.character;
  if (!character || !noteId) {
    return;
  }

  const updatedCharacter = {
    ...character,
    notes: character.notes.filter((note) => note.id !== noteId)
  };

  state.character = updatedCharacter;
  if (state.viewingNoteId === noteId) {
    state.viewingNoteId = undefined;
  }
  state.deletingNoteId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

function bindEvents(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (dragState.suppressNextClick) {
      dragState.suppressNextClick = false;
      event.preventDefault();
      return;
    }

    if (target.closest("[data-modal-close]")) {
      state.modalCardId = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
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
      state.addItemToCompartmentId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      render();
      return;
    }

    if (target.matches("[data-modal-backdrop]")) {
      state.modalCardId = undefined;
      state.selectedItemId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
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
      state.addItemToCompartmentId = undefined;
      state.addingDefinitionItemId = undefined;
      state.addItemError = undefined;
      render();
      return;
    }

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

    const editCompendiumItemButton = target.closest<HTMLElement>('[data-action="edit-compendium-item"]');
    if (editCompendiumItemButton) {
      state.itemDefinitionModalOpen = true;
      state.editingCompendiumItemId = editCompendiumItemButton.dataset.itemId;
      render();
      return;
    }

    if (target.closest('[data-action="save-compendium-item"]')) {
      void saveCompendiumItem();
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
      void removeCompendiumItem();
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
      void saveCompendiumCard();
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
      void removeCompendiumCard();
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
      void saveCompendiumDomain();
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
      void removeCompendiumDomain();
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

    const progressionTierButton = target.closest<HTMLElement>("[data-progression-tier]");
    if (progressionTierButton) {
      state.selectedProgressionTier = Number(progressionTierButton.dataset.progressionTier) as ProgressionTierNumber;
      render();
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
      void addItemToContainer();
      return;
    }

    if (target.closest('[data-action="create-container"]')) {
      void createInventoryContainer();
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
      void deleteInventoryContainer(state.deleteContainerId);
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
      void deleteInventoryItem(state.deletingItemId);
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
      void moveItemToCompartment(moveItemButton.dataset.itemId, moveItemButton.dataset.targetCompartmentId, moveItemButton.dataset.sourceCompartmentId);
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
  });
}

async function boot(): Promise<void> {
  render();
  bindEvents();
  bindDragEvents();
  await refreshCatalog();
  state.character = await ensureDemoCharacter();
  render();
}

void boot();
