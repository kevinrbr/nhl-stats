import type { GameCenterBoxscoreResponse } from '@/app/games/types/gameCenter';

export async function fetchGameCenterBoxscore(gameId: number): Promise<GameCenterBoxscoreResponse> {
  const response = await fetch(`/api-nhl/v1/gamecenter/${gameId}/boxscore`);

  if (!response.ok) {
    throw new Error(`Erreur lors de la recuperation du boxscore pour le match ${gameId}`);
  }

  return response.json();
}
