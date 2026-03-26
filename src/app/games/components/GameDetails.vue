<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';
import { useTeamSchedule } from '@/app/teams/queries/useTeamSchedule';
import { useTeamScheduleBySeason } from '@/app/teams/queries/useTeamScheduleBySeason';
import { useHeadToHead } from '@/app/games/composables/useHeadToHead';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';
import { getNhlSeasonIdFromDate, getPreviousNhlSeasonId } from '@/app/teams/utils/season';
import GameStatsPanel from '@/app/games/components/GameStatsPanel.vue';
import GameTeamRecentFormCards from '@/app/games/components/GameTeamRecentFormCards.vue';

const props = defineProps<{
  game: UpcomingGame;
}>();

const { game } = toRefs(props);
const router = useRouter();
const COMPLETED_GAME_STATES = new Set(['OFF', 'FINAL', 'FINAL_OT', 'FINAL_SO']);

const homeTeam = computed(() => game.value.homeTeam.abbrev);
const awayTeam = computed(() => game.value.awayTeam.abbrev);

const { data: homeTeamSchedule, isLoading: isHomeTeamScheduleLoading } = useTeamSchedule(homeTeam);

const homeTeamCompletedGames = computed(() => {
  if (!homeTeamSchedule.value) return [];

  return homeTeamSchedule.value.filter((scheduledGame) =>
    COMPLETED_GAME_STATES.has((scheduledGame.gameState ?? '').toUpperCase())
  );
});

const currentSeasonH2hCount = computed(() => {
  if (!awayTeam.value) return 0;

  return homeTeamCompletedGames.value.filter((scheduledGame) => {
    const opponent = scheduledGame.isHome
      ? scheduledGame.awayTeam.abbrev
      : scheduledGame.homeTeam.abbrev;
    return opponent === awayTeam.value;
  }).length;
});

const currentSeasonId = computed(() => getNhlSeasonIdFromDate(game.value.date));
const previousSeasonId = computed(() => getPreviousNhlSeasonId(currentSeasonId.value));
const shouldLoadPreviousSeasonH2h = computed(() => currentSeasonH2hCount.value < 3);

const {
  data: previousSeasonHomeTeamSchedule,
  isLoading: isPreviousSeasonHomeTeamScheduleLoading,
} = useTeamScheduleBySeason(homeTeam, previousSeasonId, shouldLoadPreviousSeasonH2h);

const previousSeasonHomeTeamCompletedGames = computed(() => {
  if (!previousSeasonHomeTeamSchedule.value) return [];

  return previousSeasonHomeTeamSchedule.value.filter((scheduledGame) =>
    COMPLETED_GAME_STATES.has((scheduledGame.gameState ?? '').toUpperCase())
  );
});

const { headToHeadGames, headToHeadStats } = useHeadToHead(
  homeTeamCompletedGames,
  awayTeam,
  {
    fallbackGames: previousSeasonHomeTeamCompletedGames,
    minGames: 3,
  }
);

const isHeadToHeadLoading = computed(
  () => isHomeTeamScheduleLoading.value || isPreviousSeasonHomeTeamScheduleLoading.value
);

const selectedStatsGameId = ref(game.value.id);

watch(
  () => game.value.id,
  (nextGameId) => {
    selectedStatsGameId.value = nextGameId;
  },
  { immediate: true }
);

const isViewingHeadToHeadStats = computed(
  () => selectedStatsGameId.value !== game.value.id
);

const h2hSummary = computed(() => {
  if (!headToHeadGames.value.length) return null;

  let goalsFor = 0;
  let goalsAgainst = 0;
  let oneGoalGames = 0;

  for (const matchupGame of headToHeadGames.value) {
    const teamScore = getTeamScore(matchupGame);
    const opponentScore = getOpponentScore(matchupGame);

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (Math.abs(teamScore - opponentScore) === 1) {
      oneGoalGames += 1;
    }
  }

  const sampleSize = headToHeadGames.value.length;
  const totalGoals = goalsFor + goalsAgainst;

  return {
    sampleSize,
    goalsForPerGame: goalsFor / sampleSize,
    goalsAgainstPerGame: goalsAgainst / sampleSize,
    totalGoalsPerGame: totalGoals / sampleSize,
    oneGoalGames,
  };
});

