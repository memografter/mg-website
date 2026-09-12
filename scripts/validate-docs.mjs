import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Load the standalone docs data without starting Next or executing SDK/provider code.
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  if (file.endsWith(".json")) loadedModule.exports = JSON.parse(fs.readFileSync(file, "utf8"));
  else {
    const source = fs.readFileSync(file, "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const localRequire = specifier => {
      if (!specifier.startsWith(".")) throw new Error(`Unexpected docs dependency: ${specifier}`);
      const target = path.resolve(path.dirname(file), specifier);
      return load(path.extname(target) ? target : `${target}.ts`);
    };
    vm.runInThisContext(`(function(exports, require, module) {${output}\n})`, { filename: file })(loadedModule.exports, localRequire, loadedModule);
  }
  return loadedModule.exports;
}

const { docsPages, validateDocs } = load("src/lib/docs/pages.ts");
const { docsNavItems } = load("src/lib/docs/nav.ts");
const { docsSearchIndex } = load("src/lib/docs/search.ts");
const { getDocSectionId } = load("src/lib/docs/section-id.ts");
const problems = validateDocs().map(slug => `Navigation has no page: ${slug}`);
const routes = new Map();
for (const page of docsPages) {
  const route = page.slug ? `/docs/${page.slug}` : "/docs";
  if (routes.has(route)) problems.push(`Duplicate route: ${route}`);
  const anchors = page.sections.map(section => getDocSectionId(section.title));
  if (new Set(anchors).size !== anchors.length) problems.push(`Duplicate anchors: ${route}`);
  routes.set(route, new Set(anchors));
  for (const section of page.sections) {
    for (const block of section.code ?? []) {
      if (!block.code?.trim()) problems.push(`Empty code/signature: ${route} / ${section.title}`);
      if (/fact\.confidence|confidenceWeight\s*:|updateMemoryNodeConfidence\s*\(/.test(block.code)) problems.push(`Obsolete example: ${route}`);
    }
    if (section.table?.rows.some(row => row.length !== section.table.headers.length)) problems.push(`Malformed table: ${route}`);
  }
}
function checkLink(href, from) {
  if (!href.startsWith("/docs")) return;
  const [route, anchor] = href.split("#");
  if (!routes.has(route)) problems.push(`Broken link from ${from}: ${href}`);
  else if (anchor && !routes.get(route).has(anchor)) problems.push(`Broken anchor from ${from}: ${href}`);
}
for (const page of docsPages) {
  for (const link of [...page.guideMeta?.prerequisites ?? [], ...page.sections.flatMap(section => section.links ?? [])]) checkLink(link.href, page.slug);
}
for (const item of docsNavItems) checkLink(item.href, "navigation");
for (const record of docsSearchIndex) checkLink(record.href, "search");
if (new Set(docsSearchIndex.map(record => record.id)).size !== docsSearchIndex.length) problems.push("Duplicate search IDs");
for (const term of ["analyzeDetailed", "quality", "episode", "cluster", "pinTopic", "reconcileSession"]) {
  if (!docsSearchIndex.some(record => `${record.title} ${record.content}`.includes(term))) problems.push(`Missing search coverage: ${term}`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else console.log(`Validated ${docsPages.length} pages, ${docsNavItems.length} navigation entries, and ${docsSearchIndex.length} search records.`);
