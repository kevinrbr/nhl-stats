<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type {
  TeamAngleInsightGroup,
  TeamPlayerInsightGroup,
  TeamStyleProfile,
  TeamStyleSimilarGames,
} from '@/app/games/types/gamePlayerInsights';
import { useGamePlayerInsights } from '@/app/games/composables/useGamePlayerInsights';

const props = defineProps<{
  game: UpcomingGame | null;
}>();

const emit = defineEmits<{
  (e: 'select-game', gameId: number): void;
}>();

const gameRef = toRef(props, 'game');
const { data: insights, isLoading, isError } = useGamePlayerInsights(gameRef);

const homeTeamLabel = computed(() => props.game?.homeTeam.abbrev ?? 'HOME');
const awayTeamLabel = computed(() => props.game?.awayTeam.abbrev ?? 'AWAY');

function getSampleLabel(group: TeamPlayerInsightGroup): string {
  if (group.sampleGames <= 1) return `${group.sampleGames} game`;
  return `${group.sampleGames} games`;
}

function getTeamSampleLabel(group: TeamAngleInsightGroup): string {
  if (group.sampleGames <= 1) return `${group.sampleGames} game`;
  return `${group.sampleGames} games`;
}

function getStyleSampleLabel(group: TeamStyleProfile | TeamStyleSimilarGames): string {
  if (group.sampleGames <= 1) return `${group.sampleGames} game`;
  return `${group.sampleGames} games`;
}

function formatGameDate(date: string): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '-';
  return value.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSimilarityClass(score: number): string {
  if (score >= 75) return 'text-emerald-300';
  if (score >= 60) return 'text-amber-300';
  return 'text-zinc-400';
}

function getEdgeBadgeClass(side: 'home' | 'away' | 'even'): string {
  if (side === 'home') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (side === 'away') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
  return 'border-zinc-600 bg-zinc-800/40 text-zinc-300';
}

function getEdgeSideLabel(side: 'home' | 'away' | 'even', homeLabel: string, awayLabel: string): string {
  if (side === 'home') return homeLabel;
  if (side === 'away') return awayLabel;
  return 'Even';
}

