#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TIME_ZONE = "Europe/Lisbon";

const ROOT_DIR = process.cwd();

const TARGETS = [
  {
    type: "apostas",
    filePath: (dateIso) => path.join(ROOT_DIR, "src", "apostas", `${dateIso}.md`),
    buildTitle: (datePt) => `Apostas do Dia - ${datePt}`,
    tags: '["apostas"]',
    layout: "layouts/post-aposta.njk",
    body: () => [
      "## As Melhores Apostas do Dia, sempre com a melhor analise, confianca e procurando PRINCIPALMENTE VALOR!",
      "",
      "### Apostas Simples (1 unidade cada)",
      "",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x"

    ].join("\n"),
  },
  {
    type: "desafios_comeback",
    isChallenge: true,
    filePath: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "comeback", `${dateIso}.md`),
    buildTitle: (datePt) => `Odd do Dia - ${datePt}`,
    tags: '["desafios_comeback"]',
    layout: "layouts/post-desafio.njk",
    body: (monthLabelPt, balanceLine) => [
      "## Odd do Dia - Uma unica aposta diaria. Sem ruido. Sem exageros.",
      "",
      "Odd do Dia: **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "",
      balanceLine ?? `**Balanco de unidades do desafio (${monthLabelPt}): 0u**`,
    ].join("\n"),
  },
  {
    type: "desafios_draw",
    isChallenge: true,
    filePath: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "draw", `${dateIso}.md`),
    buildTitle: (datePt) => `Favorito Seguro - ${datePt}`,
    tags: '["desafios_draw"]',
    layout: "layouts/post-desafio.njk",
    body: (monthLabelPt, balanceLine) => [
      "## Favorito Seguro - Apostar em favoritos reais, mas sempre com protecao inteligente.",
      "",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "",
      "**Múltipla total: x | 0.50 unidades**",
      "",
      balanceLine ?? `**Balanco de unidades do desafio (${monthLabelPt}): 0u**`,
    ].join("\n"),
  },
  {
    type: "desafios_over25",
    isChallenge: true,
    filePath: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "over25", `${dateIso}.md`),
    buildTitle: (datePt) => `Desafio Ambas Marcam / +2.5 - ${datePt}`,
    tags: '["desafios_over25"]',
    layout: "layouts/post-desafio.njk",
    body: (monthLabelPt, balanceLine) => [
      "### Ambas Marcam ou +2.5 golos - Decisao PERFEITA manter flexibilidade, com valor e odds ESTRONDOSAS!",
      "",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "- **team1 vs team2** -> TipoDeApostaAqui | Odd: x",
      "",
      "**Múltipla total: x | 0.50 unidades**",
      "",
      balanceLine ?? `**Balanco de unidades do desafio (${monthLabelPt}): 0u**`,
    ].join("\n"),
  },
];

function parseArgs(argv) {
  const options = {
    dateIso: getCurrentDateIsoInLisbon(),
    dryRun: false,
    force: false,
    noCopyBalance: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--no-copy-balance") {
      options.noCopyBalance = true;
      continue;
    }

    if (arg === "--date") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Falta valor para --date. Usa formato YYYY-MM-DD.");
      }
      options.dateIso = normalizeDateIso(next);
      i += 1;
      continue;
    }

    throw new Error(`Argumento nao suportado: ${arg}`);
  }

  return options;
}

function getCurrentDateIsoInLisbon() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return normalizeDateIso(formatter.format(new Date()));
}

function normalizeDateIso(input) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(input).trim());
  if (!match) {
    throw new Error(`Data invalida: "${input}". Usa YYYY-MM-DD.`);
  }

  const [_, year, month, day] = match;
  const candidate = `${year}-${month}-${day}`;
  const date = new Date(`${candidate}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data invalida: "${input}".`);
  }

  const check = date.toISOString().slice(0, 10);
  if (check !== candidate) {
    throw new Error(`Data invalida: "${input}".`);
  }

  return candidate;
}

