import type { ActiveGameMarker } from "./gameMarkerSync";

export function renderGameMarkers(markers: ActiveGameMarker[], escapeHtml: (value: string) => string): string {
  if (!markers.length) return "";
  return `<section class="game-markers-preview band" aria-label="Marcadores de jogo"><div class="section-heading"><h2>Marcadores de jogo</h2></div><div class="game-markers-preview-grid">${markers.map((marker) => renderMarker(marker, escapeHtml)).join("")}</div></section>`;
}

function renderMarker(marker: ActiveGameMarker, escapeHtml: (value: string) => string): string {
  if (marker.state.kind === "counter") {
    const canDecrease = marker.state.value > 0;
    const canIncrease = marker.state.max === undefined || marker.state.value < marker.state.max;
    return `<article class="game-marker-preview"><small>${escapeHtml(marker.sourceLabel)}</small><h3>${escapeHtml(marker.definition.label)}</h3><div class="game-marker-counter"><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="-1" aria-label="Diminuir ${escapeHtml(marker.definition.label)}" ${canDecrease ? "" : "disabled"}>−</button><strong>${marker.state.value}${marker.state.max === undefined ? "" : ` / ${marker.state.max}`}</strong><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="1" aria-label="Aumentar ${escapeHtml(marker.definition.label)}" ${canIncrease ? "" : "disabled"}>+</button></div>${marker.definition.reset ? `<span>Reinicia: ${resetLabel(marker.definition.reset)}</span>` : ""}</article>`;
  }

  const diceState = marker.state;
  return `<article class="game-marker-preview game-marker-dice"><small>${escapeHtml(marker.definition.label)}</small><div class="game-marker-dice-slots" aria-label="Dados de ${escapeHtml(marker.definition.label)}">${diceState.results.map((die, index) => `<button class="game-marker-die-slot die-${diceState.die} ${die.used ? "is-used" : ""} ${die.value ? "has-result" : ""}" type="button" data-action="interact-game-marker-die" data-game-marker-key="${escapeHtml(marker.key)}" data-game-marker-die-id="${escapeHtml(die.id)}" ${die.used ? "disabled" : ""} aria-label="${die.used ? `Dado ${index + 1} consumido com resultado ${die.value}` : die.value ? `Consumir dado ${index + 1} com resultado ${die.value}` : `Definir resultado do dado ${index + 1}`}"><strong>${die.value || "—"}</strong><small>${diceState.die}</small></button>`).join("")}</div></article>`;
}

function resetLabel(reset: "session" | "short-rest" | "long-rest"): string {
  return reset === "session" ? "sessão" : reset === "short-rest" ? "descanso breve" : "descanso longo";
}
