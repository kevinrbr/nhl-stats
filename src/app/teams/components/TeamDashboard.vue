<script lang="ts" setup>
import { computed, ref, toRefs } from 'vue';
import { useTeamKpiMetrics } from '@/app/teams/composables/useTeamKpiMetrics';
import { useTeamInsights } from '@/app/teams/composables/useTeamInsights';
import { useTeamOverview } from '@/app/teams/composables/useTeamOverview';
import type { TeamGameDetails } from '@/app/teams/presenters/teams.presenter';
import Select from '@/components/ui/select/Select.vue';
import SelectContent from '@/components/ui/select/SelectContent.vue';
import SelectGroup from '@/components/ui/select/SelectGroup.vue';
import SelectItem from '@/components/ui/select/SelectItem.vue';
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue';
import SelectValue from '@/components/ui/select/SelectValue.vue';
import TeamKpiStrip from '@/app/teams/components/TeamKpiStrip.vue';
import TeamNextGameCard from '@/app/teams/components/TeamNextGameCard.vue';
import TeamPlayoffStatus from '@/app/teams/components/TeamPlayoffStatus.vue';
import TeamRecentGames from '@/app/teams/components/TeamRecentGames.vue';
import TeamRoadtripStatus from '@/app/teams/components/TeamRoadtripStatus.vue';

const emit = defineEmits<{
  (e: 'select-team', teamAbbrev: string): void;
}>();

const props = defineProps<{
  team: string;
}>();

const { team } = toRefs(props);
const {
  teamMeta,
  teamStanding,
  playoffStatus,
  teamLastGames,
  travelStatus,
  isLastGamesLoading,
  isScheduleLoading,
} = useTeamOverview(team);
const { recentForm, homeAwaySplit } = useTeamInsights(teamLastGames);
const { kpiMetrics } = useTeamKpiMetrics(recentForm, homeAwaySplit, travelStatus);

const isLoading = isLastGamesLoading;

const selectedTeamName = computed(() => teamMeta.value?.name ?? team.value);
const selectedTeamLogo = computed(() => teamMeta.value?.logo ?? '');

const selectedPeriod = ref('season');
const selectedStat = ref('goals-for');
const selectedLocation = ref('all');

const PERIOD_OPTIONS = [
  { value: 'season', label: 'Season' },
  { value: 'last10', label: 'Last 10' },
  { value: 'last5', label: 'Last 5' }
] as const;

const STAT_OPTIONS = [
  { value: 'goals-for', label: 'Goals' },
  { value: 'goals-against', label: 'Goals Against' },
  { value: 'goal-differential', label: 'Goal Diff' },
  { value: 'sog-for', label: 'SOG' },
  { value: 'sog-against', label: 'SOG Against' },
] as const;

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Home + Away' },
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
] as const;

const filteredGames = computed(() => {
  if (!teamLastGames.value) return [];

  let games = [...teamLastGames.value].reverse();

  if (selectedLocation.value === 'home') {
    games = games.filter((game) => game.isHome);
  } else if (selectedLocation.value === 'away') {
    games = games.filter((game) => !game.isHome);
  }

  if (selectedPeriod.value === 'last5') {
    games = games.slice(0, 5);
  } else if (selectedPeriod.value === 'last10') {
    games = games.slice(0, 10);
  } else {
    games = games.slice(0, 30);
  }

  return games.reverse();
});

const getStatValue = (game: TeamGameDetails): number => {
  const teamScore = game.isHome ? game.homeTeam.score : game.awayTeam.score;
  const opponentScore = game.isHome ? game.awayTeam.score : game.homeTeam.score;
  const teamSog = game.isHome ? game.homeTeam.sog : game.awayTeam.sog;
  const opponentSog = game.isHome ? game.awayTeam.sog : game.homeTeam.sog;

  switch (selectedStat.value) {
    case 'goals-for':
      return teamScore;
    case 'goals-against':
      return opponentScore;
    case 'goal-differential':
      return teamScore - opponentScore;
    case 'sog-for':
      return teamSog;
    case 'sog-against':
      return opponentSog;
    default:
      return teamScore;
  }
};

const getOpponentLabel = (game: TeamGameDetails): string => {
  const opponent = game.isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
  return game.isHome ? opponent : `@${opponent}`;
};

const statLabel = computed(
  () => STAT_OPTIONS.find((option) => option.value === selectedStat.value)?.label ?? 'Goals'
);

const periodLabel = computed(
  () => PERIOD_OPTIONS.find((option) => option.value === selectedPeriod.value)?.label ?? 'Season'
);

const locationLabel = computed(
  () => LOCATION_OPTIONS.find((option) => option.value === selectedLocation.value)?.label ?? 'Home + Away'
);

const chartData = computed(() => {
  const games = filteredGames.value;
  return {
    categories: games.map((game) => getOpponentLabel(game)),
    data: games.map((game) => getStatValue(game))
  };
});

