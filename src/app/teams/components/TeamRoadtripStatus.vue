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

const scenarioHint = computed(() => {
  if (!props.travelStatus) return '';

  switch (props.travelStatus.scenario) {
    case 'home-to-home':
      return 'Derniere game a domicile, fatigue generalement plus basse.';
    case 'away-to-home':
      return 'Retour a domicile apres une sequence de matchs a l exterieur.';
    case 'home-to-away':
      return 'Transition domicile vers exterieur, voyage a anticiper.';
    default:
      return 'Road trip en continu, charge de deplacement maintenue.';
  }
});

const awayStreakLabel = computed(() => {
  if (!props.travelStatus || props.travelStatus.awayStreakGames === 0) return '0';
  return `${props.travelStatus.awayStreakGames} (${props.travelStatus.awayStreakDays}j)`;
});

const nextGameLabel = computed(() => {
  if (!props.travelStatus) return '-';
  return `${formatDate(props.travelStatus.nextGame.date)} ${
    props.travelStatus.nextGame.isHome ? '(dom.)' : '(ext.)'
  }`;
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
      <span class="text-gray-400 text-xs">{{ dateWindowLabel }}</span>
    </div>

    <div v-if="props.isLoading" class="space-y-3">
      <div class="h-14 rounded bg-gray-700 animate-pulse"></div>
      <div class="h-20 rounded bg-gray-700 animate-pulse"></div>
      <div class="h-16 rounded bg-gray-700 animate-pulse"></div>
    </div>

    <div v-else-if="travelStatus" class="space-y-3">
      <div class="bg-gray-900 rounded p-3">
        <p class="text-gray-400 text-xs mb-1">Situation</p>
        <p class="text-white text-sm font-semibold">{{ travelStatus.headline }}</p>
        <p class="text-gray-300 text-xs mt-1">{{ travelStatus.detail }}</p>
        <p class="text-gray-500 text-xs mt-2">{{ scenarioHint }}</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-900 rounded p-3">
          <p class="text-gray-400 text-xs mb-1">Repos</p>
          <p class="text-white text-lg font-bold">{{ travelStatus.restDays }}j</p>
        </div>

        <div class="bg-gray-900 rounded p-3">
          <p class="text-gray-400 text-xs mb-1">Voyage</p>
          <p class="text-white text-lg font-bold">
            {{ travelStatus.travelDistanceKm.toLocaleString() }}
            <span class="text-sm text-gray-400">km</span>
          </p>
        </div>

        <div class="bg-gray-900 rounded p-3">
          <p class="text-gray-400 text-xs mb-1">Serie exterieure</p>
          <p class="text-white text-lg font-bold">{{ awayStreakLabel }}</p>
        </div>

        <div class="bg-gray-900 rounded p-3">
          <p class="text-gray-400 text-xs mb-1">Prochaine game</p>
          <p class="text-white text-sm font-bold">{{ nextGameLabel }}</p>
        </div>
      </div>

      <div class="bg-gray-900 rounded p-3">
        <div class="flex items-center justify-between">
          <p class="text-gray-400 text-xs">Fatigue</p>
          <p class="text-white text-sm font-semibold">
            {{ travelStatus.fatigueScore }}/10
          </p>
        </div>
        <div class="mt-2 h-2 rounded bg-gray-700 overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="travelStatus.fatigueBarClass"
            :style="{ width: `${travelStatus.fatigueScore * 10}%` }"
          ></div>
        </div>
        <p class="text-xs mt-2" :class="travelStatus.fatigueTextClass">
          {{ travelStatus.fatigueLabel }}
        </p>
      </div>
    </div>

    <div v-else class="text-center py-6">
      <p class="text-gray-400 text-sm">Statut de voyage indisponible.</p>
    </div>
  </div>
</template>
