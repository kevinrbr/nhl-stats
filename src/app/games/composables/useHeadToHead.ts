import { computed, type Ref } from 'vue';
import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';

export function useHeadToHead(
  games: Ref<TeamScheduleGame[] | undefined>,
  opponentTeam: Ref<string | null>
) {
  const headToHeadGames = computed(() => {
    if (!games.value || !opponentTeam.value) return [];
    
    return games.value.filter(game => {
      const opponent = game.isHome 
        ? game.awayTeam.abbrev 
        : game.homeTeam.abbrev;
      
      return opponent === opponentTeam.value;
    });
  });

  const headToHeadStats = computed(() => {
    const h2h = headToHeadGames.value;
    if (h2h.length === 0) return null;

    let wins = 0;
    let losses = 0;
    const otLosses = 0;

    h2h.forEach(game => {
      const teamScore = game.isHome ? game.homeTeam.score : game.awayTeam.score;
      const opponentScore = game.isHome ? game.awayTeam.score : game.homeTeam.score;

      if (teamScore > opponentScore) {
        wins++;
      } else {
        losses++;
      }
    });

    return {
      wins,
      losses,
      otLosses,
      total: h2h.length,
      record: `${wins}-${losses}${otLosses > 0 ? `-${otLosses}` : ''}`
    };
  });

  return {
    headToHeadGames,
    headToHeadStats
  };
}
