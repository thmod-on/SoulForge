import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const sourceDirectory = resolve(process.env.SOULFORGE_PACK_SOURCE ?? "local-packs/imports");
const releasePath = resolve(process.env.SOULFORGE_PACK_RELEASE ?? "local-packs/library-release.json");
const bucket = process.env.SOULFORGE_PACK_BUCKET ?? "soulforge-pack-library";
const release = JSON.parse(await readFile(releasePath, "utf8"));

if (release.assetDeclaration !== "original-or-licensed" || !release.changes || typeof release.changes !== "object") {
  throw new Error("O release precisa declarar assetDeclaration: 'original-or-licensed' e uma nota por Pack.");
}

const files = (await readdir(sourceDirectory)).filter((name) => name.endsWith(".soulforge-pack.json")).sort();
if (files.length !== 11) throw new Error(`A biblioteca privada exige exatamente 11 Packs; foram encontrados ${files.length}.`);
const bundles = await Promise.all(files.map(async (name) => {
  const path = join(sourceDirectory, name);
  const bytes = await readFile(path);
  const bundle = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  const manifest = bundle?.manifest;
  const hasSourceMetadata = Boolean(manifest?.source) || (Array.isArray(manifest?.sources) ? manifest.sources.length > 0 : Boolean(manifest?.sources));
  if (bundle?.format !== "soulforge-pack-v1" || !manifest?.id || !manifest?.name || !manifest?.version || !hasSourceMetadata || manifest.distribution !== "private-local-only" || !Array.isArray(bundle.definitions) || !bundle.definitions.length) throw new Error(`${name} não atende ao contrato da biblioteca privada.`);
  const changes = release.changes[manifest.id];
  if (typeof changes !== "string" || !changes.trim()) throw new Error(`Falta uma nota de atualização para ${manifest.id}.`);
  return { path, bytes, entry: { id: manifest.id, name: manifest.name, version: manifest.version, checksum: createHash("sha256").update(bytes).digest("hex"), changes, definitionCount: bundle.definitions.length } };
}));

const ids = new Set(bundles.map(({ entry }) => entry.id));
if (ids.size !== bundles.length) throw new Error("Há IDs de Pack repetidos na publicação.");
const catalog = { format: "soulforge-private-library-v1", publishedAt: new Date().toISOString(), packs: bundles.map(({ entry }) => entry) };
console.log(`Biblioteca preparada: ${catalog.packs.length} Packs para ${bucket}.`);
if (dryRun) {
  console.log(JSON.stringify(catalog, null, 2));
  process.exit(0);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "soulforge-pack-library-"));
try {
  const catalogPath = join(temporaryDirectory, "catalog.json");
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  for (const { path, entry } of bundles) await run("pnpm", ["exec", "wrangler", "r2", "object", "put", `${bucket}/packs/${entry.id}/${entry.version}.soulforge-pack.json`, "--file", path, "--content-type", "application/json", "--remote"]);
  await run("pnpm", ["exec", "wrangler", "r2", "object", "put", `${bucket}/catalog.json`, "--file", catalogPath, "--content-type", "application/json", "--remote"]);
  console.log("Biblioteca privada publicada. Os arquivos de origem permanecem locais e ignorados pelo Git.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

function run(command, commandArgs) {
  return new Promise((resolvePromise, reject) => {
    const quotedArgs = commandArgs.map((value) => `"${String(value).replaceAll('"', '\\"')}"`);
    const child = process.platform === "win32"
      ? spawn(`${command} ${quotedArgs.join(" ")}`, { stdio: "inherit", shell: true })
      : spawn(command, commandArgs, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} encerrou com código ${code}.`)));
  });
}
