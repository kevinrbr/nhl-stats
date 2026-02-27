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

export interface TeamScheduleGame {
  id: number;
  date: string;
  gameState: string;
  isHome: boolean;
  homeTeam: {
    abbrev: string;
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    abbrev: string;
    name: string;
    logo: string;
    score: number;
  };
}

type RawLocalizedText = {
  default?: string;
};

type RawTeamData = {
  abbrev?: string;
  commonName?: RawLocalizedText;
  placeName?: RawLocalizedText;
  name?: RawLocalizedText;
  sog?: number;
  score?: number;
  logo?: string;
  darkLogo?: string;
};

type RawLastGameData = {
  gameInfo: {
    id: number;
    startTimeUTC: string;
  };
  boxscore: {
    homeTeam: RawTeamData;
    awayTeam: RawTeamData;
  };
};

type RawScheduleGameData = {
  id: number;
  startTimeUTC: string;
  gameState?: string;
  homeTeam?: RawTeamData;
  awayTeam?: RawTeamData;
};

export function teamLastGamesPresenter(
  gamesData: RawLastGameData[],
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
        abbrev: home.abbrev ?? '',
        name: home.commonName?.default ?? home.abbrev ?? 'Unknown',
        sog: home.sog || 0,
        score: home.score || 0,
        logo: home.logo ?? '',
      },
      awayTeam: {
        abbrev: away.abbrev ?? '',
        name: away.commonName?.default ?? away.abbrev ?? 'Unknown',
        sog: away.sog || 0,
        score: away.score || 0,
        logo: away.logo ?? '',
      },
    };
  });
}

function getTeamName(teamData: RawTeamData): string {
  return (
    teamData?.commonName?.default ??
    teamData?.placeName?.default ??
    teamData?.name?.default ??
    teamData?.abbrev ??
    'Unknown'
  );
}

function getTeamLogo(teamData: RawTeamData): string {
  return teamData?.logo ?? teamData?.darkLogo ?? '';
}

export function teamSchedulePresenter(
  gamesData: RawScheduleGameData[],
  teamAbbrev: string
): TeamScheduleGame[] {
  return gamesData
    .map((game) => {
      const home = game?.homeTeam ?? {};
      const away = game?.awayTeam ?? {};
      const isHome = home.abbrev === teamAbbrev;

      return {
        id: game.id,
        date: game.startTimeUTC,
        gameState: game.gameState ?? '',
        isHome,
        homeTeam: {
          abbrev: home.abbrev ?? '',
          name: getTeamName(home),
          logo: getTeamLogo(home),
          score: home.score ?? 0,
        },
        awayTeam: {
          abbrev: away.abbrev ?? '',
          name: getTeamName(away),
          logo: getTeamLogo(away),
          score: away.score ?? 0,
        },
      };
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}
