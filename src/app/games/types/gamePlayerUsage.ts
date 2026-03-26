import type { GameTeamSide } from '@/app/games/types/gameCenter';

export interface GamePlayerUsageItem {
  playerId: number | null;
  sweaterNumber: number | null;
  name: string;
  position: string;
  toi: string;
  toiMinutes: number;
  sog: number;
  points: number;
  goals: number;
  xg: number | null;
}

export interface GameTeamUsageSnapshot {
  side: GameTeamSide;
  teamAbbrev: string;
  teamName: string;
  teamLogo: string;
  players: GamePlayerUsageItem[];
}
