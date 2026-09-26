import type { Character, ResourceTrack } from "./types";

const legacyCustomResourceId = /^resource\.[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CustomResourceDraft = Pick<ResourceTrack, "label" | "value" | "max" | "tone">;

/** Reconhece recursos atuais e os IDs gerados pelas versões anteriores. */
export function isCustomResource(resource: ResourceTrack): boolean {
  return resource.source === "custom" || legacyCustomResourceId.test(resource.id);
}

export function createCustomResource(draft: CustomResourceDraft, id = crypto.randomUUID()): ResourceTrack {
  return { id: `resource.${id}`, ...draft, source: "custom" };
}

export function removeCustomResource(character: Character, resourceId: string): Character | Error {
  const resource = character.resources.find((entry) => entry.id === resourceId);
  if (!resource || !isCustomResource(resource)) return new Error("Somente recursos customizados podem ser removidos.");
  return { ...character, resources: character.resources.filter((entry) => entry.id !== resourceId) };
}

/** Torna explícita a origem dos recursos criados antes desse metadado existir. */
export function migrateLegacyCustomResources(character: Character): Character {
  let changed = false;
  const resources = character.resources.map((resource) => {
    if (resource.source || !legacyCustomResourceId.test(resource.id)) return resource;
    changed = true;
    return { ...resource, source: "custom" as const };
  });
  return changed ? { ...character, resources } : character;
}
