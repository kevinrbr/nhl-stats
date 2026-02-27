import { computed, type Ref } from 'vue';
import type { TeamTravelStatus } from '@/app/teams/composables/useTeamRoadTrip';
import type {
  TeamHomeAwaySplitInsight,
  TeamKpiMetric,
  TeamRecentFormInsight,
  TeamInsightTone,
} from '@/app/teams/types/teamInsights';

const SPLIT_TONE_THRESHOLD = 3;

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatAverage(value: number): string {
  return value.toFixed(1);
}

function getSplitTone(current: number, compared: number): TeamInsightTone {
  const diff = current - compared;
  if (Math.abs(diff) < SPLIT_TONE_THRESHOLD) return 'neutral';
  if (diff > 0) return 'positive';
  return 'negative';
}

function getFatigueTone(score: number): TeamInsightTone {
  if (score <= 4) return 'positive';
  if (score <= 6) return 'neutral';
  return 'negative';
}

export function useTeamKpiMetrics(
  recentForm: Ref<TeamRecentFormInsight | null>,
  homeAwaySplit: Ref<TeamHomeAwaySplitInsight | null>,
  travelStatus: Ref<TeamTravelStatus | null>
) {
  const kpiMetrics = computed<TeamKpiMetric[]>(() => {
    const form = recentForm.value;
    const split = homeAwaySplit.value;
    const travel = travelStatus.value;

    const homeTone =
      split ? getSplitTone(split.home.winPct, split.away.winPct) : 'neutral';
    const awayTone =
      split ? getSplitTone(split.away.winPct, split.home.winPct) : 'neutral';

    const formTone: TeamInsightTone =
      form && form.winPct >= 50 ? 'positive' : form ? 'negative' : 'neutral';

    return [
      {
        id: 'record',
        label: 'Record',
        value: form?.record ?? '-',
        meta: form ? `${form.sampleSize} games` : undefined,
        tone: formTone,
      },
      {
        id: 'win-pct',
        label: 'Win %',
        value: form ? formatPercent(form.winPct) : '-',
        tone: formTone,
      },
      {
        id: 'gf-gp',
        label: 'GF/GP',
        value: form ? formatAverage(form.goalsForAvg) : '-',
        tone:
          form && form.goalsForAvg >= form.goalsAgainstAvg
            ? 'positive'
            : 'neutral',
        helpText: 'Goals For per Game',
      },
      {
        id: 'ga-gp',
        label: 'GA/GP',
        value: form ? formatAverage(form.goalsAgainstAvg) : '-',
        tone:
          form && form.goalsAgainstAvg <= form.goalsForAvg
            ? 'positive'
            : form
              ? 'negative'
              : 'neutral',
        helpText: 'Goals Against per Game',
      },
      {
        id: 'home',
        label: 'Home',
        value: split?.home.record ?? '-',
        meta: split ? formatPercent(split.home.winPct) : undefined,
        tone: homeTone,
      },
      {
        id: 'away',
        label: 'Away',
        value: split?.away.record ?? '-',
        meta: split ? formatPercent(split.away.winPct) : undefined,
        tone: awayTone,
      },
      {
        id: 'fatigue',
        label: 'Fatigue',
        value: travel ? `${travel.fatigueScore}/10` : '-',
        meta: travel
          ? `${travel.restDays}j rest · ${travel.nextLegDistanceKm.toLocaleString()} km`
          : undefined,
        tone: travel ? getFatigueTone(travel.fatigueScore) : 'neutral',
      },
    ];
  });

  return {
    kpiMetrics,
  };
}
