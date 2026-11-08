import { beforeEach, describe, expect, it, vi } from "vitest";

const coordinator = vi.hoisted(() => ({
  deleteCloudAccount: vi.fn(),
  dismissSessionExpiredNotice: vi.fn(),
  getSyncViewModel: vi.fn(),
  grantPrivateAccess: vi.fn(),
  initializeSyncCoordinator: vi.fn(),
  markForSync: vi.fn(),
  mountGoogleSignIn: vi.fn(),
  queueLocalSnapshot: vi.fn(),
  refreshAccessGrants: vi.fn(),
  removeCloudAccount: vi.fn(),
  resolveConflict: vi.fn(),
  revokePrivateAccess: vi.fn(),
  runSync: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("../../sync/syncCoordinator", () => coordinator);

import { handleCloudAction } from "./cloudIntegration";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("cloud account actions", () => {
  it("does not disconnect when the preservation explanation is cancelled", () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("window", { confirm });

    expect(handleCloudAction(targetFor("cloud-sign-out"))).toBe(true);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("alterações locais continuarão neste dispositivo"));
    expect(coordinator.signOut).not.toHaveBeenCalled();
  });

  it("disconnects only after confirmation and can dismiss the global notice", () => {
    vi.stubGlobal("window", { confirm: vi.fn(() => true) });
    handleCloudAction(targetFor("cloud-sign-out"));
    handleCloudAction(targetFor("continue-cloud-offline"));
    expect(coordinator.signOut).toHaveBeenCalledOnce();
    expect(coordinator.dismissSessionExpiredNotice).toHaveBeenCalledOnce();
  });
});

function targetFor(action: string): HTMLElement {
  return { closest: (selector: string) => selector.includes(`data-action=\"${action}\"`) ? {} : null } as unknown as HTMLElement;
}
