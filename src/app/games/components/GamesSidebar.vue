<script setup lang="ts">
import { useGamesSchedule } from '../queries/useGamesSchedule';
import GameCard from './GameCard.vue';

const emit = defineEmits<{
  (e: 'select-game', gameId: number): void;
}>();

const { data: gamesByDate, isLoading } = useGamesSchedule();
console.log(gamesByDate);
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
  <div class="h-full overflow-y-auto">
    <h2 class="text-white text-xl font-bold mb-4 sticky top-0 pb-2">
      Upcoming Games
    </h2>

    <div v-if="isLoading" class="text-gray-400 text-center py-8">
      Loading games...
    </div>

    <div v-else-if="gamesByDate" class="space-y-6">
      <div 
        v-for="dayGames in gamesByDate" 
        :key="dayGames.date"
        class="space-y-3"
      >
        <div class="sticky top-12 pb-2">
          <h3 class="text-gray-300 text-sm font-semibold uppercase tracking-wide">
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

    <div v-else class="text-gray-400 text-center py-8">
      No upcoming games
    </div>
  </div>
</template>