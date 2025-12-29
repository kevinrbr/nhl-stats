import { useQuery } from "@tanstack/vue-query";
import { getTeamsLastGames } from "@/api/services/teams.service";
import { teamLastGamesPresenter } from "../presenters/teams.presenter";

export function useTeamLastGames(team: string) {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const data = await getTeamsLastGames(team);
      return teamLastGamesPresenter(data, team);
    },
  });
}