import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(root, "src");
const mainPath = path.join(sourceDirectory, "main.ts");
const baseline = JSON.parse(fs.readFileSync(path.join(scriptDirectory, "architecture-baseline.json"), "utf8"));
const violations = [];

const mainSource = fs.readFileSync(mainPath, "utf8");
// O compilador nativo do TypeScript 7 não expõe a antiga Compiler API no
// pacote principal. Este verificador precisa somente de guardas estruturais
// simples, portanto usa análise lexical independente da implementação do TS.
const renderFunctions = [...mainSource.matchAll(/\bfunction\s+(render\w*)\s*\(/g)].map((match) => match[1]);
const templateLiterals = countTemplateLiterals(mainSource);

function countTemplateLiterals(source) {
  let count = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (inLineComment) {
      if (character === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (character === "*" && next === "/") { inBlockComment = false; index += 1; }
      continue;
    }
    if (!quote && character === "/" && next === "/") { inLineComment = true; index += 1; continue; }
    if (!quote && character === "/" && next === "*") { inBlockComment = true; index += 1; continue; }
    if (quote) {
      if (character === "\\") { index += 1; continue; }
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') { quote = character; continue; }
    if (character === "`") {
      count += 1;
      quote = "`";
    }
  }
  return count;
}

const lineCount = mainSource.split(/\r?\n/).length - 1;
if (lineCount > baseline.main.maxLines) violations.push(`src/main.ts cresceu para ${lineCount} linhas (limite legado: ${baseline.main.maxLines}).`);
if (templateLiterals > baseline.main.maxTemplateLiterals) violations.push(`src/main.ts declara ${templateLiterals} templates HTML (limite legado: ${baseline.main.maxTemplateLiterals}). Extraia a renderização para src/features/.`);

const allowedRenderFunctions = new Set(baseline.main.allowedRenderFunctions);
const unexpectedRenderFunctions = renderFunctions.filter((name) => !allowedRenderFunctions.has(name));
if (unexpectedRenderFunctions.length) violations.push(`Novas funções de renderização em src/main.ts: ${unexpectedRenderFunctions.join(", ")}. Crie-as no módulo da feature responsável.`);

function listTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(fullPath);
    return entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

for (const file of listTypeScriptFiles(sourceDirectory).filter((file) => path.normalize(file) !== path.normalize(mainPath))) {
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(/\bimport(?:\s+type)?\s+(?:[\s\S]*?\s+from\s+)?["'](\.[^"']+)["']/g)) {
    const importedPath = path.resolve(path.dirname(file), `${match[1]}.ts`);
    if (path.normalize(importedPath) === path.normalize(mainPath)) violations.push(`${path.relative(root, file)} não pode importar src/main.ts.`);
  }
}

if (violations.length) {
  console.error("Verificação arquitetural falhou:\n- " + violations.join("\n- "));
  process.exit(1);
}

console.log(`Arquitetura validada: main.ts com ${lineCount} linhas, ${renderFunctions.length} renderizações legadas e ${templateLiterals} templates.`);
