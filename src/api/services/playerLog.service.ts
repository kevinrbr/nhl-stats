export const getPlayerLog = async (playerId: string): Promise<any> => {
  const res = await fetch(
    `api-nhl/v1/player/${playerId}/game-log/20252026/2` 
  );

  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération des données pour ${playerId}`);
  }

  return res.json();
};