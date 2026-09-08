import type { Catalog } from "../../domain/catalog";
import type { CompendiumSpread } from "../../app/types";

export type CompendiumChapter = {
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
};

export type CompendiumIndexDependencies = {
  spread: CompendiumSpread;
  catalog: Catalog;
  escapeHtml(value: string): string;
  renderTransformationsSpread(renderChapterCard: (chapter: CompendiumChapter) => string): string;
};

export function renderCompendiumIndex(deps: CompendiumIndexDependencies): string {
  const { spread, catalog, escapeHtml } = deps;
  const renderChapterCard = (chapter: CompendiumChapter) => renderCompendiumChapterCard(chapter, escapeHtml);

  return `
    <main class="content compendium-content compendium-index-content">
      <div class="screen-title"><div><h1>Compendium</h1></div></div>
      <nav class="compendium-bookmarks" aria-label="Aberturas do Compendium">
        ${renderBookmark(1, "Dominios | Cartas", spread)}
        ${renderBookmark(2, "Itens | Classes", spread)}
        ${renderBookmark(3, "Ancestralidades | Comunidades", spread)}
        ${renderBookmark(4, "Transformações", spread)}
      </nav>
      ${spread === 1
        ? renderSpread("Dominios e cartas do Compendium", domainChapter(catalog), cardChapter(catalog), renderChapterCard)
        : spread === 2
          ? renderSpread("Itens e classes do Compendium", itemChapter(catalog), classChapter(catalog), renderChapterCard)
          : spread === 3
            ? renderSpread("Ancestralidades e comunidades do Compendium", ancestryChapter(catalog), communityChapter(catalog), renderChapterCard)
            : deps.renderTransformationsSpread(renderChapterCard)}
    </main>
  `;
}

export function renderCompendiumChapterCard(chapter: CompendiumChapter, escapeHtml: (value: string) => string): string {
  return `
    <div class="compendium-index-card ${chapter.emphasized ? "is-priority" : ""}">
      <div class="compendium-page-heading">
        ${chapter.eyebrow ? `<span>${escapeHtml(chapter.eyebrow)}</span>` : ""}
        <h2>${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(chapter.summary)}</p>
      </div>
      <div class="compendium-chapter-count"><strong>${chapter.count}</strong><span>${escapeHtml(chapter.countLabel)}</span></div>
      <div class="compendium-actions compendium-index-actions">
        <button type="button" ${chapter.primaryActionId ? `data-action="${chapter.primaryActionId}"` : "disabled"}>${escapeHtml(chapter.primaryAction)}</button>
        <button type="button" ${chapter.secondaryActionId ? `data-action="${chapter.secondaryActionId}"` : "disabled"}>${escapeHtml(chapter.secondaryAction)}</button>
      </div>
      <ul class="compendium-chapter-notes">${chapter.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderBookmark(spread: CompendiumSpread, label: string, selected: CompendiumSpread): string {
  const active = spread === selected;
  return `<button class="sf-tab ${active ? "is-active" : ""}" type="button" data-compendium-spread="${spread}" aria-current="${active ? "page" : "false"}">Capítulo ${spread} <span>${label}</span></button>`;
}

function renderSpread(label: string, left: CompendiumChapter, right: CompendiumChapter, renderChapterCard: (chapter: CompendiumChapter) => string): string {
  return `<section class="compendium-spread compendium-index-spread" aria-label="${label}"><article class="compendium-page">${renderChapterCard(left)}</article><article class="compendium-page">${renderChapterCard(right)}</article></section>`;
}

function domainChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Dominios", summary: "A identidade que organiza as cartas: nome, descricao e cor de cada vertente.", count: catalog.domains.length, countLabel: "Dominios cadastrados", primaryAction: "Novo dominio", primaryActionId: "new-compendium-domain", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-domains", details: ["Dominios de packs sao protegidos e apenas podem ser consultados.", "Dominios locais ficam salvos neste dispositivo.", "Uma carta sempre devera pertencer a um dominio."], emphasized: true };
}

function cardChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Cartas", summary: "Cartas utilizaveis por personagens, organizadas por dominio, tier, custo e efeito.", count: catalog.cards.length, countLabel: "Cartas cadastradas", primaryAction: "Nova carta", primaryActionId: "new-compendium-card", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-cards", details: ["Toda carta pertence obrigatoriamente a um dominio.", "Cartas locais podem ser criadas, editadas e excluidas.", "Conteudo de packs fica protegido para preservar sua origem."] };
}

function itemChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Itens", summary: "Armas, armaduras, consumiveis, equipamentos e loot que podem ser referenciados pelo inventario.", count: catalog.items.length, countLabel: "Definitions cadastradas", primaryAction: "Novo item", primaryActionId: "new-compendium-item", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-items", details: ["Busca e filtros por tipo ficam na pagina interna.", "Itens locais podem ser criados, editados e excluidos.", "Itens continuam sendo Definitions, nao copias do personagem."] };
}

function classChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Classes", summary: "Classes definem a identidade do personagem e os dominios que podem conceder cartas.", count: catalog.classes.length, countLabel: "Classes cadastradas", primaryAction: "Nova classe", primaryActionId: "new-compendium-class", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-classes", details: ["Cada classe libera um ou mais dominios.", "Fundamento, especializacao e maestria serao conectados em seguida.", "Classes locais ficam salvas neste dispositivo."] };
}

function ancestryChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Ancestralidades", summary: "Linhagens que concedem duas features permanentes: uma Top Feature e uma Bottom Feature.", count: catalog.ancestries.length, countLabel: "Ancestralidades cadastradas", primaryAction: "Nova ancestralidade", primaryActionId: "new-compendium-ancestry", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-ancestries", details: ["Uma ancestralidade unica concede as duas features da mesma Definition.", "Ancestralidades mistas combinam Top e Bottom de origens diferentes.", "A linhagem narrativa e as escolhas mecanicas permanecem separadas na ficha."], emphasized: true };
}

function communityChapter(catalog: Catalog): CompendiumChapter {
  return { eyebrow: "", title: "Comunidades", summary: "Origens culturais, sociais ou ambientais que concedem uma Feature permanente.", count: catalog.communities.length, countLabel: "Comunidades cadastradas", primaryAction: "Nova comunidade", primaryActionId: "new-compendium-community", secondaryAction: "Pesquisar e gerenciar", secondaryActionId: "manage-compendium-communities", details: ["Cada comunidade concede uma única Feature.", "Os adjetivos são referências narrativas, não bônus adicionais.", "A comunidade mecânica não substitui a origem livre da personagem."] };
}
