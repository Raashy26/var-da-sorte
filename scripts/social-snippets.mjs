#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TIME_ZONE = "Europe/Lisbon";
const ROOT_DIR = process.cwd();
const COMPLIANCE_LINES = [
  "Transparencia: conteudo informativo, sem promessas de lucro e sem garantias de ganhos.",
  "Jogo responsavel: +18. Aposta com moderacao e dentro dos teus limites.",
];

const PATHS = {
  aposta: (dateIso) => path.join(ROOT_DIR, "src", "apostas", `${dateIso}.md`),
  comeback: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "comeback", `${dateIso}.md`),
  draw: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "draw", `${dateIso}.md`),
  over25: (dateIso) => path.join(ROOT_DIR, "src", "desafios", "over25", `${dateIso}.md`),
};

function parseArgs(argv) {
  const options = {
    dateIso: getCurrentDateIsoInLisbon(),
    source: "all",
    write: false,
    outDir: path.join(ROOT_DIR, "templates", "social-output"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--date") {
      const next = argv[i + 1];
      if (!next) throw new Error("Falta valor para --date. Usa YYYY-MM-DD.");
      options.dateIso = normalizeDateIso(next);
      i += 1;
      continue;
    }

    if (arg === "--source") {
      const next = (argv[i + 1] || "").trim().toLowerCase();
      if (!next) throw new Error("Falta valor para --source (telegram|instagram|all).");
      if (!["telegram", "instagram", "all"].includes(next)) {
        throw new Error(`Valor invalido para --source: ${next}`);
      }
      options.source = next;
      i += 1;
      continue;
    }

    if (arg === "--write") {
      options.write = true;
      continue;
    }

    if (arg === "--out-dir") {
      const next = argv[i + 1];
      if (!next) throw new Error("Falta valor para --out-dir.");
      options.outDir = path.resolve(ROOT_DIR, next);
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Argumento nao suportado: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log("Uso: node scripts/social-snippets.mjs [--date YYYY-MM-DD] [--source telegram|instagram|all] [--write] [--out-dir caminho]");
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
  if (!match) throw new Error(`Data invalida: "${input}". Usa YYYY-MM-DD.`);

  const [_, year, month, day] = match;
  const candidate = `${year}-${month}-${day}`;
  const date = new Date(`${candidate}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== candidate) {
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

async function readUtf8OrEmpty(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function firstNonEmptyLine(lines) {
  for (const line of lines) {
    const clean = line.trim();
    if (clean) return clean;
  }
  return "";
}

function parseSelectionLine(line) {
  const pattern = /^-\s*\*\*(.+?)\*\*\s*->\s*(.+?)\s*\|\s*Odd:\s*(.+)$/i;
  const match = pattern.exec(line.trim());
  if (!match) return null;
  return {
    game: match[1].trim(),
    market: match[2].trim(),
    odd: match[3].trim(),
  };
}

function parseOddDoDiaLine(line) {
  const pattern = /^Odd do Dia:\s*\*\*(.+?)\*\*\s*->\s*(.+?)\s*\|\s*Odd:\s*(.+)$/i;
  const match = pattern.exec(line.trim());
  if (!match) return null;
  return {
    game: match[1].trim(),
    market: match[2].trim(),
    odd: match[3].trim(),
  };
}

function extractApostaData(raw) {
  const lines = raw.split(/\r?\n/);
  const picks = lines.map(parseSelectionLine).filter(Boolean);

  if (picks.length === 0) {
    return {
      hasData: false,
      game: "Sem jogo definido",
      market: "Sem mercado publicado",
      odd: "n/d",
    };
  }

  const first = picks[0];
  return {
    hasData: true,
    game: first.game,
    market: first.market,
    odd: first.odd,
  };
}

function extractDesafioFile(raw, type) {
  const lines = raw.split(/\r?\n/);
  const oddDoDiaLine = lines.map(parseOddDoDiaLine).find(Boolean);

  if (oddDoDiaLine) {
    return {
      active: true,
      type,
      selection: `${oddDoDiaLine.game} -> ${oddDoDiaLine.market}`,
      odd: oddDoDiaLine.odd,
    };
  }

  const pick = lines.map(parseSelectionLine).find(Boolean);
  if (pick) {
    return {
      active: true,
      type,
      selection: `${pick.game} -> ${pick.market}`,
      odd: pick.odd,
    };
  }

  const semLine = firstNonEmptyLine(lines.filter((line) => /sem\s+/i.test(line)));
  return {
    active: false,
    type,
    reason: semLine || "Sem desafio publicado",
  };
}

function pickMainDesafio(desafios) {
  for (const desafio of desafios) {
    if (desafio.active) return desafio;
  }
  if (desafios.length > 0) {
    return desafios[0];
  }
  return { active: false, type: "nenhum", reason: "Sem desafio publicado hoje" };
}

function typeLabel(type) {
  if (type === "comeback") return "odd_do_dia";
  if (type === "draw") return "favorito_seguro";
  if (type === "over25") return "ambas_marcam_ou_over25";
  return "n/d";
}

function buildUtmUrl({ pathName, source, campaign, content }) {
  return `https://www.vardasorte.com/${pathName}/?utm_source=${source}&utm_medium=social&utm_campaign=${campaign}&utm_content=${content}`;
}

function buildApostaPost({ datePt, source, aposta }) {
  const url = buildUtmUrl({
    pathName: "aposta",
    source,
    campaign: "daily_post",
    content: "aposta_dia",
  });

  return [
    `[VAR da Sorte | ${datePt}] Aposta do dia: foco em valor e gestao de banca`,
    "",
    `- Jogo em destaque: ${aposta.game}`,
    `- Mercado principal: ${aposta.market}`,
    `- Odd/linha: ${aposta.odd}`,
    "",
    `Ver analise completa: ${url}`,
    "",
    ...COMPLIANCE_LINES,
  ].join("\n");
}

function buildDesafioPost({ datePt, source, desafio }) {
  const url = buildUtmUrl({
    pathName: "desafio",
    source,
    campaign: "daily_post",
    content: "desafio_dia",
  });

  const selection = desafio.active ? desafio.selection : "Sem selecao publicada";
  const odd = desafio.active ? desafio.odd : "n/d";

  return [
    `[VAR da Sorte | ${datePt}] Desafio do dia: selecao objetiva e disciplinada`,
    "",
    `- Tipo de desafio: ${typeLabel(desafio.type)}`,
    `- Selecao principal: ${selection}`,
    `- Odd total ou odd chave: ${odd}`,
    "",
    `Ver desafio completo: ${url}`,
    "",
    ...COMPLIANCE_LINES,
  ].join("\n");
}

function buildReminderPost({ source }) {
  const url = buildUtmUrl({
    pathName: "desafio",
    source,
    campaign: "daily_post",
    content: "reminder_noite",
  });

  return [
    "Reminder de hoje:",
    "- Aposta e desafios ainda ativos no site",
    "- Atualizacao diaria com metodo e consistencia",
    "- Consulta antes dos jogos",
    "",
    `Ver agora: ${url}`,
    "",
    ...COMPLIANCE_LINES,
  ].join("\n");
}

function buildSourceOutput({ source, dateIso, datePt, apostaData, desafioData }) {
  return [
    `# Social snippets - ${dateIso} - ${source}`,
    "",
    "## Aposta do dia",
    "",
    buildApostaPost({ datePt, source, aposta: apostaData }),
    "",
    "## Desafio do dia",
    "",
    buildDesafioPost({ datePt, source, desafio: desafioData }),
    "",
    "## Reminder noturno",
    "",
    buildReminderPost({ source }),
    "",
  ].join("\n");
}

function resolveSources(optionSource) {
  if (optionSource === "all") return ["telegram", "instagram"];
  return [optionSource];
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const datePt = formatPtDateFromIso(options.dateIso);

    const [apostaRaw, comebackRaw, drawRaw, over25Raw] = await Promise.all([
      readUtf8OrEmpty(PATHS.aposta(options.dateIso)),
      readUtf8OrEmpty(PATHS.comeback(options.dateIso)),
      readUtf8OrEmpty(PATHS.draw(options.dateIso)),
      readUtf8OrEmpty(PATHS.over25(options.dateIso)),
    ]);

    const apostaData = extractApostaData(apostaRaw);
    const desafios = [
      extractDesafioFile(comebackRaw, "comeback"),
      extractDesafioFile(drawRaw, "draw"),
      extractDesafioFile(over25Raw, "over25"),
    ];
    const desafioData = pickMainDesafio(desafios);

    const sources = resolveSources(options.source);
    const blocks = sources.map((source) =>
      buildSourceOutput({
        source,
        dateIso: options.dateIso,
        datePt,
        apostaData,
        desafioData,
      })
    );

    const output = blocks.join("\n---\n\n");

    if (options.write) {
      await fs.mkdir(options.outDir, { recursive: true });
      const outPath = path.join(options.outDir, `${options.dateIso}.md`);
      await fs.writeFile(outPath, output, "utf8");
      const relative = path.relative(ROOT_DIR, outPath).replaceAll("\\", "/");
      console.log(`Ficheiro gerado: ${relative}`);
    }

    console.log("");
    console.log(output);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
