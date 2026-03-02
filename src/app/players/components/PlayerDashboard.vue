<script lang="ts" setup>
import { computed, ref, toRefs } from 'vue';
import { usePlayerLogs } from '@/app/players/queries/usePlayerLogs';
import type { Player } from '@/app/players/types/player';
import Select from '@/components/ui/select/Select.vue';
import SelectContent from '@/components/ui/select/SelectContent.vue';
import SelectGroup from '@/components/ui/select/SelectGroup.vue';
import SelectItem from '@/components/ui/select/SelectItem.vue';
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue';
import SelectValue from '@/components/ui/select/SelectValue.vue';

type PlayerGameLog = {
  homeRoadFlag: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  opponentAbbrev: string;
};

const props = defineProps<{
  selectedPlayerId: string;
  selectedPlayer: Player | null;
}>();

const { selectedPlayerId } = toRefs(props);
const { data: playerLogs } = usePlayerLogs(selectedPlayerId);
const selectedPlayerLabel = computed(() =>
  props.selectedPlayer ? `${props.selectedPlayer.name} #${props.selectedPlayer.number}` : `Player #${props.selectedPlayerId}`
);

// Select states
const selectedPeriod = ref('season');
const selectedStat = ref('points');
const selectedFilter = ref('all');

// Select options
const PERIOD_OPTIONS = [
  { value: 'season', label: 'Season' },
  { value: 'last10', label: 'Last 10' },
  { value: 'last5', label: 'Last 5' }
] as const;

const STAT_OPTIONS = [
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'points', label: 'Points' },
  { value: 'shots', label: 'SOG' }
] as const;

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' }
] as const;

// Computed data
const filteredLogs = computed(() => {
  if (!playerLogs.value) return [];
  
  let logs = [...playerLogs.value] as PlayerGameLog[];
  
  // Apply home/away filter
  if (selectedFilter.value === 'home') {
    logs = logs.filter(log => log.homeRoadFlag === 'H');
  } else if (selectedFilter.value === 'away') {
    logs = logs.filter(log => log.homeRoadFlag === 'R');
  }
  
  // Apply period filter
  if (selectedPeriod.value === 'last5') {
    logs = logs.slice(0, 5);
  } else if (selectedPeriod.value === 'last10') {
    logs = logs.slice(0, 10);
  }
  
  return logs;
});

const getStatValue = (log: PlayerGameLog): number => {
  const statMap: Record<string, number> = {
    goals: log.goals,
    assists: log.assists,
    points: log.points,
    shots: log.shots
  };
  return statMap[selectedStat.value] ?? log.points;
};

const statLabel = computed(() => 
  STAT_OPTIONS.find(opt => opt.value === selectedStat.value)?.label ?? 'Points'
);

const periodLabel = computed(() => 
  PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod.value)?.label ?? 'Season'
);

const chartData = computed(() => {
  const logs = filteredLogs.value;
  return {
    categories: logs.map(log => log.opponentAbbrev).reverse(),
    data: logs.map(log => getStatValue(log)).reverse()
  };
});

// ApexCharts options
const chartOptions = computed(() => ({
  chart: {
    id: 'player-stats-chart',
    type: 'bar',
    background: 'transparent',
    foreColor: '#ffffff',
    toolbar: { show: false }
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
          { from: -100, to: 0, color: '#ef4444' },
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
    <div class="flex items-center gap-3 mb-8">
      <img
        v-if="props.selectedPlayer?.headshot"
        :src="props.selectedPlayer.headshot"
        :alt="selectedPlayerLabel"
        class="w-12 h-12 rounded-full object-cover"
      />
      <h1 class="text-white text-2xl font-bold leading-none">
        {{ selectedPlayerLabel }}
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

      <Select v-model="selectedFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="Filtre" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="option in FILTER_OPTIONS"
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
        {{ statLabel }} - {{ periodLabel }}
      </h3>
      <p class="text-gray-500 text-xs mt-1">
        Last {{ filteredLogs.length }} games
      </p>
    </div>

    <!-- Chart -->
    <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
      <apexchart 
        v-if="filteredLogs.length > 0" 
        width="100%" 
        height="400"
        type="bar" 
        :options="chartOptions" 
        :series="chartSeries"
        :key="`${selectedPeriod}-${selectedStat}-${selectedFilter}`"
      />
      <div v-else class="text-gray-400 text-center py-8">
        Aucune donnée disponible
      </div>
    </div>
  </div>
</template>
