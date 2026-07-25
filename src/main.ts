import { catalog } from "./content/installedPacks";
import { findDefinition, findDomain } from "./domain/catalog";
import type { CardDefinition, Character, ItemDefinition } from "./domain/types";
import { ensureDemoCharacter } from "./storage/characterRepository";
import "./styles.css";

type Page = "overview" | "skills" | "experiences" | "inventory" | "progression" | "notes" | "compendium" | "settings";
type InventoryFilter = "todos" | ItemDefinition["category"];

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
  selectedItemId: string;
  selectedCardId: string;
  character?: Character;
} = {
  page: "overview",
  inventoryFilter: "todos",
  selectedItemId: "item.demo.long-sword",
  selectedCardId: "card.demo.dread-veil"
};

const navItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "overview", label: "Visao Geral", icon: "◈" },
  { page: "skills", label: "Habilidades", icon: "✦" },
  { page: "experiences", label: "Experiencias", icon: "✺" },
  { page: "inventory", label: "Inventario", icon: "▣" },
  { page: "progression", label: "Progressao", icon: "⬡" },
  { page: "notes", label: "Anotacoes", icon: "☷" }
];

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

function renderSidebar(character: Character): string {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">SF</div>
        <div>
          <strong>SOULFORGE</strong>
          <span>Daggerheart Companion</span>
        </div>
      </div>
      <div class="portrait">
        <div class="portrait-art"></div>
        <div>
          <strong>${escapeHtml(character.identity.name)}</strong>
          <span>${escapeHtml(character.identity.ancestry)} • ${escapeHtml(character.identity.className)}</span>
        </div>
      </div>
      <nav class="side-nav" aria-label="Menu principal">
        ${navItems
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
      <button class="top-link ${state.page === "compendium" ? "is-active" : ""}" data-page="compendium">Compendium</button>
      <button class="top-link ${state.page === "settings" ? "is-active" : ""}" data-page="settings">Configuracoes</button>
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
              <article class="resource-card tone-${resource.tone}">
                <span>${escapeHtml(resource.label)}</span>
                <strong>${resource.value} / ${resource.max}</strong>
                <div class="pips" aria-hidden="true">
                  ${Array.from({ length: resource.max }, (_, index) => `<i class="${index < resource.value ? "filled" : ""}"></i>`).join("")}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderOverview(character: Character): string {
  const activeCards = getActiveCards(character);
  return `
    <main class="content">
      <section class="hero-strip">
        <div>
          <span>Nivel ${character.identity.level}</span>
          <h1>${escapeHtml(character.identity.name)}</h1>
          <p>${escapeHtml(character.identity.community)}</p>
        </div>
        <div class="xp-block">
          <span>Proximo nivel</span>
          <div class="bar"><i style="width: ${progressPercent(character.identity.xp, character.identity.nextLevelXp)}%"></i></div>
          <strong>${character.identity.xp} XP</strong>
        </div>
      </section>
      <section class="overview-grid">
        <div class="band">
          <div class="section-heading">
            <h2>Atributos</h2>
          </div>
          <div class="attribute-grid">
            ${character.attributes.map((attribute) => `<div><span>${attribute.label}</span><strong>${attribute.value}</strong></div>`).join("")}
          </div>
        </div>
        <div class="band">
          <div class="section-heading">
            <h2>Defesa</h2>
          </div>
          <div class="defense-grid">
            <div><span>Evasao</span><strong>${character.defense.evasion}</strong></div>
            <div><span>Armadura</span><strong>${character.defense.armor}</strong></div>
            <div><span>Dano menor</span><strong>${character.defense.minor}</strong></div>
            <div><span>Dano maior</span><strong>${character.defense.major}</strong></div>
          </div>
        </div>
      </section>
      ${renderResources(character)}
      <section class="band">
        <div class="section-heading">
          <h2>Cartas ativas</h2>
          <span>${activeCards.length} / 5 ativas</span>
        </div>
        <div class="card-row">
          ${activeCards.map(renderCardTile).join("")}
        </div>
      </section>
      <section class="quick-actions">
        <button data-action="rest-short"><span>☕</span> Descansar breve</button>
        <button data-action="rest-long"><span>♨</span> Descansar longo</button>
        <button data-page="experiences"><span>✺</span> Registrar experiencia</button>
        <button data-page="inventory"><span>▣</span> Abrir inventario</button>
      </section>
    </main>
  `;
}

function renderCardTile(card: CardDefinition): string {
  const domain = findDomain(catalog, card.domainId);
  return `
    <article class="ability-card" data-card-id="${card.id}">
      <div class="card-tier">${card.tier}</div>
      <div class="card-art"></div>
      <h3>${escapeHtml(card.name)}</h3>
      <span>${escapeHtml(domain?.name ?? "Sem dominio")} • ${escapeHtml(card.cardType)}</span>
      <p>${escapeHtml(card.summary)}</p>
    </article>
  `;
}

function renderInventory(character: Character): string {
  const entries = getItemEntries(character);
  const filteredEntries = entries.filter(({ item }) => state.inventoryFilter === "todos" || item.category === state.inventoryFilter);
  const selectedItem = entries.find(({ item }) => item.id === state.selectedItemId)?.item ?? filteredEntries[0]?.item ?? entries[0]?.item;
  const equipped = entries.filter(({ entry }) => entry.equipped);
  const currentWeight = entries.reduce((total, { entry, item }) => total + entry.quantity * item.weight, 0);

  return `
    <main class="content content-with-panel">
      <section class="inventory-main">
        <div class="screen-title">
          <h1>Inventario</h1>
          <label class="search-box">
            <span>⌕</span>
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
        <div class="section-heading">
          <h2>Equipados</h2>
        </div>
        <div class="item-grid equipped-grid">
          ${equipped.map(({ entry, item }) => renderItemTile(entry.quantity, item, selectedItem?.id === item.id)).join("")}
        </div>
        <div class="section-heading">
          <h2>Mochila</h2>
          <span>${currentWeight} / ${character.inventory.capacity}</span>
        </div>
        <div class="item-grid">
          ${filteredEntries.map(({ entry, item }) => renderItemTile(entry.quantity, item, selectedItem?.id === item.id)).join("")}
        </div>
        <div class="capacity-bar"><i style="width: ${progressPercent(currentWeight, character.inventory.capacity)}%"></i></div>
      </section>
      ${renderItemPanel(selectedItem)}
    </main>
  `;
}

function renderItemTile(quantity: number, item: ItemDefinition, selected: boolean): string {
  return `
    <button class="item-tile ${selected ? "is-active" : ""}" data-item-id="${item.id}">
      <span class="item-icon">${itemIcon(item.category)}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</small>
      <em>${quantity}</em>
    </button>
  `;
}

function itemIcon(category: ItemDefinition["category"]): string {
  const icons: Record<ItemDefinition["category"], string> = {
    arma: "⚔",
    armadura: "⬟",
    consumivel: "◉",
    equipamento: "◎",
    loot: "◆"
  };

  return icons[category];
}

function renderItemPanel(item?: ItemDefinition): string {
  if (!item) {
    return `<aside class="detail-panel"><p>Nenhum item selecionado.</p></aside>`;
  }

  return `
    <aside class="detail-panel">
      <div class="panel-heading">
        <div>
          <h2>${escapeHtml(item.name)}</h2>
          <span>${item.tier ? `Tier ${item.tier}` : itemFilterLabels[item.category]}</span>
        </div>
        <button aria-label="Fechar detalhes">×</button>
      </div>
      <div class="feature-art item-detail-art">${itemIcon(item.category)}</div>
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
            <span>⌕</span>
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
      <small>${escapeHtml(domain?.name ?? "Sem dominio")} • ${escapeHtml(card.cardType)}</small>
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
          <span>${escapeHtml(domain?.name ?? "Sem dominio")} • Tier ${card.tier}</span>
        </div>
        <button aria-label="Fechar detalhes">×</button>
      </div>
      <div class="feature-art card-detail-art">✦</div>
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

function renderPlaceholder(page: Page): string {
  const labels: Record<Page, string> = {
    overview: "Visao Geral",
    skills: "Habilidades",
    experiences: "Experiencias",
    inventory: "Inventario",
    progression: "Progressao",
    notes: "Anotacoes",
    compendium: "Compendium",
    settings: "Configuracoes"
  };

  return `
    <main class="content">
      <section class="empty-state">
        <span>◇</span>
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
  `;
}

function bindEvents(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const pageButton = target.closest<HTMLElement>("[data-page]");
    if (pageButton) {
      state.page = pageButton.dataset.page as Page;
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
      state.selectedItemId = itemButton.dataset.itemId ?? state.selectedItemId;
      render();
      return;
    }

    const cardButton = target.closest<HTMLElement>("[data-card-id]");
    if (cardButton) {
      state.selectedCardId = cardButton.dataset.cardId ?? state.selectedCardId;
      if (state.page !== "compendium") {
        state.page = "compendium";
      }
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
