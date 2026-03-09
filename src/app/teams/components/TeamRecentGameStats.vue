<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { GameCenterSkaterStatLine } from '@/app/games/types/gameCenter';
import { useGameCenterBoxscore } from '@/app/games/queries/useGameCenterBoxscore';

type TeamInfo = UpcomingGame['homeTeam'];

const props = defineProps<{
  gameId: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}>();

const gameIdRef = toRef(props, 'gameId');
const { data: boxscore, isLoading, isError } = useGameCenterBoxscore(gameIdRef);

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getPlayerDisplayName(line: GameCenterSkaterStatLine): string {
  const defaultName = line.name?.default?.trim();
  if (defaultName) return defaultName;
  if (line.sweaterNumber) return `#${line.sweaterNumber}`;
  if (line.playerId) return `Player ${line.playerId}`;
  return 'Unknown player';
}

function getTeamSkaterLines(side: 'homeTeam' | 'awayTeam') {
  const teamStats = boxscore.value?.playerByGameStats?.[side];
  return [...(teamStats?.forwards ?? []), ...(teamStats?.defense ?? [])];
}

function buildSogSeries(lines: GameCenterSkaterStatLine[]) {
  const players = lines
    .map((line) => ({
      name: getPlayerDisplayName(line),
      sog: toSafeNumber(line.sog),
    }))
    .filter((player) => player.sog > 0)
    .sort((a, b) => b.sog - a.sog)
    .slice(0, 10);

  return {
    categories: players.map((player) => player.name),
    data: players.map((player) => player.sog),
  };
}

const homeSogSeries = computed(() => buildSogSeries(getTeamSkaterLines('homeTeam')));
const awaySogSeries = computed(() => buildSogSeries(getTeamSkaterLines('awayTeam')));

const chartOptions = (categories: string[]) => ({
  chart: {
    type: 'bar',
    background: 'transparent',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '60%',
      borderRadius: 6,
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ['#e5e7eb'],
      fontSize: '11px',
      fontWeight: 500,
    },
  },
  xaxis: {
    categories,
    labels: {
      style: { colors: '#9ca3af', fontSize: '11px' },
    },
  },
  yaxis: {
    labels: {
      style: { colors: '#d4d4d8', fontSize: '11px' },
    },
  },
  grid: { show: false },
  tooltip: { enabled: false },
  theme: { mode: 'dark' },
});
</script>

<template>
  <div class="rounded-lg border border-zinc-800/80 bg-zinc-900/70 p-3">
    <div v-if="isLoading" class="space-y-2">
      <div class="h-24 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-24 bg-zinc-800/70 rounded animate-pulse"></div>
    </div>

    <div v-else-if="isError || !boxscore" class="text-zinc-400 text-xs">
      Impossible de charger les stats de ce match.
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <img :src="props.homeTeam.logo" :alt="props.homeTeam.name" class="w-5 h-5" />
          <p class="text-zinc-100 text-xs font-semibold">{{ props.homeTeam.abbrev }} · SOG</p>
        </div>
        <apexchart
          v-if="homeSogSeries.data.length > 0"
          width="100%"
          height="240"
          type="bar"
          :options="chartOptions(homeSogSeries.categories)"
          :series="[{ name: 'SOG', data: homeSogSeries.data }]"
        />
        <p v-else class="text-zinc-500 text-xs">Aucun tir cadré enregistré.</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <img :src="props.awayTeam.logo" :alt="props.awayTeam.name" class="w-5 h-5" />
          <p class="text-zinc-100 text-xs font-semibold">{{ props.awayTeam.abbrev }} · SOG</p>
        </div>
        <apexchart
          v-if="awaySogSeries.data.length > 0"
          width="100%"
          height="240"
          type="bar"
          :options="chartOptions(awaySogSeries.categories)"
          :series="[{ name: 'SOG', data: awaySogSeries.data }]"
        />
        <p v-else class="text-zinc-500 text-xs">Aucun tir cadré enregistré.</p>
      </div>
    </div>
  </div>
</template>
