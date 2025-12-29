import { getStandings } from "@/api/services/standings.service";
import { useQuery } from "@tanstack/vue-query";
import { standingsPresenter } from "../presenters/standings.presenter";

export function useStandingsQuery() {
  return useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const data = await getStandings();
      return standingsPresenter(data.standings);
    },
  });
}