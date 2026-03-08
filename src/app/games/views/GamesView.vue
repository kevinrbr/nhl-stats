<script setup lang="ts">
import { ref } from 'vue';
import GamesSidebar from '@/app/games/components/GamesSidebar.vue';
import GameDetails from '@/app/games/components/GameDetails.vue';
import GameStatsPanel from '@/app/games/components/GameStatsPanel.vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';

const selectedGame = ref<UpcomingGame | null>(null);
const selectedStatsGameId = ref<number | null>(null);

const handleSelectGame = (game: UpcomingGame) => {
  selectedGame.value = game;
  selectedStatsGameId.value = game.id;
};

const handleSelectH2HGame = (gameId: number) => {
  selectedStatsGameId.value = gameId;
};

const handleOpenSelectedGameStats = (gameId: number) => {
  selectedStatsGameId.value = gameId;
};

const handleBackFromGameStats = () => {
  selectedStatsGameId.value = null;
};
</script>

<template>
  <section class="app-view app-split">
    <aside class="app-split-sidebar-wide">
      <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-4">
        <GamesSidebar @select-game="handleSelectGame" />
      </div>
    </aside>

    <section class="app-split-content">
      <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-6 min-h-[calc(100dvh-8rem)]">
        <GameStatsPanel
          v-if="selectedGame && selectedStatsGameId"
          :game-id="selectedStatsGameId"
          :fallback-game="selectedGame"
          @back="handleBackFromGameStats"
        />
        <GameDetails
          v-else-if="selectedGame"
          :game="selectedGame"
          @select-h2h-game="handleSelectH2HGame"
          @open-game-stats="handleOpenSelectedGameStats"
        />
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-zinc-400 text-lg">
            Select a game to view details
          </p>
        </div>
      </div>
    </section>
  </section>
</template>
