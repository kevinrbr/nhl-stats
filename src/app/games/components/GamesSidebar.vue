<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UpcomingGame } from '../presenters/games.presenter';
import { useGamesSchedule } from '../queries/useGamesSchedule';
import GameCard from './GameCard.vue';

type GamesSidebarTab = 'upcoming' | 'past';

const emit = defineEmits<{
  (e: 'select-game', gameId: UpcomingGame): void;
}>();

const props = withDefaults(defineProps<{
  isPremium?: boolean;
}>(), {
  isPremium: false,
});

const { data: gamesByDate, isLoading } = useGamesSchedule();
const activeTab = ref<GamesSidebarTab>('upcoming');

const displayedGamesByDate = computed(() => {
  if (!gamesByDate.value) return [];
  return activeTab.value === 'upcoming'
    ? gamesByDate.value.upcomingGames
    : gamesByDate.value.pastGames;
});

const hasUpcomingGames = computed(() => (gamesByDate.value?.upcomingGames.length ?? 0) > 0);
const hasPastGames = computed(() => (gamesByDate.value?.pastGames.length ?? 0) > 0);

const emptyMessage = computed(() =>
  activeTab.value === 'upcoming'
    ? 'No upcoming games'
    : 'No past games available'
);

const freeGameId = computed<number | null>(() => {
  const upcomingFirst = gamesByDate.value?.upcomingGames?.[0]?.games?.[0]?.id;
  if (typeof upcomingFirst === 'number') return upcomingFirst;

  const pastFirst = gamesByDate.value?.pastGames?.[0]?.games?.[0]?.id;
  if (typeof pastFirst === 'number') return pastFirst;

  return null;
});

const displayedGamesByDateWithAccess = computed(() => {
  const unlockedGameId = freeGameId.value;

  return displayedGamesByDate.value.map((day) => ({
    ...day,
    gamesWithAccess: day.games.map((game) => ({
      game,
      locked: !props.isPremium && unlockedGameId !== null && game.id !== unlockedGameId,
    })),
  }));
});

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
    <div class="sticky top-0 z-10 pb-2 bg-zinc-900/95 backdrop-blur-sm space-y-3">
      <h2 class="text-zinc-100 text-lg font-semibold">Games</h2>
      <div class="inline-flex rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-1">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="activeTab === 'upcoming'
            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
            : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70'"
          @click="activeTab = 'upcoming'"
        >
          Upcoming
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="activeTab === 'past'
            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
            : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70'"
          @click="activeTab = 'past'"
        >
          Past
        </button>
      </div>
      <p class="text-[11px] uppercase tracking-wide text-zinc-500">
        <template v-if="activeTab === 'upcoming'">
          {{ hasUpcomingGames ? 'Upcoming games available' : 'No upcoming games in schedule' }}
        </template>
        <template v-else>
          {{ hasPastGames ? 'Recent completed games available' : 'No completed games in history' }}
        </template>
      </p>
    </div>

    <div v-if="isLoading" class="text-zinc-400 text-center py-8">
      Loading games...
    </div>

    <div v-else-if="displayedGamesByDateWithAccess.length" class="space-y-6">
      <div 
        v-for="dayGames in displayedGamesByDateWithAccess" 
        :key="dayGames.date"
        class="space-y-3"
      >
        <div class="sticky top-12 pb-2">
          <h3 class="text-zinc-300 text-xs font-semibold uppercase tracking-wide">
            {{ formatDate(dayGames.date) }}
          </h3>
        </div>

        <div class="space-y-2">
          <GameCard
            v-for="{ game, locked } in dayGames.gamesWithAccess"
            :key="game.id"
            :game="game"
            :locked="locked"
            @select="emit('select-game', $event)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-zinc-400 text-center py-8">
      {{ emptyMessage }}
    </div>
  </div>
</template>
