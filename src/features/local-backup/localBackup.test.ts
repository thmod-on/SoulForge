import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { backupFormat, buildBackupBundle, buildContentBundle, contentFormat, parseBackupBundle, parseContentBundle, previewContentImport, selectContentImport } from "./localBackup";

const localDomain = { id: "domain.local.fog", type: "domain" as const, packId: "local", name: "Névoa", summary: "Domínio local.", color: "#7652a8" };

describe("backup e conteúdo local", () => {
  it("separa backup completo do conteúdo compartilhável", () => {
    const snapshot = {
      characters: [demoCharacter],
      installedPacks: [{ id: "pack.private", name: "Privado", version: "1.0.0", description: "Pack importado." }],
      definitions: [{ ...localDomain }, { ...localDomain, id: "domain.private.fog", packId: "pack.private" }],
      overrides: []
    };

    const backup = buildBackupBundle(snapshot, "0.35.0");
    const content = buildContentBundle(snapshot, "0.35.0");

    expect(backup.format).toBe(backupFormat);
    expect(backup.packs).toHaveLength(1);
    expect(backup.localDefinitions).toEqual([localDomain]);
    expect(content.format).toBe(contentFormat);
    expect(content.definitions).toEqual([localDomain]);
  });

  it("valida backup e preserva a ficha para restauração", () => {
    const serialized = JSON.stringify({ format: backupFormat, exportedAt: "2026-09-29T12:00:00.000Z", appVersion: "0.35.0", characters: [demoCharacter], packs: [], localDefinitions: [localDomain], overrides: [] });
    const result = parseBackupBundle(serialized);

    expect(result.characters).toEqual([demoCharacter]);
    expect(result.localDefinitions).toEqual([localDomain]);
  });

  it("normaliza marcadores e efeitos legados em backup e conteúdo compartilhável", () => {
    const legacyFeature = { id: "feature.local.rest", type: "feature" as const, packId: "local", name: "Descanso", summary: "Teste.", sourceType: "class" as const, sourceId: "class.local", tier: "class" as const, activation: { label: "Ativar", costs: [], endsOn: ["short-rest", "long-rest"], modifiers: [] }, gameMarkers: [{ id: "uses", kind: "counter" as const, label: "Usos", initialValue: 1, reset: "short-rest" as const }] };
    const legacyOverride = { id: "card-marker:card.external", kind: "card-marker" as const, definitionId: "card.external", gameMarkers: [{ id: "uses", kind: "counter" as const, label: "Usos", initialValue: 1, reset: "short-rest" as const }] };
    const content = parseContentBundle(JSON.stringify({ format: contentFormat, exportedAt: "2026-10-12T12:00:00.000Z", appVersion: "0.36.2", definitions: [legacyFeature], overrides: [legacyOverride] }));
    const backup = parseBackupBundle(JSON.stringify({ format: backupFormat, exportedAt: "2026-10-12T12:00:00.000Z", appVersion: "0.36.2", characters: [], packs: [], localDefinitions: [legacyFeature], overrides: [legacyOverride] }));

    expect(content.definitions[0]).toMatchObject({ activation: { endsOn: ["any-rest"] }, gameMarkers: [{ reset: "any-rest" }] });
    expect(content.overrides[0]?.gameMarkers).toMatchObject([{ reset: "any-rest" }]);
    expect(backup.localDefinitions[0]).toMatchObject({ activation: { endsOn: ["any-rest"] } });
  });

  it("rejeita conteúdo compartilhável que tente distribuir Pack externo", () => {
    const serialized = JSON.stringify({ format: contentFormat, exportedAt: "2026-09-29T12:00:00.000Z", appVersion: "0.35.0", definitions: [{ ...localDomain, packId: "pack.private" }], overrides: [] });

    expect(() => parseContentBundle(serialized)).toThrow("Definitions locais");
  });

  it("só substitui conflitos de conteúdo aceitos explicitamente", () => {
    const bundle = parseContentBundle(JSON.stringify({ format: contentFormat, exportedAt: "2026-09-29T12:00:00.000Z", appVersion: "0.35.0", definitions: [{ ...localDomain, name: "Névoa atualizada" }], overrides: [] }));
    const snapshot = { characters: [], installedPacks: [], definitions: [localDomain], overrides: [] };
    const preview = previewContentImport(bundle, snapshot);

    expect(preview.definitionConflictIds).toEqual([localDomain.id]);
    expect(selectContentImport(preview, new Set(), snapshot).definitions).toEqual([]);
    expect(selectContentImport(preview, new Set([`definition:${localDomain.id}`]), snapshot).definitions).toEqual(bundle.definitions);
  });

  it("não permite que conteúdo local reutilize o ID de uma Definition de Pack", () => {
    const bundle = parseContentBundle(JSON.stringify({ format: contentFormat, exportedAt: "2026-09-29T12:00:00.000Z", appVersion: "0.35.0", definitions: [localDomain], overrides: [] }));

    expect(() => previewContentImport(bundle, { characters: [], installedPacks: [], definitions: [{ ...localDomain, packId: "pack.private" }], overrides: [] })).toThrow("Pack instalado");
  });
});
