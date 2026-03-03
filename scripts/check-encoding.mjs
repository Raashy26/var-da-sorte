#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = process.cwd();
const IGNORE_DIRS = new Set([".git", "node_modules", "_site"]);
const TEXT_EXTENSIONS = new Set([
  ".njk",
  ".md",
  ".js",
  ".mjs",
  ".json",
  ".toml",
  ".css",
  ".txt",
  ".html",
  ".yml",
  ".yaml",
]);

const FILE_NAME_ALLOWLIST = new Set([
  ".eleventy.js",
  "README",
  "README.md",
  "package.json",
  "package-lock.json",
  "netlify.toml",
]);

const MOJIBAKE_REPLACEMENTS = new Map([
  ["Ã¡", "á"],
  ["Ã ", "à"],
  ["Ã¢", "â"],
  ["Ã£", "ã"],
  ["Ã¤", "ä"],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ãª", "ê"],
  ["Ã«", "ë"],
  ["Ã­", "í"],
  ["Ã¬", "ì"],
  ["Ã®", "î"],
  ["Ã¯", "ï"],
  ["Ã³", "ó"],
  ["Ã²", "ò"],
  ["Ã´", "ô"],
  ["Ãµ", "õ"],
  ["Ã¶", "ö"],
  ["Ãº", "ú"],
  ["Ã¹", "ù"],
  ["Ã»", "û"],
  ["Ã¼", "ü"],
  ["Ã§", "ç"],
  ["Ã", "Á"],
  ["Ã€", "À"],
  ["Ã‚", "Â"],
  ["Ãƒ", "Ã"],
  ["Ã„", "Ä"],
  ["Ã‰", "É"],
  ["Ãˆ", "È"],
  ["ÃŠ", "Ê"],
  ["Ã‹", "Ë"],
  ["Ã", "Í"],
  ["ÃŒ", "Ì"],
  ["ÃŽ", "Î"],
  ["Ã", "Ï"],
  ["Ã“", "Ó"],
  ["Ã’", "Ò"],
  ["Ã”", "Ô"],
  ["Ã•", "Õ"],
  ["Ã–", "Ö"],
  ["Ãš", "Ú"],
  ["Ã™", "Ù"],
  ["Ã›", "Û"],
  ["Ãœ", "Ü"],
  ["Ã‡", "Ç"],
  ["Âº", "º"],
  ["Âª", "ª"],
  ["Â°", "°"],
  ["â€”", "—"],
  ["â€“", "–"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€¦", "…"],
  ["Â·", "·"],
  // Double-encoded fragments sometimes found in corrupted files.
  ["ÃƒÂ¡", "á"],
  ["ÃƒÂ©", "é"],
  ["ÃƒÂ­", "í"],
  ["ÃƒÂ³", "ó"],
  ["ÃƒÂº", "ú"],
  ["ÃƒÂ£", "ã"],
  ["ÃƒÂ§", "ç"],
  ["Ã¢â‚¬â€œ", "–"],
  ["Ã¢â‚¬â€", "—"],
  ["Ã¢â‚¬Å“", "“"],
  ["Ã¢â‚¬Â", "”"],
  ["Ã¢â‚¬â„¢", "’"],
]);

const MOJIBAKE_FRAGMENTS = Array.from(MOJIBAKE_REPLACEMENTS.keys());

function parseArgs(argv) {
  const options = {
    fix: false,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--fix") {
      options.fix = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    throw new Error(`Argumento não suportado: ${arg}`);
  }

  return options;
}

function shouldScanFile(filePath) {
  const relative = path.relative(ROOT_DIR, filePath).replaceAll("\\", "/");
  if (relative === "scripts/check-encoding.mjs") return false;

  const name = path.basename(filePath);
  if (FILE_NAME_ALLOWLIST.has(name)) return true;
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function walkDirectory(dirPath, collected) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(absolutePath, collected);
      continue;
    }
    if (shouldScanFile(absolutePath)) {
      collected.push(absolutePath);
    }
  }
}

function getLineIssues(line) {
  const issues = [];
  if (line.includes("\uFFFD")) {
    issues.push("replacement-char");
  }

  const fragments = MOJIBAKE_FRAGMENTS.filter((fragment) => line.includes(fragment));
  if (fragments.length > 0) {
    issues.push(`mojibake:${fragments.join(",")}`);
  }

  return issues;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const issues = getLineIssues(line);
    if (issues.length === 0) continue;
    findings.push({
      filePath,
      lineNumber: index + 1,
      issues,
      line,
    });
  }

  return findings;
}

function applySafeFixes(content) {
  let fixed = content;
  for (const [bad, good] of MOJIBAKE_REPLACEMENTS.entries()) {
    if (!fixed.includes(bad)) continue;
    fixed = fixed.split(bad).join(good);
  }
  return fixed;
}

function fixFiles(files, options) {
  const changed = [];

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const fixed = applySafeFixes(original);
    if (fixed === original) continue;

    changed.push(filePath);
    if (!options.dryRun) {
      fs.writeFileSync(filePath, fixed, "utf8");
    }
  }

  return changed;
}

function printFindings(findings) {
  if (findings.length === 0) return;

  console.log(`Encoding check: ${findings.length} problema(s) encontrado(s).`);
  for (const finding of findings) {
    const relativePath = path.relative(ROOT_DIR, finding.filePath).replaceAll("\\", "/");
    console.log(`${relativePath}:${finding.lineNumber} [${finding.issues.join("; ")}]`);
    console.log(`  ${finding.line}`);
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const files = [];
    walkDirectory(ROOT_DIR, files);

    if (options.fix) {
      const changed = fixFiles(files, options);
      const mode = options.dryRun ? "dry-run" : "write";
      console.log(`Encoding fix (${mode}): ${changed.length} ficheiro(s) com alterações seguras.`);
      for (const filePath of changed) {
        const relativePath = path.relative(ROOT_DIR, filePath).replaceAll("\\", "/");
        console.log(`- ${relativePath}`);
      }
    }

    const findings = files.flatMap((file) => scanFile(file));

    if (findings.length === 0) {
      console.log("Encoding check: OK (sem caracteres corrompidos detetados).");
      return;
    }

    printFindings(findings);
    process.exitCode = 1;
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