function handleSelectGame(gameId: number): void {
  if (!Number.isFinite(gameId) || gameId <= 0) return;
  emit('select-game', gameId);
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-zinc-100 text-sm font-semibold">Player Angles</h3>
      <span class="text-zinc-500 text-xs">H2H + recent form</span>
    </div>

    <div v-if="isLoading" class="space-y-2">
      <div class="h-16 bg-zinc-800/70 rounded animate-pulse"></div>
      <div class="h-16 bg-zinc-800/70 rounded animate-pulse"></div>
    </div>

    <div v-else-if="isError || !insights" class="text-zinc-400 text-sm">
      Impossible de calculer les tendances joueurs pour ce matchup.
    </div>

    <template v-else>
      <div class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">
            Style Matchup
          </p>
          <p class="text-zinc-400 text-[11px]">
            Similarity:
            <span class="font-semibold" :class="getSimilarityClass(insights.style.similarity)">
              {{ insights.style.similarity.toFixed(1) }}%
            </span>
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in insights.style.matchupTags"
            :key="`style-matchup-tag-${tag}`"
            class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/40 text-zinc-200 text-[10px]"
          >
            {{ tag }}
          </span>
          <span
            v-if="insights.style.matchupTags.length === 0"
            class="text-zinc-500 text-[10px]"
          >
            No strong style mismatch detected
          </span>
        </div>

        <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
          <div class="flex items-center justify-between gap-2">
            <p class="text-zinc-300 text-xs font-semibold">Theoretical edge</p>
            <span
              class="px-2 py-0.5 rounded border text-[10px] font-medium"
              :class="getEdgeBadgeClass(insights.style.edge.side)"
            >
              {{ getEdgeSideLabel(insights.style.edge.side, homeTeamLabel, awayTeamLabel) }}
            </span>
          </div>
          <p class="text-zinc-100 text-xs mt-1">{{ insights.style.edge.summary }}</p>
          <p class="text-zinc-500 text-[10px] mt-0.5">
            confidence {{ insights.style.edge.confidence }}%
          </p>
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="reason in insights.style.edge.reasons"
              :key="`style-edge-reason-${reason}`"
              class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]"
            >
              {{ reason }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ homeTeamLabel }} · profile {{ getStyleSampleLabel(insights.style.home) }}
            </p>
            <div class="space-y-1.5">
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Pace</span>
                  <span>{{ insights.style.home.pace.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-sky-500/70" :style="{ width: `${insights.style.home.score.pace}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Def load</span>
                  <span>{{ insights.style.home.defensiveLoad.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-rose-500/70" :style="{ width: `${insights.style.home.score.defensiveLoad}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Physical</span>
                  <span>{{ insights.style.home.physicality.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-amber-500/70" :style="{ width: `${insights.style.home.score.physicality}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Chaos</span>
                  <span>{{ insights.style.home.chaos.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-violet-500/70" :style="{ width: `${insights.style.home.score.chaos}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Discipline</span>
                  <span>{{ insights.style.home.discipline.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-emerald-500/70" :style="{ width: `${insights.style.home.score.discipline}%` }"></div>
                </div>
              </div>
            </div>
            <div v-if="insights.style.home.tags.length" class="flex flex-wrap gap-1">
              <span
                v-for="tag in insights.style.home.tags"
                :key="`style-home-tag-${tag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ awayTeamLabel }} · profile {{ getStyleSampleLabel(insights.style.away) }}
            </p>
            <div class="space-y-1.5">
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Pace</span>
                  <span>{{ insights.style.away.pace.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-sky-500/70" :style="{ width: `${insights.style.away.score.pace}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Def load</span>
                  <span>{{ insights.style.away.defensiveLoad.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-rose-500/70" :style="{ width: `${insights.style.away.score.defensiveLoad}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Physical</span>
                  <span>{{ insights.style.away.physicality.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-amber-500/70" :style="{ width: `${insights.style.away.score.physicality}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Chaos</span>
                  <span>{{ insights.style.away.chaos.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-violet-500/70" :style="{ width: `${insights.style.away.score.chaos}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Discipline</span>
                  <span>{{ insights.style.away.discipline.toFixed(1) }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded bg-zinc-800 overflow-hidden">
                  <div class="h-full bg-emerald-500/70" :style="{ width: `${insights.style.away.score.discipline}%` }"></div>
                </div>
              </div>
            </div>
            <div v-if="insights.style.away.tags.length" class="flex flex-wrap gap-1">
              <span
                v-for="tag in insights.style.away.tags"
                :key="`style-away-tag-${tag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ homeTeamLabel }} · similar opponents to {{ awayTeamLabel }}
              ({{ getStyleSampleLabel(insights.style.similarGames.home) }})
            </p>
            <div v-if="insights.style.similarGames.home.matches.length" class="space-y-1.5">
              <button
                v-for="match in insights.style.similarGames.home.matches"
                :key="`home-style-match-${match.gameId}`"
                type="button"
                class="w-full rounded border border-zinc-800/80 bg-zinc-950/60 px-2 py-1.5 text-left hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors cursor-pointer"
                @click="handleSelectGame(match.gameId)"
              >
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-zinc-300">vs {{ match.opponentAbbrev }} · {{ formatGameDate(match.gameDate) }}</span>
                  <span :class="getSimilarityClass(match.similarity)">
                    {{ match.similarity.toFixed(1) }}%
                  </span>
                </div>
                <p class="text-zinc-500 text-[10px] mt-0.5">
                  Score {{ match.teamGoals }}-{{ match.opponentGoals }} · SOG {{ match.teamSog }}-{{ match.opponentSog }}
                </p>
              </button>
            </div>
            <p v-else class="text-zinc-500 text-xs">Pas assez d'historique comparable.</p>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ awayTeamLabel }} · similar opponents to {{ homeTeamLabel }}
              ({{ getStyleSampleLabel(insights.style.similarGames.away) }})
            </p>
            <div v-if="insights.style.similarGames.away.matches.length" class="space-y-1.5">
              <button
                v-for="match in insights.style.similarGames.away.matches"
                :key="`away-style-match-${match.gameId}`"
                type="button"
                class="w-full rounded border border-zinc-800/80 bg-zinc-950/60 px-2 py-1.5 text-left hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors cursor-pointer"
                @click="handleSelectGame(match.gameId)"
              >
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-zinc-300">vs {{ match.opponentAbbrev }} · {{ formatGameDate(match.gameDate) }}</span>
                  <span :class="getSimilarityClass(match.similarity)">
                    {{ match.similarity.toFixed(1) }}%
                  </span>
                </div>
                <p class="text-zinc-500 text-[10px] mt-0.5">
                  Score {{ match.teamGoals }}-{{ match.opponentGoals }} · SOG {{ match.teamSog }}-{{ match.opponentSog }}
                </p>
              </button>
            </div>
            <p v-else class="text-zinc-500 text-xs">Pas assez d'historique comparable.</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">
            H2H impact (last {{ insights.h2hGameIds.length }} games)
          </p>
          <p class="text-zinc-500 text-[11px]">
            points/game + sog/game
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ homeTeamLabel }} · {{ getSampleLabel(insights.h2h.home) }}
            </p>
            <div v-if="insights.h2h.home.players.length" class="space-y-2">
              <div
                v-for="player in insights.h2h.home.players"
                :key="`h2h-home-${player.key}`"
                class="flex items-center justify-between gap-2"
              >
                <p class="text-zinc-100 text-xs truncate">{{ player.name }}</p>
                <div class="text-right shrink-0">
                  <p class="text-zinc-400 text-[11px]">
                    {{ player.pointsPerGame.toFixed(1) }} pts/g · {{ player.sogPerGame.toFixed(1) }} sog/g
                  </p>
                  <p class="text-zinc-500 text-[10px]">
                    O2.5 SOG: {{ player.sogOver25Count }}/{{ player.games }} ({{ player.sogOver25Rate.toFixed(0) }}%)
                    · O0.5 PTS: {{ player.pointsOver05Count }}/{{ player.games }} ({{ player.pointsOver05Rate.toFixed(0) }}%)
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-zinc-500 text-xs">Aucun signal H2H.</p>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ awayTeamLabel }} · {{ getSampleLabel(insights.h2h.away) }}
            </p>
            <div v-if="insights.h2h.away.players.length" class="space-y-2">
              <div
                v-for="player in insights.h2h.away.players"
                :key="`h2h-away-${player.key}`"
                class="flex items-center justify-between gap-2"
              >
                <p class="text-zinc-100 text-xs truncate">{{ player.name }}</p>
                <div class="text-right shrink-0">
                  <p class="text-zinc-400 text-[11px]">
                    {{ player.pointsPerGame.toFixed(1) }} pts/g · {{ player.sogPerGame.toFixed(1) }} sog/g
                  </p>
                  <p class="text-zinc-500 text-[10px]">
                    O2.5 SOG: {{ player.sogOver25Count }}/{{ player.games }} ({{ player.sogOver25Rate.toFixed(0) }}%)
                    · O0.5 PTS: {{ player.pointsOver05Count }}/{{ player.games }} ({{ player.pointsOver05Rate.toFixed(0) }}%)
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-zinc-500 text-xs">Aucun signal H2H.</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">
            Team Angles
          </p>
          <p class="text-zinc-500 text-[11px]">
            Lines: SOG O29.5 · Goals O2.5
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ homeTeamLabel }} · H2H {{ getTeamSampleLabel(insights.teams.h2h.home) }}
            </p>
            <p class="text-zinc-400 text-[11px]">
              SOG For {{ insights.teams.h2h.home.sogForPerGame.toFixed(1) }} · Against {{ insights.teams.h2h.home.sogAgainstPerGame.toFixed(1) }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O29.5 SOG For: {{ insights.teams.h2h.home.sogForOver295Count }}/{{ insights.teams.h2h.home.sampleGames }}
              · O29.5 SOG Against: {{ insights.teams.h2h.home.sogAgainstOver295Count }}/{{ insights.teams.h2h.home.sampleGames }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O2.5 Goals For: {{ insights.teams.h2h.home.goalsForOver25Count }}/{{ insights.teams.h2h.home.sampleGames }}
              · O2.5 Goals Against: {{ insights.teams.h2h.home.goalsAgainstOver25Count }}/{{ insights.teams.h2h.home.sampleGames }}
            </p>
            <div v-if="insights.teams.h2h.home.flags.length" class="flex flex-wrap gap-1">
              <span
                v-for="flag in insights.teams.h2h.home.flags"
                :key="`h2h-home-flag-${flag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ flag }}
              </span>
            </div>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ awayTeamLabel }} · H2H {{ getTeamSampleLabel(insights.teams.h2h.away) }}
            </p>
            <p class="text-zinc-400 text-[11px]">
              SOG For {{ insights.teams.h2h.away.sogForPerGame.toFixed(1) }} · Against {{ insights.teams.h2h.away.sogAgainstPerGame.toFixed(1) }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O29.5 SOG For: {{ insights.teams.h2h.away.sogForOver295Count }}/{{ insights.teams.h2h.away.sampleGames }}
              · O29.5 SOG Against: {{ insights.teams.h2h.away.sogAgainstOver295Count }}/{{ insights.teams.h2h.away.sampleGames }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O2.5 Goals For: {{ insights.teams.h2h.away.goalsForOver25Count }}/{{ insights.teams.h2h.away.sampleGames }}
              · O2.5 Goals Against: {{ insights.teams.h2h.away.goalsAgainstOver25Count }}/{{ insights.teams.h2h.away.sampleGames }}
            </p>
            <div v-if="insights.teams.h2h.away.flags.length" class="flex flex-wrap gap-1">
              <span
                v-for="flag in insights.teams.h2h.away.flags"
                :key="`h2h-away-flag-${flag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ flag }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ homeTeamLabel }} · Recent {{ getTeamSampleLabel(insights.teams.recent.home) }}
            </p>
            <p class="text-zinc-400 text-[11px]">
              SOG For {{ insights.teams.recent.home.sogForPerGame.toFixed(1) }} · Against {{ insights.teams.recent.home.sogAgainstPerGame.toFixed(1) }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O29.5 SOG For: {{ insights.teams.recent.home.sogForOver295Count }}/{{ insights.teams.recent.home.sampleGames }}
              · O29.5 SOG Against: {{ insights.teams.recent.home.sogAgainstOver295Count }}/{{ insights.teams.recent.home.sampleGames }}
            </p>
            <div v-if="insights.teams.recent.home.flags.length" class="flex flex-wrap gap-1">
              <span
                v-for="flag in insights.teams.recent.home.flags"
                :key="`recent-home-flag-${flag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ flag }}
              </span>
            </div>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-2">
            <p class="text-zinc-300 text-xs font-semibold">
              {{ awayTeamLabel }} · Recent {{ getTeamSampleLabel(insights.teams.recent.away) }}
            </p>
            <p class="text-zinc-400 text-[11px]">
              SOG For {{ insights.teams.recent.away.sogForPerGame.toFixed(1) }} · Against {{ insights.teams.recent.away.sogAgainstPerGame.toFixed(1) }}
            </p>
            <p class="text-zinc-500 text-[10px]">
              O29.5 SOG For: {{ insights.teams.recent.away.sogForOver295Count }}/{{ insights.teams.recent.away.sampleGames }}
              · O29.5 SOG Against: {{ insights.teams.recent.away.sogAgainstOver295Count }}/{{ insights.teams.recent.away.sampleGames }}
            </p>
            <div v-if="insights.teams.recent.away.flags.length" class="flex flex-wrap gap-1">
              <span
                v-for="flag in insights.teams.recent.away.flags"
                :key="`recent-away-flag-${flag}`"
                class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]"
              >
                {{ flag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-zinc-200 text-xs font-semibold uppercase tracking-wide">Recent form (last 5 games)</p>
          <p class="text-zinc-500 text-[11px]">hot players to watch</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ homeTeamLabel }} · {{ getSampleLabel(insights.recent.home) }}
            </p>
            <div v-if="insights.recent.home.players.length" class="space-y-2">
              <div
                v-for="player in insights.recent.home.players"
                :key="`recent-home-${player.key}`"
                class="flex items-center justify-between gap-2"
              >
                <p class="text-zinc-100 text-xs truncate">{{ player.name }}</p>
                <div class="text-right shrink-0">
                  <p class="text-zinc-400 text-[11px]">
                    {{ player.points }} pts · {{ player.sog }} sog ({{ player.games }}g)
                  </p>
                  <p class="text-zinc-500 text-[10px]">
                    O2.5 SOG: {{ player.sogOver25Count }}/{{ player.games }} · O0.5 PTS: {{ player.pointsOver05Count }}/{{ player.games }}
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-zinc-500 text-xs">Aucun joueur chaud sur la fenetre.</p>
          </div>

          <div class="rounded-md border border-zinc-800/80 bg-zinc-900/50 p-2.5">
            <p class="text-zinc-300 text-xs font-semibold mb-2">
              {{ awayTeamLabel }} · {{ getSampleLabel(insights.recent.away) }}
            </p>
            <div v-if="insights.recent.away.players.length" class="space-y-2">
              <div
                v-for="player in insights.recent.away.players"
                :key="`recent-away-${player.key}`"
                class="flex items-center justify-between gap-2"
              >
                <p class="text-zinc-100 text-xs truncate">{{ player.name }}</p>
                <div class="text-right shrink-0">
                  <p class="text-zinc-400 text-[11px]">
                    {{ player.points }} pts · {{ player.sog }} sog ({{ player.games }}g)
                  </p>
                  <p class="text-zinc-500 text-[10px]">
                    O2.5 SOG: {{ player.sogOver25Count }}/{{ player.games }} · O0.5 PTS: {{ player.pointsOver05Count }}/{{ player.games }}
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-zinc-500 text-xs">Aucun joueur chaud sur la fenetre.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
