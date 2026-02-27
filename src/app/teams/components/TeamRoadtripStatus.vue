<script setup lang="ts">
import { computed } from 'vue';
import type { TeamTravelStatus } from '@/app/teams/composables/useTeamRoadTrip';

const props = withDefaults(defineProps<{
  travelStatus: TeamTravelStatus | null;
  isLoading?: boolean;
}>(), {
  isLoading: false,
});

const travelStatus = computed(() => props.travelStatus);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getFatigueUi = (score: number): { label: string; textClass: string; barClass: string } => {
  if (score <= 3) {
    return {
      label: 'Low',
      textClass: 'text-emerald-300',
      barClass: 'bg-emerald-500',
    };
  }

  if (score <= 6) {
    return {
      label: 'Medium',
      textClass: 'text-zinc-300',
      barClass: 'bg-zinc-500',
    };
  }

  if (score <= 8) {
    return {
      label: 'High',
      textClass: 'text-amber-300',
      barClass: 'bg-amber-500',
    };
  }

  return {
    label: 'Very high',
    textClass: 'text-rose-300',
    barClass: 'bg-rose-500',
  };
};

const fatigueUi = computed(() => getFatigueUi(props.travelStatus?.fatigueScore ?? 0));

const awayStreakLabel = computed(() => {
  if (!props.travelStatus || props.travelStatus.awayStreakGames === 0) return '0';
  return `${props.travelStatus.awayStreakGames} (${props.travelStatus.awayStreakWindowDays}j)`;
});

const situationTitle = computed(() => {
  if (!props.travelStatus) return '-';

  switch (props.travelStatus.scenario) {
    case 'home-to-home':
      return `${props.travelStatus.restDays}j de repos`;
    case 'away-to-home':
      return props.travelStatus.daysUntilNextGame === 0
        ? "Retour a domicile aujourd'hui"
        : `Retour a domicile dans ${props.travelStatus.daysUntilNextGame}j`;
    case 'home-to-away':
      return props.travelStatus.daysUntilNextGame === 0
        ? "Depart aujourd'hui"
        : `Depart dans ${props.travelStatus.daysUntilNextGame}j`;
    default:
      return 'Road trip en cours';
  }
});

const situationDetail = computed(() => {
  if (!props.travelStatus) return '-';

  switch (props.travelStatus.scenario) {
    case 'home-to-home':
      return 'Domicile -> domicile';
    case 'away-to-home':
      return `En deplacement depuis ${props.travelStatus.awayTripElapsedDays}j`;
    case 'home-to-away': {
      const city = props.travelStatus.nextDestinationCity ?? 'Exterieur';
      const duration = props.travelStatus.nextTripWindowDays || 1;
      return `${city} (${duration}j)`;
    }
    default:
      return `En deplacement depuis ${props.travelStatus.awayTripElapsedDays}j`;
  }
});

const dateWindowLabel = computed(() => {
  if (!props.travelStatus) return '';
  return `${formatDate(props.travelStatus.lastGame.date)} -> ${formatDate(props.travelStatus.nextGame.date)}`;
});
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
    <div class="flex items-center justify-between mb-3 gap-3">
      <h3 class="text-zinc-100 text-sm font-semibold">Road Trip Status</h3>
      <span class="text-zinc-400 text-xs bg-zinc-950 rounded px-2 py-1">{{ dateWindowLabel }}</span>
    </div>

    <div v-if="props.isLoading" class="space-y-2">
      <div class="h-16 rounded bg-zinc-800/70 animate-pulse"></div>
      <div class="h-24 rounded bg-zinc-800/70 animate-pulse"></div>
    </div>

    <div v-else-if="travelStatus" class="space-y-2">
      <div class="bg-zinc-950/65 rounded p-3 border border-zinc-800/70">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-zinc-500 text-[11px] uppercase tracking-wide mb-1">Situation</p>
            <p class="text-zinc-100 text-sm font-semibold">{{ situationTitle }}</p>
            <p class="text-zinc-300 text-xs mt-1 truncate">{{ situationDetail }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-zinc-500 text-[11px] uppercase tracking-wide">Fatigue</p>
            <p class="text-zinc-100 text-xl leading-none font-bold mt-1">
              {{ travelStatus.fatigueScore }}
              <span class="text-xs text-zinc-400 font-medium">/10</span>
            </p>
            <p class="text-[11px] mt-1" :class="fatigueUi.textClass">
              {{ fatigueUi.label }}
            </p>
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded bg-zinc-700 overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="fatigueUi.barClass"
            :style="{ width: `${travelStatus.fatigueScore * 10}%` }"
          ></div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="bg-zinc-950/65 rounded p-3 border border-zinc-800/70">
          <p class="text-zinc-500 text-[11px] uppercase tracking-wide mb-2">Rhythm</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-zinc-400 text-xs">Rest</p>
              <p class="text-zinc-100 text-lg font-bold leading-tight">{{ travelStatus.restDays }}j</p>
            </div>
            <div>
              <p class="text-zinc-400 text-xs">Away streak</p>
              <p class="text-zinc-100 text-lg font-bold leading-tight">{{ awayStreakLabel }}</p>
            </div>
          </div>
        </div>

        <div class="bg-zinc-950/65 rounded p-3 border border-zinc-800/70">
          <p class="text-zinc-500 text-[11px] uppercase tracking-wide mb-2">Travel</p>
          <div class="flex items-end justify-between gap-3">
            <p class="text-zinc-100 text-lg font-bold leading-tight">
              {{ travelStatus.nextLegDistanceKm.toLocaleString() }}
              <span class="text-xs text-zinc-400 font-medium">km</span>
            </p>
            <p class="text-zinc-400 text-xs">Next leg</p>
          </div>
          <p class="text-zinc-400 text-xs mt-1">
            Total {{ travelStatus.totalTripDistanceKm.toLocaleString() }} km
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-6">
      <p class="text-zinc-400 text-sm">Statut de voyage indisponible.</p>
    </div>
  </div>
</template>
