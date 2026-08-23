import type { Character } from "../../domain/types";
import { getCharacterTier, type ActiveFeatureEffect } from "./featureEffects";

export function renderActiveFeatureEffects(character: Character, effects: ActiveFeatureEffect[], escapeHtml: (value: string) => string): string {
  if (!effects.length) return "";
  const tier = getCharacterTier(character.identity.level);
  return `<section class="active-effects-band" aria-labelledby="active-effects-title"><div class="active-effects-heading"><div><span>Efeitos em cena</span><h2 id="active-effects-title">Efeitos ativos</h2></div><strong>${effects.length}</strong></div><div class="active-effects-list">${effects.map((effect) => `<article class="active-effect"><div class="active-effect-title"><span>Ativo</span><h3>${escapeHtml(effect.feature.name)}</h3></div><div class="active-effect-details"><p>${escapeHtml(describeModifiers(effect, tier))}</p><small>Termina: ${escapeHtml(describeEndConditions(effect))}</small>${effect.activation.reminders?.length ? `<em><b>Lembrete de mesa</b>${effect.activation.reminders.map(escapeHtml).join(" · ")}</em>` : ""}</div><button class="active-effect-end" type="button" data-action="end-feature-effect" data-feature-id="${escapeHtml(effect.feature.id)}">Encerrar</button></article>`).join("")}</div></section>`;
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
  return effect.activation.endsOn.map((condition) => ({
    "scene-end": "fim da cena",
    "severe-damage": "dano severo",
    "short-rest": "descanso breve",
    "long-rest": "descanso longo",
    "next-successful-attack": "próximo ataque bem-sucedido (encerre manualmente)"
  })[condition]).join(" ou ");
}

function describeDefenseField(field: "evasion" | "armor" | "minor" | "major"): string {
  return ({ evasion: "Evasão", armor: "Armadura", minor: "Menor", major: "Maior" })[field];
}
