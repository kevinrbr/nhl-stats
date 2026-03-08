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
  <section class="app-view app-split">
    <aside class="app-split-sidebar">
      <PlayersSidebar
        :selected-player-id="selectedPlayerId"
        @select-player="handleSelectPlayer"
      />
    </aside>

    <section class="app-split-content">
      <PlayerDashboard
        :selected-player-id="selectedPlayerId"
        :selected-player="selectedPlayer"
      />
    </section>
  </section>
</template>
