import { computed, type Ref } from 'vue';
import type { TeamScheduleGame } from '../presenters/teams.presenter';
import { NHL_CITY_COORDS, calculateDistance } from '@/app/common/utils/cityCoordinates';

const COMPLETED_STATES = new Set(['OFF', 'FINAL']);

export type TeamTravelScenario =
  | 'home-to-home'
  | 'away-to-home'
  | 'home-to-away'
  | 'away-to-away';

export interface TeamTravelStatus {
  scenario: TeamTravelScenario;
  lastGame: TeamScheduleGame;
  nextGame: TeamScheduleGame;
  restDays: number;
  travelDistanceKm: number;
  awayStreakGames: number;
  awayStreakDays: number;
  headline: string;
  detail: string;
  fatigueScore: number;
  fatigueLabel: string;
  fatigueTextClass: string;
  fatigueBarClass: string;
}

function pluralizeDays(days: number): string {
  return `${days} jour${days > 1 ? 's' : ''}`;
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

function getFatigueUi(score: number): {
  label: string;
  textClass: string;
  barClass: string;
} {
  if (score <= 3) {
    return {
      label: 'Faible',
      textClass: 'text-green-400',
      barClass: 'bg-green-500',
    };
  }

  if (score <= 6) {
    return {
      label: 'Moderee',
      textClass: 'text-yellow-400',
      barClass: 'bg-yellow-500',
    };
  }

  if (score <= 8) {
    return {
      label: 'Elevee',
      textClass: 'text-orange-400',
      barClass: 'bg-orange-500',
    };
  }

  return {
    label: 'Tres elevee',
    textClass: 'text-red-400',
    barClass: 'bg-red-500',
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

    const restDays = Math.max(
      0,
      diffInCalendarDays(lastGame.date, nextGame.date) - 1
    );
    const daysUntilNextGame = diffInLocalCalendarDays(new Date(), new Date(nextGame.date));

    const awayStreak = lastGame.isHome ? [] : getAwayStreak(completedGames);
    const awayStreakGames = awayStreak.length;
    const firstAwayGame = awayStreak[0];
    const lastAwayGame = awayStreak[awayStreak.length - 1];
    const awayStreakDays =
      awayStreakGames > 0 && firstAwayGame && lastAwayGame
        ? diffInCalendarDays(firstAwayGame.date, lastAwayGame.date) + 1
        : 0;

    const lastWasHome = lastGame.isHome;
    const nextIsHome = nextGame.isHome;

    let scenario: TeamTravelScenario = 'home-to-home';
    let travelDistanceKm = 0;
    let headline = '';
    let detail = '';

    if (lastWasHome && nextIsHome) {
      scenario = 'home-to-home';
      headline = `${pluralizeDays(restDays)} de repos`;
      detail =
        'Dernier match a domicile et prochain match a domicile. Fatigue limitee.';
    } else if (!lastWasHome && nextIsHome) {
      scenario = 'away-to-home';
      travelDistanceKm = getAwayStreakDistance(
        awayStreak,
        teamAbbrev.value,
        true
      );
      headline = `${pluralizeDays(restDays)} avant le retour a domicile`;
      detail = `${awayStreakGames} matchs a l'exterieur sur ${pluralizeDays(awayStreakDays)}.`;
    } else if (lastWasHome && !nextIsHome) {
      scenario = 'home-to-away';
      const nextGameIndex = sortedGames.findIndex((game) => game.id === nextGame.id);
      const upcomingAwayTrip = getNextAwayTrip(sortedGames, nextGameIndex);
      const firstTripGame = upcomingAwayTrip[0] ?? nextGame;
      const lastTripGame =
        upcomingAwayTrip[upcomingAwayTrip.length - 1] ?? nextGame;

      travelDistanceKm += distanceBetweenTeams(
        teamAbbrev.value,
        firstTripGame.homeTeam.abbrev
      );

      for (let i = 1; i < upcomingAwayTrip.length; i += 1) {
        const previousAway = upcomingAwayTrip[i - 1];
        const currentAway = upcomingAwayTrip[i];
        if (!previousAway || !currentAway) continue;

        travelDistanceKm += distanceBetweenTeams(
          previousAway.homeTeam.abbrev,
          currentAway.homeTeam.abbrev
        );
      }

      const tripDuration = Math.max(
        1,
        diffInCalendarDays(firstTripGame.date, lastTripGame.date) + 1
      );

      headline =
        daysUntilNextGame === 0
          ? "Depart aujourd'hui"
          : `${pluralizeDays(daysUntilNextGame)} avant le depart`;
      detail = `Prochain deplacement vers ${getCityLabel(firstTripGame.homeTeam.abbrev)}: ${upcomingAwayTrip.length || 1} match(s) a l'exterieur sur ${pluralizeDays(tripDuration)}.`;
    } else {
      scenario = 'away-to-away';
      const traveledDistance = getAwayStreakDistance(
        awayStreak,
        teamAbbrev.value,
        false
      );
      const nextLegDistance = distanceBetweenTeams(
        lastGame.homeTeam.abbrev,
        nextGame.homeTeam.abbrev
      );
      const extendedTripDays =
        awayStreakGames > 0 && firstAwayGame
          ? diffInCalendarDays(firstAwayGame.date, nextGame.date) + 1
          : 0;

      travelDistanceKm = traveledDistance + nextLegDistance;
      headline = 'Road trip en cours';
      detail = `${awayStreakGames} matchs a l'exterieur enchaine(s), ${pluralizeDays(extendedTripDays)} de voyage avec le prochain match.`;
    }

    const awayPressure = awayStreakGames * 1.2;
    const travelPressure = Math.min(3.5, travelDistanceKm / 1200);
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

    const fatigueScore = Math.min(
      10,
      Math.max(
        1,
        Math.round(1 + awayPressure + travelPressure + restPenalty + transitionPenalty)
      )
    );

    const fatigueUi = getFatigueUi(fatigueScore);

    return {
      scenario,
      lastGame,
      nextGame,
      restDays,
      travelDistanceKm,
      awayStreakGames,
      awayStreakDays,
      headline,
      detail,
      fatigueScore,
      fatigueLabel: fatigueUi.label,
      fatigueTextClass: fatigueUi.textClass,
      fatigueBarClass: fatigueUi.barClass,
    };
  });

  return { travelStatus };
}
