#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = process.cwd();
const NODE_BIN = process.execPath;
const ELEVENTY_CMD = path.join(ROOT_DIR, "node_modules", "@11ty", "eleventy", "cmd.cjs");
const TEMP_SITE_DIR = ".tmp_prepublish_site";

const COMMANDS = [
  { label: "Encoding", command: NODE_BIN, args: ["scripts/check-encoding.mjs"] },
  { label: "Build", command: NODE_BIN, args: [ELEVENTY_CMD, `--output=${TEMP_SITE_DIR}`] },
  {
    label: "Links",
    command: NODE_BIN,
    args: ["scripts/check-links.mjs"],
    env: { SITE_DIR: TEMP_SITE_DIR },
  },
  {
    label: "Assets",
    command: NODE_BIN,
    args: ["scripts/check-assets.mjs"],
    env: { SITE_DIR: TEMP_SITE_DIR },
  },
];

function runStep(step) {
  console.log("");
  console.log(`==> ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    cwd: ROOT_DIR,
    env: { ...process.env, ...(step.env || {}) },
  });
  return result.status === 0;
}

function main() {
  const tempDirPath = path.join(ROOT_DIR, TEMP_SITE_DIR);
  fs.rmSync(tempDirPath, { recursive: true, force: true });

  const failed = [];
  for (const step of COMMANDS) {
    const ok = runStep(step);
    if (!ok) failed.push(step.label);
  }

  console.log("");
  if (failed.length > 0) {
    console.error(`Prepublish check: FAIL (${failed.join(", ")})`);
    fs.rmSync(tempDirPath, { recursive: true, force: true });
    process.exitCode = 1;
    return;
  }

  fs.rmSync(tempDirPath, { recursive: true, force: true });
  console.log("Prepublish check: OK");
}

main();
