export type SyncResourceType = "character" | "definition" | "override";
export type SyncStatus = "local-only" | "pending" | "syncing" | "synced" | "offline" | "error" | "conflict";

export type CloudMediaReference = {
  $soulforgeMedia: string;
  mimeType: string;
  size: number;
  checksum: string;
};

export type SyncEnvelope<T = unknown> = {
  type: SyncResourceType;
  id: string;
  revision: number;
  updatedAt: string;
  deletedAt?: string;
  payload?: T;
};

export type SyncPushChange = {
  mutationId: string;
  type: SyncResourceType;
  id: string;
  expectedRevision: number;
  deleted: boolean;
  payload?: unknown;
};

export type SyncConflict = {
  key: string;
  local: SyncPushChange;
  remote: SyncEnvelope;
};

export type SyncPushResponse = {
  applied: SyncEnvelope[];
  conflicts: SyncConflict[];
};

export type SyncPullResponse = {
  cursor: number;
  changes: SyncEnvelope[];
};

export type CloudUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export type CloudSession = {
  authenticated: boolean;
  user?: CloudUser;
};

export function syncKey(type: SyncResourceType, id: string): string {
  return `${type}:${id}`;
}
