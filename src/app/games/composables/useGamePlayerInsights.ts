import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { MatchupPlayerInsights } from '@/app/games/types/gamePlayerInsights';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { useTeamScheduleBySeason } from '@/app/teams/queries/useTeamScheduleBySeason';
import { useTeamRoster } from '@/app/teams/queries/useTeamRoster';
import { getNhlSeasonIdFromDate, getPreviousNhlSeasonId } from '@/app/teams/utils/season';
import { ensureGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';
import { useBettingLines } from '@/app/common/composables/useBettingLines';
import {
  buildMatchupTopPicks,
  buildTeamAngleInsightGroup,
  buildTeamPlayerInsightGroup,
  getHeadToHeadGameIds,
  getRecentCompletedGameIds,
} from '@/app/games/utils/gamePlayerInsights';

const H2H_WINDOW_SIZE = 5;
const RECENT_WINDOW_SIZE = 5;

export function useGamePlayerInsights(game: Ref<UpcomingGame | null>) {
  const queryClient = useQueryClient();
  const { teamSogLine } = useBettingLines();

  const homeTeamAbbrev = computed(() => game.value?.homeTeam.abbrev ?? '');
  const awayTeamAbbrev = computed(() => game.value?.awayTeam.abbrev ?? '');
  const homeTeamRosterKey = computed(() => homeTeamAbbrev.value || undefined);
  const awayTeamRosterKey = computed(() => awayTeamAbbrev.value || undefined);

  const { data: homeTeamSchedule, isLoading: isHomeScheduleLoading } = useTeamSchedule(homeTeamAbbrev);
  const { data: awayTeamSchedule, isLoading: isAwayScheduleLoading } = useTeamSchedule(awayTeamAbbrev);
  const { data: homeTeamRoster, isLoading: isHomeRosterLoading } = useTeamRoster(homeTeamRosterKey);
  const { data: awayTeamRoster, isLoading: isAwayRosterLoading } = useTeamRoster(awayTeamRosterKey);

  const homeRosterVersion = computed(() =>
    homeTeamRoster.value
      ? `${homeTeamRoster.value.forwards.length}-${homeTeamRoster.value.defensemen.length}-${homeTeamRoster.value.goalies.length}`
      : '0'
  );
  const awayRosterVersion = computed(() =>
    awayTeamRoster.value
      ? `${awayTeamRoster.value.forwards.length}-${awayTeamRoster.value.defensemen.length}-${awayTeamRoster.value.goalies.length}`
      : '0'
  );

  const currentSeasonH2hCount = computed(() => {
    if (!homeTeamSchedule.value || !awayTeamAbbrev.value) return 0;

    return homeTeamSchedule.value.filter((gameItem) => {
      const opponent = gameItem.isHome ? gameItem.awayTeam.abbrev : gameItem.homeTeam.abbrev;
      const isCompleted = ['OFF', 'FINAL', 'FINAL_OT', 'FINAL_SO'].includes(
        (gameItem.gameState ?? '').toUpperCase()
      );
      return isCompleted && opponent === awayTeamAbbrev.value;
    }).length;
  });

  const currentSeasonId = computed(() => {
    if (!game.value) return '';
    return getNhlSeasonIdFromDate(game.value.date);
  });
  const previousSeasonId = computed(() => getPreviousNhlSeasonId(currentSeasonId.value));
  const shouldLoadPreviousSeasonH2h = computed(() => currentSeasonH2hCount.value < H2H_WINDOW_SIZE);

  const {
    data: previousSeasonHomeTeamSchedule,
    isLoading: isPreviousSeasonHomeScheduleLoading,
  } = useTeamScheduleBySeason(homeTeamAbbrev, previousSeasonId, shouldLoadPreviousSeasonH2h);

  const insightsQuery = useQuery({
    queryKey: computed(
      () =>
        [
          'games',
          'player-insights',
          homeTeamAbbrev.value,
          awayTeamAbbrev.value,
          game.value?.id ?? 0,
          previousSeasonId.value,
          shouldLoadPreviousSeasonH2h.value,
          teamSogLine.value,
          homeRosterVersion.value,
          awayRosterVersion.value,
        ] as const
    ),
    enabled: computed(
      () =>
        Boolean(
          game.value &&
            homeTeamAbbrev.value &&
            awayTeamAbbrev.value &&
            homeTeamSchedule.value &&
            awayTeamSchedule.value &&
            (!shouldLoadPreviousSeasonH2h.value || previousSeasonHomeTeamSchedule.value)
        )
    ),
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<MatchupPlayerInsights> => {
      const homeSchedule = homeTeamSchedule.value ?? [];
      const awaySchedule = awayTeamSchedule.value ?? [];
      const previousHomeSchedule = previousSeasonHomeTeamSchedule.value ?? [];

      const currentSeasonH2hGameIds = getHeadToHeadGameIds(
        homeSchedule,
        awayTeamAbbrev.value,
        H2H_WINDOW_SIZE
      );
      const missingH2hCount = Math.max(0, H2H_WINDOW_SIZE - currentSeasonH2hGameIds.length);
      const previousSeasonH2hGameIds =
        missingH2hCount > 0
          ? getHeadToHeadGameIds(previousHomeSchedule, awayTeamAbbrev.value, missingH2hCount)
          : [];
      const h2hGameIds = [...currentSeasonH2hGameIds, ...previousSeasonH2hGameIds];
      const homeRecentGameIds = getRecentCompletedGameIds(homeSchedule, RECENT_WINDOW_SIZE);
      const awayRecentGameIds = getRecentCompletedGameIds(awaySchedule, RECENT_WINDOW_SIZE);

      const uniqueGameIds = Array.from(
        new Set([...h2hGameIds, ...homeRecentGameIds, ...awayRecentGameIds])
      );

      const boxscores = await Promise.all(
        uniqueGameIds.map((gameId) => ensureGameCenterBoxscore(queryClient, gameId))
      );

      const boxscoresByGameId = new Map<number, (typeof boxscores)[number]>();
      uniqueGameIds.forEach((gameId, index) => {
        boxscoresByGameId.set(gameId, boxscores[index]);
      });

      const h2hHomePlayers = buildTeamPlayerInsightGroup(
        homeTeamAbbrev.value,
        h2hGameIds,
        boxscoresByGameId,
        'h2h'
      );
      const h2hAwayPlayers = buildTeamPlayerInsightGroup(
        awayTeamAbbrev.value,
        h2hGameIds,
        boxscoresByGameId,
        'h2h'
      );
      const recentHomePlayers = buildTeamPlayerInsightGroup(
        homeTeamAbbrev.value,
        homeRecentGameIds,
        boxscoresByGameId,
        'recent'
      );
      const recentAwayPlayers = buildTeamPlayerInsightGroup(
        awayTeamAbbrev.value,
        awayRecentGameIds,
        boxscoresByGameId,
        'recent'
      );

      const h2hHomeTeamAngles = buildTeamAngleInsightGroup(
        homeTeamAbbrev.value,
        h2hGameIds,
        boxscoresByGameId,
        {
          sogLine: teamSogLine.value,
        }
      );
      const h2hAwayTeamAngles = buildTeamAngleInsightGroup(
        awayTeamAbbrev.value,
        h2hGameIds,
        boxscoresByGameId,
        {
          sogLine: teamSogLine.value,
        }
      );
      const recentHomeTeamAngles = buildTeamAngleInsightGroup(
        homeTeamAbbrev.value,
        homeRecentGameIds,
        boxscoresByGameId,
        {
          sogLine: teamSogLine.value,
        }
      );
      const recentAwayTeamAngles = buildTeamAngleInsightGroup(
        awayTeamAbbrev.value,
        awayRecentGameIds,
        boxscoresByGameId,
        {
          sogLine: teamSogLine.value,
        }
      );

      const playerHeadshotsById = new Map<number, string>();
      for (const player of homeTeamRoster.value?.forwards ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }
      for (const player of homeTeamRoster.value?.defensemen ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }
      for (const player of homeTeamRoster.value?.goalies ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }
      for (const player of awayTeamRoster.value?.forwards ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }
      for (const player of awayTeamRoster.value?.defensemen ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }
      for (const player of awayTeamRoster.value?.goalies ?? []) {
        if (player?.id && player.headshot) playerHeadshotsById.set(player.id, player.headshot);
      }

      const topPicks = buildMatchupTopPicks({
        homeTeamAbbrev: homeTeamAbbrev.value,
        awayTeamAbbrev: awayTeamAbbrev.value,
        h2hHomePlayers,
        h2hAwayPlayers,
        recentHomePlayers,
        recentAwayPlayers,
        h2hHomeTeamAngles,
        h2hAwayTeamAngles,
        recentHomeTeamAngles,
        recentAwayTeamAngles,
        teamSogLine: teamSogLine.value,
        playerHeadshotsById,
      });

      return {
        h2hGameIds,
        homeRecentGameIds,
        awayRecentGameIds,
        h2h: {
          home: h2hHomePlayers,
          away: h2hAwayPlayers,
        },
        recent: {
          home: recentHomePlayers,
          away: recentAwayPlayers,
        },
        teams: {
          h2h: {
            home: h2hHomeTeamAngles,
            away: h2hAwayTeamAngles,
          },
          recent: {
            home: recentHomeTeamAngles,
            away: recentAwayTeamAngles,
          },
        },
        topPicks,
      };
    },
  });

  const isLoading = computed(
    () =>
      isHomeScheduleLoading.value ||
      isAwayScheduleLoading.value ||
      isPreviousSeasonHomeScheduleLoading.value ||
      isHomeRosterLoading.value ||
      isAwayRosterLoading.value ||
      insightsQuery.isLoading.value
  );

  return {
    ...insightsQuery,
    isLoading,
  };
}
