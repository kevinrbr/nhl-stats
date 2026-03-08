import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import {
  getPlayerShotZones,
  type PlayerShotZonesParams,
} from '@/api/services/playerShots.service';

export function usePlayerShootingZonesQuery(
  playerId: Ref<string>,
  params: PlayerShotZonesParams = {}
) {
  const season = params.season ?? '20252026';
  const gameType = params.gameType ?? '2';

  return useQuery({
    queryKey: computed(() => [
      'players',
      'shooting-zones',
      playerId.value,
      season,
      gameType,
    ]),
    enabled: computed(() => !!playerId.value),
    queryFn: async () => getPlayerShotZones(playerId.value, { season, gameType }),
  });
}
