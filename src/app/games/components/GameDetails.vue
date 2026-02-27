<script setup lang="ts">
import { computed, toRefs } from 'vue';
import type { UpcomingGame } from '../presenters/games.presenter';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { useHeadToHead } from '../composables/useHeadToHead';

const props = defineProps<{
  game: UpcomingGame;
}>();

const emit = defineEmits<{
  (e: 'select-h2h-game', gameId: number): void;
}>();

const { game } = toRefs(props);
const COMPLETED_GAME_STATES = new Set(['OFF', 'FINAL']);

const homeTeam = computed(() => game.value.homeTeam.abbrev);
const awayTeam = computed(() => game.value.awayTeam.abbrev);

const { data: homeTeamSchedule, isLoading } = useTeamSchedule(homeTeam);
const homeTeamCompletedGames = computed(() => {
  if (!homeTeamSchedule.value) return [];
  return homeTeamSchedule.value.filter((scheduledGame) =>
    COMPLETED_GAME_STATES.has(scheduledGame.gameState)
  );
});

const { headToHeadGames, headToHeadStats } = useHeadToHead(
  homeTeamCompletedGames,
  awayTeam
);

const handleH2HGameClick = (gameId: number) => {
  emit('select-h2h-game', gameId);
};
</script>
<template>
  <div class="text-white space-y-6">
    <div class="border-b border-gray-700 pb-4">
      <div class="flex items-center gap-2 mb-2">
        <img :src="game.homeTeam.logo" class="w-12 h-12" />
        <h2 class="text-2xl font-bold">
          {{ game.homeTeam.name }} vs {{ game.awayTeam.name }}
        </h2>
        <img :src="game.awayTeam.logo" class="w-12 h-12" />
      </div>
      <p class="text-gray-400 text-sm">
        {{ game.dayAbbrev }} - {{ game.startTime }}
      </p>
    </div>

    <div v-if="isLoading" class="bg-gray-800 rounded-lg p-4">
      <div class="animate-pulse space-y-2">
        <div class="h-3 bg-gray-700 rounded w-1/2"></div>
        <div class="h-3 bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>

    <template v-else>
      <div v-if="headToHeadStats && headToHeadStats.total > 0" class="bg-gray-800 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-400 mb-2">Season H2H</h3>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img :src="game.homeTeam.logo" class="w-6 h-6" />
            <span class="text-white font-medium">{{ homeTeam }}</span>
          </div>
          
          <div class="px-3 py-1 bg-gray-700 rounded">
            <span class="text-white text-lg font-bold">{{ headToHeadStats.record }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-white font-medium">{{ awayTeam }}</span>
            <img :src="game.awayTeam.logo" class="w-6 h-6" />
          </div>
        </div>

        <div v-if="headToHeadGames.length > 0" class="mt-4 space-y-2">
          <button
            v-for="h2hGame in headToHeadGames"
            :key="h2hGame.id"
            @click="handleH2HGameClick(h2hGame.id)"
            class="w-full bg-gray-900 hover:bg-gray-700 transition-colors rounded p-3 text-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <img 
                  :src="h2hGame.homeTeam.logo" 
                  class="w-6 h-6 flex-shrink-0"
                />
                <span class="text-white text-xs truncate">
                  {{ h2hGame.homeTeam.abbrev }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span 
                  class="text-sm font-bold"
                  :class="h2hGame.homeTeam.score > h2hGame.awayTeam.score ? 'text-green-400' : 'text-white'"
                >
                  {{ h2hGame.homeTeam.score }}
                </span>
                <span class="text-gray-500 text-xs">-</span>
                <span 
                  class="text-sm font-bold"
                  :class="h2hGame.awayTeam.score > h2hGame.homeTeam.score ? 'text-green-400' : 'text-white'"
                >
                  {{ h2hGame.awayTeam.score }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span class="text-white text-xs truncate">
                  {{ h2hGame.awayTeam.abbrev }}
                </span>
                <img 
                  :src="h2hGame.awayTeam.logo" 
                  class="w-6 h-6 flex-shrink-0"
                />
              </div>

              <span class="text-gray-500 text-xs flex-shrink-0">
                {{ new Date(h2hGame.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                }) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div v-else class="bg-gray-800 rounded-lg p-4 text-center">
        <p class="text-gray-400 text-sm">
          No previous matchups this season
        </p>
      </div>
    </template>
  </div>
</template>
