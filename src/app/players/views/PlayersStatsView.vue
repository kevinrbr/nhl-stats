<script setup lang="ts">
import PlayerDashboard from '@/app/players/components/PlayerDashboard.vue';
import PlayersSidebar from '@/app/players/components/PlayersSidebar.vue';
import type { Player } from '@/app/players/types/player';
import { ref } from 'vue';

const selectedPlayerId = ref<string>('8482947');
const selectedPlayer = ref<Player | null>(null);

const handleSelectPlayer = (player: Player) => {
  selectedPlayerId.value = player.id.toString();
  selectedPlayer.value = player;
};

</script>

<template>
  <section class="flex">
    <aside
      class="w-[250px] pr-4 sticky self-start top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain"
    >
      <PlayersSidebar
        :selected-player-id="selectedPlayerId"
        @select-player="handleSelectPlayer"
      />
    </aside>

    <section class="flex-1">
      <PlayerDashboard
        :selected-player-id="selectedPlayerId"
        :selected-player="selectedPlayer"
      />
    </section>
  </section>
</template>
