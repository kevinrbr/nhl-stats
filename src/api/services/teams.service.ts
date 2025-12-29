export const getTeamsLastGames = async (team: string): Promise<any> => {
  const res = await fetch(
    `/api-nhl/v1/club-schedule-season/${team}/20252026`
  );

  if (!res.ok) {
    throw new Error("Erreur fetching rosters data");
  }

  return res.json();
};