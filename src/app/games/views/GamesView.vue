<script setup lang="ts">
import { ref } from 'vue';
import GamesSidebar from '@/app/games/components/GamesSidebar.vue';
import GameDetails from '@/app/games/components/GameDetails.vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';

const selectedGame = ref<UpcomingGame | null>(null);
const selectedH2HGameId = ref<number | null>(null);

const handleSelectGame = (game: UpcomingGame) => {
  selectedGame.value = game;
  selectedH2HGameId.value = null; // Reset h2h selection
};

const handleSelectH2HGame = (gameId: number) => {
  selectedH2HGameId.value = gameId;
  console.log('Selected H2H game:', gameId);
  // TODO: Afficher les détails de ce match spécifique
};
</script>

<template>
  <section class="flex h-screen">
    <aside class="w-[320px] pr-4 border-r border-gray-800">
      <GamesSidebar @select-game="handleSelectGame" />
    </aside>

    <section class="flex-1 p-6 overflow-y-auto">
      <GameDetails 
        v-if="selectedGame" 
        :game="selectedGame"
        @select-h2h-game="handleSelectH2HGame"
      />
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-400 text-lg">
          Select a game to view details
        </p>
      </div>
    </section>
  </section>
</template>