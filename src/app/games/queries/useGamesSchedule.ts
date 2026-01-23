import { useQuery } from "@tanstack/vue-query";
import { fetchGamesSchedule } from "@/api/services/games.service";
import { upcomingGamesPresenter } from "@/app/games/presenters/games.presenter";

export function useGamesSchedule() {
  return useQuery({
    queryKey: ["gamesSchedule"], 
    queryFn: async () => {
      const data = await fetchGamesSchedule();
      return upcomingGamesPresenter(data);
    },
  });
}