export async function fetchGamesSchedule() {
  const res = await fetch(`api-nhl/v1/schedule/now`);
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération des matchs à venir`);
  }
  return res.json();
}
