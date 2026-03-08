export interface ShootingZoneTone {
  fillHex: string;
  fillOpacity: number;
  textHex: string;
  label: string;
}

export function getShootingZoneTone(sharePct: number): ShootingZoneTone {
  if (sharePct >= 20) {
    return {
      fillHex: '#10b981',
      fillOpacity: 0.86,
      textHex: '#f8fafc',
      label: 'Very high',
    };
  }

  if (sharePct >= 12) {
    return {
      fillHex: '#0ea5e9',
      fillOpacity: 0.78,
      textHex: '#f8fafc',
      label: 'High',
    };
  }

  if (sharePct >= 6) {
    return {
      fillHex: '#3b82f6',
      fillOpacity: 0.68,
      textHex: '#f8fafc',
      label: 'Medium',
    };
  }

  if (sharePct > 0) {
    return {
      fillHex: '#6366f1',
      fillOpacity: 0.58,
      textHex: '#e2e8f0',
      label: 'Low',
    };
  }

  return {
    fillHex: '#64748b',
    fillOpacity: 0.25,
    textHex: '#cbd5e1',
    label: 'None',
  };
}
