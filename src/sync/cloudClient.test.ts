import { describe, expect, it } from "vitest";
import { CloudApiError, isCloudAuthenticationError, readCloudApiError } from "./cloudClient";

describe("CloudApiError", () => {
  it("preserva status e código da resposta para distinguir autenticação", async () => {
    const error = await readCloudApiError(Response.json({ error: "Entre novamente.", code: "session_expired" }, { status: 401 }), "Falha");
    expect(error).toBeInstanceOf(CloudApiError);
    expect(error).toMatchObject({ message: "Entre novamente.", status: 401, code: "session_expired" });
    expect(isCloudAuthenticationError(error)).toBe(true);
    expect(isCloudAuthenticationError(new CloudApiError("Proibido", 403))).toBe(false);
  });
});
