<script setup lang="ts">
import type {
  PlayoffStatus,
  TeamStanding,
} from '@/app/standings/composables/useTeamStandings';

defineProps<{
  teamStanding: TeamStanding | null;
  playoffStatus: PlayoffStatus | null;
}>();

const statusColors = {
  green: 'bg-green-600/20 border-green-600/40 text-green-400',
  blue: 'bg-blue-600/20 border-blue-600/40 text-blue-400',
  orange: 'bg-orange-600/20 border-orange-600/40 text-orange-400',
  red: 'bg-red-600/20 border-red-600/40 text-red-400',
};
</script>

<template>
  <div v-if="playoffStatus && teamStanding" class="bg-gray-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-white text-sm font-semibold">Playoff Standing</h3>
      <div 
        class="px-2 py-1 rounded text-xs font-bold border"
        :class="statusColors[playoffStatus.color as keyof typeof statusColors]"
      >
        {{ playoffStatus.badge }}
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">Position:</span>
        <span class="text-white font-medium">{{ playoffStatus.position }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">Points:</span>
        <span class="text-white font-medium">{{ teamStanding.points }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">Status:</span>
        <span 
          class="font-medium"
          :class="{
            'text-green-400': playoffStatus.status === 'in',
            'text-blue-400': playoffStatus.status === 'wildcard',
            'text-orange-400': playoffStatus.status === 'bubble',
            'text-red-400': playoffStatus.status === 'out',
          }"
        >
          {{ playoffStatus.description }}
        </span>
      </div>

      <div class="pt-2 border-t border-gray-700">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">Record:</span>
          <span class="text-gray-300">
            {{ teamStanding.wins }}-{{ teamStanding.losses }} ({{ teamStanding.gamesPlayed }} GP)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