function formatPtDateFromIso(dateIso) {
  const date = new Date(`${dateIso}T12:00:00Z`);
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getPtMonthLabelFromIso(dateIso) {
  const date = new Date(`${dateIso}T12:00:00Z`);
  const monthName = new Intl.DateTimeFormat("pt-PT", {
    timeZone: TIME_ZONE,
    month: "long",
  }).format(date);
  return capitalizeFirst(monthName);
}

function capitalizeFirst(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildFrontMatter({ title, dateIso, tags, layout }) {
  return [
    "---",
    `title: "${title}"`,
    `date: ${dateIso}`,
    `tags: ${tags}`,
    `layout: ${layout}`,
    "---",
    "",
  ].join("\n");
}

function getPreviousDateIso(dateIso) {
  const date = new Date(`${dateIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getDefaultBalanceLine(monthLabelPt) {
  return `**Balanco de unidades do desafio (${monthLabelPt}): 0u**`;
}

function extractBalanceLine(rawContent) {
  const lines = rawContent.split(/\r?\n/);
  for (const line of lines) {
    if (/balan[cç]o/i.test(line) && /unidades do desafio/i.test(line)) {
      return line.trim();
    }
  }
  return null;
}

async function resolveBalanceLine(target, context, options) {
  if (!target.isChallenge) {
    return { line: null, source: null };
  }

  if (options.noCopyBalance) {
    return {
      line: getDefaultBalanceLine(context.monthLabelPt),
      source: null,
    };
  }

  const previousDateIso = getPreviousDateIso(context.dateIso);
  const previousPath = target.filePath(previousDateIso);

  try {
    const raw = await fs.readFile(previousPath, "utf8");
    const copiedLine = extractBalanceLine(raw);
    if (copiedLine) {
      return { line: copiedLine, source: previousPath };
    }
  } catch {
    // fallback handled below
  }

  return {
    line: getDefaultBalanceLine(context.monthLabelPt),
    source: null,
  };
}

async function buildFileContent(target, dateIso, datePt, monthLabelPt, options) {
  const frontMatter = buildFrontMatter({
    title: target.buildTitle(datePt),
    dateIso,
    tags: target.tags,
    layout: target.layout,
  });

  const balance = await resolveBalanceLine(target, { dateIso, monthLabelPt }, options);
  const body = target.body(monthLabelPt, balance.line);
  return {
    content: `${frontMatter}${body}\n`,
    balanceSource: balance.source,
    balanceLine: balance.line,
  };
}

async function ensureFile(target, options, context) {
  const absolutePath = target.filePath(context.dateIso);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  let exists = false;
  try {
    await fs.access(absolutePath);
    exists = true;
  } catch {
    exists = false;
  }

  const willWrite = !exists || options.force;
  const built = await buildFileContent(
    target,
    context.dateIso,
    context.datePt,
    context.monthLabelPt,
    options
  );
  const { content, balanceSource, balanceLine } = built;

  if (options.dryRun) {
    return {
      type: target.type,
      path: absolutePath,
      action: willWrite ? (exists ? "overwrite" : "create") : "skip",
      exists,
      balanceSource,
      balanceLine,
    };
  }

  if (!willWrite) {
    return {
      type: target.type,
      path: absolutePath,
      action: "skip",
      exists,
      balanceSource,
      balanceLine,
    };
  }

  await fs.writeFile(absolutePath, content, "utf8");

  return {
    type: target.type,
    path: absolutePath,
    action: exists ? "overwrite" : "create",
    exists,
    balanceSource,
    balanceLine,
  };
}

function printSummary(results, options, context) {
  console.log("");
  console.log("VAR da Sorte - Gerador Diario");
  console.log(`Data alvo: ${context.dateIso} (${context.datePt}, ${TIME_ZONE})`);
  console.log(`Modo: ${options.dryRun ? "dry-run" : "write"}${options.force ? " + force" : ""}`);
  console.log("");

  for (const result of results) {
    const relativePath = path.relative(ROOT_DIR, result.path).replaceAll("\\", "/");
    console.log(`- [${result.action}] ${result.type} -> ${relativePath}`);
    if (result.type.startsWith("desafios_")) {
      const sourcePath = result.balanceSource
        ? path.relative(ROOT_DIR, result.balanceSource).replaceAll("\\", "/")
        : "fallback";
      console.log(`  balanco: ${result.balanceLine}`);
      console.log(`  origem: ${sourcePath}`);
    }
  }

  const created = results.filter((r) => r.action === "create").length;
  const overwritten = results.filter((r) => r.action === "overwrite").length;
  const skipped = results.filter((r) => r.action === "skip").length;

  console.log("");
  console.log(`Resumo: ${created} criados, ${overwritten} atualizados, ${skipped} ignorados.`);
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const context = {
      dateIso: options.dateIso,
      datePt: formatPtDateFromIso(options.dateIso),
      monthLabelPt: getPtMonthLabelFromIso(options.dateIso),
    };

    const results = [];
    for (const target of TARGETS) {
      const result = await ensureFile(target, options, context);
      results.push(result);
    }

    printSummary(results, options, context);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
