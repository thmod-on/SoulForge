import type { CharacterSheetModifier, FeatureDefinition } from "../../domain/types";
import { readGameMarker, renderGameMarkerFields } from "./gameMarkerForm";

type FeatureEditorOptions = {
  key: string;
  title: string;
  feature?: FeatureDefinition;
  required?: boolean;
  note?: string;
  escapeHtml: (value: string) => string;
  includeGameMarker?: boolean;
  includeResourceModifier?: boolean;
  includeRestMoveModifier?: boolean;
};

type FeatureDraftOptions = Pick<FeatureEditorOptions, "key" | "feature" | "includeResourceModifier" | "includeRestMoveModifier"> & {
  sourceType: FeatureDefinition["sourceType"];
  tier: FeatureDefinition["tier"];
  hopeCost?: number;
};

/** Editor único para o conteúdo mecânico de uma Feature, independente de sua fonte. */
export function renderFeatureAuthoringFields(options: FeatureEditorOptions): string {
  const { key, title, feature, required = false, note, escapeHtml, includeGameMarker = true, includeResourceModifier = false, includeRestMoveModifier = false } = options;
  const modifier = feature?.sheetModifiers?.find((entry) => entry.kind === "resource-max");
  const restMoveModifier = feature?.sheetModifiers?.find((entry) => entry.kind === "rest-move-bonus");
  const resourceModifier = includeResourceModifier ? `<div class="form-grid feature-resource-modifier"><label class="form-field"><span>Bônus de recurso</span><select data-feature-resource-modifier-kind="${key}"><option value="none" ${modifier ? "" : "selected"}>Nenhum</option><option value="resource-max" ${modifier ? "selected" : ""}>Aumentar máximo</option></select></label><label class="form-field"><span>Recurso</span><select data-feature-resource-id="${key}"><option value="hp" ${modifier?.resourceId === "hp" ? "selected" : ""}>PV</option><option value="stress" ${modifier?.resourceId === "stress" ? "selected" : ""}>Estresse</option><option value="hope" ${modifier?.resourceId === "hope" ? "selected" : ""}>Esperança</option><option value="armor-slots" ${modifier?.resourceId === "armor-slots" ? "selected" : ""}>Armadura</option></select></label><label class="form-field"><span>Quantidade</span><input data-feature-resource-amount="${key}" type="number" min="1" step="1" value="${modifier?.amount ?? 1}" /></label></div><small>O bônus é aplicado automaticamente enquanto esta Feature estiver ativa.</small>` : "";
  const restMoveBonus = includeRestMoveModifier ? `<label class="form-field feature-rest-move-modifier"><span>Movimentos adicionais por descanso</span><input data-feature-rest-move-amount="${key}" type="number" min="0" step="1" value="${restMoveModifier?.amount ?? 0}" /><small>Use 0 para não alterar o limite normal.</small></label>` : "";
  return `<fieldset class="class-feature-field"><legend>${title}${required ? " *" : ""}</legend>${note ? `<small>${note}</small>` : ""}<label class="form-field"><span>Nome${required ? " *" : ""}</span><input data-feature-name="${key}" value="${escapeHtml(feature?.name ?? "")}" /></label><label class="form-field"><span>Descricao${required ? " *" : ""}</span><textarea data-feature-summary="${key}">${escapeHtml(feature?.summary ?? "")}</textarea></label>${resourceModifier}${restMoveBonus}${includeGameMarker ? renderGameMarkerFields(`feature-${key}`, feature?.gameMarkers?.[0], escapeHtml) : ""}</fieldset>`;
}

export function readFeatureAuthoringFields(options: FeatureDraftOptions): FeatureDefinition | undefined | Error {
  const { key, feature, sourceType, tier, hopeCost, includeResourceModifier = false, includeRestMoveModifier = false } = options;
  const value = (field: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-feature-${field}="${key}"]`)?.value.trim() ?? "";
  const name = value("name");
  const summary = value("summary");
  if (!name || !summary) return undefined;
  const marker = readGameMarker(`feature-${key}`, feature?.gameMarkers?.[0]?.id);
  if (marker instanceof Error) return marker;
  const modifierKind = document.querySelector<HTMLSelectElement>(`[data-feature-resource-modifier-kind="${key}"]`)?.value;
  const resourceId = document.querySelector<HTMLSelectElement>(`[data-feature-resource-id="${key}"]`)?.value ?? "stress";
  const amount = Number(document.querySelector<HTMLInputElement>(`[data-feature-resource-amount="${key}"]`)?.value ?? 0);
  const restMoveAmount = Number(document.querySelector<HTMLInputElement>(`[data-feature-rest-move-amount="${key}"]`)?.value ?? 0);
  if (includeRestMoveModifier && (!Number.isInteger(restMoveAmount) || restMoveAmount < 0)) return new Error("Informe uma quantidade válida de movimentos adicionais por descanso.");
  const sheetModifiers: CharacterSheetModifier[] = (feature?.sheetModifiers ?? []).filter((entry) => !(includeResourceModifier && entry.kind === "resource-max") && !(includeRestMoveModifier && entry.kind === "rest-move-bonus"));
  if (includeResourceModifier && modifierKind === "resource-max" && Number.isFinite(amount) && amount > 0) sheetModifiers.push({ kind: "resource-max", resourceId, amount });
  if (includeRestMoveModifier && restMoveAmount > 0) sheetModifiers.push({ kind: "rest-move-bonus", amount: restMoveAmount });
  return { id: feature?.id ?? `feature.local.${crypto.randomUUID()}`, type: "feature", packId: "local", name, summary, sourceType, sourceId: "", tier, ...(hopeCost ? { hopeCost } : {}), ...(marker ? { gameMarkers: [marker] } : {}), ...(sheetModifiers.length ? { sheetModifiers } : {}) };
}
