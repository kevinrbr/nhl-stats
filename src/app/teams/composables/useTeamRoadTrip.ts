import { computed, type Ref } from 'vue';
import type { TeamScheduleGame } from '../presenters/teams.presenter';
import { NHL_CITY_COORDS, calculateDistance } from '@/app/common/utils/cityCoordinates';

const COMPLETED_STATES = new Set(['OFF', 'FINAL']);

export type TeamTravelScenario =
  | 'home-to-home'
  | 'away-to-home'
  | 'home-to-away'
  | 'away-to-away';

export interface TeamTravelFatigueBreakdown {
  awayPressure: number;
  distancePressure: number;
  restPenalty: number;
  transitionPenalty: number;
}

export interface TeamTravelStatus {
  scenario: TeamTravelScenario;
  lastGame: TeamScheduleGame;
  nextGame: TeamScheduleGame;
  daysUntilNextGame: number;
  restDays: number;
  awayStreakGames: number;
  awayStreakWindowDays: number;
  awayTripElapsedDays: number;
  awayTripWindowDays: number;
  nextTripWindowDays: number;
  nextDestinationCity: string | null;
  nextLegDistanceKm: number;
  totalTripDistanceKm: number;
  fatigueScore: number;
  fatigueBreakdown: TeamTravelFatigueBreakdown;
}

interface FatigueInput {
  scenario: TeamTravelScenario;
  awayStreakGames: number;
  totalTripDistanceKm: number;
  restDays: number;
}

function getCityLabel(teamAbbrev: string): string {
  return NHL_CITY_COORDS[teamAbbrev]?.city ?? teamAbbrev;
}

function diffInCalendarDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  return Math.max(0, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)));
}

