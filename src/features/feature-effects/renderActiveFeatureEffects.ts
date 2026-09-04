import type { Character, CharacterSheetModifier, SheetModifierCondition } from "../../domain/types";
import { getCharacterTier, type ActiveFeatureEffect } from "./featureEffects";
import type { ActiveSheetModifierEffect } from "../player/sheetModifiers";

export function renderActiveFeatureEffects(character: Character, effects: ActiveFeatureEffect[], sheetEffects: ActiveSheetModifierEffect[], escapeHtml: (value: string) => string): string {
  const amount = effects.length + sheetEffects.length;
  if (!amount) return "";
  const tier = getCharacterTier(character.identity.level);
  return `<section class="active-effects-band" aria-labelledby="active-effects-title"><div class="active-effects-heading"><div><span>Efeitos em cena</span><h2 id="active-effects-title">Efeitos ativos</h2></div><strong>${amount}</strong></div><div class="active-effects-list">${effects.map((effect) => `<article class="active-effect"><div class="active-effect-title"><span>${effect.feature.sourceType === "ancestry" ? "Ancestralidade" : "Ativo"}${effect.state.target ? effect.state.target === "ally" ? " · Aliado" : " · Você" : ""}</span><h3>${escapeHtml(effect.feature.name)}</h3></div><div class="active-effect-details"><p>${escapeHtml(describeModifiers(effect, tier))}</p>${renderTokens(effect, escapeHtml)}<small>Termina: ${escapeHtml(describeEndConditions(effect))}</small>${effect.activation.reminders?.length ? `<em><b>Lembrete de mesa</b>${effect.activation.reminders.map(escapeHtml).join(" · ")}</em>` : ""}</div><button class="active-effect-end" type="button" data-action="end-feature-effect" data-feature-id="${escapeHtml(effect.feature.id)}">Encerrar</button></article>`).join("")}${sheetEffects.map((effect) => `<article class="active-effect active-sheet-effect"><div class="active-effect-title"><span>Loadout</span><h3>${escapeHtml(effect.card.name)}</h3></div><div class="active-effect-details"><p>${escapeHtml(describeSheetModifiers(effect.modifiers))}</p><small>${escapeHtml(describeCondition(effect.condition))}</small></div></article>`).join("")}</div></section>`;
}

function renderTokens(effect: ActiveFeatureEffect, escapeHtml: (value: string) => string): string {
  const tokens = effect.state.tokens;
  if (!tokens) return "";
  return `<div class="active-effect-tokens"><span>${escapeHtml(tokens.label)}</span><div><button type="button" data-action="change-feature-effect-tokens" data-feature-id="${escapeHtml(effect.feature.id)}" data-token-delta="-1" ${tokens.value ? "" : "disabled"} aria-label="Gastar ficha">−</button><strong>${tokens.value}</strong><button type="button" data-action="change-feature-effect-tokens" data-feature-id="${escapeHtml(effect.feature.id)}" data-token-delta="1" aria-label="Adicionar ficha">+</button></div></div>`;
}

function describeModifiers(effect: ActiveFeatureEffect, tier: number): string {
  const descriptions = effect.activation.modifiers.flatMap((modifier) => {
    if (modifier.kind === "defense") return [`+${modifier.amount} em ${modifier.fields.map(describeDefenseField).join(" e ")}`];
    if (modifier.kind === "defense-per-tier") return [`+${tier} nos limiares ${modifier.fields.map(describeDefenseField).join(" e ")}`];
    return [];
  });
  return descriptions.join(" · ") || "Efeito ativo";
}

function describeEndConditions(effect: ActiveFeatureEffect): string {
  if (!effect.activation.endsOn.length) return "ao encerrar manualmente";
  return effect.activation.endsOn.map((condition) => ({
    "scene-end": "fim da cena (encerre manualmente)",
    "severe-damage": "dano severo em você (encerre manualmente)",
    "short-rest": "descanso breve",
    "long-rest": "descanso longo",
    "next-successful-attack": "próximo ataque bem-sucedido (encerre manualmente)"
  })[condition]).join(" ou ");
}

function describeDefenseField(field: "evasion" | "armor" | "minor" | "major"): string {
  return ({ evasion: "Evasão", armor: "Armadura", minor: "Menor", major: "Maior" })[field];
}

function describeSheetModifiers(modifiers: CharacterSheetModifier[]): string {
  return modifiers.map((modifier) => {
    if (modifier.kind === "attribute") return `+${modifier.amount} em ${describeAttribute(modifier.attributeId)}`;
    if (modifier.kind === "defense") return `+${modifier.amount} em ${describeDefenseField(modifier.field)}`;
    if (modifier.kind === "resource-max") return `+${modifier.amount} no máximo de ${modifier.resourceId}`;
    if (modifier.kind === "defense-per-proficiency") return `+${modifier.amount} × Proficiência em ${describeDefenseField(modifier.field)}`;
    const multiplier = modifier.multiplier ?? 1;
    const divisor = modifier.divisor ?? 1;
    return `+${multiplier === 1 ? "" : `${multiplier} × `}${describeAttribute(modifier.attributeId)}${divisor === 1 ? "" : ` ÷ ${divisor}`} em ${describeDefenseField(modifier.field)}`;
  }).join(" · ");
}

function describeCondition(condition: SheetModifierCondition): string {
  if (condition.kind === "equipped-armor") return "Condição atendida: armadura equipada.";
  return `Condição atendida: ${condition.minimum} ou mais cartas deste domínio no Loadout.`;
}

function describeAttribute(attributeId: "for" | "dex" | "con" | "int" | "wil" | "cha"): string {
  return ({ for: "Força", dex: "Agilidade", cha: "Finesse", wil: "Instinto", con: "Presença", int: "Conhecimento" })[attributeId];
}
