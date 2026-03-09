export interface UpcomingGame {
  id: number;
  date: string;
  dayAbbrev: string;
  startTime: string; // Format: "1:00 AM"
  venue: string;
  homeTeam: {
    id: number;
    name: string;
    abbrev: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    abbrev: string;
    logo: string;
  };
  gameState: string;
}

export interface GamesByDate {
  date: string;
  dayAbbrev: string;
  games: UpcomingGame[];
}

const COMPLETED_GAME_STATES = new Set([
  'OFF',
  'FINAL',
  'FINAL_OT',
  'FINAL_SO',
]);

function isUpcomingGame(game: any, nowMs: number): boolean {
  const startAtMs = Date.parse(game?.startTimeUTC ?? '');
  if (Number.isNaN(startAtMs)) return false;

  const normalizedState = String(game?.gameState ?? '').toUpperCase();
  const oneHourMs = 60 * 60 * 1000;
  const estimatedGameDurationMs = 3 * 60 * 60 * 1000;
  const recentCompletedWindowMs = estimatedGameDurationMs + oneHourMs;
  const liveWindowMs = 4 * 60 * 60 * 1000;

  if (COMPLETED_GAME_STATES.has(normalizedState)) {
    return nowMs - startAtMs <= recentCompletedWindowMs;
  }

  return startAtMs >= nowMs - liveWindowMs;
}

export function upcomingGamesPresenter(data: any): GamesByDate[] {
  if (!data?.gameWeek) return [];

  const nowMs = Date.now();

  return data.gameWeek
    .map((day: any) => ({
      date: day.date,
      dayAbbrev: day.dayAbbrev,
      games: (day.games ?? [])
        .filter((game: any) => isUpcomingGame(game, nowMs))
        .map((game: any) => {
          // Convertir l'heure UTC en format AM/PM
          const startDate = new Date(game.startTimeUTC);
          const hours = startDate.getHours();
          const minutes = startDate.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes.toString().padStart(2, '0');

          return {
            id: game.id,
            date: day.date,
            dayAbbrev: day.dayAbbrev,
            startTime: `${displayHours}:${displayMinutes} ${ampm}`,
            venue: game.venue.default,
            homeTeam: {
              id: game.homeTeam.id,
              name: game.homeTeam.commonName.default,
              abbrev: game.homeTeam.abbrev,
              logo: game.homeTeam.logo,
            },
            awayTeam: {
              id: game.awayTeam.id,
              name: game.awayTeam.commonName.default,
              abbrev: game.awayTeam.abbrev,
              logo: game.awayTeam.logo,
            },
            gameState: game.gameState,
          };
        }),
    }))
    .filter((day: GamesByDate) => day.games.length > 0);
}
