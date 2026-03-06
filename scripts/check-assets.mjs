#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = process.cwd();
const SITE_DIR = path.resolve(ROOT_DIR, process.env.SITE_DIR || "_site");
const SIZE_WARN_BYTES = 300 * 1024;

const ATTR_RE = /\b(?:src|href|content)\s*=\s*["']([^"']+)["']/gi;
const CSS_URL_RE = /url\((['"]?)([^'")]+)\1\)/gi;
const ASSET_EXT_RE =
  /\.(css|js|mjs|png|jpg|jpeg|webp|svg|ico|json|xml|txt|woff|woff2|ttf|eot|map|pdf)$/i;
const RASTER_EXT_RE = /\.(png|jpg|jpeg|webp)$/i;

function toPosixPath(value) {
  return value.replaceAll("\\", "/");
}

function isSkippableUrl(value) {
  if (!value) return true;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("//")
  );
}

function looksLikeAsset(value) {
  const pathOnly = value.split("#")[0].split("?")[0];
  if (!pathOnly) return false;
  if (ASSET_EXT_RE.test(pathOnly)) return true;
  return (
    pathOnly.startsWith("/images/") ||
    pathOnly.startsWith("/scripts/") ||
    pathOnly === "/style.css"
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

function fileToWebPath(siteFilePath) {
  const rel = toPosixPath(path.relative(SITE_DIR, siteFilePath));
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

    if (resolved.origin === "https://local.test") {
      return `${resolved.pathname}${resolved.search ?? ""}${resolved.hash ?? ""}`;
    }

    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      if (resolved.hostname === "www.vardasorte.com" || resolved.hostname === "vardasorte.com") {
        return `${resolved.pathname}${resolved.search ?? ""}${resolved.hash ?? ""}`;
      }
      return null;
    }

    return null;
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
  const absolute = path.join(SITE_DIR, normalized);
  if (await fileExists(absolute)) return absolute;
  return null;
}

function collectUrlsFromText(raw) {
  const urls = [];
  let match;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    urls.push(match[1].trim());
  }
  while ((match = CSS_URL_RE.exec(raw)) !== null) {
    urls.push(match[2].trim());
  }
  return urls;
}

async function main() {
  try {
    const allFiles = await walkFiles(SITE_DIR);
    const htmlAndCss = allFiles.filter((file) => {
      const rel = toPosixPath(path.relative(SITE_DIR, file));
      if (rel.startsWith("includes/")) return false;
      return file.endsWith(".html") || file.endsWith(".css");
    });
    const missing = [];
    const referencedAssetFiles = new Set();

    for (const filePath of htmlAndCss) {
      const raw = await fs.readFile(filePath, "utf8");
      const currentWebPath = fileToWebPath(filePath);
      const urls = collectUrlsFromText(raw);

      for (const rawUrl of urls) {
        if (isSkippableUrl(rawUrl)) continue;
        if (!looksLikeAsset(rawUrl)) continue;

        const sitePath = resolveToSitePath(rawUrl, currentWebPath);
        if (!sitePath) continue;

        const resolvedFile = await resolveWebPathToFile(sitePath);
        if (!resolvedFile) {
          missing.push({
            from: toPosixPath(path.relative(ROOT_DIR, filePath)),
            asset: rawUrl,
          });
        } else {
          referencedAssetFiles.add(resolvedFile);
        }
      }
    }

    const warnings = [];
    for (const filePath of referencedAssetFiles) {
      const rel = toPosixPath(path.relative(ROOT_DIR, filePath));
      if (!rel.startsWith("_site/images/")) continue;
      if (!RASTER_EXT_RE.test(filePath)) continue;
      const stat = await fs.stat(filePath);
      if (stat.size > SIZE_WARN_BYTES) {
        warnings.push({
          file: rel,
          sizeKb: (stat.size / 1024).toFixed(1),
        });
      }
    }

    if (missing.length > 0) {
      console.error("Asset check: FAIL");
      for (const item of missing) {
        console.error(`- Missing asset: ${item.asset} (from ${item.from})`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`Asset check: OK (${htmlAndCss.length} files scanned).`);

    if (warnings.length > 0) {
      console.warn(`Asset check warnings: ${warnings.length} file(s) above ${Math.round(SIZE_WARN_BYTES / 1024)}KB.`);
      for (const warning of warnings) {
        console.warn(`- Heavy asset: ${warning.file} (${warning.sizeKb}KB)`);
      }
    }
  } catch (error) {
    console.error(`Asset check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
