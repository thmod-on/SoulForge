import type { Character, Definition, GameMarkerDefinition } from "../../domain/types";
import { deleteCharacter, listCharacters, loadCharacter, saveCharacter } from "../../storage/characterRepository";
import { deleteCardMarkerOverride, deleteCustomDefinition, loadCardMarkerOverrides, loadCustomDefinitions, putCardMarkerOverride, saveCardMarkerOverride, saveCustomDefinition, type CardMarkerOverride } from "../../storage/compendiumRepository";
import { loadLocalDataSnapshot } from "../../storage/localDataRepository";
import { getSyncViewModel, grantPrivateAccess, initializeSyncCoordinator, markForSync, mountGoogleSignIn, queueLocalSnapshot, refreshAccessGrants, removeCloudAccount, resolveConflict, revokePrivateAccess, runSync, signOut } from "../../sync/syncCoordinator";

export { getSyncViewModel, mountGoogleSignIn, queueLocalSnapshot };

export async function saveSyncedCharacter(character: Character): Promise<void> {
  await saveCharacter(character);
  await markForSync("character", character.id, character);
}

export async function deleteSyncedCharacter(id: string): Promise<void> {
  await deleteCharacter(id);
  await markForSync("character", id, undefined, true);
}

export async function saveSyncedDefinition(definition: Definition): Promise<void> {
  await saveCustomDefinition(definition);
  if (definition.packId === "local") await markForSync("definition", definition.id, definition);
}

export async function deleteSyncedDefinition(id: string): Promise<void> {
  await deleteCustomDefinition(id);
  await markForSync("definition", id, undefined, true);
}

export async function saveSyncedCardMarkerOverride(definitionId: string, gameMarkers: GameMarkerDefinition[]): Promise<void> {
  await saveCardMarkerOverride(definitionId, gameMarkers);
  await markForSync("override", `card-marker:${definitionId}`, { id: `card-marker:${definitionId}`, kind: "card-marker", definitionId, gameMarkers } satisfies CardMarkerOverride);
}

export function handleCloudAction(target: HTMLElement): boolean {
  if (target.closest('[data-action="sync-now"]')) void runSync();
  else if (target.closest('[data-action="cloud-sign-out"]')) void signOut();
  else if (target.closest('[data-action="delete-cloud-account"]')) {
    if (window.confirm("Excluir permanentemente todas as fichas, criações e imagens da nuvem? Os dados deste dispositivo serão preservados.")) void removeCloudAccount();
  } else if (target.closest('[data-action="refresh-private-access"]')) {
    void refreshAccessGrants();
  } else if (target.closest('[data-action="grant-private-access"]')) {
    const input = document.querySelector<HTMLInputElement>("[data-private-access-email]");
    if (!input) return true;
    void grantPrivateAccess(input.value).then(() => { input.value = ""; }).catch(() => undefined);
  } else {
    const revoke = target.closest<HTMLElement>("[data-action='revoke-private-access']");
    if (revoke?.dataset.email) {
      if (window.confirm(`Revogar o acesso de ${revoke.dataset.email}? A pessoa precisará de uma nova autorização para entrar novamente.`)) void revokePrivateAccess(revoke.dataset.email).catch(() => undefined);
      return true;
    }
    const button = target.closest<HTMLElement>("[data-sync-conflict]");
    const key = button?.dataset.syncConflict;
    const choice = button?.dataset.syncChoice;
    if (!key || (choice !== "local" && choice !== "remote" && choice !== "copy")) return false;
    void resolveConflict(key, choice);
  }
  return true;
}

export async function initializeCloudIntegration(options: { afterRemoteChange(): Promise<void>; afterAuthenticated?(): Promise<void>; stateChanged(): void }): Promise<void> {
  await initializeSyncCoordinator({
    snapshot: async () => {
      const snapshot = await loadLocalDataSnapshot();
      return { characters: snapshot.characters, definitions: snapshot.definitions.filter((definition) => definition.packId === "local"), overrides: snapshot.overrides };
    },
    saveCharacter,
    deleteCharacter,
    saveDefinition: saveCustomDefinition,
    deleteDefinition: deleteCustomDefinition,
    saveOverride: putCardMarkerOverride,
    deleteOverride: deleteCardMarkerOverride,
    afterRemoteChange: options.afterRemoteChange,
    afterAuthenticated: options.afterAuthenticated,
    stateChanged: options.stateChanged
  });
}

export async function refreshCloudAppliedState(activeCharacterId: string | undefined, refreshCatalog: () => Promise<void>): Promise<{ characters: Character[]; character?: Character }> {
  await refreshCatalog();
  return { characters: await listCharacters(), character: activeCharacterId ? await loadCharacter(activeCharacterId) : undefined };
}

export { deleteCharacter as deleteLocalCharacter, saveCharacter as saveLocalCharacter };
export { deleteCustomDefinition as deleteLocalDefinition, loadCardMarkerOverrides, loadCustomDefinitions, putCardMarkerOverride, saveCustomDefinition as saveLocalDefinition };
