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
  green: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300',
  blue: 'bg-sky-500/10 border-sky-500/35 text-sky-300',
  orange: 'bg-amber-500/10 border-amber-500/35 text-amber-300',
  red: 'bg-rose-500/10 border-rose-500/35 text-rose-300',
};
</script>

<template>
  <div
    v-if="playoffStatus && teamStanding"
    class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-zinc-100 text-sm font-semibold">Playoff Standing</h3>
      <div 
        class="px-2 py-1 rounded text-xs font-bold border"
        :class="statusColors[playoffStatus.color as keyof typeof statusColors]"
      >
        {{ playoffStatus.badge }}
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-400">Position:</span>
        <span class="text-zinc-100 font-medium">{{ playoffStatus.position }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-400">Points:</span>
        <span class="text-zinc-100 font-medium">{{ teamStanding.points }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-zinc-400">Status:</span>
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

      <div class="pt-2 border-t border-zinc-700/70">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-400">Record:</span>
          <span class="text-zinc-300">
            {{ teamStanding.wins }}-{{ teamStanding.losses }} ({{ teamStanding.gamesPlayed }} GP)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
