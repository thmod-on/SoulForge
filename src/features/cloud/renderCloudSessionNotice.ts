import type { SyncViewModel } from "../../sync/syncCoordinator";

export function renderCloudSessionNotice(sync: SyncViewModel): string {
  if (!sync.syncEnabled || sync.status !== "session-expired" || sync.sessionNoticeDismissed) return "";
  const pending = sync.pendingChanges
    ? `<strong>${sync.pendingChanges} ${sync.pendingChanges === 1 ? "alteração aguarda" : "alterações aguardam"} envio.</strong>`
    : "";
  return `<aside class="cloud-session-notice" data-cloud-session-notice-root role="status" aria-live="polite"><div class="cloud-session-notice-copy"><span aria-hidden="true">☁</span><div><strong>Sua sessão expirou</strong><p>Seus dados continuam salvos neste dispositivo. ${pending}</p></div></div><div class="cloud-session-notice-actions"><div class="cloud-google-button" data-google-signin aria-label="Entrar novamente com Google"></div><button class="sf-action sf-action--secondary sf-action--compact" type="button" data-action="continue-cloud-offline">Continuar offline</button></div></aside>`;
}

export function mountCloudSignInIfPresent(root: HTMLElement, mountGoogleSignIn: () => Promise<void>): void {
  if (root.querySelector("[data-google-signin]")) void mountGoogleSignIn();
}

export function updateCloudSessionNotice(root: HTMLElement, sync: SyncViewModel, mountGoogleSignIn: () => Promise<void>): void {
  const markup = renderCloudSessionNotice(sync);
  const current = root.querySelector<HTMLElement>("[data-cloud-session-notice-root]");
  if (current) {
    if (markup) current.outerHTML = markup;
    else current.remove();
  } else if (markup) root.insertAdjacentHTML("afterbegin", markup);
  mountCloudSignInIfPresent(root, mountGoogleSignIn);
}
