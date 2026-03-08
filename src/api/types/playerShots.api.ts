export interface ApiPlayerShotZoneRow {
  zone: string;
  sog: number;
}

export interface ApiPlayerShotZonesResponse {
  rows: ApiPlayerShotZoneRow[];
  source: 'season' | 'now';
}
