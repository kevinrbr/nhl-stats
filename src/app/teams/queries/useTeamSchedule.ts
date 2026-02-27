import { useQuery } from '@tanstack/vue-query';
import { extractTeamScheduleGames, getTeamSchedule } from '@/api/services/teams.service';
import { teamSchedulePresenter } from '../presenters/teams.presenter';
import { computed, type Ref } from 'vue';

export function useTeamSchedule(team: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['teams', 'schedule', team.value]),
    queryFn: async () => {
      const data = await getTeamSchedule(team.value);
      const games = extractTeamScheduleGames(data);

      return teamSchedulePresenter(
        games as Parameters<typeof teamSchedulePresenter>[0],
        team.value
      );
    },
    enabled: computed(() => !!team.value),
    staleTime: 5 * 60 * 1000,
  });
}
