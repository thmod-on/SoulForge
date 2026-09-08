import { describe, expect, it } from "vitest";
import type { SettingsViewState } from "../../app/types";
import { createCatalog } from "../../domain/catalog";
import type { PackBundle } from "../../domain/types";
import { readPackImportFiles, renderPackManagementDialogs } from "./packManagement";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function createState(): SettingsViewState {
  return { installedPacks: [], openSettingsSections: { general: false, localData: false, loadRules: false, appearance: false, progression: false }, packImportOpen: false };
}

function createBundle(id: string, name: string): PackBundle {
  return {
    format: "soulforge-pack-v1",
    manifest: { id, name, version: "1.0.0", description: `Conteudo de ${name}` },
    definitions: [{ id: `domain.${id}`, type: "domain", packId: id, name: `Dominio de ${name}`, summary: "Resumo", color: "#fff" }]
  };
}

function createFile(name: string, bundle: PackBundle): File {
  return { name, text: async () => JSON.stringify(bundle) } as File;
}

describe("gestão visual de packs", () => {
  it("não renderiza os diálogos quando o fluxo está fechado", () => {
    expect(renderPackManagementDialogs({ state: createState(), escapeHtml })).toBe("");
  });

  it("não mostra uma faixa de erro vazia ao abrir a importação", () => {
    const state = createState();
    state.packImportOpen = true;

    const html = renderPackManagementDialogs({ state, escapeHtml });

    expect(html).toContain("Importar Pack local");
    expect(html).toContain("multiple");
    expect(html).toContain("Selecionar Packs");
    expect(html).not.toContain("data-pack-import-error");
  });

  it("prepara e apresenta vários Packs no mesmo lote", async () => {
    const state = createState();
    state.packImportOpen = true;

    await readPackImportFiles(
      [createFile("primeiro.soulforge-pack.json", createBundle("pack.first", "Primeiro")), createFile("segundo.soulforge-pack.json", createBundle("pack.second", "Segundo"))],
      { state, getCatalog: () => createCatalog([], []) }
    );

    expect(state.pendingPackBundles).toHaveLength(2);
    const html = renderPackManagementDialogs({ state, escapeHtml });
    expect(html).toContain("2 Packs prontos");
    expect(html).toContain("Primeiro");
    expect(html).toContain("Segundo");
    expect(html).toContain("Instalar 2 Packs");
  });

  it("bloqueia o lote quando o mesmo Pack é selecionado duas vezes", async () => {
    const state = createState();
    const bundle = createBundle("pack.duplicate", "Duplicado");

    await readPackImportFiles(
      [createFile("a.soulforge-pack.json", bundle), createFile("b.soulforge-pack.json", bundle)],
      { state, getCatalog: () => createCatalog([], []) }
    );

    expect(state.pendingPackBundles).toBeUndefined();
    expect(state.packImportError).toContain("selecionado mais de uma vez");
  });

  it("escapa o nome do pack no diálogo de remoção", () => {
    const state = createState();
    state.installedPacks = [{ id: "pack.test", name: "Pack <Teste>", version: "1.0.0", description: "" }];
    state.deletingInstalledPackId = "pack.test";

    expect(renderPackManagementDialogs({ state, escapeHtml })).toContain("Pack &lt;Teste&gt;");
  });
});
