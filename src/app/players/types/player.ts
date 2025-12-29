export interface Player {
  id: number;
  name: string;
  number: number;
  headshot: string;
}

export type PlayersByPosition = {
  forwards: Player[];
  defensemen: Player[];
  goalies: Player[];
};