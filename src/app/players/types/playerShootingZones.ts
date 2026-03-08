export type PlayerShootingZoneId =
  | 'behind_the_net'
  | 'beyond_the_red_line'
  | 'center_point'
  | 'crease'
  | 'high_slot'
  | 'l_circle'
  | 'l_corner'
  | 'l_net_side'
  | 'l_point'
  | 'low_slot'
  | 'offensive_neutral_zone'
  | 'outside_r'
  | 'outside_l'
  | 'r_circle'
  | 'r_corner'
  | 'r_net_side'
  | 'r_point';

export interface ZonePosition {
  x: number;
  y: number;
}

export interface PlayerShootingZoneDefinition {
  id: PlayerShootingZoneId;
  label: string;
  aliases: string[];
  position: ZonePosition;
}

export interface PlayerShootingZoneStat {
  id: PlayerShootingZoneId;
  label: string;
  sog: number;
  sharePct: number;
  position: ZonePosition;
}

export interface PlayerShootingZonesSummary {
  zones: PlayerShootingZoneStat[];
  totalSog: number;
  source: 'season' | 'now' | null;
}

export const PLAYER_SHOOTING_ZONE_DEFINITIONS: PlayerShootingZoneDefinition[] = [
  {
    id: 'behind_the_net',
    label: 'Behind the net',
    aliases: ['behindthenet', 'behind_the_net'],
    position: { x: 50, y: 7.6 },
  },
  {
    id: 'beyond_the_red_line',
    label: 'Beyond the red line',
    aliases: ['beyondtheredline', 'beyondredline', 'beyond_the_red_line'],
    position: { x: 50, y: 67.5 },
  },
  {
    id: 'center_point',
    label: 'Center point',
    aliases: ['centerpoint', 'center_point'],
    position: { x: 50, y: 42.3 },
  },
  {
    id: 'crease',
    label: 'Crease',
    aliases: ['crease'],
    position: { x: 50, y: 13.6 },
  },
  {
    id: 'high_slot',
    label: 'High slot',
    aliases: ['highslot', 'high_slot'],
    position: { x: 50, y: 28.6 },
  },
  {
    id: 'l_circle',
    label: 'L Circle',
    aliases: ['lcircle', 'l_circle', 'leftcircle'],
    position: { x: 30, y: 27 },
  },
  {
    id: 'l_corner',
    label: 'L Corner',
    aliases: ['lcorner', 'l_corner', 'leftcorner'],
    position: { x: 13, y: 16 },
  },
  {
    id: 'l_net_side',
    label: 'L Net side',
    aliases: ['lnetside', 'l_net_side', 'leftnetside'],
    position: { x: 42, y: 14.5 },
  },
  {
    id: 'l_point',
    label: 'L Point',
    aliases: ['lpoint', 'l_point', 'leftpoint'],
    position: { x: 29, y: 41.8 },
  },
  {
    id: 'low_slot',
    label: 'Low Slot',
    aliases: ['lowslot', 'low_slot'],
    position: { x: 50, y: 21.2 },
  },
  {
    id: 'offensive_neutral_zone',
    label: 'Offensive neutral zone',
    aliases: ['offensiveneutralzone', 'offensive_neutral_zone'],
    position: { x: 50, y: 53.2 },
  },
  {
    id: 'outside_r',
    label: 'Outside R',
    aliases: ['outsider', 'outside_r', 'outsideright'],
    position: { x: 80, y: 34 },
  },
  {
    id: 'outside_l',
    label: 'Outside L',
    aliases: ['outsidel', 'outside_l', 'outsideleft'],
    position: { x: 20, y: 34 },
  },
  {
    id: 'r_circle',
    label: 'R Circle',
    aliases: ['rcircle', 'r_circle', 'rightcircle'],
    position: { x: 70, y: 27 },
  },
  {
    id: 'r_corner',
    label: 'R Corner',
    aliases: ['rcorner', 'r_corner', 'rightcorner'],
    position: { x: 87, y: 16 },
  },
  {
    id: 'r_net_side',
    label: 'R Net side',
    aliases: ['rnetside', 'r_net_side', 'rightnetside'],
    position: { x: 58, y: 14.5 },
  },
  {
    id: 'r_point',
    label: 'R Point',
    aliases: ['rpoint', 'r_point', 'rightpoint'],
    position: { x: 71, y: 41.8 },
  },
];
