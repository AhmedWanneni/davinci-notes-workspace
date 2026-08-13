import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distAssetsDir = path.join(repoRoot, "apps/desktop/dist/assets");

if (!fs.existsSync(distAssetsDir)) {
  console.error(
    `❌ Error: Build output not found at ${distAssetsDir}. Run "pnpm --filter @app/desktop build:web" first.`,
  );
  process.exit(1);
}

// Configured size limits with reasonable headroom
const BUDGETS = {
  totalJsRawKb: 1400,
  totalJsGzipKb: 450,
  entryJsRawKb: 250,
  entryJsGzipKb: 80,
  graphJsRawKb: 150,
  graphJsGzipKb: 50,
  totalCssRawKb: 60,
  totalCssGzipKb: 15,
};

const files = fs.readdirSync(distAssetsDir);
const assetStats = [];

let totalJsRawBytes = 0;
let totalJsGzipBytes = 0;
let totalCssRawBytes = 0;
let totalCssGzipBytes = 0;

let entryJsStat = null;
let graphJsStat = null;

for (const file of files) {
  const filePath = path.join(distAssetsDir, file);
  const content = fs.readFileSync(filePath);
  const rawBytes = content.length;
  const gzipBytes = zlib.gzipSync(content).length;

  const rawKb = rawBytes / 1024;
  const gzipKb = gzipBytes / 1024;

  const isJs = file.endsWith(".js");
  const isCss = file.endsWith(".css");

  if (isJs) {
    totalJsRawBytes += rawBytes;
    totalJsGzipBytes += gzipBytes;
    if (file.startsWith("index-")) {
      entryJsStat = { file, rawKb, gzipKb };
    } else if (file.startsWith("GraphView-")) {
      graphJsStat = { file, rawKb, gzipKb };
    }
  } else if (isCss) {
    totalCssRawBytes += rawBytes;
    totalCssGzipBytes += gzipBytes;
  }

  assetStats.push({
    file,
    type: isJs ? "JS" : isCss ? "CSS" : "OTHER",
    rawKb,
    gzipKb,
  });
}

const totalJsRawKb = totalJsRawBytes / 1024;
const totalJsGzipKb = totalJsGzipBytes / 1024;
const totalCssRawKb = totalCssRawBytes / 1024;
const totalCssGzipKb = totalCssGzipBytes / 1024;

console.log("\n📦 === DESKTOP BUNDLE SIZE AUDIT ===");
console.table(
  assetStats.map((s) => ({
    File: s.file,
    Type: s.type,
    "Raw Size (KB)": s.rawKb.toFixed(2),
    "Gzip Size (KB)": s.gzipKb.toFixed(2),
  })),
);

console.log("\n📊 Summary Totals:");
console.log(
  `  Total JS:  ${totalJsRawKb.toFixed(2)} KB raw (limit: ${BUDGETS.totalJsRawKb} KB) | ${totalJsGzipKb.toFixed(2)} KB gzip (limit: ${BUDGETS.totalJsGzipKb} KB)`,
);
console.log(
  `  Total CSS: ${totalCssRawKb.toFixed(2)} KB raw (limit: ${BUDGETS.totalCssRawKb} KB) | ${totalCssGzipKb.toFixed(2)} KB gzip (limit: ${BUDGETS.totalCssGzipKb} KB)`,
);
if (entryJsStat) {
  console.log(
    `  Entry JS:  ${entryJsStat.rawKb.toFixed(2)} KB raw (limit: ${BUDGETS.entryJsRawKb} KB) | ${entryJsStat.gzipKb.toFixed(2)} KB gzip (limit: ${BUDGETS.entryJsGzipKb} KB)`,
  );
}
if (graphJsStat) {
  console.log(
    `  Graph JS:  ${graphJsStat.rawKb.toFixed(2)} KB raw (limit: ${BUDGETS.graphJsRawKb} KB) | ${graphJsStat.gzipKb.toFixed(2)} KB gzip (limit: ${BUDGETS.graphJsGzipKb} KB)`,
  );
}

const violations = [];

if (totalJsRawKb > BUDGETS.totalJsRawKb) {
  violations.push(
    `Total JS raw size (${totalJsRawKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.totalJsRawKb} KB`,
  );
}
if (totalJsGzipKb > BUDGETS.totalJsGzipKb) {
  violations.push(
    `Total JS gzip size (${totalJsGzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.totalJsGzipKb} KB`,
  );
}
if (totalCssRawKb > BUDGETS.totalCssRawKb) {
  violations.push(
    `Total CSS raw size (${totalCssRawKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.totalCssRawKb} KB`,
  );
}
if (totalCssGzipKb > BUDGETS.totalCssGzipKb) {
  violations.push(
    `Total CSS gzip size (${totalCssGzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.totalCssGzipKb} KB`,
  );
}
if (entryJsStat && entryJsStat.rawKb > BUDGETS.entryJsRawKb) {
  violations.push(
    `Entry JS raw size (${entryJsStat.rawKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.entryJsRawKb} KB`,
  );
}
if (entryJsStat && entryJsStat.gzipKb > BUDGETS.entryJsGzipKb) {
  violations.push(
    `Entry JS gzip size (${entryJsStat.gzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.entryJsGzipKb} KB`,
  );
}
if (graphJsStat && graphJsStat.rawKb > BUDGETS.graphJsRawKb) {
  violations.push(
    `Graph JS raw size (${graphJsStat.rawKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.graphJsRawKb} KB`,
  );
}
if (graphJsStat && graphJsStat.gzipKb > BUDGETS.graphJsGzipKb) {
  violations.push(
    `Graph JS gzip size (${graphJsStat.gzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.graphJsGzipKb} KB`,
  );
}

if (violations.length > 0) {
  console.error("\n❌ BUNDLE SIZE BUDGET VIOLATIONS:");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error("\nFailing CI check.\n");
  process.exit(1);
}

console.log("\n✅ All bundle size checks passed within configured budgets!\n");
process.exit(0);
