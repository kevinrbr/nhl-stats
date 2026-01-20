// Récupère le calendrier de la saison
export const getTeamSchedule = async (team: string): Promise<any> => {
  const res = await fetch(
    `/api-nhl/v1/club-schedule-season/${team}/20252026`
  );

  if (!res.ok) {
    throw new Error("Erreur fetching team schedule");
  }

  return res.json();
};

// Récupère les détails d'un match (boxscore)
export const getGameBoxscore = async (gameId: number): Promise<any> => {
  const res = await fetch(`/api-nhl/v1/gamecenter/${gameId}/boxscore`);

  if (!res.ok) {
    throw new Error(`Erreur fetching game ${gameId} boxscore`);
  }

  return res.json();
};

// Récupère les 20 derniers matchs avec détails
export const getTeamLastGamesWithDetails = async (team: string): Promise<any[]> => {
  // 1. Récupérer le calendrier
  const scheduleData = await getTeamSchedule(team);
  
  // 2. Filtrer et trier les matchs terminés
  const games = scheduleData.games ?? scheduleData.gamesByMonth?.[0]?.games ?? [];
  const completedGames = games
    .filter((game: any) => game.gameState === "OFF" || game.gameState === "FINAL")
    .sort(
      (a: any, b: any) =>
        new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime()
    );

  // 3. Récupérer les détails de chaque match
  const details = await Promise.all(
    completedGames.map(async (game: any) => {
      try {
        const boxscore = await getGameBoxscore(game.id);
        return {
          gameInfo: game,
          boxscore
        };
      } catch (error) {
        console.error(`Error fetching boxscore for game ${game.id}:`, error);
        return null;
      }
    })
  );

  // Filtrer les matchs dont on n'a pas pu récupérer les détails
  return details.filter(Boolean);
};