/**
 * Shared utility helpers — geo-math, colours, and spline utilities.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Non-geo helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse coordinates from a filename formatted as `lon,lat.ext`. */
export function parseCoordinates(
  filename: string
): { lat: number; lon: number } | null {
  const base = filename.split("/").pop() ?? "";
  const match = base.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\.\w+$/);
  if (!match) return null;
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/** Confidence → AQI/ring accent colour. */
export function confidenceColor(confidence: number): string {
  if (confidence < 0.25) return "#22c55e";
  if (confidence < 0.5)  return "#eab308";
  if (confidence < 0.75) return "#f97316";
  return "#ef4444";
}

/** DaisyUI badge colour class for an AQI status string. */
export function aqiBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "good")            return "badge-success";
  if (s === "moderate")        return "badge-warning";
  if (s.includes("sensitive")) return "badge-warning";
  if (s === "unhealthy")       return "badge-error";
  if (s.includes("very"))      return "badge-error";
  if (s === "hazardous")       return "badge-error";
  return "badge-neutral";
}

/** Format coordinates with N/S · E/W card labels. */
export function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir},  ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/** Human-readable risk label. */
export function riskLabel(confidence: number): string {
  if (confidence < 0.25) return "Low Risk";
  if (confidence < 0.5)  return "Moderate Risk";
  if (confidence < 0.75) return "High Risk";
  return "Critical Risk";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Geo-math
// ─────────────────────────────────────────────────────────────────────────────

/** Seeded pseudo-random number generator (linear congruential). */
function seededRng(seed: number) {
  let s = Math.abs(Math.round(seed * 1e6)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Project a destination point from (lat, lng) at `bearingDeg` degrees
 * and `distanceM` metres using spherical Earth. Returns [lat, lng].
 */
export function destPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number
): [number, number] {
  const R  = 6371000;
  const d  = distanceM / R;
  const b  = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(b)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(φ1),
      Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
    );
  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}

/** Haversine distance in metres between two lat/lng points. */
export function haversineM(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 6371000;
  const φ1   = (lat1 * Math.PI) / 180;
  const φ2   = (lat2 * Math.PI) / 180;
  const Δφ   = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ   = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing in degrees from point 1 → point 2. */
export function initialBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Pre-compute polar (bearing + distance) for each polygon vertex. */
export function toPolarVertices(
  centerLat: number,
  centerLng: number,
  points: [number, number][]
): Array<{ bearing: number; distM: number }> {
  return points.map(([vlat, vlng]) => ({
    bearing: initialBearing(centerLat, centerLng, vlat, vlng),
    distM:   haversineM(centerLat, centerLng, vlat, vlng),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Catmull-Rom spline - creates smooth organic curves from control points
// ─────────────────────────────────────────────────────────────────────────────

function catmullRomPoint(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  p3: readonly [number, number],
  t: number
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * (
      2 * p1[0] +
      (-p0[0] + p2[0]) * t +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
    ),
    0.5 * (
      2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
    ),
  ];
}

/**
 * Convert N control points into a smooth closed curve
 * via Catmull-Rom spline interpolation.
 * `samplesPerSegment` controls smoothness (8 → 8×N output points).
 */
export function smoothClosedCurve(
  points: [number, number][],
  samplesPerSegment = 8
): [number, number][] {
  const n = points.length;
  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let j = 0; j < samplesPerSegment; j++) {
      result.push(catmullRomPoint(p0, p1, p2, p3, j / samplesPerSegment));
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Zone polygon generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate irregular N-sided control polygon centred at (lat, lng).
 *
 * Default 5 ha = 50 000 m²  (circumradius ≈ 130 m for N=12).
 * Seeded by coordinates so the shape is deterministic across renders.
 *
 * @returns Raw control points (NOT smoothed — pass through smoothClosedCurve).
 */
export function generateZonePolygon(
  lat: number,
  lng: number,
  areaM2: number = 50_000,      // 5 ha default
  sides:  number = 12,
  irregularity: number = 0.35
): [number, number][] {
  const rng     = seededRng(lat + lng * 1000);
  // Circumradius of a regular n-gon matching the target area
  const baseR   = Math.sqrt(areaM2 / ((sides / 2) * Math.sin((2 * Math.PI) / sides)));
  const step    = 360 / sides;
  const rotation = rng() * 45;   // random start angle (seeded)

  return Array.from({ length: sides }, (_, i) => {
    const bearing = rotation + i * step;
    const vary    = 1 + (rng() - 0.5) * 2 * irregularity;
    return destPoint(lat, lng, bearing, baseR * vary);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Fire zone styling — dynamic by confidence & prediction class
// ─────────────────────────────────────────────────────────────────────────────

export interface FireZoneStyle {
  fillColor:   string;
  strokeColor: string;
  fillOpacity: number;
  /** Multiplier on the base circumradius */
  sizeMultiplier: number;
  weight: number;
}

/**
 * Returns Leaflet polygon style params based on model output.
 *
 * No-wildfire → neutral dark teal, smaller footprint.
 * Wildfire    → colour and size scale with confidence:
 *   Low conf  (< 0.4) → amber, 0.75× size
 *   Mid conf  (< 0.65)→ dark orange-red, 1.0× size
 *   High conf (≥ 0.65)→ near-black fill, dark red stroke, 1.3× size
 */
export function fireZoneStyle(
  confidence: number,
  isWildfire: boolean
): FireZoneStyle {
  if (!isWildfire) {
    return {
      fillColor:      "#003322",
      strokeColor:    "#016640",
      fillOpacity:    0.30,
      sizeMultiplier: 0.55,
      weight:         1.8,
    };
  }
  const c = confidence;
  // Size: 0.75× at low confidence → 1.35× at max confidence
  const sizeMultiplier = 0.75 + c * 0.60;
  const fillOpacity    = 0.45 + c * 0.32;   // 0.45 → 0.77
  const weight         = 2.0 + c * 1.5;     // 2.0 → 3.5

  if (c < 0.4) {
    return { fillColor: "#cc5500", strokeColor: "#ff7700", fillOpacity, sizeMultiplier, weight };
  }
  if (c < 0.65) {
    return { fillColor: "#7a0e0e", strokeColor: "#b52020", fillOpacity, sizeMultiplier, weight };
  }
  // High confidence — near-black, very opaque
  return   { fillColor: "#110000", strokeColor: "#6b0000", fillOpacity, sizeMultiplier, weight };
}

/** AQI halo style — always adapts to confidence, larger outer ring. */
export interface AqiHaloStyle {
  fillColor:   string;
  strokeColor: string;
  fillOpacity: number;
  /** Radius multiplier relative to fire zone radius */
  radiusMultiplier: number;
}
export function aqiHaloStyle(confidence: number, isWildfire: boolean): AqiHaloStyle {
  const base = isWildfire ? confidenceColor(confidence) : "#00aa77";
  return {
    fillColor:        base,
    strokeColor:      base,
    fillOpacity:      0.06 + confidence * 0.06,  // 0.06 → 0.12
    radiusMultiplier: 3.2 + confidence * 1.0,     // 3.2× → 4.2× fire radius
  };
}
