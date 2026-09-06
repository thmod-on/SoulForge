import type { Character } from "../../domain/types";

const coreResources = [
  { id: "stress", label: "Estresse", color: "#f4cc57", path: "M19 2 5 19h10l-2 11L27 12H17Z" },
  { id: "hp", label: "PV", color: "#ef6579", path: "M16 28C12 24 3 18 3 10a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 8-9 14-13 18Z" },
  { id: "hope", label: "Esperança", color: "#f3eadc", path: "M16 2 28 16 16 30 4 16Z" },
  { id: "armor-slots", label: "Armadura", color: "#65c8df", path: "M16 2 28 7 26 19Q24 26 16 30 8 26 6 19L4 7Z" }
] as const;

export function isCoreResource(id: string): boolean {
  return coreResources.some((resource) => resource.id === id);
}

export function renderCoreResources(character: Character): string {
  return `<section class="sidebar-core-resources" aria-label="Recursos principais">${coreResources.map((definition) => {
    const resource = character.resources.find((entry) => entry.id === definition.id);
    if (!resource) return "";
    const percent = resource.max > 0 ? Math.max(0, Math.min(100, resource.value / resource.max * 100)) : 0;
    const gradient = `core-resource-fill-${definition.id}`;
    return `<article class="sidebar-core-resource" aria-label="${definition.label}"><div class="sidebar-core-resource-value"><svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><linearGradient id="${gradient}" x1="0" y1="1" x2="0" y2="0"><stop offset="${percent}%" stop-color="${definition.color}"/><stop offset="${percent}%" stop-color="${definition.id === "stress" ? "#efebf4" : "#34313e"}"/></linearGradient></defs><path d="${definition.path}" fill="url(#${gradient})" stroke="#efebf4" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="sidebar-core-resource-label">${definition.label}</span><strong aria-live="polite">${resource.value} / ${resource.max}</strong></div><div class="sidebar-core-resource-controls"><button class="sf-stepper-button" type="button" data-resource-adjust="1" data-resource-id="${definition.id}" aria-label="Aumentar ${definition.label}" ${resource.value >= resource.max ? "disabled" : ""}>+</button><button class="sf-stepper-button" type="button" data-resource-adjust="-1" data-resource-id="${definition.id}" aria-label="Reduzir ${definition.label}" ${resource.value <= 0 ? "disabled" : ""}>−</button></div></article>`;
  }).join("")}</section>`;
}
