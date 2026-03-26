<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';

const props = defineProps<{
  game: UpcomingGame | null;
}>();

const router = useRouter();
const gameRef = toRef(props, 'game');
const COMPLETED_GAME_STATES = new Set(['OFF', 'FINAL', 'FINAL_OT', 'FINAL_SO']);
const RECENT_FORM_WINDOW = 10;

const homeTeamAbbrev = computed(() => gameRef.value?.homeTeam.abbrev ?? '');
const awayTeamAbbrev = computed(() => gameRef.value?.awayTeam.abbrev ?? '');

const { data: homeTeamSchedule, isLoading: isHomeTeamScheduleLoading } = useTeamSchedule(homeTeamAbbrev);
const { data: awayTeamSchedule, isLoading: isAwayTeamScheduleLoading } = useTeamSchedule(awayTeamAbbrev);

type TeamRecentForm = {
  sampleGames: number;
  wins: number;
  losses: number;
  winRate: number;
  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  streak: string;
  recentResults: Array<{
    gameId: number;
    result: 'V' | 'D';
    extraTimeType: 'OT' | 'SO' | null;
  }>;
};

function getExtraTimeType(gameState: string, gameEndType?: string): 'OT' | 'SO' | null {
  const normalizedEndType = (gameEndType ?? '').toUpperCase();
  if (normalizedEndType === 'SO') return 'SO';
  if (normalizedEndType === 'OT') return 'OT';

  const normalizedState = (gameState ?? '').toUpperCase();
  if (normalizedState.includes('SO')) return 'SO';
  if (normalizedState.includes('OT')) return 'OT';
  if (normalizedState === 'FINAL_SO') return 'SO';
  if (normalizedState === 'FINAL_OT') return 'OT';
  return null;
}

