<script setup lang="ts">
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';

defineProps<{
  game: UpcomingGame;
}>();



const emit = defineEmits<{
  (e: 'select', game: UpcomingGame): void;
}>();
</script>

<template>
  <button
    @click="emit('select', game)"
    class="w-full hover:bg-gray-700 rounded-lg p-4 transition-colors border border-gray-700"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Home Team (à gauche) -->
      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.homeTeam.logo" 
          :alt="game.homeTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <span class="text-white text-sm font-medium">
          {{ game.homeTeam.abbrev }}
        </span>
      </div>

      <!-- Game Info -->
      <div class="flex flex-col items-center">
        <span class="text-gray-400 text-xs mb-1">{{ game.dayAbbrev }}</span>
        <span class="text-white text-sm font-semibold">{{ game.startTime }}</span>
      </div>

      <!-- Away Team (à droite avec @) -->
      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.awayTeam.logo" 
          :alt="game.awayTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <span class="text-white text-sm font-medium">
          @{{ game.awayTeam.abbrev }}
        </span>
      </div>
    </div>
  </button>
</template>