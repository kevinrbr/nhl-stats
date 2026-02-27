export const NHL_CITY_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  ANA: { lat: 33.8078, lng: -117.8765, city: "Anaheim" },
  BOS: { lat: 42.3662, lng: -71.0621, city: "Boston" },
  BUF: { lat: 42.8750, lng: -78.8761, city: "Buffalo" },
  CAR: { lat: 35.8032, lng: -78.7219, city: "Raleigh" },
  CBJ: { lat: 39.9692, lng: -83.0061, city: "Columbus" },
  CGY: { lat: 51.0373, lng: -114.0519, city: "Calgary" },
  CHI: { lat: 41.8807, lng: -87.6742, city: "Chicago" },
  COL: { lat: 39.7487, lng: -105.0077, city: "Denver" },
  DAL: { lat: 32.7905, lng: -96.8103, city: "Dallas" },
  DET: { lat: 42.3410, lng: -83.0550, city: "Detroit" },
  EDM: { lat: 53.5467, lng: -113.4969, city: "Edmonton" },
  FLA: { lat: 26.1583, lng: -80.3256, city: "Sunrise" },
  LAK: { lat: 34.0430, lng: -118.2673, city: "Los Angeles" },
  MIN: { lat: 44.9449, lng: -93.1011, city: "St. Paul" },
  MTL: { lat: 45.4960, lng: -73.5693, city: "Montreal" },
  NJD: { lat: 40.7332, lng: -74.1711, city: "Newark" },
  NSH: { lat: 36.1591, lng: -86.7785, city: "Nashville" },
  NYI: { lat: 40.7225, lng: -73.5907, city: "Elmont" },
  NYR: { lat: 40.7505, lng: -73.9934, city: "New York" },
  OTT: { lat: 45.2968, lng: -75.9270, city: "Ottawa" },
  PHI: { lat: 39.9012, lng: -75.1720, city: "Philadelphia" },
  PIT: { lat: 40.4394, lng: -79.9892, city: "Pittsburgh" },
  SEA: { lat: 47.6221, lng: -122.3540, city: "Seattle" },
  SJS: { lat: 37.3327, lng: -121.9010, city: "San Jose" },
  STL: { lat: 38.6264, lng: -90.2025, city: "St. Louis" },
  TBL: { lat: 27.9425, lng: -82.4518, city: "Tampa" },
  TOR: { lat: 43.6435, lng: -79.3791, city: "Toronto" },
  UTA: { lat: 40.7683, lng: -111.9011, city: "Salt Lake City" },
  VAN: { lat: 49.2778, lng: -123.1089, city: "Vancouver" },
  VGK: { lat: 36.0929, lng: -115.1784, city: "Las Vegas" },
  WPG: { lat: 49.8928, lng: -97.1436, city: "Winnipeg" },
  WSH: { lat: 38.8981, lng: -77.0209, city: "Washington" },
};

// Calculer la distance entre deux points (formule de Haversine)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}