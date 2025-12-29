export const teamLastGamesPresenter = (scheduleData: any, team: string) => {
  const games = scheduleData.games ?? scheduleData.gamesByMonth?.[0]?.games ?? [];

  const sortedGames = games
    .filter((game: any) => game.gameState === "OFF")
    .sort(
      (a: any, b: any) =>
        new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime()
    )
    .slice(0, 20);

  return sortedGames.map((g: any) => {
    const home = g.homeTeam || g.home; // selon la structure de l'API
    const away = g.awayTeam || g.away;
    const isHome = home.abbrev === team;

    return {
      id: g.id,
      date: g.startTimeUTC,
      isHome,
      homeTeam: {
        abbrev: home.abbrev,
        name: home.commonName?.default || home.name,
        sog: home.sog,
        score: home.score,
        logo: home.logo,
      },
      awayTeam: {
        abbrev: away.abbrev,
        name: away.commonName?.default || away.name,
        sog: away.sog,
        score: away.score,
        logo: away.logo,
      },
    };
  });
};
