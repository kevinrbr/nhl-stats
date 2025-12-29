import type { ApiPlayersByPosition } from "@/api/types/players.api";

export const getRostersByTeam = async (teamId: string): Promise<ApiPlayersByPosition> => {
    console.log(teamId);
  const res = await fetch(
    `/api-nhl/v1/roster/${teamId}/current`
  );

  if (!res.ok) {
    throw new Error(`Erreur lors du chargement du roster pour ${teamId}`);
  }

  return res.json();
};