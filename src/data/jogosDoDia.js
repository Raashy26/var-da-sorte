
const fetch = require("node-fetch");
const API_KEY = fa07e5a83c500c77b2b45c04ae70cc46;

module.exports = async function () {
  const API_KEY = process.env.FOOTBALL_API_KEY; // mete no .env
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches?competitions=PL&dateFrom=${today}&dateTo=${today}`,
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
      competition: "Premier League",
      odds: {
        home: match.odds?.homeWin || "-",
        draw: match.odds?.draw || "-",
        away: match.odds?.awayWin || "-",
      },
    }));
  } catch (err) {
    console.error("Erro ao buscar jogos:", err);
    return [];
  }
};
