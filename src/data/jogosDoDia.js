const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) {
    console.error("⚠️ Nenhuma API_KEY encontrada no .env");
    return [];
  }

  // Data de hoje
  const today = new Date();
  const dateFrom = today.toISOString().split("T")[0];
  const dateTo = dateFrom; // só hoje

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: { "X-Auth-Token": API_KEY },
      }
    );

    const data = await res.json();

    if (!data.matches || !data.matches.length) {
      console.warn("⚠️ Sem jogos hoje.");
      return [];
    }

    // Mapear até 10 jogos
    return data.matches.slice(0, 10).map((match) => ({
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      competition: match.competition?.name || "Competição Desconhecida",
      date: match.utcDate,
      odds: {
        home: match.odds?.homeWin || "-",
        draw: match.odds?.draw || "-",
        away: match.odds?.awayWin || "-",
      },
    }));
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
