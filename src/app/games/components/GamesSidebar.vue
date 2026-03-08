<script setup lang="ts">
import type { UpcomingGame } from '../presenters/games.presenter';
import { useGamesSchedule } from '../queries/useGamesSchedule';
import GameCard from './GameCard.vue';

const emit = defineEmits<{
  (e: 'select-game', gameId: UpcomingGame): void;
}>();

const { data: gamesByDate, isLoading } = useGamesSchedule();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};
</script>

<template>
  <div>
    <h2 class="text-zinc-100 text-lg font-semibold mb-4 sticky top-0 pb-2 bg-zinc-900/95 backdrop-blur-sm">
      Upcoming Games
    </h2>

    <div v-if="isLoading" class="text-zinc-400 text-center py-8">
      Loading games...
    </div>

    <div v-else-if="gamesByDate" class="space-y-6">
      <div 
        v-for="dayGames in gamesByDate" 
        :key="dayGames.date"
        class="space-y-3"
      >
        <div class="sticky top-12 pb-2">
          <h3 class="text-zinc-300 text-xs font-semibold uppercase tracking-wide">
            {{ formatDate(dayGames.date) }}
          </h3>
        </div>

        <!-- Games List -->
        <div class="space-y-2">
          <GameCard
            v-for="game in dayGames.games"
            :key="game.id"
            :game="game"
            @select="emit('select-game', $event)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-zinc-400 text-center py-8">
      No upcoming games
    </div>
  </div>
</template>
