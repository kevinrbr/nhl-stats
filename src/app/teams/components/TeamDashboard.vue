<script lang="ts" setup>
import { computed, ref, toRefs } from 'vue';
import { Activity, House } from 'lucide-vue-next';
import { useTeamInsightCards } from '@/app/teams/composables/useTeamInsightCards';
import { useTeamInsights } from '@/app/teams/composables/useTeamInsights';
import { useTeamOverview } from '@/app/teams/composables/useTeamOverview';
import type { TeamGameDetails } from '@/app/teams/presenters/teams.presenter';
import Select from '@/components/ui/select/Select.vue';
import SelectContent from '@/components/ui/select/SelectContent.vue';
import SelectGroup from '@/components/ui/select/SelectGroup.vue';
import SelectItem from '@/components/ui/select/SelectItem.vue';
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue';
import SelectValue from '@/components/ui/select/SelectValue.vue';
import TeamInsightCard from '@/app/teams/components/TeamInsightCard.vue';
import TeamPlayoffStatus from '@/app/teams/components/TeamPlayoffStatus.vue';
import TeamRecentGames from '@/app/teams/components/TeamRecentGames.vue';
import TeamRoadtripStatus from '@/app/teams/components/TeamRoadtripStatus.vue';

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
const { recentFormCard, homeAwayCard } = useTeamInsightCards(
  recentForm,
  homeAwaySplit
);

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
  
  // 1. Inverser pour avoir les plus récents en premier
  let games = [...teamLastGames.value].reverse();
  
  // 2. Filtrer par location (Home/Away)
  if (selectedLocation.value === 'home') {
    games = games.filter(game => game.isHome);
  } else if (selectedLocation.value === 'away') {
    games = games.filter(game => !game.isHome);
  }
  
  // 3. Prendre les X derniers matchs
  if (selectedPeriod.value === 'last5') {
    games = games.slice(0, 5);
  } else if (selectedPeriod.value === 'last10') {
    games = games.slice(0, 10);
  } else {
    games = games.slice(0, 30);
  }
  
  // 4. Re-inverser pour afficher du plus ancien au plus récent
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

const statLabel = computed(() => 
  STAT_OPTIONS.find(opt => opt.value === selectedStat.value)?.label ?? 'Goals'
);

const periodLabel = computed(() => 
  PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod.value)?.label ?? 'Season'
);

const locationLabel = computed(() => 
  LOCATION_OPTIONS.find(opt => opt.value === selectedLocation.value)?.label ?? 'Home + Away'
);

const chartData = computed(() => {
  const games = filteredGames.value;
  return {
    categories: games.map(game => getOpponentLabel(game)),
    data: games.map(game => getStatValue(game))
  };
});

// ApexCharts options
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
</script>

<template>
  <div class="w-full p-6">
    <div v-if="isLoading" class="text-white text-center py-8">
      Loading...
    </div>
    <template v-else>
      <div class="flex items-center gap-3 mb-8">
        <img
          v-if="selectedTeamLogo"
          :src="selectedTeamLogo"
          :alt="selectedTeamName"
          class="w-11 h-11 object-contain"
        />
        <h1 class="text-white text-2xl font-bold leading-none">
          {{ selectedTeamName }}
        </h1>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 mb-6">
        <Select v-model="selectedPeriod">
          <SelectTrigger class="w-[160px]">
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
          <SelectTrigger class="w-[160px]">
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
          <SelectTrigger class="w-[160px]">
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

      <!-- Chart header -->
      <div class="mb-4">
        <h3 class="text-white text-sm font-medium">
          {{ statLabel }} - {{ periodLabel }} ({{ locationLabel }})
        </h3>
        <p class="text-gray-500 text-xs mt-1">
          Last {{ filteredGames.length }} games
        </p>
      </div>

      <!-- Chart -->
      <div class="rounded-lg p-4 mb-6">
        <apexchart 
          v-if="filteredGames.length > 0" 
          width="100%" 
          height="400"
          type="bar" 
          :options="chartOptions" 
          :series="chartSeries"
          :key="`${selectedPeriod}-${selectedStat}-${selectedLocation}`"
        />
        <div v-else class="text-gray-400 text-center py-8">
          Aucune donnée disponible
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <TeamInsightCard
          :title="recentFormCard.title"
          :subtitle="recentFormCard.subtitle"
          :metrics="recentFormCard.metrics"
          :variant="recentFormCard.variant"
          :icon="Activity"
          :is-loading="isLastGamesLoading"
        />
        <TeamInsightCard
          :title="homeAwayCard.title"
          :subtitle="homeAwayCard.subtitle"
          :metrics="homeAwayCard.metrics"
          :variant="homeAwayCard.variant"
          :icon="House"
          :is-loading="isLastGamesLoading"
        />
      </div>

      <div class="flex gap-6 items-start">
        <div class="flex-1">
          <TeamRecentGames
            :games="teamLastGames"
            :is-loading="isLastGamesLoading"
            :limit="10"
          />
        </div>
        <div class="flex-1">
          <TeamPlayoffStatus
            :team-standing="teamStanding"
            :playoff-status="playoffStatus"
          />
          <TeamRoadtripStatus
            class="mt-6"
            :travel-status="travelStatus"
            :is-loading="isScheduleLoading"
          />
        </div>
      </div>
    </template>
  </div>
</template>
