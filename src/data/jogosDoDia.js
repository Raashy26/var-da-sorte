const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  const today = new Date().toISOString().split("T")[0];

  if (!API_KEY) {
    console.error("⚠️ Nenhuma API_KEY encontrada no .env");
    return [];
  }

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: { "X-Auth-Token": API_KEY },
      }
    );

    const data = await res.json();

    if (!data.matches || !data.matches.length) {
      return [];
    }

    return data.matches.map((match) => ({
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      competition: match.competition.name,
      utcDate: match.utcDate, // hora do jogo em UTC
    }));
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
