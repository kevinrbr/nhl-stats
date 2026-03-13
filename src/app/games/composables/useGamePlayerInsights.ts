import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { MatchupPlayerInsights } from '@/app/games/types/gamePlayerInsights';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { useTeamScheduleBySeason } from '@/app/teams/queries/useTeamScheduleBySeason';
import { getNhlSeasonIdFromDate, getPreviousNhlSeasonId } from '@/app/teams/utils/season';
import { ensureGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';
import {
  buildMatchupStyleTags,
  buildMatchupStyleTheoreticalEdge,
  buildMatchupStyleSimilarity,
  buildTeamAngleInsightGroup,
  buildTeamPlayerInsightGroup,
  buildTeamStyleProfile,
  buildTeamStyleSimilarGames,
  getHeadToHeadGameIds,
  getRecentCompletedGameIds,
} from '@/app/games/utils/gamePlayerInsights';

const H2H_WINDOW_SIZE = 3;
const RECENT_WINDOW_SIZE = 5;
const STYLE_WINDOW_SIZE = 10;

export function useGamePlayerInsights(game: Ref<UpcomingGame | null>) {
  const queryClient = useQueryClient();

  const homeTeamAbbrev = computed(() => game.value?.homeTeam.abbrev ?? '');
  const awayTeamAbbrev = computed(() => game.value?.awayTeam.abbrev ?? '');

  const { data: homeTeamSchedule, isLoading: isHomeScheduleLoading } = useTeamSchedule(homeTeamAbbrev);
  const { data: awayTeamSchedule, isLoading: isAwayScheduleLoading } = useTeamSchedule(awayTeamAbbrev);

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
      const homeStyleGameIds = getRecentCompletedGameIds(homeSchedule, STYLE_WINDOW_SIZE);
      const awayStyleGameIds = getRecentCompletedGameIds(awaySchedule, STYLE_WINDOW_SIZE);

      const uniqueGameIds = Array.from(
        new Set([
          ...h2hGameIds,
          ...homeRecentGameIds,
          ...awayRecentGameIds,
          ...homeStyleGameIds,
          ...awayStyleGameIds,
        ])
      );

      const boxscores = await Promise.all(
        uniqueGameIds.map((gameId) => ensureGameCenterBoxscore(queryClient, gameId))
      );

      const boxscoresByGameId = new Map<number, (typeof boxscores)[number]>();
      uniqueGameIds.forEach((gameId, index) => {
        boxscoresByGameId.set(gameId, boxscores[index]);
      });

      const homeStyleProfile = buildTeamStyleProfile(
        homeTeamAbbrev.value,
        homeStyleGameIds,
        boxscoresByGameId
      );
      const awayStyleProfile = buildTeamStyleProfile(
        awayTeamAbbrev.value,
        awayStyleGameIds,
        boxscoresByGameId
      );

      return {
        h2hGameIds,
        homeRecentGameIds,
        awayRecentGameIds,
        homeStyleGameIds,
        awayStyleGameIds,
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
        style: {
          home: homeStyleProfile,
          away: awayStyleProfile,
          similarity: buildMatchupStyleSimilarity(homeStyleProfile, awayStyleProfile),
          matchupTags: buildMatchupStyleTags(homeStyleProfile, awayStyleProfile),
          edge: buildMatchupStyleTheoreticalEdge(
            homeStyleProfile,
            awayStyleProfile,
            homeTeamAbbrev.value,
            awayTeamAbbrev.value
          ),
          similarGames: {
            home: buildTeamStyleSimilarGames(
              homeTeamAbbrev.value,
              homeStyleGameIds,
              boxscoresByGameId,
              awayStyleProfile,
              awayTeamAbbrev.value
            ),
            away: buildTeamStyleSimilarGames(
              awayTeamAbbrev.value,
              awayStyleGameIds,
              boxscoresByGameId,
              homeStyleProfile,
              homeTeamAbbrev.value
            ),
          },
        },
      };
    },
  });

  const isLoading = computed(
    () =>
      isHomeScheduleLoading.value ||
      isAwayScheduleLoading.value ||
      isPreviousSeasonHomeScheduleLoading.value ||
      insightsQuery.isLoading.value
  );

  return {
    ...insightsQuery,
    isLoading,
  };
}
