import { computed, type Ref } from 'vue';
import type { TeamGameDetails } from '@/app/teams/presenters/teams.presenter';
import type {
  TeamHomeAwaySplitInsight,
  TeamRecord,
  TeamRecentFormInsight,
} from '@/app/teams/types/teamInsights';

function getTeamScore(game: TeamGameDetails): number {
  return game.isHome ? game.homeTeam.score : game.awayTeam.score;
}

function getOpponentScore(game: TeamGameDetails): number {
  return game.isHome ? game.awayTeam.score : game.homeTeam.score;
}

function getRecordLabel(wins: number, losses: number, ties: number): string {
  if (ties > 0) return `${wins}-${losses}-${ties}`;
  return `${wins}-${losses}`;
}

function summarizeGames(games: TeamGameDetails[]): TeamRecord {
  if (games.length === 0) {
    return {
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      record: '0-0',
      winPct: 0,
      goalsForAvg: 0,
      goalsAgainstAvg: 0,
      goalDiffAvg: 0,
    };
  }

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const game of games) {
    const teamScore = getTeamScore(game);
    const opponentScore = getOpponentScore(game);

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (teamScore > opponentScore) {
      wins += 1;
    } else if (teamScore < opponentScore) {
      losses += 1;
    } else {
      ties += 1;
    }
  }

  return {
    games: games.length,
    wins,
    losses,
    ties,
    record: getRecordLabel(wins, losses, ties),
    winPct: (wins / games.length) * 100,
    goalsForAvg: goalsFor / games.length,
    goalsAgainstAvg: goalsAgainst / games.length,
    goalDiffAvg: (goalsFor - goalsAgainst) / games.length,
  };
}

export function useTeamInsights(games: Ref<TeamGameDetails[] | undefined>) {
  const sortedGames = computed(() =>
    [...(games.value ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  );

  const recentForm = computed<TeamRecentFormInsight | null>(() => {
    if (sortedGames.value.length === 0) return null;

    const sample = sortedGames.value.slice(-10);
    const summary = summarizeGames(sample);
    const lastFiveTrend = sample
      .slice(-5)
      .reverse()
      .map((game) => {
        const teamScore = getTeamScore(game);
        const opponentScore = getOpponentScore(game);
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'T';
      })
      .join('');

    return {
      ...summary,
      sampleSize: sample.length,
      lastFiveTrend,
    };
  });

  const homeAwaySplit = computed<TeamHomeAwaySplitInsight | null>(() => {
    if (sortedGames.value.length === 0) return null;

    const homeGames = sortedGames.value.filter((game) => game.isHome);
    const awayGames = sortedGames.value.filter((game) => !game.isHome);
    const home = summarizeGames(homeGames);
    const away = summarizeGames(awayGames);
    const winPctDiff = home.winPct - away.winPct;

    let edge: TeamHomeAwaySplitInsight['edge'] = 'even';
    if (Math.abs(winPctDiff) >= 5) edge = winPctDiff > 0 ? 'home' : 'away';

    return {
      totalGames: sortedGames.value.length,
      edge,
      home,
      away,
    };
  });

  return {
    recentForm,
    homeAwaySplit,
  };
}
