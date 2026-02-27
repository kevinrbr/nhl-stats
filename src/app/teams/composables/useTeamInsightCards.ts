import { computed, type Ref } from 'vue';
import type {
  TeamHomeAwaySplitInsight,
  TeamInsightCardData,
  TeamInsightMetric,
  TeamInsightTone,
  TeamRecentFormInsight,
} from '@/app/teams/types/teamInsights';

const DEFAULT_RECENT_METRICS: TeamInsightMetric[] = [
  { id: 'record', label: 'Record', value: '-' },
  { id: 'win-pct', label: 'Win %', value: '-' },
  { id: 'gf-gp', label: 'GF/GP', value: '-', helpText: 'Goals For per Game' },
  { id: 'ga-gp', label: 'GA/GP', value: '-', helpText: 'Goals Against per Game' },
];

const DEFAULT_SPLIT_METRICS: TeamInsightMetric[] = [
  { id: 'home-record', label: 'Home record', value: '-' },
  { id: 'away-record', label: 'Away record', value: '-' },
  { id: 'home-win-pct', label: 'Home win %', value: '-' },
  { id: 'away-win-pct', label: 'Away win %', value: '-' },
];

const formatPercent = (value: number): string => `${Math.round(value)}%`;
const formatAverage = (value: number): string => value.toFixed(1);

function getToneFromWinPct(winPct: number): TeamInsightTone {
  if (winPct >= 50) return 'positive';
  return 'negative';
}

function getSplitTone(current: number, compared: number): TeamInsightTone {
  if (current > compared) return 'positive';
  if (current < compared) return 'negative';
  return 'neutral';
}

export function useTeamInsightCards(
  recentForm: Ref<TeamRecentFormInsight | null>,
  homeAwaySplit: Ref<TeamHomeAwaySplitInsight | null>
) {
  const recentFormCard = computed<TeamInsightCardData>(() => {
    if (!recentForm.value) {
      return {
        title: 'Recent form',
        subtitle: 'No data',
        variant: 'emerald',
        metrics: DEFAULT_RECENT_METRICS,
      };
    }

    const trend = recentForm.value.lastFiveTrend || '-';
    const tone = getToneFromWinPct(recentForm.value.winPct);

    return {
      title: 'Recent form',
      subtitle: `${recentForm.value.sampleSize} games · ${trend}`,
      variant: 'emerald',
      metrics: [
        {
          id: 'record',
          label: 'Record',
          value: recentForm.value.record,
          tone,
        },
        {
          id: 'win-pct',
          label: 'Win %',
          value: formatPercent(recentForm.value.winPct),
          tone,
        },
        {
          id: 'gf-gp',
          label: 'GF/GP',
          value: formatAverage(recentForm.value.goalsForAvg),
          tone: recentForm.value.goalsForAvg >= recentForm.value.goalsAgainstAvg ? 'positive' : 'neutral',
          helpText: 'Goals For per Game',
        },
        {
          id: 'ga-gp',
          label: 'GA/GP',
          value: formatAverage(recentForm.value.goalsAgainstAvg),
          tone: recentForm.value.goalsAgainstAvg <= recentForm.value.goalsForAvg ? 'positive' : 'negative',
          helpText: 'Goals Against per Game',
        },
      ],
    };
  });

  const homeAwayCard = computed<TeamInsightCardData>(() => {
    if (!homeAwaySplit.value) {
      return {
        title: 'Home vs Away',
        subtitle: 'No data',
        variant: 'amber',
        metrics: DEFAULT_SPLIT_METRICS,
      };
    }

    const edgeLabel =
      homeAwaySplit.value.edge === 'home'
        ? 'Edge: home'
        : homeAwaySplit.value.edge === 'away'
          ? 'Edge: away'
          : 'Edge: even';

    const homeTone = getSplitTone(homeAwaySplit.value.home.winPct, homeAwaySplit.value.away.winPct);
    const awayTone = getSplitTone(homeAwaySplit.value.away.winPct, homeAwaySplit.value.home.winPct);

    return {
      title: 'Home vs Away',
      subtitle: `${homeAwaySplit.value.totalGames} games · ${edgeLabel}`,
      variant: 'amber',
      metrics: [
        {
          id: 'home-record',
          label: 'Home record',
          value: homeAwaySplit.value.home.record,
          tone: homeTone,
        },
        {
          id: 'away-record',
          label: 'Away record',
          value: homeAwaySplit.value.away.record,
          tone: awayTone,
        },
        {
          id: 'home-win-pct',
          label: 'Home win %',
          value: formatPercent(homeAwaySplit.value.home.winPct),
          tone: homeTone,
        },
        {
          id: 'away-win-pct',
          label: 'Away win %',
          value: formatPercent(homeAwaySplit.value.away.winPct),
          tone: awayTone,
        },
      ],
    };
  });

  return {
    recentFormCard,
    homeAwayCard,
  };
}
