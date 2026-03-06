#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = process.cwd();
const SITE_DIR = path.resolve(ROOT_DIR, process.env.SITE_DIR || "_site");
const LINK_RE = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;

function isSkippableUrl(value) {
  if (!value) return true;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//")
  );
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function toPosixPath(value) {
  return value.replaceAll("\\", "/");
}

function fileToWebPath(htmlFilePath) {
  const rel = toPosixPath(path.relative(SITE_DIR, htmlFilePath));
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) {
    return `/${rel.slice(0, -"index.html".length)}`;
  }
  return `/${rel}`;
}

function resolveToSitePath(urlValue, currentWebPath) {
  try {
    const base = `https://local.test${currentWebPath}`;
    const resolved = new URL(urlValue, base);
    if (resolved.origin !== "https://local.test") return null;
    return `${resolved.pathname}${resolved.search ?? ""}${resolved.hash ?? ""}`;
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveWebPathToFile(webPathWithQuery) {
  const webPath = webPathWithQuery.split("#")[0].split("?")[0] || "/";
  const normalized = webPath.startsWith("/") ? webPath : `/${webPath}`;
  const fsPath = path.join(SITE_DIR, normalized);
  const parsed = path.parse(fsPath);

  const candidates = [];
  if (normalized.endsWith("/")) {
    candidates.push(path.join(fsPath, "index.html"));
  } else if (parsed.ext) {
    candidates.push(fsPath);
  } else {
    candidates.push(fsPath);
    candidates.push(path.join(fsPath, "index.html"));
  }

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

async function main() {
  try {
    const allFiles = await walkFiles(SITE_DIR);
    const htmlFiles = allFiles.filter((file) => {
      if (!file.endsWith(".html")) return false;
      const rel = toPosixPath(path.relative(SITE_DIR, file));
      return !rel.startsWith("includes/");
    });
    const missing = [];

    for (const htmlFile of htmlFiles) {
      const raw = await fs.readFile(htmlFile, "utf8");
      const currentWebPath = fileToWebPath(htmlFile);
      let match;
      while ((match = LINK_RE.exec(raw)) !== null) {
        const href = match[1].trim();
        if (isSkippableUrl(href)) continue;

        const sitePath = resolveToSitePath(href, currentWebPath);
        if (!sitePath) continue;

        const resolvedFile = await resolveWebPathToFile(sitePath);
        if (!resolvedFile) {
          missing.push({
            from: toPosixPath(path.relative(ROOT_DIR, htmlFile)),
            href,
          });
        }
      }
    }

    if (missing.length > 0) {
      console.error("Link check: FAIL");
      for (const item of missing) {
        console.error(`- Missing link target: ${item.href} (from ${item.from})`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`Link check: OK (${htmlFiles.length} HTML files scanned).`);
  } catch (error) {
    console.error(`Link check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
