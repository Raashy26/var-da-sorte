const fetch = require("node-fetch");

module.exports = async function () {
  const apiKey = "fa07e5a83c500c77b2b45c04ae70cc46";
  const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const data = await response.json();

    // Normalizar dados
    return data.map((match) => {
      const market = match.bookmakers[0]?.markets[0]?.outcomes || [];
      return {
        home: match.home_team,
        away: match.away_team,
        competition: match.sport_title,
        odds: {
          home: market.find((o) => o.name === match.home_team)?.price || "-",
          draw: market.find((o) => o.name === "Draw")?.price || "-",
          away: market.find((o) => o.name === match.away_team)?.price || "-",
        },
      };
    });
  } catch (err) {
    console.error("Erro ao buscar Odds API:", err);
    return [];
  }
};
