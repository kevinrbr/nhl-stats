<script setup lang="ts">
import PlayerDashboard from '@/app/players/components/PlayerDashboard.vue';
import PlayersSidebar from '@/app/players/components/PlayersSidebar.vue';
import { ref } from 'vue';

const selectedPlayerId = ref<string>('8482947')

const handleSelectPlayer = (playerId: number) => {
  selectedPlayerId.value = playerId.toString();
}

</script>

<template>
  <section class="flex">
    <aside class="w-[250px] pr-4">
      <PlayersSidebar @select-player="handleSelectPlayer" />
    </aside>

    <section class="flex-1">
      <PlayerDashboard :selected-player-id="selectedPlayerId" />
    </section>
  </section>
</template>