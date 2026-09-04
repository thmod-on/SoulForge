import type { ActiveGameMarker } from "./gameMarkerSync";

export function renderGameMarkers(markers: ActiveGameMarker[], escapeHtml: (value: string) => string): string {
  if (!markers.length) return "";
  return `<section class="game-markers-preview band" aria-label="Marcadores de jogo"><div class="section-heading"><h2>Marcadores de jogo</h2></div><div class="game-markers-preview-grid">${markers.map((marker) => renderMarker(marker, escapeHtml)).join("")}</div></section>`;
}

function renderMarker(marker: ActiveGameMarker, escapeHtml: (value: string) => string): string {
  if (marker.state.kind === "counter") {
    const canDecrease = marker.state.value > 0;
    const canIncrease = marker.state.max === undefined || marker.state.value < marker.state.max;
    const maximum = marker.state.max === undefined ? "" : `<small>/${marker.state.max}</small>`;
    return `<article class="game-marker-preview game-marker-counter-preview"><small>${escapeHtml(marker.definition.label)}</small><div class="game-marker-counter-controls"><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="-1" aria-label="Diminuir ${escapeHtml(marker.definition.label)}" ${canDecrease ? "" : "disabled"}>−</button><div class="game-marker-counter-token" aria-label="${marker.state.value}${marker.state.max === undefined ? "" : ` de ${marker.state.max}`}"><strong>${marker.state.value}</strong>${maximum}</div><button type="button" data-game-marker-adjust="${escapeHtml(marker.key)}" data-game-marker-delta="1" aria-label="Aumentar ${escapeHtml(marker.definition.label)}" ${canIncrease ? "" : "disabled"}>+</button></div></article>`;
  }

  if (marker.state.kind === "stored-dice") {
    const storedState = marker.state;
    const slots = Array.from({ length: storedState.max }, (_, index) => `<span class="game-marker-die-slot die-${storedState.die} ${index < storedState.available ? "is-stored" : ""}" aria-label="${index < storedState.available ? "Dado armazenado" : "Espaço livre"}"><strong>${index < storedState.available ? "◆" : "—"}</strong><small>${storedState.die}</small></span>`).join("");
    const canStore = storedState.available < storedState.max;
    const canSpend = storedState.available > 0;
    return `<article class="game-marker-preview game-marker-dice game-marker-stored-dice"><small>${escapeHtml(marker.definition.label)}</small><div class="game-marker-dice-slots" aria-label="Reserva de ${escapeHtml(marker.definition.label)}">${slots}</div><div class="game-marker-stored-dice-actions"><button type="button" class="sf-action sf-action--secondary sf-action--compact" data-action="store-game-marker-die" data-game-marker-key="${escapeHtml(marker.key)}" ${canStore ? "" : "disabled"}>Esperança → guardar</button><button type="button" class="sf-action sf-action--primary sf-action--compact" data-action="spend-stored-game-marker-dice" data-game-marker-key="${escapeHtml(marker.key)}" ${canSpend ? "" : "disabled"}>Gastar dados</button></div><em>Armazene após rolar com Esperança.</em></article>`;
  }

  const diceState = marker.state;
  return `<article class="game-marker-preview game-marker-dice"><small>${escapeHtml(marker.definition.label)}</small><div class="game-marker-dice-slots" aria-label="Dados de ${escapeHtml(marker.definition.label)}">${diceState.results.map((die, index) => `<button class="game-marker-die-slot die-${diceState.die} ${die.used ? "is-used" : ""} ${die.value ? "has-result" : ""}" type="button" data-action="interact-game-marker-die" data-game-marker-key="${escapeHtml(marker.key)}" data-game-marker-die-id="${escapeHtml(die.id)}" ${die.used ? "disabled" : ""} aria-label="${die.used ? `Dado ${index + 1} consumido com resultado ${die.value}` : die.value ? `Consumir dado ${index + 1} com resultado ${die.value}` : `Definir resultado do dado ${index + 1}`}"><strong>${die.value || "—"}</strong><small>${diceState.die}</small></button>`).join("")}</div></article>`;
}
