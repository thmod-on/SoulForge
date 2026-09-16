import { describe, expect, it, vi } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { addCharacterScar, handleCharacterScarEscape, removeCharacterScar, renderCharacterScarDialogs, type CharacterScarDependencies } from "./characterScars";

const scar = { id: "scar.1", narrative: "O som de correntes desperta o medo da cripta.", createdAt: "2026-09-15T12:00:00.000Z" };

describe("character scars", () => {
  it("persists narrative scars without directly mutating the Hope resource", () => {
    const original = structuredClone(demoCharacter);
    const added = addCharacterScar(original, scar);
    const removed = removeCharacterScar(added, scar.id);
    expect(added.scars).toEqual([scar]);
    expect(added.resources).toEqual(original.resources);
    expect(removed.scars).toEqual([]);
  });

  it("renders the current Hope equation, narrative and last-slot warning", () => {
    const character = { ...structuredClone(demoCharacter), scars: [scar] };
    const hope = character.resources.find((resource) => resource.id === "hope")!;
    hope.max = 1;
    hope.value = 1;
    const html = renderCharacterScarDialogs(dependencies(character));
    expect(html).toContain('class="container-modal character-scar-modal sf-scroll-region"');
    expect(html).toContain("Limite sem Cicatrizes");
    expect(html).toContain("Último espaço de Esperança");
    expect(html).toContain(scar.narrative);
    expect(html).toContain('data-character-scar-action="prepare-remove"');
  });

  it("asks for confirmation before restoring Hope and closes one layer at a time with Escape", () => {
    const deps = dependencies({ ...structuredClone(demoCharacter), scars: [scar] });
    deps.state.deletingCharacterScarId = scar.id;
    const html = renderCharacterScarDialogs(deps);
    expect(html).toContain("Remover esta Cicatriz?");
    expect(html).toContain('class="container-modal danger-modal character-scar-confirm"');
    expect(html).toContain('class="danger-summary"');
    expect(handleCharacterScarEscape({ key: "Escape" } as KeyboardEvent, deps)).toBe(true);
    expect(deps.state.deletingCharacterScarId).toBeUndefined();
    expect(deps.state.characterScarsOpen).toBe(true);
    handleCharacterScarEscape({ key: "Escape" } as KeyboardEvent, deps);
    expect(deps.state.characterScarsOpen).toBe(false);
  });
});

function dependencies(character: typeof demoCharacter & { scars?: typeof scar[] }): CharacterScarDependencies {
  return { state: { character, characterScarsOpen: true }, escapeHtml: (value) => value, saveCharacter: vi.fn(), render: vi.fn() };
}
