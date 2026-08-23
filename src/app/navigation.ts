import type { Page } from "./types";

export const playerNavigation: Array<{ page: Page; label: string }> = [
  { page: "skills", label: "Aptidoes" },
  { page: "inventory", label: "Inventario" },
  { page: "progression", label: "Progressao" },
  { page: "notes", label: "Anotacoes" }
];

export const editorNavigation: Array<{ page: Page; label: string; icon: string }> = [
  { page: "compendium", label: "Compendium", icon: "&#128214;" },
  { page: "settings", label: "Configuracoes", icon: "&#128220;" }
];

export function isEditorPage(page: Page): boolean {
  return page === "compendium" || page === "settings";
}
