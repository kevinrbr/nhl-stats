import { useQuery } from '@tanstack/vue-query';
import { getRostersByTeam } from '@/api/services/rosters.service';
import { type Ref, computed } from 'vue';

export function useTeamRoster(teamId: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['rosters', teamId.value]),
    queryFn: () => getRostersByTeam(teamId.value!),
    enabled: computed(() => !!teamId.value),
  });
}