const chartOptions = computed(() => ({
  chart: {
    id: 'team-stats-chart',
    type: 'bar',
    background: 'transparent',
    foreColor: '#ffffff',
    toolbar: { show: false },
    selection: { enabled: false },
    zoom: { enabled: false }
  },
  states: {
    normal: {
      filter: { type: 'none', value: 0 }
    },
    hover: {
      filter: { type: 'none', value: 0 }
    },
    active: {
      allowMultipleDataPointsSelection: false,
      filter: { type: 'none', value: 0 }
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '70%',
      borderRadius: 4,
      borderRadiusApplication: 'end',
      dataLabels: { position: 'top' },
      colors: {
        ranges: [
          { from: -100, to: -0.01, color: '#ef4444' },
          { from: 0, to: 0, color: selectedStat.value.includes('differential') ? '#6b7280' : '#22c55e' },
          { from: 0.01, to: 100, color: '#22c55e' }
        ],
        backgroundBarColors: [],
        backgroundBarOpacity: 0
      }
    }
  },
  dataLabels: {
    enabled: true,
    offsetY: -20,
    style: {
      fontSize: '11px',
      colors: ['#ffffff'],
      fontWeight: 500
    },
    formatter: function(val: number) {
      return val === 0 ? '' : val;
    }
  },
  xaxis: {
    categories: chartData.value.categories,
    labels: {
      rotate: 0,
      style: {
        colors: '#9ca3af',
        fontSize: '11px'
      }
    },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '11px'
      }
    }
  },
  grid: { show: false },
  tooltip: { enabled: false },
  theme: { mode: 'dark' }
}));

const chartSeries = computed(() => [{
  name: statLabel.value,
  data: chartData.value.data
}]);

const teamRecordLabel = computed(() => {
  if (!teamStanding.value) return '-';
  return `${teamStanding.value.wins}-${teamStanding.value.losses}`;
});

const headerContextLine = computed(() => {
  if (!teamStanding.value) return 'Team overview';

  const points = `${teamStanding.value.points} pts`;
  const gp = `${teamStanding.value.gamesPlayed} GP`;
  const position = playoffStatus.value?.position ?? '';
  return [teamRecordLabel.value, points, gp, position].filter(Boolean).join(' • ');
});

const playoffBadgeClass = computed(() => {
  switch (playoffStatus.value?.status) {
    case 'in':
      return 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';
    case 'wildcard':
      return 'border-sky-500/40 text-sky-300 bg-sky-500/10';
    case 'bubble':
      return 'border-amber-500/40 text-amber-300 bg-amber-500/10';
    case 'out':
      return 'border-rose-500/40 text-rose-300 bg-rose-500/10';
    default:
      return 'border-zinc-600 text-zinc-300 bg-zinc-700/20';
  }
});

const handleSelectTeam = (teamAbbrev: string) => {
  emit('select-team', teamAbbrev);
};
</script>

<template>
  <div class="w-full px-6 pb-6 pt-2">
    <div v-if="isLoading" class="text-zinc-300 text-center py-8">
      Loading...
    </div>

    <template v-else>
      <header class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5 mb-4">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3 min-w-0">
            <img
              v-if="selectedTeamLogo"
              :src="selectedTeamLogo"
              :alt="selectedTeamName"
              class="w-11 h-11 object-contain"
            />
            <div class="min-w-0">
              <h1 class="text-zinc-100 text-2xl font-bold leading-none truncate">
                {{ selectedTeamName }}
              </h1>
              <p class="text-zinc-400 text-sm mt-1">
                {{ headerContextLine }}
              </p>
            </div>
          </div>

          <div
            v-if="playoffStatus"
            class="px-2.5 py-1 rounded-md border text-xs font-semibold"
            :class="playoffBadgeClass"
          >
            {{ playoffStatus.badge }}
          </div>
        </div>
      </header>

      <TeamKpiStrip :metrics="kpiMetrics" :is-loading="isLastGamesLoading" class="mb-4" />

      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section class="space-y-6 min-w-0">
          <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
              <div>
                <h3 class="text-zinc-100 text-sm font-medium">
                  {{ statLabel }} - {{ periodLabel }} ({{ locationLabel }})
                </h3>
                <p class="text-zinc-500 text-xs mt-1">
                  Last {{ filteredGames.length }} games
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <Select v-model="selectedPeriod">
                  <SelectTrigger class="w-[140px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="option in PERIOD_OPTIONS"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select v-model="selectedStat">
                  <SelectTrigger class="w-[140px]">
                    <SelectValue placeholder="Statistique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="option in STAT_OPTIONS"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select v-model="selectedLocation">
                  <SelectTrigger class="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="option in LOCATION_OPTIONS"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <apexchart
              v-if="filteredGames.length > 0"
              width="100%"
              height="380"
              type="bar"
              :options="chartOptions"
              :series="chartSeries"
              :key="`${selectedPeriod}-${selectedStat}-${selectedLocation}`"
            />
            <div v-else class="text-zinc-400 text-center py-8">
              Aucune donnée disponible
            </div>
          </div>

          <TeamRecentGames
            :games="teamLastGames"
            :is-loading="isLastGamesLoading"
            :limit="10"
          />
        </section>

        <aside class="space-y-6">
          <TeamPlayoffStatus
            :team-standing="teamStanding"
            :playoff-status="playoffStatus"
          />
          <TeamNextGameCard
            :travel-status="travelStatus"
            :is-loading="isScheduleLoading"
            @select-team="handleSelectTeam"
          />
          <TeamRoadtripStatus
            :travel-status="travelStatus"
            :is-loading="isScheduleLoading"
          />
        </aside>
      </div>
    </template>
  </div>
</template>
