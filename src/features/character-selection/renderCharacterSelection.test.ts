import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { renderCharacterSelection } from "./renderCharacterSelection";

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

describe("renderCharacterSelection", () => {
  it("apresenta retrato e apenas os metadados essenciais no carrossel", () => {
    const character = {
      ...demoCharacter,
      id: "character.lyra",
      identity: {
        ...demoCharacter.identity,
        name: "Lyra Greenwhisper",
        className: "Exploradora",
        ancestry: "Elfa",
        level: 2,
        portraitImage: "data:image/webp;base64,retrato"
      }
    };

    const html = renderCharacterSelection([character], escapeHtml);

    expect(html).toContain('class="character-select-carousel"');
    expect(html).toContain('data-character-carousel');
    expect(html).toContain('src="data:image/webp;base64,retrato"');
    expect(html).toContain("Lyra Greenwhisper");
    expect(html).toContain("Exploradora · Elfa");
    expect(html).toContain("Nível 2");
    expect(html).toContain('class="character-card-menu"');
    expect(html).toContain('data-action="export-character" data-character-id="character.lyra"');
    expect(html).toContain("Exportar personagem");
    expect(html).toContain("Excluir personagem");
    expect(html).not.toContain("Último acesso");
    expect(html).not.toContain("Experiência");
  });

  it("usa placeholder e preserva as ações acessíveis quando não há retrato", () => {
    const html = renderCharacterSelection([demoCharacter], escapeHtml);

    expect(html).toContain('class="character-select-placeholder"');
    expect(html).toContain('aria-label="Compendium"');
    expect(html).toContain('aria-label="Configurações"');
    expect(html).toContain('class="sf-navigation-icon"');
    expect(html).toContain('data-action="request-delete-character"');
  });

  it("mantém o estado vazio sem controles de carrossel", () => {
    const html = renderCharacterSelection([], escapeHtml);

    expect(html).toContain("Nenhuma ficha encontrada");
    expect(html).not.toContain('data-character-carousel');
    expect(html).not.toContain('data-action="scroll-character-carousel"');
  });
});
