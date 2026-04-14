/**
 * Shared utility helpers.
 */

/** Parse coordinates from a filename formatted as `lat,lon.ext`. */
export function parseCoordinates(
  filename: string
): { lat: number; lon: number } | null {
  const base = filename.split("/").pop() ?? "";
  const match = base.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\.\w+$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/**
 * Confidence → risk zone colour.
 * 0.00–0.25 → Green | 0.25–0.50 → Yellow | 0.50–0.75 → Orange | 0.75–1.00 → Red
 */
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

/** Format coordinates with N/S · E/W card labels (no raw negatives). */
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
//  Geo-polygon helpers
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
 * Project a point from a centre at `distanceM` metres on `bearingDeg` degrees.
 * Returns [lat, lng].
 */
function destPoint(
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

/**
 * Generate an irregular n-sided polygon centred at (lat, lng)
 * with a target area of `areaM2` square metres.
 *
 * `irregularity` – max fractional variation of each vertex radius (0–1).
 * Seeded by lat+lng so the shape is deterministic across renders.
 *
 * For 1 ha = 10 000 m²:
 *   Regular octagon circumradius R where 4·R²·sin(π/4) = 10 000 → R ≈ 59.5 m
 */
export function generateZonePolygon(
  lat: number,
  lng: number,
  areaM2: number = 10_000,   // 1 ha default
  sides: number = 8,
  irregularity: number = 0.28
): [number, number][] {
  const rng       = seededRng(lat + lng * 1000);
  // circumradius of a regular n-gon with the target area
  const baseR     = Math.sqrt(areaM2 / ((sides / 2) * Math.sin((2 * Math.PI) / sides)));
  const angleStep = 360 / sides;
  // Slight rotation so it doesn't always point straight up
  const rotation  = rng() * 45;

  return Array.from({ length: sides }, (_, i) => {
    const bearing = rotation + i * angleStep;
    const vary    = 1 + (rng() - 0.5) * 2 * irregularity;
    return destPoint(lat, lng, bearing, baseR * vary);
  });
}

/**
 * Generate the outer AQI halo polygon — same shape, scaled out by `scale`.
 */
export function generateAqiPolygon(
  lat: number,
  lng: number,
  confidence: number
): [number, number][] {
  // AQI halo is 2.5× the area → radius scales by √2.5 ≈ 1.58
  const scale  = 1.58 + confidence * 1.5; // grows with confidence
  const areaM2 = 10_000 * scale * scale;
  return generateZonePolygon(lat, lng, areaM2, 12, 0.18);
}
