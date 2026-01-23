<script setup lang="ts">
import { ref } from 'vue';
import GamesSidebar from '@/app/games/components/GamesSidebar.vue';
import GameDetails from '@/app/games/components/GameDetails.vue';

const selectedGameId = ref<number | null>(null);

const handleSelectGame = (gameId: number) => {
  selectedGameId.value = gameId;
};
</script>

<template>
  <section class="flex h-screen">
    <aside class="w-[320px] pr-4">
      <GamesSidebar @select-game="handleSelectGame" />
    </aside>

    <section class="flex-1 p-6">
      <GameDetails v-if="selectedGameId" :game-id="selectedGameId" />
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-400 text-lg">
          Select a game to view details
        </p>
      </div>
    </section>
  </section>
</template>