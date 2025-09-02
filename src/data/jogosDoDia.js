const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) {
    console.error("⚠️ Nenhuma API_KEY encontrada no .env");
    return [];
  }

  // Datas: hoje até 7 dias à frente
  const today = new Date();
  const dateFrom = today.toISOString().split("T")[0];
  const future = new Date();
  future.setDate(today.getDate() + 7);
  const dateTo = future.toISOString().split("T")[0];

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?from=${dateFrom}&to=${dateTo}&timezone=Europe/Lisbon`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    const data = await res.json();

    if (!data.response || !data.response.length) {
      console.warn("⚠️ Sem jogos encontrados para os próximos dias.");
      return [];
    }

    // Mapear até 10 jogos
    return data.response
      .slice(0, 10)
      .map((fixture) => ({
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        competition: fixture.league.name || "Competição Desconhecida",
        date: fixture.fixture.date,
        odds: {
          home: fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[0]?.odd || "-",
          draw: fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[1]?.odd || "-",
          away: fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[2]?.odd || "-",
        },
      }));
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