function diffInLocalCalendarDays(start: Date, end: Date): number {
  const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(
    0,
    Math.round((endLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function distanceBetweenTeams(fromAbbrev: string, toAbbrev: string): number {
  const from = NHL_CITY_COORDS[fromAbbrev];
  const to = NHL_CITY_COORDS[toAbbrev];

  if (!from || !to) return 0;

  return calculateDistance(from.lat, from.lng, to.lat, to.lng);
}

function getAwayStreak(completedGames: TeamScheduleGame[]): TeamScheduleGame[] {
  const streak: TeamScheduleGame[] = [];

  for (let i = completedGames.length - 1; i >= 0; i -= 1) {
    const game = completedGames[i];
    if (!game) continue;
    if (game.isHome) break;
    streak.unshift(game);
  }

  return streak;
}

function getAwayStreakDistance(
  awayStreak: TeamScheduleGame[],
  teamAbbrev: string,
  includeReturnHome: boolean
): number {
  if (awayStreak.length === 0) return 0;

  let totalDistance = 0;

  const firstAwayGame = awayStreak[0];
  if (!firstAwayGame) return 0;

  totalDistance += distanceBetweenTeams(teamAbbrev, firstAwayGame.homeTeam.abbrev);

  for (let i = 1; i < awayStreak.length; i += 1) {
    const previousGame = awayStreak[i - 1];
    const currentGame = awayStreak[i];
    if (!previousGame || !currentGame) continue;

    const previousVenue = previousGame.homeTeam.abbrev;
    const currentVenue = currentGame.homeTeam.abbrev;
    totalDistance += distanceBetweenTeams(previousVenue, currentVenue);
  }

  if (includeReturnHome) {
    const lastAwayGame = awayStreak[awayStreak.length - 1];
    if (!lastAwayGame) return totalDistance;

    const lastVenue = lastAwayGame.homeTeam.abbrev;
    totalDistance += distanceBetweenTeams(lastVenue, teamAbbrev);
  }

  return totalDistance;
}

function getNextAwayTrip(
  sortedGames: TeamScheduleGame[],
  startIndex: number
): TeamScheduleGame[] {
  const trip: TeamScheduleGame[] = [];

  for (let i = startIndex; i < sortedGames.length; i += 1) {
    const game = sortedGames[i];
    if (!game || COMPLETED_STATES.has(game.gameState)) continue;
    if (game.isHome) break;
    trip.push(game);
  }

  return trip;
}

function computeFatigueScore({
  scenario,
  awayStreakGames,
  totalTripDistanceKm,
  restDays,
}: FatigueInput): { score: number; breakdown: TeamTravelFatigueBreakdown } {
  const awayPressure = awayStreakGames * 1.2;
  const distancePressure = Math.min(3.5, totalTripDistanceKm / 1200);
  const restPenalty =
    restDays === 0 ? 2.5 : restDays === 1 ? 1.6 : restDays === 2 ? 0.8 : 0;
  const transitionPenalty =
    scenario === 'away-to-away'
      ? 1.5
      : scenario === 'away-to-home'
        ? 0.8
        : scenario === 'home-to-away'
          ? 1.1
          : 0.2;

  const score = Math.min(
    10,
    Math.max(
      1,
      Math.round(1 + awayPressure + distancePressure + restPenalty + transitionPenalty)
    )
  );

  return {
    score,
    breakdown: {
      awayPressure,
      distancePressure,
      restPenalty,
      transitionPenalty,
    },
  };
}

export function useTeamRoadTrip(
  games: Ref<TeamScheduleGame[] | undefined>,
  teamAbbrev: Ref<string>
) {
  const travelStatus = computed<TeamTravelStatus | null>(() => {
    if (!games.value || games.value.length === 0) return null;

    const sortedGames = [...games.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const completedGames = sortedGames.filter((game) =>
      COMPLETED_STATES.has(game.gameState)
    );

    if (completedGames.length === 0) return null;

    const lastGame = completedGames[completedGames.length - 1];
    if (!lastGame) return null;

    const nextGame = sortedGames.find(
      (game) =>
        !COMPLETED_STATES.has(game.gameState) &&
        new Date(game.date).getTime() > new Date(lastGame.date).getTime()
    );

    if (!nextGame) return null;

    const now = new Date();
    const restDays = Math.max(0, diffInCalendarDays(lastGame.date, nextGame.date) - 1);
    const daysUntilNextGame = diffInLocalCalendarDays(now, new Date(nextGame.date));

    const awayStreak = lastGame.isHome ? [] : getAwayStreak(completedGames);
    const awayStreakGames = awayStreak.length;
    const firstAwayGame = awayStreak[0];
    const lastAwayGame = awayStreak[awayStreak.length - 1];

    const awayStreakWindowDays =
      awayStreakGames > 0 && firstAwayGame && lastAwayGame
        ? diffInCalendarDays(firstAwayGame.date, lastAwayGame.date) + 1
        : 0;

    const awayTripElapsedDays =
      awayStreakGames > 0 && firstAwayGame
        ? diffInLocalCalendarDays(new Date(firstAwayGame.date), now) + 1
        : 0;

    const awayTripWindowDays =
      awayStreakGames > 0 && firstAwayGame
        ? diffInCalendarDays(firstAwayGame.date, nextGame.date) + 1
        : 0;

    const lastWasHome = lastGame.isHome;
    const nextIsHome = nextGame.isHome;

    let scenario: TeamTravelScenario = 'home-to-home';
    let totalTripDistanceKm = 0;
    let nextLegDistanceKm = 0;
    let nextTripWindowDays = 0;
    let nextDestinationCity: string | null = null;

    if (lastWasHome && nextIsHome) {
      scenario = 'home-to-home';
    } else if (!lastWasHome && nextIsHome) {
      scenario = 'away-to-home';
      totalTripDistanceKm = getAwayStreakDistance(awayStreak, teamAbbrev.value, true);
      nextLegDistanceKm = distanceBetweenTeams(lastGame.homeTeam.abbrev, teamAbbrev.value);
      nextDestinationCity = getCityLabel(teamAbbrev.value);
    } else if (lastWasHome && !nextIsHome) {
      scenario = 'home-to-away';
      const nextGameIndex = sortedGames.findIndex((game) => game.id === nextGame.id);
      const upcomingAwayTrip = getNextAwayTrip(sortedGames, nextGameIndex);
      const firstTripGame = upcomingAwayTrip[0] ?? nextGame;
      const lastTripGame = upcomingAwayTrip[upcomingAwayTrip.length - 1] ?? nextGame;

      totalTripDistanceKm += distanceBetweenTeams(teamAbbrev.value, firstTripGame.homeTeam.abbrev);
      nextLegDistanceKm = distanceBetweenTeams(teamAbbrev.value, firstTripGame.homeTeam.abbrev);
      nextDestinationCity = getCityLabel(firstTripGame.homeTeam.abbrev);

      for (let i = 1; i < upcomingAwayTrip.length; i += 1) {
        const previousAway = upcomingAwayTrip[i - 1];
        const currentAway = upcomingAwayTrip[i];
        if (!previousAway || !currentAway) continue;

        totalTripDistanceKm += distanceBetweenTeams(
          previousAway.homeTeam.abbrev,
          currentAway.homeTeam.abbrev
        );
      }

      nextTripWindowDays = Math.max(
        1,
        diffInCalendarDays(firstTripGame.date, lastTripGame.date) + 1
      );
    } else {
      scenario = 'away-to-away';
      const traveledDistance = getAwayStreakDistance(awayStreak, teamAbbrev.value, false);
      nextLegDistanceKm = distanceBetweenTeams(lastGame.homeTeam.abbrev, nextGame.homeTeam.abbrev);

      totalTripDistanceKm = traveledDistance + nextLegDistanceKm;
      nextDestinationCity = getCityLabel(nextGame.homeTeam.abbrev);
    }

    const { score: fatigueScore, breakdown: fatigueBreakdown } = computeFatigueScore({
      scenario,
      awayStreakGames,
      totalTripDistanceKm,
      restDays,
    });

    return {
      scenario,
      lastGame,
      nextGame,
      daysUntilNextGame,
      restDays,
      awayStreakGames,
      awayStreakWindowDays,
      awayTripElapsedDays,
      awayTripWindowDays,
      nextTripWindowDays,
      nextDestinationCity,
      nextLegDistanceKm,
      totalTripDistanceKm,
      fatigueScore,
      fatigueBreakdown,
    };
  });

  return { travelStatus };
}
