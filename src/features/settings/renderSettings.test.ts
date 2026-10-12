import { describe, expect, it } from "vitest";
import { renderSettings } from "./renderSettings";

describe("renderSettings", () => {
  it("permite administrar dados locais sem uma ficha ativa", () => {
    const html = renderSettings({
      appVersion: "0.37.0",
      state: {
        installedPacks: [],
        openSettingsSections: { general: true, cloud: false, localData: true, loadRules: true, appearance: false, progression: false },
        packImportOpen: false,
        removeAllInstalledPacksOpen: false
      },
      hasActiveCharacter: false,
      escapeHtml: (value) => value,
      getPackDisplayName: (packId) => packId,
      getPackDisplayDescription: () => "",
      sync: { session: { authenticated: false }, status: "local-only", conflicts: [], syncEnabled: false }
    });

    expect(html).toContain('data-action="open-pack-import"');
    expect(html).toContain('data-action="open-character-import"');
    expect(html).toContain("Definida ao criar uma ficha");
  });
});
