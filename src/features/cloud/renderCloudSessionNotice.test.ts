import { describe, expect, it } from "vitest";
import { renderCloudSessionNotice } from "./renderCloudSessionNotice";

describe("renderCloudSessionNotice", () => {
  it("oferece novo login e continuidade offline sem sugerir perda local", () => {
    const html = renderCloudSessionNotice({ session: { authenticated: false }, status: "session-expired", conflicts: [], syncEnabled: true, pendingChanges: 3, sessionNoticeDismissed: false });
    expect(html).toContain("Sua sessão expirou");
    expect(html).toContain("Seus dados continuam salvos neste dispositivo");
    expect(html).toContain("3 alterações aguardam envio");
    expect(html).toContain("data-google-signin");
    expect(html).toContain('data-action="continue-cloud-offline"');
  });

  it("some depois que a pessoa escolhe continuar offline", () => {
    expect(renderCloudSessionNotice({ session: { authenticated: false }, status: "session-expired", conflicts: [], syncEnabled: true, pendingChanges: 0, sessionNoticeDismissed: true })).toBe("");
  });
});
