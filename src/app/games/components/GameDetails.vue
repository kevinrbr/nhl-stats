<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import type { UpcomingGame } from '../presenters/games.presenter';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { useHeadToHead } from '../composables/useHeadToHead';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';

const props = defineProps<{
  game: UpcomingGame;
}>();

const emit = defineEmits<{
  (e: 'select-h2h-game', gameId: number): void;
  (e: 'open-game-stats', gameId: number): void;
}>();

const { game } = toRefs(props);
const COMPLETED_GAME_STATES = new Set(['OFF', 'FINAL']);
const router = useRouter();

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

const handleTeamClick = (teamAbbrev: string) => {
  void router.push(getTeamsRoute(teamAbbrev));
};

const handleOpenGameStats = () => {
  emit('open-game-stats', game.value.id);
};
</script>
<template>
  <div class="text-zinc-100 space-y-6">
    <div class="border-b border-zinc-700 pb-4">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="flex items-center gap-2 min-w-0">
        <img :src="game.homeTeam.logo" class="w-12 h-12" />
        <h2 class="text-2xl font-bold flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="bg-transparent border-0 p-0 hover:underline underline-offset-4"
            @click="handleTeamClick(game.homeTeam.abbrev)"
          >
            {{ game.homeTeam.name }}
          </button>
          <span class="text-zinc-400">vs</span>
          <button
            type="button"
            class="bg-transparent border-0 p-0 hover:underline underline-offset-4"
            @click="handleTeamClick(game.awayTeam.abbrev)"
          >
            {{ game.awayTeam.name }}
          </button>
        </h2>
        <img :src="game.awayTeam.logo" class="w-12 h-12" />
        </div>

        <button
          type="button"
          class="shrink-0 rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          @click="handleOpenGameStats"
        >
          Match stats
        </button>
      </div>
      <p class="text-zinc-400 text-sm">
        {{ game.dayAbbrev }} - {{ game.startTime }}
      </p>
    </div>

    <div v-if="isLoading" class="bg-zinc-800/80 rounded-lg p-4">
      <div class="animate-pulse space-y-2">
        <div class="h-3 bg-zinc-700 rounded w-1/2"></div>
        <div class="h-3 bg-zinc-700 rounded w-1/3"></div>
      </div>
    </div>

    <template v-else>
      <div v-if="headToHeadStats && headToHeadStats.total > 0" class="bg-zinc-800/80 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-zinc-400 mb-2">Season H2H</h3>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img :src="game.homeTeam.logo" class="w-6 h-6" />
            <button
              type="button"
              class="bg-transparent border-0 p-0 text-zinc-100 font-medium hover:underline underline-offset-2"
              @click="handleTeamClick(homeTeam)"
            >
              {{ homeTeam }}
            </button>
          </div>
          
          <div class="px-3 py-1 bg-zinc-700 rounded">
            <span class="text-zinc-100 text-lg font-bold">{{ headToHeadStats.record }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="bg-transparent border-0 p-0 text-zinc-100 font-medium hover:underline underline-offset-2"
              @click="handleTeamClick(awayTeam)"
            >
              {{ awayTeam }}
            </button>
            <img :src="game.awayTeam.logo" class="w-6 h-6" />
          </div>
        </div>

        <div v-if="headToHeadGames.length > 0" class="mt-4 space-y-2">
          <button
            v-for="h2hGame in headToHeadGames"
            :key="h2hGame.id"
            @click="handleH2HGameClick(h2hGame.id)"
            class="w-full bg-zinc-900 hover:bg-zinc-700/80 transition-colors rounded p-3 text-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <img 
                  :src="h2hGame.homeTeam.logo" 
                  class="w-6 h-6 flex-shrink-0"
                />
                <span
                  role="link"
                  tabindex="0"
                  class="text-zinc-100 text-xs truncate hover:underline underline-offset-2 cursor-pointer"
                  @click.stop="handleTeamClick(h2hGame.homeTeam.abbrev)"
                  @keydown.enter.stop.prevent="handleTeamClick(h2hGame.homeTeam.abbrev)"
                  @keydown.space.stop.prevent="handleTeamClick(h2hGame.homeTeam.abbrev)"
                >
                  {{ h2hGame.homeTeam.abbrev }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span 
                  class="text-sm font-bold"
                  :class="h2hGame.homeTeam.score > h2hGame.awayTeam.score ? 'text-green-400' : 'text-zinc-100'"
                >
                  {{ h2hGame.homeTeam.score }}
                </span>
                <span class="text-zinc-500 text-xs">-</span>
                <span 
                  class="text-sm font-bold"
                  :class="h2hGame.awayTeam.score > h2hGame.homeTeam.score ? 'text-green-400' : 'text-zinc-100'"
                >
                  {{ h2hGame.awayTeam.score }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span
                  role="link"
                  tabindex="0"
                  class="text-zinc-100 text-xs truncate hover:underline underline-offset-2 cursor-pointer"
                  @click.stop="handleTeamClick(h2hGame.awayTeam.abbrev)"
                  @keydown.enter.stop.prevent="handleTeamClick(h2hGame.awayTeam.abbrev)"
                  @keydown.space.stop.prevent="handleTeamClick(h2hGame.awayTeam.abbrev)"
                >
                  {{ h2hGame.awayTeam.abbrev }}
                </span>
                <img 
                  :src="h2hGame.awayTeam.logo" 
                  class="w-6 h-6 flex-shrink-0"
                />
              </div>

              <span class="text-zinc-500 text-xs flex-shrink-0">
                {{ new Date(h2hGame.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                }) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div v-else class="bg-zinc-800/80 rounded-lg p-4 text-center">
        <p class="text-zinc-400 text-sm">
          No previous matchups this season
        </p>
      </div>
    </template>
  </div>
</template>
