import { fetchGameCenterBoxscore } from '@/api/services/gamecenter.service';

type BoxscoreTeam = {
  abbrev?: string;
  commonName?: {
    default?: string;
  };
  sog?: number;
  score?: number;
  logo?: string;
};

type GameBoxscoreResponse = {
  homeTeam: BoxscoreTeam;
  awayTeam: BoxscoreTeam;
};

type TeamScheduleGame = {
  id: number;
  startTimeUTC: string;
  gameState?: string;
};

type TeamScheduleResponse = {
  games?: TeamScheduleGame[];
  gamesByMonth?: Array<{
    games?: TeamScheduleGame[];
  }>;
};

type LastGamesWithDetailsOptions = {
  maxGames?: number;
  scheduleGames?: Array<{
    id: number;
    date: string;
    gameState: string;
  }>;
};

type TeamLastGameDetails = {
  gameInfo: TeamScheduleGame;
  boxscore: GameBoxscoreResponse;
};

// Récupère le calendrier de la saison en cours
export const getTeamSchedule = async (team: string): Promise<TeamScheduleResponse> => {
  const res = await fetch(
    `/api-nhl/v1/club-schedule-season/${team}/now`
  );

  if (!res.ok) {
    throw new Error("Erreur fetching team schedule");
  }

  return res.json();
};

export function extractTeamScheduleGames(scheduleData: TeamScheduleResponse): TeamScheduleGame[] {
  if (Array.isArray(scheduleData?.games)) return scheduleData.games;
  return (scheduleData?.gamesByMonth ?? []).flatMap((month) => month.games ?? []);
}

// Récupère les derniers matchs complétés avec détails (boxscore)
export const getTeamLastGamesWithDetails = async (
  team: string,
  options: LastGamesWithDetailsOptions = {}
): Promise<TeamLastGameDetails[]> => {
  const maxGames = options.maxGames ?? 30;
  const scheduleGamesFromOptions = options.scheduleGames?.map((game) => ({
    id: game.id,
    startTimeUTC: game.date,
    gameState: game.gameState,
  }));
  const scheduleData = scheduleGamesFromOptions
    ? { games: scheduleGamesFromOptions }
    : await getTeamSchedule(team);
  
  // 1. Filtrer et trier les matchs terminés
  const games = extractTeamScheduleGames(scheduleData);
  const completedGames = games
    .filter((game) => game.gameState === "OFF" || game.gameState === "FINAL")
    .sort(
      (a, b) =>
        new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime()
    )
    .slice(-maxGames);

  // 2. Récupérer les détails de chaque match sélectionné
  const details = await Promise.all(
    completedGames.map(async (game) => {
      try {
        const boxscore = await fetchGameCenterBoxscore(game.id);
        return {
          gameInfo: game,
          boxscore
        };
      } catch (error) {
        console.error(`Error fetching boxscore for game ${game.id}:`, error);
        return null;
      }
    })
  );

  // 3. Filtrer les matchs dont on n'a pas pu récupérer les détails
  return details.filter(
    (detail): detail is TeamLastGameDetails => detail !== null
  );
};
