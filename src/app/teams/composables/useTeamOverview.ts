import { computed, type Ref } from 'vue';
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import { useTeamStandings } from '@/app/standings/composables/useTeamStandings';
import { useTeamLastGames } from '../queries/useTeamLastGames';
import { useTeamSchedule } from '../queries/useTeamSchedule';
import { useTeamRoadTrip } from './useTeamRoadTrip';

export interface TeamMeta {
  abbrev: string;
  name: string;
  logo: string;
}

export function useTeamOverview(team: Ref<string>) {
  const { data: standings, isLoading: isStandingsLoading } = useStandingsQuery();
  const { data: teamSchedule, isLoading: isScheduleLoading } = useTeamSchedule(team);
  const { data: teamLastGames, isLoading: isLastGamesLoading } = useTeamLastGames(team, {
    maxGames: 30,
    scheduleGames: teamSchedule,
  });
  const { teamStanding, playoffStatus } = useTeamStandings(team, standings);
  const { travelStatus } = useTeamRoadTrip(teamSchedule, team);

  const teamMeta = computed<TeamMeta | null>(() => {
    const selectedTeam = standings.value?.find((standing) => standing.teamAbbrev === team.value);

    if (!selectedTeam) return null;

    return {
      abbrev: selectedTeam.teamAbbrev,
      name: selectedTeam.teamName.default,
      logo: selectedTeam.logo,
    };
  });

  return {
    teamMeta,
    teamStanding,
    playoffStatus,
    teamLastGames,
    travelStatus,
    isStandingsLoading,
    isLastGamesLoading,
    isScheduleLoading,
  };
}
