export type TeamEdge = 'home' | 'away' | 'even';

export interface TeamRecord {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  record: string;
  winPct: number;
  goalsForAvg: number;
  goalsAgainstAvg: number;
  goalDiffAvg: number;
}

export interface TeamRecentFormInsight extends TeamRecord {
  sampleSize: number;
  lastFiveTrend: string;
}

export interface TeamHomeAwaySplitInsight {
  totalGames: number;
  edge: TeamEdge;
  home: TeamRecord;
  away: TeamRecord;
}

export type TeamInsightTone = 'neutral' | 'positive' | 'negative';

export interface TeamKpiMetric {
  id: string;
  label: string;
  value: string;
  meta?: string;
  tone?: TeamInsightTone;
  helpText?: string;
}
