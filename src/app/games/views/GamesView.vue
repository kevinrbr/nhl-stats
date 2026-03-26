<script setup lang="ts">
import { ref } from 'vue';
import GamesSidebar from '@/app/games/components/GamesSidebar.vue';
import GameDetails from '@/app/games/components/GameDetails.vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';

const selectedGame = ref<UpcomingGame | null>(null);

const handleSelectGame = (game: UpcomingGame) => {
  selectedGame.value = game;
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
      <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-6 lg:p-7 min-h-[calc(100dvh-8rem)]">
        <GameDetails
          v-if="selectedGame"
          :game="selectedGame"
        />
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-zinc-300 text-xl font-medium">
            Select a game to view details
          </p>
        </div>
      </div>
    </section>
  </section>
</template>
