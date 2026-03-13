export type GameTeamSide = 'awayTeam' | 'homeTeam';

export type TeamComparisonStatKey =
  | 'goals'
  | 'sog'
  | 'hits'
  | 'blockedShots'
  | 'pim'
  | 'giveaways'
  | 'takeaways'
  | 'powerPlayGoals';

export interface TeamAggregatedStats {
  goals: number;
  sog: number;
  hits: number;
  blockedShots: number;
  pim: number;
  giveaways: number;
  takeaways: number;
  powerPlayGoals: number;
}

export interface TeamComparisonRow {
  key: TeamComparisonStatKey;
  label: string;
  away: number;
  home: number;
  awayPercent: number;
  homePercent: number;
}

export interface GameCenterTeam {
  id: number;
  abbrev: string;
  score?: number;
  sog?: number;
  logo?: string;
  commonName?: {
    default?: string;
  };
}

export interface GameCenterSkaterStatLine {
  playerId?: number;
  sweaterNumber?: number;
  position?: string;
  name?: {
    default?: string;
  };
  goals?: number;
  assists?: number;
  points?: number;
  sog?: number;
  hits?: number;
  blockedShots?: number;
  pim?: number;
  giveaways?: number;
  takeaways?: number;
  powerPlayGoals?: number;
  toi?: string;
}

export interface GameCenterGoalieStatLine {
  playerId?: number;
  sweaterNumber?: number;
  position?: string;
  name?: {
    default?: string;
  };
  pim?: number;
  toi?: string;
  starter?: boolean;
  decision?: string;
}

export interface GameCenterTeamPlayerStats {
  forwards?: GameCenterSkaterStatLine[];
  defense?: GameCenterSkaterStatLine[];
  goalies?: GameCenterGoalieStatLine[];
}

export interface GameCenterBoxscoreResponse {
  id: number;
  gameDate?: string;
  startTimeUTC: string;
  gameState?: string;
  venue?: {
    default?: string;
  };
  periodDescriptor?: {
    number?: number;
    periodType?: string;
  };
  awayTeam: GameCenterTeam;
  homeTeam: GameCenterTeam;
  playerByGameStats?: {
    awayTeam?: GameCenterTeamPlayerStats;
    homeTeam?: GameCenterTeamPlayerStats;
  };
}
