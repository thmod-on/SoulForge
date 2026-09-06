import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { isCoreResource, renderCoreResources } from "./renderCoreResources";
import { renderResources, type PlayerShellDependencies } from "./renderPlayerShell";

describe("compact core resources", () => {
  it("renders exactly one icon per resource even for large maxima", () => {
    const character = structuredClone(demoCharacter);
    character.resources.forEach((resource) => { resource.max = 99; resource.value = 33; });
    const html = renderCoreResources(character);
    expect(html.match(/<svg /g)).toHaveLength(4);
    expect(html.match(/data-resource-adjust=/g)).toHaveLength(8);
    expect(html).toContain("33 / 99");
    expect(html).not.toContain("Essencia Sombria");
  });

  it("fills stress proportionally and disables controls at the limits", () => {
    const character = structuredClone(demoCharacter);
    const stress = character.resources.find((resource) => resource.id === "stress")!;
    stress.value = 3;
    stress.max = 6;
    expect(renderCoreResources(character)).toContain('offset="50%" stop-color="#f4cc57"');
    stress.value = 6;
    expect(renderCoreResources(character)).toContain('aria-label="Aumentar Estresse" disabled');
    stress.value = 0;
    stress.max = 0;
    const html = renderCoreResources(character);
    expect(html).toContain('aria-label="Reduzir Estresse" disabled');
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });

  it("leaves only special resources in the main resource band", () => {
    const dependencies = {
      escapeHtml: (value: string) => value,
      progressPercent: (value: number, max: number) => value / max * 100
    } as PlayerShellDependencies;
    const html = renderResources(demoCharacter, dependencies);
    expect(html).toContain("Recursos especiais");
    expect(html).toContain("Essencia Sombria");
    for (const id of ["hp", "hope", "stress", "armor-slots"]) {
      expect(isCoreResource(id)).toBe(true);
      expect(html).not.toContain(`data-resource-id="${id}"`);
    }
    expect(isCoreResource("custom")).toBe(false);
  });
});
