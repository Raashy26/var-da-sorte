const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) {
    console.error("⚠️ Nenhuma API_KEY encontrada no .env");
    return [];
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      {
        headers: { "x-apisports-key": API_KEY },
      }
    );

    const data = await res.json();

    if (!data.response || !data.response.length) {
      console.warn("⚠️ Sem jogos encontrados para hoje.");
      return [];
    }

    // 🔥 Eliminar duplicados (mesmo fixture.id)
    const uniqueFixtures = [];
    const seen = new Set();

    for (const match of data.response) {
      if (!seen.has(match.fixture.id)) {
        seen.add(match.fixture.id);
        uniqueFixtures.push(match);
      }
    }

    return uniqueFixtures.slice(0, 10).map((match) => {
      let home = "-", draw = "-", away = "-";

      const matchWinnerBet = match?.odds?.[0]?.bookmakers?.[0]?.bets?.find(
        (b) => b.name === "Match Winner"
      );

      if (matchWinnerBet && matchWinnerBet.values) {
        home =
          matchWinnerBet.values.find((v) =>
            ["Home", "1"].includes(v.value)
          )?.odd || "-";
        draw =
          matchWinnerBet.values.find((v) =>
            ["Draw", "X"].includes(v.value)
          )?.odd || "-";
        away =
          matchWinnerBet.values.find((v) =>
            ["Away", "2"].includes(v.value)
          )?.odd || "-";
      }

      return {
        id: match.fixture.id,
        home: match.teams.home.name,
        away: match.teams.away.name,
        competition: match.league.name,
        date: new Date(match.fixture.date), // ✅ corrigido para Date
        odds: { home, draw, away },
      };
    });
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
