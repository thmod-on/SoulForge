import { describe, expect, it } from "vitest";
import { demoCharacter } from "./demoCharacter";
import { createCustomResource, isCustomResource, removeCustomResource } from "./customResources";

describe("recursos customizados", () => {
  it("cria um recurso com origem explícita", () => {
    const resource = createCustomResource({ label: "Ímpeto", value: 1, max: 3, tone: "focus" }, "550e8400-e29b-41d4-a716-446655440000");
    expect(resource).toEqual({ id: "resource.550e8400-e29b-41d4-a716-446655440000", label: "Ímpeto", value: 1, max: 3, tone: "focus", source: "custom" });
    expect(isCustomResource(resource)).toBe(true);
  });

  it("remove somente recursos customizados", () => {
    const custom = createCustomResource({ label: "Ímpeto", value: 1, max: 3, tone: "focus" }, "550e8400-e29b-41d4-a716-446655440000");
    const character = { ...demoCharacter, resources: [...demoCharacter.resources, custom] };
    const removed = removeCustomResource(character, custom.id);
    const protectedResource = removeCustomResource(character, "hp");

    expect(removed).not.toBeInstanceOf(Error);
    expect(removed instanceof Error ? [] : removed.resources).not.toContainEqual(custom);
    expect(protectedResource).toEqual(new Error("Somente recursos customizados podem ser removidos."));
  });
});
