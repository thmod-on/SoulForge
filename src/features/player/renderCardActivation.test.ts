import { describe, expect, it } from "vitest";
import type { CardDefinition } from "../../domain/types";
import { renderCardActivationModal } from "./renderCardActivation";

const escapeHtml = (value: string) => value;
const card = (id: string, name: string, recallCost = 1): CardDefinition => ({
  id,
  type: "card",
  packId: "core",
  name,
  summary: "Resumo",
  domainId: "domain.valor",
  tier: 1,
  cardType: "acao",
  recallCost,
  effect: "Efeito"
});
const getDomainInfo = () => ({ name: "Valor", color: "#c39bff" });

describe("renderCardActivationModal", () => {
  it("mostra a carta de entrada, as cinco substituições e uma confirmação separada", () => {
    const html = renderCardActivationModal({
      incomingCard: card("incoming", "Palavras Inspiradoras"),
      activeCards: Array.from({ length: 5 }, (_, index) => card(`active-${index}`, `Carta ${index + 1}`)),
      stress: { id: "stress", label: "Stress", value: 0, max: 9, tone: "stress" },
      escapeHtml,
      getDomainInfo
    });

    expect(html).toContain("Mover para o Loadout");
    expect(html).toContain("Palavras Inspiradoras");
    expect((html.match(/data-recall-swap-card/g) ?? [])).toHaveLength(5);
    expect((html.match(/data-card-activation-mode/g) ?? [])).toHaveLength(2);
    expect(html).toContain("0/9 marcados · 9 restantes");
    expect(html).toContain('data-action="confirm-stored-card-activation" disabled');
    expect(html).not.toContain("<select");
  });

  it("mostra espaço livre e desabilita a troca imediata sem capacidade de Stress", () => {
    const html = renderCardActivationModal({
      incomingCard: card("incoming", "Palavras Inspiradoras", 2),
      activeCards: [card("active", "Carta ativa")],
      stress: { id: "stress", label: "Stress", value: 8, max: 9, tone: "stress" },
      escapeHtml,
      getDomainInfo
    });

    expect(html).toContain("Há espaço no Loadout");
    expect(html).toContain("card-activation-option--immediate is-disabled");
    expect(html).toContain('value="stress" data-card-activation-mode disabled');
  });
});