const h2hDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatH2hGameDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '-';
  return h2hDateFormatter.format(parsedDate);
}

function getTeamScore(matchupGame: TeamScheduleGame): number {
  return matchupGame.isHome ? matchupGame.homeTeam.score : matchupGame.awayTeam.score;
}

function getOpponentScore(matchupGame: TeamScheduleGame): number {
  return matchupGame.isHome ? matchupGame.awayTeam.score : matchupGame.homeTeam.score;
}

function isTeamWin(matchupGame: TeamScheduleGame): boolean {
  return getTeamScore(matchupGame) > getOpponentScore(matchupGame);
}

function getResultBadgeClass(matchupGame: TeamScheduleGame): string {
  return isTeamWin(matchupGame)
    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
    : 'border-rose-500/35 bg-rose-500/12 text-rose-300';
}

function getResultLabel(matchupGame: TeamScheduleGame): string {
  return isTeamWin(matchupGame) ? 'W' : 'L';
}

const handleH2HGameClick = (gameId: number) => {
  selectedStatsGameId.value = gameId;
};

const handleBackToUpcomingPreview = () => {
  selectedStatsGameId.value = game.value.id;
};

const handleTeamClick = (teamAbbrev: string) => {
  void router.push(getTeamsRoute(teamAbbrev));
};
</script>

