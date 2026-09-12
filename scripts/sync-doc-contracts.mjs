// Refresh checked-in documentation signatures without a build-time SDK dependency.
// Usage: node scripts/sync-doc-contracts.mjs <path-to-project-memografter>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const directory = path.dirname(fileURLToPath(import.meta.url));
import ts from "typescript";

const root = path.resolve(process.argv[2] || "../project-memografter");
const types = {};
const signatures = {};
const sources = {};
const publicTypes = new Set();
const printer = ts.createPrinter({ removeComments: false });
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : file.endsWith(".ts") ? [file] : [];
  });
}
for (const file of files(path.join(root, "src"))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node) && node.isTypeOnly && node.exportClause && ts.isNamedExports(node.exportClause)
      && (file === path.join(root, "src/index.ts") || file === path.join(root, "src/schema/index.ts"))) {
      for (const element of node.exportClause.elements) publicTypes.add(element.name.text);
    }
    if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const name = node.name.text;
      // Prefer canonical interfaces over forwarding aliases.
      if (!types[name] || ts.isInterfaceDeclaration(node)) {
        types[name] = printer.printNode(ts.EmitHint.Unspecified, node, source).replace(/^export /, "").replace(/import\("[^"]+"\)\./g, "");
        sources[name] = path.relative(root, file).replaceAll("\\", "/");
      }
    }
    if (ts.isClassDeclaration(node) && node.name) {
      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !member.type || member.modifiers?.some(m => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(m.kind))) continue;
        const parameters = member.parameters.map(p => `${p.dotDotDotToken ? "..." : ""}${p.name.getText(source)}${p.questionToken || p.initializer ? "?" : ""}: ${p.type?.getText(source) || "unknown"}`).join(", ");
        const name = member.name.getText(source);
        const key = `${node.name.text}.${name}`;
        const signature = `${name}(${parameters}): ${member.type.getText(source)}`;
        // Use overload declarations when present, rather than the implementation signature.
        if (!member.body) signatures[key] = signatures[key] ? `${signatures[key]}\n${signature}` : signature;
        else if (!signatures[key]) signatures[key] = signature;
      }
    }
  }
}
const requested = [...publicTypes].filter(name => types[name]).sort();
// These named shapes are referenced by the public configuration but not root exports.
for (const name of ["MemoGrafterCacheConfig"]) if (types[name]) requested.push(name);
const output = {
  types: Object.fromEntries(requested.map(name => [name, types[name]])),
  sources: Object.fromEntries(requested.map(name => [name, sources[name]])),
  publicTypes: [...publicTypes].filter(name => types[name]).sort(),
  signatures,
};
fs.writeFileSync(path.join(directory, "../src/lib/docs/contracts.json"), JSON.stringify(output, null, 2) + "\n");
console.log(`Updated ${requested.length} type declarations and ${Object.keys(signatures).length} method signatures.`);
