import type { PackManifest } from "../../domain/types";

const standardNames: Record<string, string> = {
  "daggerheart-core-ancestries-local": "Core - Ancestralidades",
  "daggerheart-hope-and-fear-ancestries-local": "Hope & Fear - Ancestralidades",
  "daggerheart-core-domains-local": "Core - Domínios",
  "daggerheart-hope-and-fear-domains-local": "Hope & Fear - Domínios"
};

const standardDescriptions: Record<string, string> = {
  "daggerheart-core-ancestries-local": "Ancestralidades do Core disponíveis neste dispositivo.",
  "daggerheart-hope-and-fear-ancestries-local": "Ancestralidades de Hope & Fear disponíveis neste dispositivo.",
  "daggerheart-core-domains-local": "Domínios do Core disponíveis neste dispositivo.",
  "daggerheart-hope-and-fear-domains-local": "Domínios de Hope & Fear disponíveis neste dispositivo."
};

const origins: Record<string, string> = {
  "daggerheart-core-ancestries-local": "Core",
  "daggerheart-hope-and-fear-ancestries-local": "Hope & Fear",
  "daggerheart-core-domains-local": "Core",
  "daggerheart-hope-and-fear-domains-local": "Hope & Fear"
};

export function getPackDisplayName(packId: string, packs: PackManifest[]): string {
  return standardNames[packId] ?? packs.find((pack) => pack.id === packId)?.name ?? "Pack indisponível";
}

export function getPackOriginName(packId: string, packs: PackManifest[]): string {
  return origins[packId] ?? getPackDisplayName(packId, packs);
}

export function getPackDisplayDescription(pack: PackManifest): string {
  return standardDescriptions[pack.id] ?? pack.description;
}
