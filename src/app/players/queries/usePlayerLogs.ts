import { useQuery } from "@tanstack/vue-query";
import { getPlayerLog } from "@/api/services/playerLog.service";
import type { Ref } from "vue";

export function usePlayerLogs(playerId: Ref<string | undefined>) {
  console.log('ici query player log', playerId);
  return useQuery({
    queryKey: ["players", playerId],
    queryFn: async () => {
      const data = await getPlayerLog(playerId.value!);
      return data;
    },
  });
}