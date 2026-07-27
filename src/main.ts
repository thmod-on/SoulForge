import { catalog } from "./content/installedPacks";
import { findDefinition, findDomain } from "./domain/catalog";
import type { CardDefinition, Character, ItemDefinition } from "./domain/types";
import { ensureDemoCharacter, saveCharacter } from "./storage/characterRepository";
import "./styles.css";

type Page = "overview" | "skills" | "experiences" | "inventory" | "progression" | "notes" | "compendium" | "settings" | "storedCards";
type InventoryFilter = "todos" | ItemDefinition["category"];
type ProgressionTierNumber = 2 | 3 | 4;

function getAppRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");

  if (!element) {
    throw new Error("App root not found.");
  }

  return element;
}

const appRoot = getAppRoot();

const state: {
  page: Page;
  inventoryFilter: InventoryFilter;
  selectedItemId?: string;
  selectedCardId: string;
  selectedProgressionTier: ProgressionTierNumber;
  modalCardId?: string;
  resourceModalId?: string;
  progressionHistoryOpen: boolean;
  character?: Character;
} = {
  page: "overview",
  inventoryFilter: "todos",
  selectedCardId: "card.demo.dread-veil",
  selectedProgressionTier: 2,
  progressionHistoryOpen: false
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
  { page: "compendium", label: "Compendium", icon: "BOOK" },
  { page: "settings", label: "Configuracoes", icon: "GEAR" }
];

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
        <div class="brand-mark"><img src="assets/brand/soulforge-symbol.png" alt="" /></div>
        <div>
          <strong>SOULFORGE</strong>
          <span>Daggerheart Companion</span>
        </div>
      </div>
      <div class="portrait">
        <div class="portrait-art"></div>
        <div>
          <strong>${escapeHtml(character.identity.name)}</strong>
          <span>${escapeHtml(character.identity.ancestry)} - ${escapeHtml(character.identity.className)}</span>
          <small>${escapeHtml(character.identity.community)}</small>
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
                <div class="attribute-badge">
                  <span title="${attribute.label}">${attributeTitle(attribute.label)}</span>
                  <i class="attribute-upgrade-dot" aria-hidden="true"></i>
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
      <nav class="side-nav" aria-label="Menu secundario">
        ${sideNavItems
          .map(
            (item) => `
              <button class="nav-button ${state.page === item.page ? "is-active" : ""}" data-page="${item.page}">
                <span>${item.icon}</span>
                ${item.label}
              </button>
            `
          )
          .join("")}
      </nav>
      <div class="pack-status">
        <span>Pack ativo</span>
        <strong>${escapeHtml(catalog.packs[0]?.name ?? "Sem pack")}</strong>
        <small>v${escapeHtml(catalog.packs[0]?.version ?? "0.0.0")}</small>
      </div>
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
      <section class="band">
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
      </section>
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
      <section class="band">
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
      </section>
    </main>
  `;
}

function renderProgression(character: Character): string {
  const selectedTier = progressionTiers.find((tier) => tier.tier === state.selectedProgressionTier) ?? progressionTiers[0];

  return `
    <main class="content progression-content">
      <section class="band">
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
      </section>
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
  const domain = findDomain(catalog, card.domainId);
  return `
    <button class="ability-card" data-card-modal-id="${card.id}">
      <div class="card-tier">${card.tier}</div>
      <div class="card-art"></div>
      <h3>${escapeHtml(card.name)}</h3>
      <span>${escapeHtml(domain?.name ?? "Sem dominio")} - ${escapeHtml(card.cardType)}</span>
      <p>${escapeHtml(card.summary)}</p>
    </button>
  `;
}

