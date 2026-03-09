<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type {
  TeamAngleInsightGroup,
  TeamPlayerInsightGroup,
} from '@/app/games/types/gamePlayerInsights';
import { useGamePlayerInsights } from '@/app/games/composables/useGamePlayerInsights';

const props = defineProps<{
  game: UpcomingGame | null;
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