<template>
  <div class="text-zinc-100 space-y-6">
    <div class="border-b border-zinc-700/80 pb-5">
      <div class="flex items-center gap-3 mb-2">
        <img :src="game.homeTeam.logo" class="w-12 h-12 md:w-14 md:h-14 object-contain" />
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-zinc-50 hover:underline underline-offset-4"
            @click="handleTeamClick(game.homeTeam.abbrev)"
          >
            {{ game.homeTeam.name }}
          </button>
          <span class="text-zinc-300">vs</span>
          <button
            type="button"
            class="bg-transparent border-0 p-0 text-zinc-50 hover:underline underline-offset-4"
            @click="handleTeamClick(game.awayTeam.abbrev)"
          >
            {{ game.awayTeam.name }}
          </button>
        </h2>
        <img :src="game.awayTeam.logo" class="w-12 h-12 md:w-14 md:h-14 object-contain" />
      </div>
      <p class="text-zinc-300 text-base">
        {{ game.dayAbbrev }} - {{ game.startTime }}
      </p>
    </div>

    <GameTeamRecentFormCards :game="game" />

    <div v-if="isHeadToHeadLoading" class="bg-zinc-800/80 rounded-lg p-4">
      <div class="animate-pulse space-y-2">
        <div class="h-3 bg-zinc-700 rounded w-1/2"></div>
        <div class="h-3 bg-zinc-700 rounded w-1/3"></div>
      </div>
    </div>

    <template v-else>
      <div
        v-if="headToHeadStats && headToHeadStats.total > 0"
        class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5 space-y-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-zinc-100 text-base font-semibold">H2H Recent Meetings</h3>
            <p class="text-zinc-300 text-sm mt-0.5">current season + previous season fallback</p>
          </div>
          <span class="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-200">
            {{ headToHeadStats.total }} games
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <div class="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-300">Record</p>
            <p class="text-lg font-semibold text-zinc-50 mt-1.5">{{ headToHeadStats.record }}</p>
          </div>
          <div class="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-300">{{ homeTeam }} GF/G</p>
            <p class="text-lg font-semibold text-zinc-50 mt-1.5">
              {{ h2hSummary ? h2hSummary.goalsForPerGame.toFixed(1) : '-' }}
            </p>
          </div>
          <div class="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-300">{{ homeTeam }} GA/G</p>
            <p class="text-lg font-semibold text-zinc-50 mt-1.5">
              {{ h2hSummary ? h2hSummary.goalsAgainstPerGame.toFixed(1) : '-' }}
            </p>
          </div>
          <div class="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-300">Total goals/g</p>
            <p class="text-lg font-semibold text-zinc-50 mt-1.5">
              {{ h2hSummary ? h2hSummary.totalGoalsPerGame.toFixed(1) : '-' }}
            </p>
          </div>
          <div class="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-300">One-goal games</p>
            <p class="text-lg font-semibold text-zinc-50 mt-1.5">
              {{ h2hSummary ? `${h2hSummary.oneGoalGames}/${h2hSummary.sampleSize}` : '-' }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <button
            v-for="h2hGame in headToHeadGames"
            :key="h2hGame.id"
            type="button"
            class="w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors"
            :class="[
              selectedStatsGameId === h2hGame.id
                ? 'border-sky-500/40 bg-sky-500/10'
                : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/70',
            ]"
            @click="handleH2HGameClick(h2hGame.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <img :src="h2hGame.homeTeam.logo" class="w-5 h-5 flex-shrink-0" />
                <span
                  role="link"
                  tabindex="0"
                  class="text-zinc-200 text-sm font-medium hover:underline underline-offset-2 cursor-pointer"
                  @click.stop="handleTeamClick(h2hGame.homeTeam.abbrev)"
                  @keydown.enter.stop.prevent="handleTeamClick(h2hGame.homeTeam.abbrev)"
                  @keydown.space.stop.prevent="handleTeamClick(h2hGame.homeTeam.abbrev)"
                >
                  {{ h2hGame.homeTeam.abbrev }}
                </span>
                <span
                  class="text-base font-semibold"
                  :class="h2hGame.homeTeam.score > h2hGame.awayTeam.score ? 'text-emerald-300' : 'text-zinc-100'"
                >
                  {{ h2hGame.homeTeam.score }}
                </span>
                <span class="text-zinc-400 text-sm">-</span>
                <span
                  class="text-base font-semibold"
                  :class="h2hGame.awayTeam.score > h2hGame.homeTeam.score ? 'text-emerald-300' : 'text-zinc-100'"
                >
                  {{ h2hGame.awayTeam.score }}
                </span>
                <span
                  role="link"
                  tabindex="0"
                  class="text-zinc-200 text-sm font-medium hover:underline underline-offset-2 cursor-pointer"
                  @click.stop="handleTeamClick(h2hGame.awayTeam.abbrev)"
                  @keydown.enter.stop.prevent="handleTeamClick(h2hGame.awayTeam.abbrev)"
                  @keydown.space.stop.prevent="handleTeamClick(h2hGame.awayTeam.abbrev)"
                >
                  {{ h2hGame.awayTeam.abbrev }}
                </span>
                <img :src="h2hGame.awayTeam.logo" class="w-5 h-5 flex-shrink-0" />
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-zinc-300 text-xs font-medium">{{ formatH2hGameDate(h2hGame.date) }}</span>
                <span
                  class="rounded px-2 py-0.5 text-xs font-semibold border"
                  :class="getResultBadgeClass(h2hGame)"
                >
                  {{ getResultLabel(h2hGame) }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div v-else class="bg-zinc-800/80 rounded-lg p-4 text-center">
        <p class="text-zinc-300 text-sm">
          No previous matchups found
        </p>
      </div>
    </template>

    <GameStatsPanel
      :game-id="selectedStatsGameId"
      :fallback-game="game"
      :show-back-button="isViewingHeadToHeadStats"
      :show-game-summary="isViewingHeadToHeadStats"
      @back="handleBackToUpcomingPreview"
    />
  </div>
</template>
