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
  sogFor: number;
  sogAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  sogForPerGame: number;
  sogAgainstPerGame: number;
  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  sogForOver295Count: number;
  sogAgainstOver295Count: number;
  goalsForOver25Count: number;
  goalsAgainstOver25Count: number;
  sogForOver295Rate: number;
  sogAgainstOver295Rate: number;
  goalsForOver25Rate: number;
  goalsAgainstOver25Rate: number;
  flags: string[];
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
}
