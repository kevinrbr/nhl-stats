import { useQuery, type QueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { fetchGameCenterBoxscore } from '@/api/services/gamecenter.service';

export const createGameCenterBoxscoreQueryKey = (gameId: number) =>
  ['gamecenter-boxscore', gameId] as const;

export async function ensureGameCenterBoxscore(
  queryClient: QueryClient,
  gameId: number
) {
  return queryClient.ensureQueryData({
    queryKey: createGameCenterBoxscoreQueryKey(gameId),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => fetchGameCenterBoxscore(gameId),
  });
}

export function useGameCenterBoxscore(gameId: Ref<number>) {
  const queryKey = computed(() => createGameCenterBoxscoreQueryKey(gameId.value));
  const isEnabled = computed(() => Number.isFinite(gameId.value) && gameId.value > 0);

  return useQuery({
    queryKey,
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async ({ queryKey: key }) => {
      const [, currentGameId] = key;
      return fetchGameCenterBoxscore(currentGameId);
    },
  });
}
