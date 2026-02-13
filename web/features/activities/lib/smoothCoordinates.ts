/**
 * Smooths GPS coordinates and handles track gaps.
 * Uses Chaikin's corner-cutting algorithm for smoothing.
 * Adapted from mobile version for web.
 */

type Coordinate = [number, number];

const DISTANCE_GAP_METERS = 500;

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function chaikinIteration(coords: Coordinate[]): Coordinate[] {
  if (coords.length < 3) return coords;

  const result: Coordinate[] = [coords[0]];

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];

    const q: Coordinate = [
      0.75 * p0[0] + 0.25 * p1[0],
      0.75 * p0[1] + 0.25 * p1[1],
    ];

    const r: Coordinate = [
      0.25 * p0[0] + 0.75 * p1[0],
      0.25 * p0[1] + 0.75 * p1[1],
    ];

    result.push(q, r);
  }

  result.push(coords[coords.length - 1]);

  return result;
}

function smoothCoordinates(
  coords: Coordinate[],
  iterations: number = 2,
): Coordinate[] {
  if (coords.length < 3) return coords;

  let result = coords;
  for (let i = 0; i < iterations; i++) {
    result = chaikinIteration(result);
  }

  return result;
}

function downsample(coords: Coordinate[], maxPoints: number): Coordinate[] {
  if (coords.length <= maxPoints) return coords;

  const step = coords.length / maxPoints;
  const result: Coordinate[] = [];

  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(coords[Math.floor(i * step)]);
  }
  result.push(coords[coords.length - 1]);

  return result;
}

export function splitCoordsByDistanceGaps(
  coords: Coordinate[],
  gapThresholdMeters: number = DISTANCE_GAP_METERS,
): Coordinate[][] {
  if (coords.length === 0) return [];

  const segments: Coordinate[][] = [];
  let currentSegment: Coordinate[] = [coords[0]];

  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    const distance = haversine(lat1, lon1, lat2, lon2);

    if (distance > gapThresholdMeters) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      currentSegment = [coords[i]];
    } else {
      currentSegment.push(coords[i]);
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

export function processSavedRoute(
  coords: Coordinate[],
  options: {
    smoothIterations?: number;
    maxPointsPerSegment?: number;
    distanceGapMeters?: number;
  } = {},
): Coordinate[][] {
  const {
    smoothIterations = 2,
    maxPointsPerSegment = 500,
    distanceGapMeters = DISTANCE_GAP_METERS,
  } = options;

  if (coords.length < 2) {
    if (coords.length === 1) return [coords];
    return [];
  }

  const segments = splitCoordsByDistanceGaps(coords, distanceGapMeters);

  return segments
    .map((segment) => {
      if (segment.length < 2) return segment;

      const sampled = downsample(segment, maxPointsPerSegment);
      return smoothCoordinates(sampled, smoothIterations);
    })
    .filter((segment) => segment.length > 0);
}

export function smoothMultiLineString(
  segments: Coordinate[][],
  options: {
    smoothIterations?: number;
    maxPointsPerSegment?: number;
  } = {},
): Coordinate[][] {
  const { smoothIterations = 2, maxPointsPerSegment = 500 } = options;

  return segments
    .map((segment) => {
      if (segment.length < 2) return segment;

      const sampled = downsample(segment, maxPointsPerSegment);
      return smoothCoordinates(sampled, smoothIterations);
    })
    .filter((segment) => segment.length > 0);
}
