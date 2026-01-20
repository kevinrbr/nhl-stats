import { useQuery } from "@tanstack/vue-query";
import { getTeamLastGamesWithDetails } from "@/api/services/teams.service";
import { teamLastGamesPresenter } from "../presenters/teams.presenter";
import type { Ref } from 'vue';

export function useTeamLastGames(team: Ref<string>) {
  return useQuery({
    queryKey: ["teams", "lastGames", team],
    queryFn: async () => {
      const data = await getTeamLastGamesWithDetails(team.value);
      return teamLastGamesPresenter(data, team.value);
    },
    // Optionnel : cache plus long car les données ne changent pas souvent
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}