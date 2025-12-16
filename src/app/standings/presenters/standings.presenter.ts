export function standingsPresenter(raw: any[]) {
  return raw.map(item => ({
    teamName: item.teamName,
    logo: item.teamLogo,
    wins: item.wins,
    losses: item.losses,
    points: item.points,
    gamesPlayed: item.gamesPlayed,
    divisionName: item.divisionName,
  }));
}