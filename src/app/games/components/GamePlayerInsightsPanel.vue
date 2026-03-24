<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type {
  MatchupTopPick,
  TeamAngleInsightGroup,
  TeamPlayerInsightGroup,
} from '@/app/games/types/gamePlayerInsights';
import { useGamePlayerInsights } from '@/app/games/composables/useGamePlayerInsights';
import { useBettingLines } from '@/app/common/composables/useBettingLines';

type PlayerTrendMode = 'h2h' | 'recent';
type PlayerTrendSection = {
  key: PlayerTrendMode;
  title: string;
  subtitle: string;
  home: TeamPlayerInsightGroup;
  away: TeamPlayerInsightGroup;
};

type TeamAngleSection = {
  key: 'h2h' | 'recent';
  title: string;
  subtitle: string;
  home: TeamAngleInsightGroup;
  away: TeamAngleInsightGroup;
};

type TeamAngleRow = {
  key: string;
  label: string;
  homeText: string;
  awayText: string;
  homeValue: number;
  awayValue: number;
  trend: 'higher_better' | 'lower_better' | 'neutral';
};

type InsightPlayer = TeamPlayerInsightGroup['players'][number];

const props = defineProps<{
  game: UpcomingGame | null;
}>();

const gameRef = toRef(props, 'game');
const { data: insights, isLoading, isError } = useGamePlayerInsights(gameRef);
const { teamSogLine, teamSogLineLabel } = useBettingLines();

const homeTeamLabel = computed(() => props.game?.homeTeam.abbrev ?? 'HOME');
const awayTeamLabel = computed(() => props.game?.awayTeam.abbrev ?? 'AWAY');

const playerTrendSections = computed<PlayerTrendSection[]>(() => {
  if (!insights.value) return [];

  return [
    {
      key: 'h2h',
      title: 'H2H Player Trends',
      subtitle: 'performances face a cet adversaire',
      home: insights.value.h2h.home,
      away: insights.value.h2h.away,
    },
    {
      key: 'recent',
      title: 'Recent Player Trends',
      subtitle: 'forme sur les derniers matchs',
      home: insights.value.recent.home,
      away: insights.value.recent.away,
    },
  ];
});

const teamAngleSections = computed<TeamAngleSection[]>(() => {
  if (!insights.value) return [];

  return [
    {
      key: 'h2h',
      title: 'H2H Team Angles',
      subtitle: 'contexte direct entre ces deux equipes',
      home: insights.value.teams.h2h.home,
      away: insights.value.teams.h2h.away,
    },
    {
      key: 'recent',
      title: 'Recent Team Angles',
      subtitle: 'tendance recente hors matchup direct',
      home: insights.value.teams.recent.home,
      away: insights.value.teams.recent.away,
    },
  ];
});

function formatSogLineLabel(value: string): string {
  return `O${value}`;
}

function formatHitRate(rate: number): string {
  return `${Math.round(rate)}%`;
}

function getSampleLabel(group: TeamPlayerInsightGroup | TeamAngleInsightGroup): string {
  if (group.sampleGames <= 1) return `${group.sampleGames} game`;
  return `${group.sampleGames} games`;
}

function getHitRateClass(rate: number): string {
  if (rate >= 70) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (rate >= 50) return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return 'border-zinc-700 bg-zinc-800/40 text-zinc-400';
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 78) return 'text-emerald-300';
  if (confidence >= 66) return 'text-amber-300';
  return 'text-zinc-300';
}

function getTopPickCardClass(rank: number): string {
  if (rank === 1) return 'border-emerald-500/35 bg-emerald-500/8';
  if (rank === 2) return 'border-sky-500/35 bg-sky-500/8';
  if (rank === 3) return 'border-violet-500/35 bg-violet-500/8';
  return 'border-zinc-800/80 bg-zinc-950/60';
}

function getPickTypeLabel(pickType: MatchupTopPick['type']): string {
  if (pickType === 'player_sog_over') return 'Player SOG';
  if (pickType === 'player_points_over') return 'Player PTS';
  if (pickType === 'player_goals_over') return 'Player Goals';
  return 'Team SOG';
}

function getTopPickProgressWidth(confidence: number): string {
  return `${Math.max(8, Math.min(100, confidence))}%`;
}

function getTeamLogoByAbbrev(teamAbbrev: string): string | null {
  if (!props.game) return null;
  if (props.game.homeTeam.abbrev === teamAbbrev) return props.game.homeTeam.logo;
  if (props.game.awayTeam.abbrev === teamAbbrev) return props.game.awayTeam.logo;
  return null;
}

