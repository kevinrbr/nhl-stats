<script setup lang="ts">
import { computed } from 'vue';
import type { TeamTravelStatus } from '../composables/useTeamRoadTrip';

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
      label: 'Faible',
      textClass: 'text-green-400',
      barClass: 'bg-green-500',
    };
  }

  if (score <= 6) {
    return {
      label: 'Moderee',
      textClass: 'text-yellow-400',
      barClass: 'bg-yellow-500',
    };
  }

  if (score <= 8) {
    return {
      label: 'Elevee',
      textClass: 'text-orange-400',
      barClass: 'bg-orange-500',
    };
  }

  return {
    label: 'Tres elevee',
    textClass: 'text-red-400',
    barClass: 'bg-red-500',
  };
};

const fatigueUi = computed(() => getFatigueUi(props.travelStatus?.fatigueScore ?? 0));

const awayStreakLabel = computed(() => {
  if (!props.travelStatus || props.travelStatus.awayStreakGames === 0) return '0';
  return `${props.travelStatus.awayStreakGames} (${props.travelStatus.awayStreakWindowDays}j)`;
});

const nextOpponent = computed(() => {
  if (!props.travelStatus) return null;

  return props.travelStatus.nextGame.isHome
    ? props.travelStatus.nextGame.awayTeam
    : props.travelStatus.nextGame.homeTeam;
});

const nextGameDateLabel = computed(() => {
  if (!props.travelStatus) return '-';
  return formatDate(props.travelStatus.nextGame.date);
});

const nextGameWhenLabel = computed(() => {
  if (!props.travelStatus) return '-';

  const dayDiff = props.travelStatus.daysUntilNextGame;
  if (dayDiff === 0) return "Aujourd'hui";
  if (dayDiff === 1) return 'Demain';
  return `Dans ${dayDiff}j`;
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
  <div class="bg-gray-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-3 gap-3">
      <h3 class="text-white text-sm font-semibold">Road Trip Status</h3>
      <span class="text-gray-400 text-xs bg-gray-900 rounded px-2 py-1">{{ dateWindowLabel }}</span>
    </div>

    <div v-if="props.isLoading" class="space-y-2">
      <div class="h-16 rounded bg-gray-700 animate-pulse"></div>
      <div class="h-24 rounded bg-gray-700 animate-pulse"></div>
      <div class="h-14 rounded bg-gray-700 animate-pulse"></div>
    </div>

    <div v-else-if="travelStatus" class="space-y-2">
      <div class="bg-gray-900 rounded p-3 border border-gray-700/70">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Situation</p>
            <p class="text-white text-sm font-semibold">{{ situationTitle }}</p>
            <p class="text-gray-300 text-xs mt-1 truncate">{{ situationDetail }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-gray-500 text-[11px] uppercase tracking-wide">Fatigue</p>
            <p class="text-white text-xl leading-none font-bold mt-1">
              {{ travelStatus.fatigueScore }}
              <span class="text-xs text-gray-400 font-medium">/10</span>
            </p>
            <p class="text-[11px] mt-1" :class="fatigueUi.textClass">
              {{ fatigueUi.label }}
            </p>
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded bg-gray-700 overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="fatigueUi.barClass"
            :style="{ width: `${travelStatus.fatigueScore * 10}%` }"
          ></div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="bg-gray-900 rounded p-3 border border-gray-700/60">
          <p class="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Rythme</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-gray-400 text-xs">Repos</p>
              <p class="text-white text-lg font-bold leading-tight">{{ travelStatus.restDays }}j</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs">Serie ext.</p>
              <p class="text-white text-lg font-bold leading-tight">{{ awayStreakLabel }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-900 rounded p-3 border border-gray-700/60">
          <p class="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Voyage</p>
          <div class="flex items-end justify-between gap-3">
            <p class="text-white text-lg font-bold leading-tight">
              {{ travelStatus.nextLegDistanceKm.toLocaleString() }}
              <span class="text-xs text-gray-400 font-medium">km</span>
            </p>
            <p class="text-gray-400 text-xs">Prochain trajet</p>
          </div>
          <p class="text-gray-400 text-xs mt-1">
            Total {{ travelStatus.totalTripDistanceKm.toLocaleString() }} km
          </p>
        </div>

        <div class="sm:col-span-2 bg-gray-900 rounded p-3 border border-gray-700/60">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Prochain match</p>
              <div v-if="nextOpponent" class="flex items-center gap-2 min-w-0">
                <img
                  :src="nextOpponent.logo"
                  :alt="nextOpponent.name"
                  class="w-6 h-6 object-contain"
                />
                <span class="text-white text-sm font-semibold truncate">
                  {{ nextOpponent.name }}
                </span>
              </div>
            </div>
            <p class="text-gray-300 text-xs text-right shrink-0">
              {{ nextGameWhenLabel }}<br>
              {{ nextGameDateLabel }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-6">
      <p class="text-gray-400 text-sm">Statut de voyage indisponible.</p>
    </div>
  </div>
</template>
