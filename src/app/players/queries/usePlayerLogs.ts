import { useQuery } from "@tanstack/vue-query";
import { getPlayerLog } from "@/api/services/playerLog.service";
import { computed, type Ref } from "vue";

export function usePlayerLogs(playerId: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ["players", "logs", playerId.value]),
    enabled: computed(() => !!playerId.value),
    queryFn: async () => {
      const data = await getPlayerLog(playerId.value!);
      return data.gameLog;
    },
  });
}
