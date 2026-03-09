<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import type { TeamGameDetails } from '@/app/teams/presenters/teams.presenter';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';
import TeamRecentGameStats from '@/app/teams/components/TeamRecentGameStats.vue';

const props = withDefaults(defineProps<{
  games?: TeamGameDetails[];
  isLoading?: boolean;
  limit?: number;
}>(), {
  games: () => [],
  isLoading: false,
  limit: 10,
});

const recentGames = computed(() => {
  // Prendre les X derniers matchs (du plus récent au plus ancien)
  return [...props.games]
    .reverse()
    .slice(0, props.limit);
});

const selectedGameId = ref<number | null>(null);

const handleSelectGame = (gameId: number) => {
  selectedGameId.value = selectedGameId.value === gameId ? null : gameId;
};

const getGameResult = (game: TeamGameDetails) => {
  const teamScore = game.isHome ? game.homeTeam.score : game.awayTeam.score;
  const opponentScore = game.isHome ? game.awayTeam.score : game.homeTeam.score;
  
  if (teamScore > opponentScore) return 'W';
  if (teamScore < opponentScore) return 'L';
  return 'T';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
};
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
    <h3 class="text-zinc-100 text-sm font-semibold mb-3">Recent Games</h3>
    <!-- Loading -->
    <div v-if="props.isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-8 bg-zinc-800/70 rounded"></div>
      </div>
    </div>

    <!-- Games Table -->
    <div v-else-if="recentGames.length > 0" class="space-y-2">
      <div
        v-for="game in recentGames"
        :key="game.id"
        class="rounded-lg border border-transparent hover:border-zinc-800/70 transition-colors"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 py-2 px-2 hover:bg-zinc-800/60 rounded transition-colors text-xs text-left"
          @click="handleSelectGame(game.id)"
        >
        <!-- Result Badge -->
        <div 
          class="w-5 h-5 rounded flex items-center justify-center font-bold flex-shrink-0"
          :class="{
            'bg-green-600 text-white': getGameResult(game) === 'W',
            'bg-red-600 text-white': getGameResult(game) === 'L',
            'bg-zinc-600 text-white': getGameResult(game) === 'T'
          }"
        >
          {{ getGameResult(game) }}
        </div>

        <!-- Home Team -->
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <img 
            :src="game.homeTeam.logo" 
            :alt="game.homeTeam.name"
            class="w-5 h-5 flex-shrink-0"
          />
          <RouterLink
            :to="getTeamsRoute(game.homeTeam.abbrev)"
            class="text-zinc-100 truncate hover:text-zinc-200 hover:underline underline-offset-2"
          >
            {{ game.homeTeam.abbrev }}
          </RouterLink>
        </div>

        <!-- Score -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <span 
            class="font-bold"
            :class="game.homeTeam.score > game.awayTeam.score ? 'text-zinc-100' : 'text-zinc-400'"
          >
            {{ game.homeTeam.score }}
          </span>
          <span class="text-zinc-500">-</span>
          <span 
            class="font-bold"
            :class="game.awayTeam.score > game.homeTeam.score ? 'text-zinc-100' : 'text-zinc-400'"
          >
            {{ game.awayTeam.score }}
          </span>
        </div>

        <!-- Away Team -->
        <div class="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <RouterLink
            :to="getTeamsRoute(game.awayTeam.abbrev)"
            class="text-zinc-100 truncate hover:text-zinc-200 hover:underline underline-offset-2"
          >
            {{ game.awayTeam.abbrev }}
          </RouterLink>
          <img 
            :src="game.awayTeam.logo" 
            :alt="game.awayTeam.name"
            class="w-5 h-5 flex-shrink-0"
          />
        </div>

        <!-- Date -->
        <span class="text-zinc-400 text-xs flex-shrink-0 w-12 text-right">
          {{ formatDate(game.date) }}
        </span>
        </button>

        <div v-if="selectedGameId === game.id" class="p-2 pt-3">
          <TeamRecentGameStats
            :game-id="game.id"
            :home-team="game.homeTeam"
            :away-team="game.awayTeam"
          />
        </div>
      </div>
    </div>

    <!-- No Games -->
    <div v-else class="text-zinc-400 text-center py-4 text-sm">
      No recent games
    </div>
  </div>
</template>
