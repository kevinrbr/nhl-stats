export async function fetchGamesSchedule() {
  const res = await fetch(`api-nhl/v1/schedule/now`);
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération des matchs à venir`);
  }
  return res.json();
}

export async function fetchGamesScheduleByDate(date: string) {
  const res = await fetch(`api-nhl/v1/schedule/${date}`);
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération du calendrier pour ${date}`);
  }
  return res.json();
}

export async function fetchPartnerGameOdds(countryCode = 'US') {
  const res = await fetch(`api-nhl/v1/partner-game/${countryCode}/now`);
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération des cotes`);
  }
  return res.json();
}