function getPlayerMetric(mode: PlayerTrendMode, player: InsightPlayer, metric: 'pts' | 'goals' | 'sog'): string {
  if (mode === 'h2h') {
    if (metric === 'pts') return `${player.pointsPerGame.toFixed(1)} pts/g`;
    if (metric === 'goals') return `${player.goalsPerGame.toFixed(1)} g/g`;
    return `${player.sogPerGame.toFixed(1)} sog/g`;
  }

  if (metric === 'pts') return `${player.points} pts`;
  if (metric === 'goals') return `${player.goals} g`;
  return `${player.sog} sog`;
}

function getAngleRows(section: TeamAngleSection): TeamAngleRow[] {
  const lineLabel = formatSogLineLabel(teamSogLineLabel.value);
  const home = section.home;
  const away = section.away;

  return [
    {
      key: 'sog-for',
      label: 'SOG For/G',
      homeText: home.sogForPerGame.toFixed(1),
      awayText: away.sogForPerGame.toFixed(1),
      homeValue: home.sogForPerGame,
      awayValue: away.sogForPerGame,
      trend: 'higher_better',
    },
    {
      key: 'sog-against',
      label: 'SOG Against/G',
      homeText: home.sogAgainstPerGame.toFixed(1),
      awayText: away.sogAgainstPerGame.toFixed(1),
      homeValue: home.sogAgainstPerGame,
      awayValue: away.sogAgainstPerGame,
      trend: 'lower_better',
    },
    {
      key: 'line-for',
      label: `${lineLabel} For`,
      homeText: `${home.sogForOverLineCount}/${home.sampleGames} (${formatHitRate(home.sogForOverLineRate)})`,
      awayText: `${away.sogForOverLineCount}/${away.sampleGames} (${formatHitRate(away.sogForOverLineRate)})`,
      homeValue: home.sogForOverLineRate,
      awayValue: away.sogForOverLineRate,
      trend: 'higher_better',
    },
    {
      key: 'line-against',
      label: `${lineLabel} Against`,
      homeText: `${home.sogAgainstOverLineCount}/${home.sampleGames} (${formatHitRate(home.sogAgainstOverLineRate)})`,
      awayText: `${away.sogAgainstOverLineCount}/${away.sampleGames} (${formatHitRate(away.sogAgainstOverLineRate)})`,
      homeValue: home.sogAgainstOverLineRate,
      awayValue: away.sogAgainstOverLineRate,
      trend: 'lower_better',
    },
    {
      key: 'goals-for',
      label: 'Goals For/G',
      homeText: home.goalsForPerGame.toFixed(1),
      awayText: away.goalsForPerGame.toFixed(1),
      homeValue: home.goalsForPerGame,
      awayValue: away.goalsForPerGame,
      trend: 'higher_better',
    },
    {
      key: 'goals-against',
      label: 'Goals Against/G',
      homeText: home.goalsAgainstPerGame.toFixed(1),
      awayText: away.goalsAgainstPerGame.toFixed(1),
      homeValue: home.goalsAgainstPerGame,
      awayValue: away.goalsAgainstPerGame,
      trend: 'lower_better',
    },
    {
      key: 'goals-line-for',
      label: 'O2.5 Goals For',
      homeText: `${home.goalsForOver25Count}/${home.sampleGames} (${formatHitRate(home.goalsForOver25Rate)})`,
      awayText: `${away.goalsForOver25Count}/${away.sampleGames} (${formatHitRate(away.goalsForOver25Rate)})`,
      homeValue: home.goalsForOver25Rate,
      awayValue: away.goalsForOver25Rate,
      trend: 'higher_better',
    },
    {
      key: 'goals-line-against',
      label: 'O2.5 Goals Against',
      homeText: `${home.goalsAgainstOver25Count}/${home.sampleGames} (${formatHitRate(home.goalsAgainstOver25Rate)})`,
      awayText: `${away.goalsAgainstOver25Count}/${away.sampleGames} (${formatHitRate(away.goalsAgainstOver25Rate)})`,
      homeValue: home.goalsAgainstOver25Rate,
      awayValue: away.goalsAgainstOver25Rate,
      trend: 'lower_better',
    },
  ];
}

