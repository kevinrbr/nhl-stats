export interface PlayerInsightLine {
  key: string;
  playerId?: number;
  name: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  sog: number;
  goalsPerGame: number;
  pointsPerGame: number;
  sogPerGame: number;
  sogOver25Count: number;
  pointsOver05Count: number;
  goalsOver05Count: number;
  sogOver25Rate: number;
  pointsOver05Rate: number;
  goalsOver05Rate: number;
  impactScore: number;
}

export interface TeamPlayerInsightGroup {
  sampleGames: number;
  players: PlayerInsightLine[];
}

export interface TeamAngleInsightGroup {
  sampleGames: number;
  sogLine: number;
  sogFor: number;
  sogAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  sogForPerGame: number;
  sogAgainstPerGame: number;
  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  sogForOverLineCount: number;
  sogAgainstOverLineCount: number;
  goalsForOver25Count: number;
  goalsAgainstOver25Count: number;
  sogForOverLineRate: number;
  sogAgainstOverLineRate: number;
  goalsForOver25Rate: number;
  goalsAgainstOver25Rate: number;
  flags: string[];
}

export interface TeamStyleScore {
  pace: number;
  defensiveLoad: number;
  physicality: number;
  chaos: number;
  discipline: number;
}

export interface TeamStyleProfile {
  sampleGames: number;
  pace: number;
  defensiveLoad: number;
  physicality: number;
  chaos: number;
  discipline: number;
  score: TeamStyleScore;
  tags: string[];
}

export interface SimilarMatchLine {
  gameId: number;
  gameDate: string;
  opponentAbbrev: string;
  similarity: number;
  teamGoals: number;
  opponentGoals: number;
  teamSog: number;
  opponentSog: number;
}

export interface TeamStyleSimilarGames {
  sampleGames: number;
  matches: SimilarMatchLine[];
}

export interface MatchupStyleEdge {
  side: 'home' | 'away' | 'even';
  confidence: number;
  summary: string;
  reasons: string[];
}

export interface MatchupStyleInsights {
  home: TeamStyleProfile;
  away: TeamStyleProfile;
  similarity: number;
  matchupTags: string[];
  edge: MatchupStyleEdge;
  similarGames: {
    home: TeamStyleSimilarGames;
    away: TeamStyleSimilarGames;
  };
}

export type MatchupTopPickType =
  | 'player_sog_over'
  | 'player_points_over'
  | 'player_goals_over'
  | 'team_sog_over';

export interface MatchupTopPick {
  id: string;
  rank: number;
  type: MatchupTopPickType;
  title: string;
  lineLabel: string;
  confidence: number;
  hitRate: number;
  sampleGames: number;
  teamAbbrev: string;
  rationale: string;
  playerId?: number;
  playerName?: string;
  playerHeadshot?: string;
}

export interface MatchupPlayerInsights {
  h2hGameIds: number[];
  homeRecentGameIds: number[];
  awayRecentGameIds: number[];
  h2h: {
    home: TeamPlayerInsightGroup;
    away: TeamPlayerInsightGroup;
  };
  recent: {
    home: TeamPlayerInsightGroup;
    away: TeamPlayerInsightGroup;
  };
  teams: {
    h2h: {
      home: TeamAngleInsightGroup;
      away: TeamAngleInsightGroup;
    };
    recent: {
      home: TeamAngleInsightGroup;
      away: TeamAngleInsightGroup;
    };
  };
  topPicks: MatchupTopPick[];
}
