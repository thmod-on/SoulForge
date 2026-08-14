import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(root, "src");
const mainPath = path.join(sourceDirectory, "main.ts");
const baseline = JSON.parse(fs.readFileSync(path.join(scriptDirectory, "architecture-baseline.json"), "utf8"));
const violations = [];

const mainSource = fs.readFileSync(mainPath, "utf8");
const sourceFile = ts.createSourceFile(mainPath, mainSource, ts.ScriptTarget.Latest, true);
const renderFunctions = [];
let templateLiterals = 0;

function visitMain(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text.startsWith("render")) renderFunctions.push(node.name.text);
  if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) templateLiterals += 1;
  ts.forEachChild(node, visitMain);
}
visitMain(sourceFile);

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
  const parsed = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const checkImports = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
      const importedPath = path.resolve(path.dirname(file), `${node.moduleSpecifier.text}.ts`);
      if (path.normalize(importedPath) === path.normalize(mainPath)) violations.push(`${path.relative(root, file)} não pode importar src/main.ts.`);
    }
    ts.forEachChild(node, checkImports);
  };
  checkImports(parsed);
}

if (violations.length) {
  console.error("Verificação arquitetural falhou:\n- " + violations.join("\n- "));
  process.exit(1);
}

console.log(`Arquitetura validada: main.ts com ${lineCount} linhas, ${renderFunctions.length} renderizações legadas e ${templateLiterals} templates.`);
