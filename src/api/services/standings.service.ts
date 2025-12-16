export const getStandings = async (): Promise<any> => {
  const res = await fetch("/api-nhl/v1/standings/now"); 
  if (!res.ok) throw new Error("Erreur fetching standings data");
  return res.json();
}