function renderInventory(character: Character): string {
  const entries = getItemEntries(character);
  const filteredEntries = entries.filter(({ item }) => state.inventoryFilter === "todos" || item.category === state.inventoryFilter);
  const selectedItem = entries.find(({ item }) => item.id === state.selectedItemId)?.item;
  const equipped = entries.filter(({ entry }) => entry.equipped);
  const currentWeight = entries.reduce((total, { entry, item }) => total + entry.quantity * item.weight, 0);

  return `
    <main class="content inventory-layout ${selectedItem ? "has-detail-panel" : ""}">
      <section class="inventory-main">
        <div class="screen-title">
          <h1>Inventario</h1>
          <label class="search-box">
            <span>BUSCA</span>
            <input type="search" placeholder="Procurar item..." aria-label="Procurar item" />
          </label>
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
        </div>
        ${selectedItem ? renderItemPanel(selectedItem, "inline") : ""}
        <div class="section-heading">
          <h2>Equipados</h2>
        </div>
        <div class="item-grid equipped-grid">
          ${equipped.map(({ entry, item }) => renderItemTile(entry.quantity, item, selectedItem?.id === item.id, Boolean(entry.equipped))).join("")}
        </div>
        <div class="section-heading">
          <h2>Mochila</h2>
        </div>
        <div class="item-grid">
          ${filteredEntries.map(({ entry, item }) => renderItemTile(entry.quantity, item, selectedItem?.id === item.id, Boolean(entry.equipped))).join("")}
        </div>
        <div class="capacity-summary">
          <span>Capacidade</span>
          <strong>${currentWeight} / ${character.inventory.capacity}</strong>
        </div>
        <div class="capacity-bar"><i style="width: ${progressPercent(currentWeight, character.inventory.capacity)}%"></i></div>
      </section>
      ${selectedItem ? renderItemPanel(selectedItem, "side") : ""}
    </main>
  `;
}

