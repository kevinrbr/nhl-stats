import { computed, type Ref } from 'vue';
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';

export interface TeamStanding {
  teamName: {
    default: string;
  };
  logo: string;
  wins: number;
  losses: number;
  points: number;
  gamesPlayed: number;
  divisionName: string;
  conferenceName?: string;
  teamAbbrev: string;
  divisionSequence: number;
  wildcardSequence: number;
  conferenceSequence: number;
  leagueSequence: number;
}

export interface PlayoffStatus {
  status: 'in' | 'wildcard' | 'bubble' | 'out';
  position: string;
  badge: string;
  description: string;
  color: 'green' | 'blue' | 'orange' | 'red';
}

export function useTeamStandings(
  teamAbbrev: Ref<string>,
  standingsSource?: Ref<TeamStanding[] | undefined>
) {
  const queryStandings = standingsSource ? undefined : useStandingsQuery();
  const standings = computed<TeamStanding[] | undefined>(
    () =>
      standingsSource?.value ??
      (queryStandings?.data.value as TeamStanding[] | undefined)
  );

  const teamStanding = computed<TeamStanding | null>(() => {
    if (!standings.value || !teamAbbrev.value) return null;
    
    return standings.value.find(
      team => team.teamAbbrev === teamAbbrev.value
    ) ?? null;
  });

  const playoffStatus = computed<PlayoffStatus | null>(() => {
    if (!teamStanding.value || !standings.value) return null;

    const team = teamStanding.value;
    const conferenceLabel = team.conferenceName ?? 'conference';
    
    // Top 3 de division = qualifié direct
    if (team.divisionSequence <= 3) {
      return {
        status: 'in',
        position: `${team.divisionSequence}${getOrdinalSuffix(team.divisionSequence)} in ${team.divisionName}`,
        badge: `${team.divisionSequence}`,
        description: 'Clinched playoff spot',
        color: 'green'
      };
    }
    
    // Wildcard 1 ou 2 = qualifié en wildcard
    if (team.wildcardSequence > 0 && team.wildcardSequence <= 2) {
      return {
        status: 'wildcard',
        position: `WC${team.wildcardSequence} in ${conferenceLabel}`,
        badge: `WC${team.wildcardSequence}`,
        description: 'Wildcard position',
        color: 'blue'
      };
    }

    // Calculer la distance avec WC2 (8ème place de la conférence)
    const pointsGap = getPointsToPlayoffs(standings.value, team);
    
    if (pointsGap <= 5) {
      return {
        status: 'bubble',
        position: `${team.conferenceSequence}${getOrdinalSuffix(team.conferenceSequence)} in ${conferenceLabel}`,
        badge: team.conferenceSequence.toString(),
        description: `${pointsGap} pts from playoffs`,
        color: 'orange'
      };
    }

    return {
      status: 'out',
      position: `${team.conferenceSequence}${getOrdinalSuffix(team.conferenceSequence)} in ${conferenceLabel}`,
      badge: team.conferenceSequence.toString(),
      description: `${pointsGap} pts from playoffs`,
      color: 'red'
    };
  });

  return {
    teamStanding,
    playoffStatus
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0] || 'th';
}

function getPointsToPlayoffs(standings: TeamStanding[], team: TeamStanding): number {
  // Trouver les équipes de la même conférence
  const conferenceTeams = standings
    .filter(t => t.conferenceName === team.conferenceName)
    .sort((a, b) => b.points - a.points);

  // La 8ème équipe (WC2) est à l'index 7
  const wc2Team = conferenceTeams[7];
  
  if (!wc2Team) return 0;
  
  return Math.max(0, wc2Team.points - team.points);
}
