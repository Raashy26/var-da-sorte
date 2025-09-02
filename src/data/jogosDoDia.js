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

    return data.response.slice(0, 20).map((match) => {
      const oddsObj = match.odds ? match.odds[0].bookmakers[0].bets.find(b => b.name === "Match Winner") : {};
      const home = oddsObj?.values?.find(v => v.value === "Home")?.odd || "-";
      const draw = oddsObj?.values?.find(v => v.value === "Draw")?.odd || "-";
      const away = oddsObj?.values?.find(v => v.value === "Away")?.odd || "-";

      const oddsTotal =
        home !== "-" && draw !== "-" && away !== "-" ? parseFloat(home) + parseFloat(draw) + parseFloat(away) : 0;

      return {
        home: match.teams.home.name,
        away: match.teams.away.name,
        competition: match.league.name,
        utcDate: match.fixture.date,
        odds: { home, draw, away },
        oddsTotal,
      };
    });
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
