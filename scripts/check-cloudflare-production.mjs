const baseUrl = new URL(process.env.SOULFORGE_PRODUCTION_URL ?? "https://soulforge.guitojoker-cloudflare.workers.dev/");
const maxAttempts = positiveInteger(process.env.SOULFORGE_SMOKE_ATTEMPTS, 6);
const retryDelayMs = positiveInteger(process.env.SOULFORGE_SMOKE_DELAY_MS, 5_000);

let lastError;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await checkProduction();
    console.log(`Produção validada em ${baseUrl.origin}: assets e API protegidos.`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < maxAttempts) {
      console.warn(`Smoke de produção ainda não passou (${attempt}/${maxAttempts}): ${message(error)}`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

console.error(`Smoke de produção falhou após ${maxAttempts} tentativas: ${message(lastError)}`);
process.exit(1);

async function checkProduction() {
  const root = await get(`?cld005-smoke=${Date.now()}`);
  assertStatus(root, 200, "HTML");
  assertContentType(root, "text/html", "HTML");
  assertSecurityHeaders(root, "HTML");
  const html = await root.text();
  const assetPath = /(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/.exec(html)?.[1];
  if (!assetPath) throw new Error("HTML não referencia um asset versionado.");

  for (const [label, path] of [["asset versionado", assetPath], ["manifesto", "/manifest.webmanifest"], ["Service Worker", "/sw.js"]]) {
    const response = await get(path);
    assertStatus(response, 200, label);
    assertSecurityHeaders(response, label);
  }

  const config = await get("/api/config");
  assertStatus(config, 200, "API config");
  assertContentType(config, "application/json", "API config");
  assertSecurityHeaders(config, "API config");
  if (config.headers.get("Cache-Control") !== "no-store") throw new Error("API config não usa Cache-Control: no-store.");

  const missing = await get("/api/__cld005_smoke_missing__");
  assertStatus(missing, 404, "rota API inexistente");
  assertSecurityHeaders(missing, "rota API inexistente");
  if (missing.headers.get("Cache-Control") !== "no-store") throw new Error("Erro de API não usa Cache-Control: no-store.");

  const mutation = await fetch(new URL("/api/auth/logout", baseUrl), { method: "POST", redirect: "manual" });
  assertStatus(mutation, 403, "mutação sem Origin");
  assertSecurityHeaders(mutation, "mutação sem Origin");
}

function get(path) {
  return fetch(new URL(path, baseUrl), { headers: { Accept: "*/*" }, redirect: "manual" });
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) throw new Error(`${label} respondeu ${response.status}; esperado ${expected}.`);
}

function assertContentType(response, expected, label) {
  if (!response.headers.get("Content-Type")?.toLowerCase().startsWith(expected)) throw new Error(`${label} não usa ${expected}.`);
}

function assertSecurityHeaders(response, label) {
  const expected = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "X-XSS-Protection": "0",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()"
  };
  for (const [name, value] of Object.entries(expected)) {
    if (response.headers.get(name) !== value) throw new Error(`${label} não possui ${name} esperado.`);
  }
  const csp = response.headers.get("Content-Security-Policy") ?? "";
  for (const directive of [
    "script-src 'self' https://accounts.google.com/gsi/client",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
    "connect-src 'self' https://accounts.google.com/gsi/",
    "frame-src https://accounts.google.com/gsi/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ]) {
    if (!csp.includes(directive)) throw new Error(`${label} não possui a diretiva CSP esperada: ${directive}.`);
  }
  if (csp.includes("unsafe-eval") || /(?:^|\s)\*(?:;|\s|$)/.test(csp)) throw new Error(`${label} possui uma CSP permissiva demais.`);
}

function positiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function message(error) {
  return error instanceof Error ? error.message : "erro desconhecido";
}
