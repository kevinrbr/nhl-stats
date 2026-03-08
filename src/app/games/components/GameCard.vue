<script setup lang="ts">
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import { RouterLink } from 'vue-router';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';

defineProps<{
  game: UpcomingGame;
}>();

const emit = defineEmits<{
  (e: 'select', game: UpcomingGame): void;
}>();
</script>

<template>
  <div
    role="button"
    tabindex="0"
    @click="emit('select', game)"
    @keydown.enter.prevent="emit('select', game)"
    @keydown.space.prevent="emit('select', game)"
    class="w-full rounded-lg p-4 transition-colors border border-zinc-800/90 bg-zinc-950/35 hover:bg-zinc-800/55 cursor-pointer"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Home Team (à gauche) -->
      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.homeTeam.logo" 
          :alt="game.homeTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <RouterLink
          :to="getTeamsRoute(game.homeTeam.abbrev)"
          class="text-zinc-100 text-sm font-medium hover:underline underline-offset-2"
          @click.stop
        >
          {{ game.homeTeam.abbrev }}
        </RouterLink>
      </div>

      <!-- Game Info -->
      <div class="flex flex-col items-center">
        <span class="text-zinc-400 text-xs mb-1">{{ game.dayAbbrev }}</span>
        <span class="text-zinc-100 text-sm font-semibold">{{ game.startTime }}</span>
      </div>

      <!-- Away Team (à droite avec @) -->
      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.awayTeam.logo" 
          :alt="game.awayTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <RouterLink
          :to="getTeamsRoute(game.awayTeam.abbrev)"
          class="text-zinc-100 text-sm font-medium hover:underline underline-offset-2"
          @click.stop
        >
          @{{ game.awayTeam.abbrev }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
