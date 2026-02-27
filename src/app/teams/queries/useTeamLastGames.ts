import { useQuery } from "@tanstack/vue-query";
import { getTeamLastGamesWithDetails } from "@/api/services/teams.service";
import { teamLastGamesPresenter } from "../presenters/teams.presenter";
import type { TeamScheduleGame } from "../presenters/teams.presenter";
import { computed, type Ref } from 'vue';

type UseTeamLastGamesOptions = {
  maxGames?: number;
  scheduleGames?: Ref<TeamScheduleGame[] | undefined>;
};

export function useTeamLastGames(
  team: Ref<string>,
  options: UseTeamLastGamesOptions = {}
) {
  const maxGames = options.maxGames ?? 30;

  return useQuery({
    queryKey: computed(() => ["teams", "lastGames", team.value, maxGames]),
    enabled: computed(() => {
      if (!team.value) return false;
      if (!options.scheduleGames) return true;
      return options.scheduleGames.value !== undefined;
    }),
    queryFn: async () => {
      const scheduleGames = options.scheduleGames?.value?.map((game) => ({
        id: game.id,
        date: game.date,
        gameState: game.gameState,
      }));

      const data = await getTeamLastGamesWithDetails(team.value, {
        maxGames,
        scheduleGames,
      });
      return teamLastGamesPresenter(data, team.value);
    },
    // Optionnel : cache plus long car les données ne changent pas souvent
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