function renderItemTile(quantity: number, item: ItemDefinition, selected: boolean, equipped: boolean): string {
  return `
    <button class="item-tile ${selected ? "is-active" : ""}" data-item-id="${item.id}">
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

function renderItemPanel(item: ItemDefinition, placement: "side" | "inline"): string {
  if (!item) {
    return `<aside class="detail-panel"><p>Nenhum item selecionado.</p></aside>`;
  }

  return `
    <aside class="detail-panel detail-panel-${placement}">
      <div class="panel-heading">
        <div>
          <h2 tabindex="-1" data-panel-title>${escapeHtml(item.name)}</h2>
          <span>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</span>
        </div>
        <button data-item-panel-close aria-label="Fechar detalhes">x</button>
      </div>
      <div class="feature-art item-detail-art">${renderItemVisual(item, "detail")}</div>
      <p>${escapeHtml(item.summary)}</p>
      <dl class="detail-list">
        <div><dt>Valor</dt><dd>${item.value ?? "-"}</dd></div>
        <div><dt>Peso</dt><dd>${item.weight}</dd></div>
      </dl>
      <div class="trait-list">
        ${(item.traits ?? []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}
      </div>
      <button class="primary-action">Equipar</button>
      <button class="secondary-action">Mover para mochila</button>
      <button class="danger-action">Descartar</button>
    </aside>
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
  const dreadDomain = catalog.domains.find((domain) => domain.name.toLowerCase() === "dread");
  const dreadCards = catalog.cards.filter((card) => card.domainId === dreadDomain?.id);
  const selectedCard = dreadCards.find((card) => card.id === state.selectedCardId) ?? dreadCards[0];

  return `
    <main class="content content-with-panel">
      <section class="inventory-main">
        <div class="screen-title">
          <div>
            <h1>Compendium</h1>
            <p>Cartas filtradas pelo dominio Dread</p>
          </div>
          <label class="search-box">
            <span>BUSCA</span>
            <input type="search" placeholder="Procurar carta..." aria-label="Procurar carta" />
          </label>
        </div>
        <div class="filter-row">
          <button class="chip is-active">Cartas</button>
          <button class="chip">Dominios</button>
          <button class="chip">Itens</button>
          <button class="chip">Regras</button>
        </div>
        <div class="domain-strip">
          <button class="domain-chip is-active" style="--domain-color: ${dreadDomain?.color ?? "#8e5cf7"}">Dread</button>
        </div>
        <div class="card-browser">
          ${dreadCards.map((card) => renderCompendiumCard(card, selectedCard?.id === card.id)).join("")}
        </div>
      </section>
      ${renderCardPanel(selectedCard)}
    </main>
  `;
}

function renderCompendiumCard(card: CardDefinition, selected: boolean): string {
  const domain = findDomain(catalog, card.domainId);
  return `
    <button class="compendium-card ${selected ? "is-active" : ""}" data-card-id="${card.id}">
      <span>Tier ${card.tier}</span>
      <strong>${escapeHtml(card.name)}</strong>
      <small>${escapeHtml(domain?.name ?? "Sem dominio")} - ${escapeHtml(card.cardType)}</small>
      <p>${escapeHtml(card.summary)}</p>
    </button>
  `;
}

function renderCardPanel(card?: CardDefinition): string {
  if (!card) {
    return `<aside class="detail-panel"><p>Nenhuma carta encontrada.</p></aside>`;
  }

  const domain = findDomain(catalog, card.domainId);

  return `
    <aside class="detail-panel">
      <div class="panel-heading">
        <div>
          <h2>${escapeHtml(card.name)}</h2>
          <span>${escapeHtml(domain?.name ?? "Sem dominio")} - Tier ${card.tier}</span>
        </div>
        <button aria-label="Fechar detalhes">x</button>
      </div>
      <div class="feature-art card-detail-art">CARD</div>
      <p>${escapeHtml(card.summary)}</p>
      <dl class="detail-list">
        <div><dt>Tipo</dt><dd>${escapeHtml(card.cardType)}</dd></div>
        <div><dt>Custo</dt><dd>${escapeHtml(card.cost ?? "-")}</dd></div>
      </dl>
      <h3>Efeito</h3>
      <p>${escapeHtml(card.effect)}</p>
      <button class="primary-action">Adicionar ao deck</button>
    </aside>
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
        <div class="modal-card-art"></div>
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
            : state.page === "inventory"
              ? renderInventory(character)
              : state.page === "compendium"
                ? renderCompendium()
                : renderPlaceholder(state.page);

  appRoot.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(character)}
      <div class="main-shell">
        ${renderTopbar()}
        ${screen}
      </div>
    </div>
    ${renderCardModal(state.modalCardId)}
    ${renderResourceModal(state.resourceModalId)}
    ${renderProgressionHistoryModal()}
  `;
}

function focusInlineItemPanel(): void {
  if (!window.matchMedia("(max-width: 1180px)").matches) {
    return;
  }

  requestAnimationFrame(() => {
    const panel = document.querySelector<HTMLElement>(".detail-panel-inline");
    const title = panel?.querySelector<HTMLElement>("[data-panel-title]");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    title?.focus({ preventScroll: true });
  });
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

function bindEvents(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest("[data-item-panel-close]")) {
      state.selectedItemId = undefined;
      render();
      return;
    }

    if (target.closest("[data-modal-close]")) {
      state.modalCardId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
      render();
      return;
    }

    if (target.matches("[data-modal-backdrop]")) {
      state.modalCardId = undefined;
      state.resourceModalId = undefined;
      state.progressionHistoryOpen = false;
      render();
      return;
    }

    const resourceAdjustButton = target.closest<HTMLElement>("[data-resource-adjust]");
    if (resourceAdjustButton) {
      const delta = Number(resourceAdjustButton.dataset.resourceAdjust);
      void adjustResource(delta);
      return;
    }

    const pageButton = target.closest<HTMLElement>("[data-page]");
    if (pageButton) {
      state.page = pageButton.dataset.page as Page;
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
      focusInlineItemPanel();
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

    if (event.key === "Escape" && state.resourceModalId) {
      state.resourceModalId = undefined;
      render();
    }

    if (event.key === "Escape" && state.progressionHistoryOpen) {
      state.progressionHistoryOpen = false;
      render();
    }
  });
}

async function boot(): Promise<void> {
  render();
  bindEvents();
  state.character = await ensureDemoCharacter();
  render();
}

void boot();