function getAngleValueClass(row: TeamAngleRow, side: 'home' | 'away'): string {
  if (row.homeValue === row.awayValue || row.trend === 'neutral') return 'text-zinc-200';

  const homeBetter =
    row.trend === 'higher_better' ? row.homeValue > row.awayValue : row.homeValue < row.awayValue;
  const awayBetter =
    row.trend === 'higher_better' ? row.awayValue > row.homeValue : row.awayValue < row.homeValue;

  if (side === 'home' && homeBetter) return 'text-emerald-300 font-medium';
  if (side === 'away' && awayBetter) return 'text-emerald-300 font-medium';
  return 'text-zinc-400';
}

function getFlags(group: TeamAngleInsightGroup): string[] {
  if (!group.flags.length) return ['No strong flag'];
  return group.flags;
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-zinc-100 text-sm font-semibold">Matchup Insights</h3>
      <span class="text-zinc-500 text-xs">H2H, recent, team angles</span>
    </div>

    <div v-if="isLoading" class="space-y-2">
      <div class="h-16 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-16 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-16 bg-zinc-800/70 rounded animate-pulse"></div>
    </div>

    <div v-else-if="isError || !insights" class="text-zinc-400 text-sm">
      Impossible de calculer les tendances pour ce matchup.
    </div>

    <template v-else>
      <section class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">
            Top Picks
          </p>
          <p class="text-zinc-500 text-[11px]">algo blend h2h + recent + context</p>
        </div>

        <div v-if="insights.topPicks.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          <article
            v-for="pick in insights.topPicks"
            :key="pick.id"
            class="rounded-md border p-2.5 space-y-2"
            :class="getTopPickCardClass(pick.rank)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-2 min-w-0">
                <span
                  class="inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded border border-zinc-700 bg-zinc-900/80 px-1 text-[10px] font-semibold text-zinc-200"
                >
                  #{{ pick.rank }}
                </span>

                <img
                  v-if="pick.playerHeadshot"
                  :src="pick.playerHeadshot"
                  :alt="pick.playerName ?? pick.teamAbbrev"
                  class="w-8 h-8 rounded-full border border-zinc-700 object-cover bg-zinc-900/70"
                />
                <img
                  v-else-if="getTeamLogoByAbbrev(pick.teamAbbrev)"
                  :src="getTeamLogoByAbbrev(pick.teamAbbrev) ?? ''"
                  :alt="pick.teamAbbrev"
                  class="w-8 h-8 rounded-full border border-zinc-700 object-contain bg-zinc-900/70 p-1"
                />

                <div class="min-w-0">
                  <p class="text-zinc-100 text-xs font-semibold truncate">{{ pick.title }}</p>
                  <p class="text-zinc-500 text-[10px] mt-0.5">
                    {{ getPickTypeLabel(pick.type) }} · {{ pick.sampleGames }}g
                  </p>
                </div>
              </div>

              <span class="text-sm font-semibold" :class="getConfidenceClass(pick.confidence)">
                {{ pick.confidence }}%
              </span>
            </div>

            <div class="h-1.5 rounded bg-zinc-800 overflow-hidden">
              <div
                class="h-full rounded bg-gradient-to-r from-sky-500/80 to-emerald-400/80"
                :style="{ width: getTopPickProgressWidth(pick.confidence) }"
              ></div>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] text-zinc-300">
                Hit {{ formatHitRate(pick.hitRate) }}
              </span>
              <span class="text-[10px] text-zinc-500">{{ pick.lineLabel }}</span>
            </div>

            <p class="text-[10px] text-zinc-500 leading-relaxed">{{ pick.rationale }}</p>
          </article>
        </div>

        <p v-else class="text-zinc-500 text-xs">
          Pas assez de signal fiable pour proposer des picks.
        </p>
      </section>

      <section
        v-for="section in playerTrendSections"
        :key="section.key"
        class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">{{ section.title }}</p>
          <p class="text-zinc-500 text-[11px]">{{ section.subtitle }}</p>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <article
            v-for="teamCard in [
              { key: `${section.key}-home`, team: homeTeamLabel, group: section.home },
              { key: `${section.key}-away`, team: awayTeamLabel, group: section.away },
            ]"
            :key="teamCard.key"
            class="rounded-md border border-zinc-800/80 bg-zinc-900/55 p-2.5 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-zinc-200 text-xs font-semibold">{{ teamCard.team }}</p>
              <span class="text-[10px] text-zinc-500">{{ getSampleLabel(teamCard.group) }}</span>
            </div>

            <div v-if="teamCard.group.players.length" class="space-y-2">
              <div
                v-for="player in teamCard.group.players"
                :key="`${teamCard.key}-${player.key}`"
                class="rounded-md border border-zinc-800/80 bg-zinc-950/70 px-2.5 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-zinc-100 text-xs font-medium truncate">{{ player.name }}</p>
                  <span class="text-[10px] text-zinc-400">impact {{ player.impactScore.toFixed(1) }}</span>
                </div>

                <div class="grid grid-cols-3 gap-1 mt-1.5">
                  <span class="rounded border border-zinc-700 bg-zinc-900/70 px-1.5 py-0.5 text-[10px] text-zinc-300 text-center">
                    {{ getPlayerMetric(section.key, player, 'pts') }}
                  </span>
                  <span class="rounded border border-zinc-700 bg-zinc-900/70 px-1.5 py-0.5 text-[10px] text-zinc-300 text-center">
                    {{ getPlayerMetric(section.key, player, 'goals') }}
                  </span>
                  <span class="rounded border border-zinc-700 bg-zinc-900/70 px-1.5 py-0.5 text-[10px] text-zinc-300 text-center">
                    {{ getPlayerMetric(section.key, player, 'sog') }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-1 mt-1.5">
                  <span class="px-1.5 py-0.5 rounded border text-[10px]" :class="getHitRateClass(player.sogOver25Rate)">
                    SOG {{ player.sogOver25Count }}/{{ player.games }} ({{ formatHitRate(player.sogOver25Rate) }})
                  </span>
                  <span class="px-1.5 py-0.5 rounded border text-[10px]" :class="getHitRateClass(player.pointsOver05Rate)">
                    PTS {{ player.pointsOver05Count }}/{{ player.games }} ({{ formatHitRate(player.pointsOver05Rate) }})
                  </span>
                  <span class="px-1.5 py-0.5 rounded border text-[10px]" :class="getHitRateClass(player.goalsOver05Rate)">
                    G {{ player.goalsOver05Count }}/{{ player.games }} ({{ formatHitRate(player.goalsOver05Rate) }})
                  </span>
                </div>
              </div>
            </div>

            <p v-else class="text-zinc-500 text-xs">Aucun signal joueur.</p>
          </article>
        </div>
      </section>

      <section class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">Team Angles</p>
          <div class="flex items-center gap-2">
            <input
              v-model.number="teamSogLine"
              type="number"
              min="15.5"
              max="45.5"
              step="0.5"
              class="w-20 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
            />
            <span class="text-zinc-300 text-[11px] font-medium">{{ formatSogLineLabel(teamSogLineLabel) }} SOG</span>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <article
            v-for="section in teamAngleSections"
            :key="section.key"
            class="rounded-md border border-zinc-800/80 bg-zinc-900/55 p-2.5 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-zinc-200 text-xs font-semibold">{{ section.title }}</p>
              <p class="text-[10px] text-zinc-500">{{ section.subtitle }}</p>
            </div>

            <div class="space-y-1.5">
              <div
                v-for="row in getAngleRows(section)"
                :key="`${section.key}-${row.key}`"
                class="grid grid-cols-[94px_1fr_94px] gap-2 items-center rounded border border-zinc-800/70 bg-zinc-950/70 px-2 py-1.5"
              >
                <span class="text-[10px] text-right truncate" :class="getAngleValueClass(row, 'home')">
                  {{ row.homeText }}
                </span>
                <span class="text-[10px] text-zinc-500 text-center truncate">{{ row.label }}</span>
                <span class="text-[10px] text-left truncate" :class="getAngleValueClass(row, 'away')">
                  {{ row.awayText }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div class="rounded border border-zinc-800/70 bg-zinc-950/70 p-2">
                <p class="text-[10px] text-zinc-500 mb-1">{{ homeTeamLabel }} flags</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="flag in getFlags(section.home)"
                    :key="`${section.key}-home-${flag}`"
                    class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900/60 text-[10px] text-zinc-300"
                  >
                    {{ flag }}
                  </span>
                </div>
              </div>

              <div class="rounded border border-zinc-800/70 bg-zinc-950/70 p-2">
                <p class="text-[10px] text-zinc-500 mb-1">{{ awayTeamLabel }} flags</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="flag in getFlags(section.away)"
                    :key="`${section.key}-away-${flag}`"
                    class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900/60 text-[10px] text-zinc-300"
                  >
                    {{ flag }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
