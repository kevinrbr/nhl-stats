<script setup lang="ts">
import { computed, toRef } from 'vue';
import { ArrowLeft } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import { useGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';
import {
  getGameStatusLabel,
  getTeamComparisonRows,
  hasDetailedStats,
} from '@/app/games/utils/gameBoxscore';

const props = defineProps<{
  gameId: number;
  fallbackGame: UpcomingGame | null;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const gameIdRef = toRef(props, 'gameId');
const { data: boxscore, isLoading, isError, error } = useGameCenterBoxscore(gameIdRef);

const homeTeam = computed(() => {
  if (boxscore.value) {
    return {
      name: boxscore.value.homeTeam.commonName?.default ?? boxscore.value.homeTeam.abbrev,
      abbrev: boxscore.value.homeTeam.abbrev,
      logo: boxscore.value.homeTeam.logo,
      score: boxscore.value.homeTeam.score ?? null,
    };
  }

  if (props.fallbackGame) {
    return {
      name: props.fallbackGame.homeTeam.name,
      abbrev: props.fallbackGame.homeTeam.abbrev,
      logo: props.fallbackGame.homeTeam.logo,
      score: null,
    };
  }

  return null;
});

const awayTeam = computed(() => {
  if (boxscore.value) {
    return {
      name: boxscore.value.awayTeam.commonName?.default ?? boxscore.value.awayTeam.abbrev,
      abbrev: boxscore.value.awayTeam.abbrev,
      logo: boxscore.value.awayTeam.logo,
      score: boxscore.value.awayTeam.score ?? null,
    };
  }

  if (props.fallbackGame) {
    return {
      name: props.fallbackGame.awayTeam.name,
      abbrev: props.fallbackGame.awayTeam.abbrev,
      logo: props.fallbackGame.awayTeam.logo,
      score: null,
    };
  }

  return null;
});

const statusLabel = computed(() => {
  if (!boxscore.value) return 'Loading';
  return getGameStatusLabel(boxscore.value);
});

const gameDateLabel = computed(() => {
  if (boxscore.value?.startTimeUTC) {
    return new Date(boxscore.value.startTimeUTC).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (props.fallbackGame) {
    return `${props.fallbackGame.dayAbbrev} · ${props.fallbackGame.startTime}`;
  }

  return '-';
});

const venueLabel = computed(() => {
  if (boxscore.value?.venue?.default) return boxscore.value.venue.default;
  if (props.fallbackGame?.venue) return props.fallbackGame.venue;
  return '-';
});

const statRows = computed(() => {
  if (!boxscore.value) return [];
  return getTeamComparisonRows(boxscore.value);
});

const statsAvailable = computed(() => {
  if (!boxscore.value) return false;
  return hasDetailedStats(boxscore.value);
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-zinc-200 text-sm hover:bg-zinc-800/80 transition-colors"
        @click="emit('back')"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>

      <span class="rounded-md border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-xs text-zinc-300">
        {{ statusLabel }}
      </span>
    </div>

    <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
      <div class="flex items-center justify-between gap-4">
        <div v-if="awayTeam" class="flex items-center gap-2 min-w-0">
          <img v-if="awayTeam.logo" :src="awayTeam.logo" :alt="awayTeam.name" class="w-9 h-9 object-contain" />
          <div class="min-w-0">
            <RouterLink
              :to="getTeamsRoute(awayTeam.abbrev)"
              class="text-zinc-100 text-sm font-semibold hover:underline underline-offset-2 truncate block"
            >
              {{ awayTeam.name }}
            </RouterLink>
            <p class="text-zinc-400 text-xs">{{ awayTeam.abbrev }}</p>
          </div>
        </div>

        <div class="text-center shrink-0">
          <p class="text-zinc-100 text-2xl font-bold">
            {{ awayTeam?.score ?? '-' }} <span class="text-zinc-500 px-1">-</span> {{ homeTeam?.score ?? '-' }}
          </p>
          <p class="text-zinc-400 text-xs mt-1">{{ gameDateLabel }}</p>
        </div>

        <div v-if="homeTeam" class="flex items-center gap-2 min-w-0 text-right">
          <div class="min-w-0">
            <RouterLink
              :to="getTeamsRoute(homeTeam.abbrev)"
              class="text-zinc-100 text-sm font-semibold hover:underline underline-offset-2 truncate block"
            >
              {{ homeTeam.name }}
            </RouterLink>
            <p class="text-zinc-400 text-xs">{{ homeTeam.abbrev }}</p>
          </div>
          <img v-if="homeTeam.logo" :src="homeTeam.logo" :alt="homeTeam.name" class="w-9 h-9 object-contain" />
        </div>
      </div>

      <p class="text-zinc-500 text-xs mt-3">{{ venueLabel }}</p>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4 space-y-3">
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
    </div>

    <div v-else-if="isError" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
      <p class="text-rose-200 text-sm">
        Impossible de charger les stats de ce match.
      </p>
      <p class="text-rose-300/80 text-xs mt-1">
        {{ error instanceof Error ? error.message : 'Unknown error' }}
      </p>
    </div>

    <div v-else class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
      <h3 class="text-zinc-100 text-sm font-semibold mb-3">Team Stats</h3>

      <div v-if="statsAvailable" class="space-y-3">
        <div
          v-for="row in statRows"
          :key="row.key"
          class="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-2.5"
        >
          <div class="grid grid-cols-[56px_1fr_56px] items-center gap-3">
            <span class="text-zinc-100 text-sm font-semibold text-left">{{ row.away }}</span>
            <div>
              <p class="text-zinc-400 text-[11px] uppercase tracking-wide text-center">{{ row.label }}</p>
              <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden flex">
                <div class="h-full bg-zinc-400/80" :style="{ width: `${row.awayPercent}%` }"></div>
                <div class="h-full bg-sky-500/70" :style="{ width: `${row.homePercent}%` }"></div>
              </div>
            </div>
            <span class="text-zinc-100 text-sm font-semibold text-right">{{ row.home }}</span>
          </div>
        </div>
      </div>

      <p v-else class="text-zinc-400 text-sm">
        Les stats detaillees ne sont pas encore disponibles pour ce match.
      </p>
    </div>
  </div>
</template>
