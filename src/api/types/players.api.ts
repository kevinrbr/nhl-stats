export interface ApiPlayer {
  id: number;
  headshot: string;
  firstName: { default: string };
  lastName: { default: string };
  sweaterNumber: number;
  positionCode: string;
  birthDate: string;
  birthCity?: { default: string };
  birthCountry?: string;
}

export type ApiPlayersByPosition = {
  forwards: ApiPlayer[];
  defensemen: ApiPlayer[];
  goalies: ApiPlayer[];
};