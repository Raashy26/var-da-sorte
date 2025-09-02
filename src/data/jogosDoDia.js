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
    // 1. Fixtures
    const resFixtures = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const fixturesData = await resFixtures.json();

    if (!fixturesData.response || !fixturesData.response.length) {
      console.warn("⚠️ Sem jogos encontrados para hoje.");
      return [];
    }

    // 🔑 eliminar duplicados pelo par (home+away+hora)
    const seen = new Set();
    const fixtures = fixturesData.response.filter((f) => {
      const key = `${f.teams.home.name}-${f.teams.away.name}-${new Date(
        f.fixture.date
      ).toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 2. Odds
    const resOdds = await fetch(
      `https://v3.football.api-sports.io/odds?date=${today}`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const oddsData = await resOdds.json();

    const oddsByFixture = {};
    if (oddsData.response && oddsData.response.length) {
      for (const odd of oddsData.response) {
        const fixtureId = odd.fixture.id;
        const matchWinner = odd.bookmakers?.[0]?.bets?.find(
          (b) => b.name === "Match Winner"
        );

        let home = "-",
          draw = "-",
          away = "-";
        if (matchWinner) {
          home =
            matchWinner.values.find((v) => ["Home", "1"].includes(v.value))
              ?.odd || "-";
          draw =
            matchWinner.values.find((v) => ["Draw", "X"].includes(v.value))
              ?.odd || "-";
          away =
            matchWinner.values.find((v) => ["Away", "2"].includes(v.value))
              ?.odd || "-";
        }

        oddsByFixture[fixtureId] = { home, draw, away };
      }
    }

    // 3. Merge Fixtures + Odds
    const jogos = fixtures.slice(0, 10).map((match) => {
      return {
        id: match.fixture.id,
        home: match.teams.home.name,
        away: match.teams.away.name,
        competition: match.league.name,
        date: new Date(match.fixture.date),
        odds: oddsByFixture[match.fixture.id] || {
          home: "-",
          draw: "-",
          away: "-",
        },
      };
    });

    return jogos;
  } catch (err) {
    console.error("❌ Erro ao buscar jogos:", err);
    return [];
  }
};
