import type { ActiveGameMarker } from "./gameMarkerSync";

export function renderGameMarkers(markers: ActiveGameMarker[], escapeHtml: (value: string) => string): string {
  if (!markers.length) return "";
  const hasSessionReset = markers.some((marker) => marker.definition.reset === "session");
  return `<section class="game-markers-preview band" aria-label="Marcadores de jogo"><div class="section-heading"><div><h2>Marcadores de jogo</h2><span>Controles ativos da ficha</span></div>${hasSessionReset ? `<button class="secondary-action game-marker-session-reset" type="button" data-action="reset-game-markers-session">Nova sessão</button>` : ""}</div><div class="game-markers-preview-grid">${markers.map((marker) => renderMarker(marker, escapeHtml)).join("")}</div></section>`;
}

function renderMarker(marker: ActiveGameMarker, escapeHtml: (value: string) => string): string {
  if (marker.state.kind === "counter") {
    const canDecrease = marker.state.value > 0;
    const canIncrease = marker.state.max === undefined || marker.state.value < marker.state.max;
    return `<article class="game-marker-preview"><small>${escapeHtml(marker.sourceLabel)}</small><h3>${escapeHtml(marker.definition.label)}</h3><div class="game-marker-counter"><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="-1" aria-label="Diminuir ${escapeHtml(marker.definition.label)}" ${canDecrease ? "" : "disabled"}>−</button><strong>${marker.state.value}${marker.state.max === undefined ? "" : ` / ${marker.state.max}`}</strong><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="1" aria-label="Aumentar ${escapeHtml(marker.definition.label)}" ${canIncrease ? "" : "disabled"}>+</button></div>${marker.definition.reset ? `<span>Reinicia: ${resetLabel(marker.definition.reset)}</span>` : ""}</article>`;
  }
  const diceState = marker.state;
  return `<article class="game-marker-preview game-marker-dice"><small>${escapeHtml(marker.sourceLabel)}</small><h3>${escapeHtml(marker.definition.label)}</h3><div class="game-marker-dice-list">${diceState.results.map((die, index) => `<div class="game-marker-die ${die.used ? "is-used" : ""}"><span>${diceState.die} ${index + 1}</span><div class="game-marker-die-results" aria-label="Resultado do dado ${index + 1}">${[1, 2, 3, 4].map((value) => `<button type="button" class="${die.value === value ? "is-selected" : ""}" data-game-marker-die-result="${escapeHtml(marker.key)}" data-game-marker-die-id="${escapeHtml(die.id)}" data-game-marker-die-value="${value}" aria-pressed="${die.value === value}">${value}</button>`).join("")}</div><button class="game-marker-die-use" type="button" data-game-marker-die-use="${escapeHtml(marker.key)}" data-game-marker-die-id="${escapeHtml(die.id)}" ${die.value === 0 ? "disabled" : ""}>${die.used ? "Disponibilizar" : "Usar"}</button></div>`).join("")}</div><span>${diceState.results.filter((die) => die.used).length} usado(s)${marker.definition.reset ? ` · Reinicia: ${resetLabel(marker.definition.reset)}` : ""}</span></article>`;
}

function resetLabel(reset: "session" | "short-rest" | "long-rest"): string {
  return reset === "session" ? "sessão" : reset === "short-rest" ? "descanso breve" : "descanso longo";
}
