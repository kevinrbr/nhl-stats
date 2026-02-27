<script setup lang="ts">
import { computed } from 'vue';
import type { TeamTravelStatus } from '@/app/teams/composables/useTeamRoadTrip';

const emit = defineEmits<{
  (e: 'select-team', teamAbbrev: string): void;
}>();

const props = withDefaults(defineProps<{
  travelStatus: TeamTravelStatus | null;
  isLoading?: boolean;
}>(), {
  isLoading: false,
});

const nextOpponent = computed(() => {
  if (!props.travelStatus) return null;

  return props.travelStatus.nextGame.isHome
    ? props.travelStatus.nextGame.awayTeam
    : props.travelStatus.nextGame.homeTeam;
});

const nextGameDateLabel = computed(() => {
  if (!props.travelStatus) return '-';

  const date = new Date(props.travelStatus.nextGame.date);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
});

const nextGameWhenLabel = computed(() => {
  if (!props.travelStatus) return '-';

  const days = props.travelStatus.daysUntilNextGame;
  if (days === 0) return "Today";
  if (days === 1) return 'Tomorrow';
  return `In ${days}d`;
});

const venueLabel = computed(() => {
  if (!props.travelStatus) return '-';
  return props.travelStatus.nextGame.isHome ? 'Home' : 'Away';
});

const canSelectOpponent = computed(() => Boolean(nextOpponent.value?.abbrev));

const handleOpponentClick = () => {
  if (!nextOpponent.value?.abbrev) return;
  emit('select-team', nextOpponent.value.abbrev);
};
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="text-zinc-100 text-sm font-semibold">Next Game</h3>
      <span class="text-zinc-400 text-xs">{{ nextGameWhenLabel }}</span>
    </div>

    <div v-if="props.isLoading" class="space-y-2">
      <div class="h-10 rounded bg-zinc-800/70 animate-pulse"></div>
      <div class="h-10 rounded bg-zinc-800/70 animate-pulse"></div>
    </div>

    <div v-else-if="props.travelStatus && nextOpponent" class="space-y-3">
      <button
        type="button"
        :disabled="!canSelectOpponent"
        class="w-full flex items-center gap-3 text-left rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 transition-colors hover:bg-zinc-900/70 disabled:opacity-70 disabled:cursor-default"
        @click="handleOpponentClick"
      >
        <img
          :src="nextOpponent.logo"
          :alt="nextOpponent.name"
          class="w-8 h-8 object-contain"
        />
        <div class="min-w-0">
          <p class="text-zinc-100 text-base font-semibold truncate">{{ nextOpponent.name }}</p>
          <p class="text-zinc-400 text-xs">{{ venueLabel }} · {{ nextGameDateLabel }}</p>
        </div>
      </button>

      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <p class="text-zinc-500 text-[11px] uppercase tracking-wide">Travel</p>
          <p class="text-zinc-100 text-sm font-semibold mt-1">
            {{ props.travelStatus.nextLegDistanceKm.toLocaleString() }} km
          </p>
        </div>
        <div class="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <p class="text-zinc-500 text-[11px] uppercase tracking-wide">Rest</p>
          <p class="text-zinc-100 text-sm font-semibold mt-1">{{ props.travelStatus.restDays }}j</p>
        </div>
      </div>
    </div>

    <div v-else class="text-zinc-400 text-sm py-2">
      Next game unavailable.
    </div>
  </div>
</template>
