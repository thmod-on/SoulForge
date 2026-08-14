import type { CardDefinition, GameMarkerDefinition } from "../domain/types";

/**
 * Metadados revisados manualmente contra a regra publicada.
 *
 * Esta lista e deliberadamente pequena: ela nao e derivada de `summary` ou
 * `effect`. Cada inclusao precisa ter uma fonte de regra confirmada.
 */
const markersByCardId: Record<string, GameMarkerDefinition[]> = {
  "card.core.arcana.p1-2": [{
    id: "unleash-chaos-charges",
    kind: "counter",
    label: "Liberar Caos",
    quantity: { kind: "spellcast-trait" },
    reset: "session"
  }],
  "card.core.arcana.p10-2": [{
    id: "premonition-use",
    kind: "counter",
    label: "Premonição",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p8-8": [{
    id: "arcane-deflection-use",
    kind: "counter",
    label: "Deflexão Arcana",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p10-8": [{
    id: "teleport-use",
    kind: "counter",
    label: "Teleporte",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p14-7": [{
    id: "planar-portal-use",
    kind: "counter",
    label: "Portal Planar",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p16-7": [{
    id: "shared-clarity-use",
    kind: "counter",
    label: "Clareza Compartilhada",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p18-7": [{
    id: "eternal-enervation-use",
    kind: "counter",
    label: "Enervação Eterna",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p18-8": [{
    id: "disintegration-wave-use",
    kind: "counter",
    label: "Onda de Desintegração",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.codex.p20-8": [{
    id: "transcendent-union-use",
    kind: "counter",
    label: "União Transcendente",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.hope-fear.dread.siphon-essence": [{
    id: "siphon-essence-use",
    kind: "counter",
    label: "Sifonar Essência",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.hope-fear.dread.dark-army": [{
    id: "dark-army-charges",
    kind: "counter",
    label: "Exército Sombrio",
    initialValue: 8,
    max: 8,
    reset: "long-rest"
  }],
  "card.core.midnight.p2-9": [{
    id: "uncanny-disguise-duration",
    kind: "counter",
    label: "Disfarce Incomum",
    quantity: { kind: "spellcast-trait" }
  }],
  "card.core.midnight.p19-2": [{
    id: "night-terror-use",
    kind: "counter",
    label: "Terror Noturno",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.midnight.p21-2": [{
    id: "eclipse-use",
    kind: "counter",
    label: "Eclipse",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.valor.p7-9": [{
    id: "lean-on-me-use",
    kind: "counter",
    label: "Apoie-se em Mim",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.valor.p17-8": [{
    id: "full-surge-use",
    kind: "counter",
    label: "Surto Total",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.bone.p18-6": [{
    id: "splintering-strike-use",
    kind: "counter",
    label: "Golpe Fragmentador",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.blade.p4-3": [{
    id: "soldiers-bond-use",
    kind: "counter",
    label: "Laço de Soldado",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.blade.p12-3": [{
    id: "battle-hardened-use",
    kind: "counter",
    label: "Endurecido pela Batalha",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.blade.p16-3": [{
    id: "battlecry-use",
    kind: "counter",
    label: "Grito de Guerra",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.blade.p16-4": [{
    id: "frenzy-use",
    kind: "counter",
    label: "Frenesi",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.blade.p18-4": [{
    id: "reapers-strike-use",
    kind: "counter",
    label: "Golpe do Ceifador",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.splendor.p3-5": [{
    id: "mending-touch-use",
    kind: "counter",
    label: "Toque Reparador",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.splendor.p9-6": [{
    id: "divination-use",
    kind: "counter",
    label: "Adivinhação",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.splendor.p13-6": [{
    id: "restoration-charges",
    kind: "counter",
    label: "Restauração",
    quantity: { kind: "spellcast-trait" },
    reset: "long-rest"
  }],
  "card.core.splendor.p15-7": [{
    id: "splendor-touched-use",
    kind: "counter",
    label: "Tocado pelo Esplendor",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.sage.p9-5": [{
    id: "healing-field-use",
    kind: "counter",
    label: "Campo de Cura",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.sage.p19-5": [{
    id: "plant-dominion-use",
    kind: "counter",
    label: "Domínio das Plantas",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.grace.p2-6": [{
    id: "inspirational-words-uses",
    kind: "counter",
    label: "Palavras Inspiradoras",
    quantity: { kind: "attribute", attributeId: "con" },
    reset: "long-rest"
  }],
  "card.core.grace.p7-1": [{
    id: "invisibility-duration",
    kind: "counter",
    label: "Invisibilidade",
    quantity: { kind: "spellcast-trait" }
  }],
  "card.core.grace.p16-9": [{
    id: "astral-projection-use",
    kind: "counter",
    label: "Projeção Astral",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }],
  "card.core.grace.p18-9": [{
    id: "copycat-use",
    kind: "counter",
    label: "Imitador",
    initialValue: 1,
    max: 1,
    reset: "long-rest"
  }]
};

export function getOfficialCardMarkers(card: CardDefinition): GameMarkerDefinition[] | undefined {
  return markersByCardId[card.id];
}

export const officiallyReviewedCardMarkerIds = Object.keys(markersByCardId);
