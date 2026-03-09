import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { MatchupPlayerInsights } from '@/app/games/types/gamePlayerInsights';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { ensureGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';
import {
  buildTeamAngleInsightGroup,
  buildTeamPlayerInsightGroup,
  getHeadToHeadGameIds,
  getRecentCompletedGameIds,
} from '@/app/games/utils/gamePlayerInsights';

const H2H_WINDOW_SIZE = 3;
const RECENT_WINDOW_SIZE = 5;

export function useGamePlayerInsights(game: Ref<UpcomingGame | null>) {
  const queryClient = useQueryClient();

  const homeTeamAbbrev = computed(() => game.value?.homeTeam.abbrev ?? '');
  const awayTeamAbbrev = computed(() => game.value?.awayTeam.abbrev ?? '');

  const { data: homeTeamSchedule, isLoading: isHomeScheduleLoading } = useTeamSchedule(homeTeamAbbrev);
  const { data: awayTeamSchedule, isLoading: isAwayScheduleLoading } = useTeamSchedule(awayTeamAbbrev);

  const insightsQuery = useQuery({
    queryKey: computed(
      () =>
        [
          'games',
          'player-insights',
          homeTeamAbbrev.value,
          awayTeamAbbrev.value,
          game.value?.id ?? 0,
        ] as const
    ),
    enabled: computed(
      () =>
        Boolean(
          game.value &&
            homeTeamAbbrev.value &&
            awayTeamAbbrev.value &&
            homeTeamSchedule.value &&
            awayTeamSchedule.value
        )
    ),
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<MatchupPlayerInsights> => {
      const homeSchedule = homeTeamSchedule.value ?? [];
      const awaySchedule = awayTeamSchedule.value ?? [];

      const h2hGameIds = getHeadToHeadGameIds(homeSchedule, awayTeamAbbrev.value, H2H_WINDOW_SIZE);
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

      return {
        h2hGameIds,
        homeRecentGameIds,
        awayRecentGameIds,
        h2h: {
          home: buildTeamPlayerInsightGroup(homeTeamAbbrev.value, h2hGameIds, boxscoresByGameId, 'h2h'),
          away: buildTeamPlayerInsightGroup(awayTeamAbbrev.value, h2hGameIds, boxscoresByGameId, 'h2h'),
        },
        recent: {
          home: buildTeamPlayerInsightGroup(
            homeTeamAbbrev.value,
            homeRecentGameIds,
            boxscoresByGameId,
            'recent'
          ),
          away: buildTeamPlayerInsightGroup(
            awayTeamAbbrev.value,
            awayRecentGameIds,
            boxscoresByGameId,
            'recent'
          ),
        },
        teams: {
          h2h: {
            home: buildTeamAngleInsightGroup(homeTeamAbbrev.value, h2hGameIds, boxscoresByGameId),
            away: buildTeamAngleInsightGroup(awayTeamAbbrev.value, h2hGameIds, boxscoresByGameId),
          },
          recent: {
            home: buildTeamAngleInsightGroup(homeTeamAbbrev.value, homeRecentGameIds, boxscoresByGameId),
            away: buildTeamAngleInsightGroup(awayTeamAbbrev.value, awayRecentGameIds, boxscoresByGameId),
          },
        },
      };
    },
  });

  const isLoading = computed(
    () => isHomeScheduleLoading.value || isAwayScheduleLoading.value || insightsQuery.isLoading.value
  );

  return {
    ...insightsQuery,
    isLoading,
  };
}
