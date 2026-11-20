import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const postPath = join(scriptDir, "POST.json");

if (!existsSync(postPath)) {
  fail(`POST.json not found next to main.ts (looked in ${scriptDir})`);
}

let raw: string;
try {
  raw = readFileSync(postPath, "utf8");
} catch (err) {
  fail(`could not read POST.json: ${err instanceof Error ? err.message : String(err)}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw!);
} catch (err) {
  fail(`POST.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
}

if (
  typeof parsed !== "object" ||
  parsed === null ||
  Array.isArray(parsed) ||
  typeof (parsed as { url?: unknown }).url !== "string"
) {
  fail("POST.json must be a JSON object with a string \"url\" field");
}

const url = (parsed as { url: string }).url;
if (!url.startsWith("https://x.com/") && !url.startsWith("https://twitter.com/")) {
  fail(`POST.json url must start with https://x.com/ or https://twitter.com/ (got ${url})`);
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  fail(`could not create output dir ${outputDir}: ${err instanceof Error ? err.message : String(err)}`);
}

const destPath = join(outputDir, "POST.json");
try {
  copyFileSync(postPath, destPath);
} catch (err) {
  fail(`could not copy POST.json to ${destPath}: ${err instanceof Error ? err.message : String(err)}`);
}

const copied = readFileSync(destPath, "utf8");
if (copied !== raw) {
  fail("copied POST.json does not match the source byte-for-byte");
}

console.log(`OK: copied POST.json to ${destPath} (url: ${url})`);