function buildRecentForm(games: TeamScheduleGame[] | undefined): TeamRecentForm | null {
  if (!games?.length) return null;

  const completedGames = games
    .filter((scheduledGame) => COMPLETED_GAME_STATES.has((scheduledGame.gameState ?? '').toUpperCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RECENT_FORM_WINDOW);

  if (!completedGames.length) return null;

  let wins = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const recentResults: TeamRecentForm['recentResults'] = [];

  const outcomes = completedGames.map((scheduledGame) => {
    const teamScore = scheduledGame.isHome ? scheduledGame.homeTeam.score : scheduledGame.awayTeam.score;
    const opponentScore = scheduledGame.isHome ? scheduledGame.awayTeam.score : scheduledGame.homeTeam.score;
    const isWin = teamScore > opponentScore;

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (isWin) {
      wins += 1;
      return 'W';
    }

    losses += 1;
    return 'L';
  });

  completedGames.forEach((scheduledGame) => {
    const teamScore = scheduledGame.isHome ? scheduledGame.homeTeam.score : scheduledGame.awayTeam.score;
    const opponentScore = scheduledGame.isHome ? scheduledGame.awayTeam.score : scheduledGame.homeTeam.score;
    const isWin = teamScore > opponentScore;

    recentResults.push({
      gameId: scheduledGame.id,
      result: isWin ? 'V' : 'D',
      extraTimeType: getExtraTimeType(scheduledGame.gameState, scheduledGame.gameEndType),
    });
  });

  const latestOutcome = outcomes[0];
  let streakCount = 0;
  for (const outcome of outcomes) {
    if (outcome !== latestOutcome) break;
    streakCount += 1;
  }

  return {
    sampleGames: completedGames.length,
    wins,
    losses,
    winRate: Math.round((wins / completedGames.length) * 100),
    goalsForPerGame: Math.round((goalsFor / completedGames.length) * 10) / 10,
    goalsAgainstPerGame: Math.round((goalsAgainst / completedGames.length) * 10) / 10,
    streak: `${latestOutcome}${streakCount}`,
    recentResults,
  };
}

const homeRecentForm = computed(() => buildRecentForm(homeTeamSchedule.value));
const awayRecentForm = computed(() => buildRecentForm(awayTeamSchedule.value));

const isLoading = computed(
  () => isHomeTeamScheduleLoading.value || isAwayTeamScheduleLoading.value
);

const canRenderCards = computed(() => homeRecentForm.value && awayRecentForm.value);

const handleTeamClick = (teamAbbrev: string) => {
  if (!teamAbbrev) return;
  void router.push(getTeamsRoute(teamAbbrev));
};

function getResultBadgeClass(result: 'V' | 'D'): string {
  return result === 'V'
    ? 'border-emerald-500/35 bg-emerald-500/20 text-emerald-200'
    : 'border-rose-500/35 bg-rose-500/20 text-rose-200';
}
</script>

<template>
  <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div class="bg-zinc-800/80 rounded-lg p-4">
      <div class="animate-pulse space-y-2">
        <div class="h-3 bg-zinc-700 rounded w-1/2"></div>
        <div class="h-3 bg-zinc-700 rounded w-1/3"></div>
        <div class="h-3 bg-zinc-700 rounded w-2/3"></div>
      </div>
    </div>
    <div class="bg-zinc-800/80 rounded-lg p-4">
      <div class="animate-pulse space-y-2">
        <div class="h-3 bg-zinc-700 rounded w-1/2"></div>
        <div class="h-3 bg-zinc-700 rounded w-1/3"></div>
        <div class="h-3 bg-zinc-700 rounded w-2/3"></div>
      </div>
    </div>
  </div>

  <div v-else-if="canRenderCards" class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div class="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700/70">
      <div class="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          class="bg-transparent border-0 p-0 text-zinc-100 text-base font-semibold hover:underline underline-offset-2"
          @click="handleTeamClick(homeTeamAbbrev)"
        >
          {{ homeTeamAbbrev }} recent form
        </button>
        <span class="text-zinc-300 text-xs font-medium">{{ homeRecentForm?.sampleGames }} games</span>
      </div>
      <div class="space-y-1 text-sm">
        <p class="text-zinc-200">
          Record:
          <span class="text-zinc-100 font-semibold">{{ homeRecentForm?.wins }}-{{ homeRecentForm?.losses }}</span>
          · Win rate:
          <span class="text-zinc-100 font-semibold">{{ homeRecentForm?.winRate }}%</span>
        </p>
        <div class="flex flex-wrap gap-1.5 pt-0.5">
          <div
            v-for="result in homeRecentForm?.recentResults"
            :key="result.gameId"
            class="relative h-7 w-7 rounded border text-xs font-semibold flex items-center justify-center"
            :class="[
              getResultBadgeClass(result.result),
              result.extraTimeType ? 'border-amber-400/80 ring-1 ring-amber-400/80' : '',
            ]"
            :title="result.extraTimeType ? `${result.result} (${result.extraTimeType})` : result.result"
          >
            {{ result.result }}
            <span
              v-if="result.extraTimeType"
              class="absolute -top-0.5 -right-0.5 rounded bg-amber-400/95 px-1 py-[1px] text-[9px] leading-none font-bold text-zinc-950"
            >
              {{ result.extraTimeType }}
            </span>
          </div>
        </div>
        <p class="text-zinc-300">
          GF/GA: {{ homeRecentForm?.goalsForPerGame.toFixed(1) }} / {{ homeRecentForm?.goalsAgainstPerGame.toFixed(1) }}
          · Streak: <span class="text-zinc-200">{{ homeRecentForm?.streak }}</span>
        </p>
      </div>
    </div>

    <div class="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700/70">
      <div class="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          class="bg-transparent border-0 p-0 text-zinc-100 text-base font-semibold hover:underline underline-offset-2"
          @click="handleTeamClick(awayTeamAbbrev)"
        >
          {{ awayTeamAbbrev }} recent form
        </button>
        <span class="text-zinc-300 text-xs font-medium">{{ awayRecentForm?.sampleGames }} games</span>
      </div>
      <div class="space-y-1 text-sm">
        <p class="text-zinc-200">
          Record:
          <span class="text-zinc-100 font-semibold">{{ awayRecentForm?.wins }}-{{ awayRecentForm?.losses }}</span>
          · Win rate:
          <span class="text-zinc-100 font-semibold">{{ awayRecentForm?.winRate }}%</span>
        </p>
        <div class="flex flex-wrap gap-1.5 pt-0.5">
          <div
            v-for="result in awayRecentForm?.recentResults"
            :key="result.gameId"
            class="relative h-7 w-7 rounded border text-xs font-semibold flex items-center justify-center"
            :class="[
              getResultBadgeClass(result.result),
              result.extraTimeType ? 'border-amber-400/80 ring-1 ring-amber-400/80' : '',
            ]"
            :title="result.extraTimeType ? `${result.result} (${result.extraTimeType})` : result.result"
          >
            {{ result.result }}
            <span
              v-if="result.extraTimeType"
              class="absolute -top-0.5 -right-0.5 rounded bg-amber-400/95 px-1 py-[1px] text-[9px] leading-none font-bold text-zinc-950"
            >
              {{ result.extraTimeType }}
            </span>
          </div>
        </div>
        <p class="text-zinc-300">
          GF/GA: {{ awayRecentForm?.goalsForPerGame.toFixed(1) }} / {{ awayRecentForm?.goalsAgainstPerGame.toFixed(1) }}
          · Streak: <span class="text-zinc-200">{{ awayRecentForm?.streak }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
