import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { fetchGameCenterBoxscore } from '@/api/services/gamecenter.service';

export function useGameCenterBoxscore(gameId: Ref<number>) {
  const queryKey = computed(() => ['gamecenter-boxscore', gameId.value] as const);
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
