import { createCatalog } from "../domain/catalog";

/** Conteúdo vem exclusivamente de Packs instalados ou criações locais. */
export const baseCatalog = createCatalog([], []);

// Compatibilidade para consumidores que precisam apenas do catalogo dos packs instalados.
export const catalog = baseCatalog;
