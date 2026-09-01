import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagePath = resolve(root, "package.json");
const changelogPath = resolve(root, "CHANGELOG.md");
const currentPackage = JSON.parse(readFileSync(packagePath, "utf8"));
const currentVersion = currentPackage.version;

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function changedFiles(args) {
  return git(args).split(/\r?\n/).filter(Boolean);
}

const workingChanges = changedFiles(["diff", "--name-only", "HEAD"]);
const committedChanges = changedFiles(["diff", "--name-only", "HEAD^", "HEAD"]);
const changed = new Set([...workingChanges, ...committedChanges]);
const hasProductChange = [...changed].some((file) => file.startsWith("src/") || file.startsWith("packs/"));

if (!hasProductChange) {
  console.log("Release validada: nenhuma mudança funcional pendente.");
  process.exit(0);
}

// Antes do commit, a versão em disco deve diferir de HEAD. Depois do commit,
// ela deve diferir do pai do commit: assim a mesma checagem protege ambos os
// momentos previstos no checklist de release.
const versionBase = workingChanges.some((file) => file.startsWith("src/") || file.startsWith("packs/")) ? "HEAD" : "HEAD^";
const previousPackageText = git(["show", `${versionBase}:package.json`]);
const previousVersion = previousPackageText ? JSON.parse(previousPackageText).version : undefined;
const changelog = readFileSync(changelogPath, "utf8");
const hasChangelogEntry = new RegExp(`^## \\[` + currentVersion.replaceAll(".", "\\.") + "\\]", "m").test(changelog);
const errors = [];

if (!previousVersion || previousVersion === currentVersion) errors.push("Atualize a versão em package.json antes de validar uma mudança funcional.");
if (!hasChangelogEntry) errors.push(`Inclua a seção ## [${currentVersion}] no CHANGELOG.md.`);

if (errors.length) {
  console.error("Verificação de release falhou:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Release validada: versão ${currentVersion} e changelog presentes.`);
