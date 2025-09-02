const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    console.error("⚠️ Nenhuma API_KEY encontrada no .env");
    return [];
  }

  const today = new Date();
  const dateFrom = today.toISOString().split("T")[0];

  // 3 dias à frente
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 3);
  const dateTo = futureDate.toISOString().split("T")[0];

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: { "X-Auth-Token": API_KEY },
      }
    );

    const data = await res.json();

    if (!data.matches || !data.matches.length) {
      return [];
    }

    // Mapear os jogos e limitar a 10
    const jogos = data.matches
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 10)
      .map((match) => ({
        home: match.homeTeam.name,
        away: match.awayTeam.name,
        competition: match.competition.name,
        date: match.utcDate,
        odds: {
          home: match.odds?.homeWin || "-",
          draw: match.odds?.draw || "-",
          away: match.odds?.awayWin || "-",
        },
      }));

    return jogos;
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
