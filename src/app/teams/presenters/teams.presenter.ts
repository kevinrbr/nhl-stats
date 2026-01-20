export interface TeamGameDetails {
  id: number;
  date: string;
  isHome: boolean;
  homeTeam: {
    abbrev: string;
    name: string;
    sog: number;
    score: number;
    logo: string;
  };
  awayTeam: {
    abbrev: string;
    name: string;
    sog: number;
    score: number;
    logo: string;
  };
}

export function teamLastGamesPresenter(
  gamesData: any[],
  teamAbbrev: string
): TeamGameDetails[] {
  return gamesData.map((gameData) => {
    const { gameInfo, boxscore } = gameData;
    const home = boxscore.homeTeam;
    const away = boxscore.awayTeam;
    const isHome = home.abbrev === teamAbbrev;

    return {
      id: gameInfo.id,
      date: gameInfo.startTimeUTC,
      isHome,
      homeTeam: {
        abbrev: home.abbrev,
        name: home.commonName.default,
        sog: home.sog || 0,
        score: home.score || 0,
        logo: home.logo,
      },
      awayTeam: {
        abbrev: away.abbrev,
        name: away.commonName.default,
        sog: away.sog || 0,
        score: away.score || 0,
        logo: away.logo,
      },
    };
  });
}