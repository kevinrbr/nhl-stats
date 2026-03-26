import { useQuery } from "@tanstack/vue-query";
import {
  fetchGamesSchedule,
  fetchGamesScheduleByDate,
  fetchPartnerGameOdds,
} from "@/api/services/games.service";
import {
  pastGamesPresenter,
  upcomingGamesPresenter,
} from "@/app/games/presenters/games.presenter";

const MAX_HISTORY_PAGES = 5;

function getPreviousStartDate(payload: unknown): string | null {
  const previousStartDate = (payload as { previousStartDate?: unknown })?.previousStartDate;
  if (typeof previousStartDate !== "string" || !previousStartDate.trim()) return null;
  return previousStartDate;
}

async function fetchHistorySchedules(initialSchedule: unknown): Promise<unknown[]> {
  const schedules: unknown[] = [initialSchedule];
  const visitedDates = new Set<string>();
  let previousStartDate = getPreviousStartDate(initialSchedule);
  let pageCount = 0;

  while (previousStartDate && pageCount < MAX_HISTORY_PAGES) {
    if (visitedDates.has(previousStartDate)) break;
    visitedDates.add(previousStartDate);

    const previousSchedule = await fetchGamesScheduleByDate(previousStartDate).catch(() => null);
    if (!previousSchedule) break;

    schedules.push(previousSchedule);
    previousStartDate = getPreviousStartDate(previousSchedule);
    pageCount += 1;
  }

  return schedules;
}

export function useGamesSchedule() {
  return useQuery({
    queryKey: ["gamesSchedule"], 
    queryFn: async () => {
      const [scheduleData, oddsData] = await Promise.all([
        fetchGamesSchedule(),
        fetchPartnerGameOdds("US").catch(() => null),
      ]);

      const historySchedules = await fetchHistorySchedules(scheduleData);

      return {
        upcomingGames: upcomingGamesPresenter(scheduleData, oddsData),
        pastGames: pastGamesPresenter(historySchedules),
      };
    },
  });
}
