import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { extractTeamScheduleGames, getTeamScheduleBySeason } from '@/api/services/teams.service';
import { teamSchedulePresenter } from '@/app/teams/presenters/teams.presenter';

export function useTeamScheduleBySeason(
  team: Ref<string>,
  seasonId: Ref<string>,
  isEnabled?: Ref<boolean>
) {
  return useQuery({
    queryKey: computed(() => ['teams', 'schedule', team.value, seasonId.value]),
    queryFn: async () => {
      const data = await getTeamScheduleBySeason(team.value, seasonId.value);
      const games = extractTeamScheduleGames(data);

      return teamSchedulePresenter(
        games as Parameters<typeof teamSchedulePresenter>[0],
        team.value
      );
    },
    enabled: computed(
      () => Boolean(team.value && seasonId.value) && (isEnabled?.value ?? true)
    ),
    staleTime: 5 * 60 * 1000,
  });
}
