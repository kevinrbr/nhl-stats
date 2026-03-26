<script setup lang="ts">
import { computed, toRef } from 'vue';
import { ArrowLeft } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import { useGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';
import GamePlayerInsightsPanel from '@/app/games/components/GamePlayerInsightsPanel.vue';
import GameH2HPlayerSnapshot from '@/app/games/components/GameH2HPlayerSnapshot.vue';
import { buildTeamUsageSnapshot } from '@/app/games/utils/gamePlayerUsage';
import {
  getGameStatusLabel,
  getTeamComparisonRows,
  hasDetailedStats,
} from '@/app/games/utils/gameBoxscore';

const props = defineProps<{
  gameId: number;
  fallbackGame: UpcomingGame | null;
  showBackButton?: boolean;
  showGameSummary?: boolean;
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

const isSelectedUpcomingGame = computed(() => {
  if (!props.fallbackGame) return false;
  return props.gameId === props.fallbackGame.id;
});

const upcomingOdds = computed(() => {
  if (!isSelectedUpcomingGame.value) return null;
  return props.fallbackGame?.odds ?? null;
});

const isViewingHistoricalGame = computed(() => {
  if (!props.fallbackGame) return true;
  return props.gameId !== props.fallbackGame.id;
});

const homeUsageSnapshot = computed(() => {
  if (!boxscore.value) return null;
  return buildTeamUsageSnapshot(boxscore.value, 'homeTeam');
});

const awayUsageSnapshot = computed(() => {
  if (!boxscore.value) return null;
  return buildTeamUsageSnapshot(boxscore.value, 'awayTeam');
});

function formatAmericanOdds(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function formatTotalLine(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number(value).toFixed(1);
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="props.showBackButton" class="flex items-center justify-between gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-zinc-100 text-sm font-medium hover:bg-zinc-800/80 transition-colors"
        @click="emit('back')"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>

      <span class="rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs font-medium text-zinc-200">
        {{ statusLabel }}
      </span>
    </div>

    <div v-if="props.showGameSummary ?? true" class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5">
      <div class="flex items-center justify-between gap-4">
        <div v-if="homeTeam" class="flex items-center gap-2 min-w-0">
          <img v-if="homeTeam.logo" :src="homeTeam.logo" :alt="homeTeam.name" class="w-10 h-10 object-contain" />
          <div class="min-w-0">
            <RouterLink
              :to="getTeamsRoute(homeTeam.abbrev)"
              class="text-zinc-100 text-base font-semibold hover:underline underline-offset-2 truncate block"
            >
              {{ homeTeam.name }}
            </RouterLink>
            <p class="text-zinc-300 text-xs font-medium">{{ homeTeam.abbrev }}</p>
          </div>
        </div>

        <div class="text-center shrink-0">
          <p class="text-zinc-50 text-3xl font-bold leading-none">
            {{ homeTeam?.score ?? '-' }} <span class="text-zinc-500 px-1">-</span> {{ awayTeam?.score ?? '-' }}
          </p>
          <p class="text-zinc-300 text-sm mt-1.5">{{ gameDateLabel }}</p>
        </div>

        <div v-if="awayTeam" class="flex items-center gap-2 min-w-0 text-right">
          <div class="min-w-0">
            <RouterLink
              :to="getTeamsRoute(awayTeam.abbrev)"
              class="text-zinc-100 text-base font-semibold hover:underline underline-offset-2 truncate block"
            >
              {{ awayTeam.name }}
            </RouterLink>
            <p class="text-zinc-300 text-xs font-medium">{{ awayTeam.abbrev }}</p>
          </div>
          <img v-if="awayTeam.logo" :src="awayTeam.logo" :alt="awayTeam.name" class="w-10 h-10 object-contain" />
        </div>
      </div>

      <p class="text-zinc-300 text-sm mt-3">{{ venueLabel }}</p>
    </div>

    <div v-if="upcomingOdds" class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-zinc-100 text-base font-semibold">Bookmaker Odds</h3>
        <span class="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-200">
          {{ upcomingOdds.bookmakerName }}
        </span>
      </div>

      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p class="text-zinc-400 text-xs uppercase tracking-wide">Moneyline</p>
          <div class="mt-1.5 flex items-center justify-between gap-2 text-sm">
            <span class="text-zinc-200">{{ homeTeam?.abbrev ?? 'HOME' }}</span>
            <span class="font-semibold text-zinc-50">{{ formatAmericanOdds(upcomingOdds.moneyline?.home) }}</span>
          </div>
          <div class="mt-1 flex items-center justify-between gap-2 text-sm">
            <span class="text-zinc-200">{{ awayTeam?.abbrev ?? 'AWAY' }}</span>
            <span class="font-semibold text-zinc-50">{{ formatAmericanOdds(upcomingOdds.moneyline?.away) }}</span>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p class="text-zinc-400 text-xs uppercase tracking-wide">Total Goals</p>
          <p class="mt-1.5 text-zinc-300 text-sm">
            Line {{ formatTotalLine(upcomingOdds.total?.line) }}
          </p>
          <div class="mt-1.5 flex items-center justify-between gap-2 text-sm">
            <span class="text-zinc-200">Over</span>
            <span class="font-semibold text-zinc-50">{{ formatAmericanOdds(upcomingOdds.total?.over) }}</span>
          </div>
          <div class="mt-1 flex items-center justify-between gap-2 text-sm">
            <span class="text-zinc-200">Under</span>
            <span class="font-semibold text-zinc-50">{{ formatAmericanOdds(upcomingOdds.total?.under) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4 space-y-3">
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
    </div>

    <div v-else-if="isError" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
      <p class="text-rose-200 text-base font-medium">
        Impossible de charger les stats de ce match.
      </p>
      <p class="text-rose-300/90 text-sm mt-1">
        {{ error instanceof Error ? error.message : 'Unknown error' }}
      </p>
    </div>

    <div v-else class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5">
      <h3 class="text-zinc-100 text-base font-semibold mb-3">Team Stats</h3>

      <div v-if="statsAvailable" class="space-y-3">
        <div
          v-for="row in statRows"
          :key="row.key"
          class="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3"
        >
          <div class="grid grid-cols-[64px_1fr_64px] items-center gap-3">
            <span class="text-zinc-50 text-base font-semibold text-left">{{ row.home }}</span>
            <div>
              <p class="text-zinc-300 text-xs font-medium uppercase tracking-wide text-center">{{ row.label }}</p>
              <div class="mt-1.5 h-2 rounded bg-zinc-800 overflow-hidden flex">
                <div class="h-full bg-sky-500/70" :style="{ width: `${row.homePercent}%` }"></div>
                <div class="h-full bg-zinc-400/80" :style="{ width: `${row.awayPercent}%` }"></div>
              </div>
            </div>
            <span class="text-zinc-50 text-base font-semibold text-right">{{ row.away }}</span>
          </div>
        </div>
      </div>

      <p v-else class="text-zinc-300 text-sm">
        Les stats detaillees ne sont pas encore disponibles pour ce match.
      </p>
    </div>

    <GameH2HPlayerSnapshot
      v-if="isViewingHistoricalGame && statsAvailable && homeUsageSnapshot && awayUsageSnapshot"
      :home-snapshot="homeUsageSnapshot"
      :away-snapshot="awayUsageSnapshot"
    />

    <GamePlayerInsightsPanel
      :game="props.fallbackGame"
    />
  </div>
</template>
