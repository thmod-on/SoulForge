import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { createCustomResource } from "../../domain/customResources";
import { renderResources, type PlayerShellDependencies } from "./renderPlayerShell";

const dependencies = {
  escapeHtml: (value: string) => value,
  progressPercent: (value: number, max: number) => value / max * 100
} as PlayerShellDependencies;

describe("recursos especiais", () => {
  it("oferece remoção somente para recursos customizados", () => {
    const custom = createCustomResource({ label: "Ímpeto", value: 1, max: 3, tone: "focus" }, "550e8400-e29b-41d4-a716-446655440000");
    const character = { ...demoCharacter, resources: [...demoCharacter.resources, custom] };
    const html = renderResources(character, dependencies);

    expect(html).toContain('aria-label="Ações de Ímpeto"');
    expect(html).toContain(`data-resource-id="${custom.id}"`);
    expect(html).not.toContain('aria-label="Ações de Essencia Sombria"');
    expect(html).not.toContain('data-resource-id="hp" aria-label="Remover');
  });
});
