import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const configPath = resolve("dist/soulforge/wrangler.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const errors = [];

if (config.assets?.run_worker_first !== true) errors.push("assets.run_worker_first deve ser true no artefato publicado.");
if (config.assets?.binding !== "ASSETS") errors.push("O binding ASSETS não está presente no artefato publicado.");
if (config.assets?.directory !== "../client") errors.push("O diretório de Static Assets compilado não aponta para ../client.");
if (config.main !== "index.js") errors.push("O entrypoint compilado do Worker não é index.js.");
if (JSON.stringify(config.triggers?.crons) !== JSON.stringify(["17 3 * * *"])) errors.push("O Cron Trigger diário de manutenção não está presente no artefato publicado.");
if (config.observability?.enabled !== false) errors.push("A ingestão de Observability deve permanecer desativada no artefato publicado.");

if (errors.length) {
  console.error("Configuração Cloudflare compilada inválida:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("Configuração Cloudflare compilada validada: Worker antecede todos os Static Assets, inclui a manutenção diária e mantém Observability desativada.");
