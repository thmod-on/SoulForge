import { describe, expect, it } from "vitest";
import { renderSettings } from "./renderSettings";

describe("renderSettings", () => {
  it("permite administrar dados locais sem uma ficha ativa", () => {
    const html = renderSettings({
      appVersion: "0.37.0",
      state: {
        installedPacks: [],
        packImportOpen: false,
        removeAllInstalledPacksOpen: false,
        privateLibrary: { loading: false, bootstrapComplete: false }
      },
      escapeHtml: (value) => value,
      getPackDisplayName: (packId) => packId,
      getPackDisplayDescription: () => "",
      sync: { session: { authenticated: false }, status: "local-only", conflicts: [], syncEnabled: false }
    });

    expect(html).toContain('data-action="open-pack-import"');
    expect(html).toContain('class="settings-app-status"');
    expect(html).toContain("Versão");
    expect(html).toContain("Offline/PWA");
    expect(html).toContain('class="settings-pack-list-shell"');
    expect(html).toContain('class="installed-pack-list sf-scroll-region"');
    expect(html).toContain('class="settings-pack-scroll-cue"');
    expect(html).toContain("Role para ver mais");
    expect(html).toContain("Voltar ao topo");
    expect(html).toContain("0 Packs instalados");
    expect(html).toContain("Biblioteca privada");
    expect(html).toContain("conta autorizada");
    expect(html).toContain('data-action="create-full-backup"');
    expect(html).not.toContain('data-action="open-character-import"');
    expect(html).not.toContain('data-action="export-character"');
    expect(html).not.toContain("Aparência");
    expect(html).not.toContain("Regras de Carga");
    expect(html).not.toContain("Progressão");
  });
});
