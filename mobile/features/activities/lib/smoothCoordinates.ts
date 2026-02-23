/**
 * Smooths GPS coordinates and handles track gaps (e.g., from battery death).
 * Uses Chaikin's corner-cutting algorithm for smoothing.
 */

import { TrackPoint } from "@/types/session";
import { haversine } from "./countDistance";

type Coordinate = [number, number];

// Gap detection thresholds
const TIME_GAP_MS = 60_000; // 60 seconds - likely battery death or app restart
const DISTANCE_GAP_METERS = 500; // 500m jump - safe for fast driving, catches battery death

/**
 * Apply one iteration of Chaikin's corner-cutting algorithm.
 */
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

/**
 * Smooths coordinates using Chaikin's algorithm.
 */
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

/**
 * Downsample coordinates if there are too many points.
 */
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

/**
 * Split TrackPoints into segments based on time gaps.
 * Used for live tracking where we have timestamps.
 */
export function splitTrackByTimeGaps(
  track: TrackPoint[],
  gapThresholdMs: number = TIME_GAP_MS,
): TrackPoint[][] {
  if (track.length === 0) return [];

  const segments: TrackPoint[][] = [];
  let currentSegment: TrackPoint[] = [track[0]];

  for (let i = 1; i < track.length; i++) {
    const timeDiff = track[i].timestamp - track[i - 1].timestamp;

    if (timeDiff > gapThresholdMs) {
      // Time gap detected - start new segment
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      currentSegment = [track[i]];
    } else {
      currentSegment.push(track[i]);
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Split coordinates into segments based on distance gaps.
 * Used for saved routes where we don't have timestamps.
 */
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
      // Distance gap detected - start new segment
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

/**
 * Process track for live map display.
 * Handles time gaps and applies smoothing.
 *
 * IMPORTANT: Pass the FULL track (including stationary points) so gap detection
 * works correctly. Stationary points are filtered out AFTER gap detection.
 * This prevents false gaps when user stops for a while then continues.
 *
 * @param track - Array of TrackPoints with timestamps (including stationary)
 * @param options - Processing options
 * @returns Array of smoothed coordinate segments (for MultiLineString)
 */
export function processLiveTrack(
  track: TrackPoint[],
  options: {
    smoothIterations?: number;
    maxPointsPerSegment?: number;
    timeGapMs?: number;
  } = {},
): Coordinate[][] {
  const {
    smoothIterations = 2,
    maxPointsPerSegment = 500,
    timeGapMs = TIME_GAP_MS,
  } = options;

  // Need at least 2 points to draw a line
  if (track.length < 2) {
    return [];
  }

  // Split by time gaps BEFORE filtering stationary/bad signal points
  // This ensures stopping for a while doesn't create false gaps
  const trackSegments = splitTrackByTimeGaps(track, timeGapMs);

  // Process each segment: filter stationary and bad signal, then smooth
  return trackSegments
    .map((segment) => {
      // Filter out stationary and bad signal points within each segment
      // Only draw points where GPS was reliable and user was moving
      const movingPoints = segment.filter((p) => !p.isStationary && !p.isBadSignal);

      if (movingPoints.length === 0) return [];

      const coords = movingPoints.map(
        (p) => [p.longitude, p.latitude] as Coordinate,
      );

      // Need at least 2 points to draw a line segment
      if (coords.length < 2) return [];

      const sampled = downsample(coords, maxPointsPerSegment);
      return smoothCoordinates(sampled, smoothIterations);
    })
    .filter((segment) => segment.length > 0);
}

/**
 * Process saved route for display.
 * Handles distance gaps and applies smoothing.
 *
 * @param coords - Array of [longitude, latitude] coordinates
 * @param options - Processing options
 * @returns Array of smoothed coordinate segments (for MultiLineString)
 */
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

  // Need at least 2 points to draw a line
  if (coords.length < 2) {
    return [];
  }

  // Split by distance gaps
  const segments = splitCoordsByDistanceGaps(coords, distanceGapMeters);

  // Process each segment
  return segments
    .map((segment) => {
      // Need at least 2 points to draw a line segment
      if (segment.length < 2) return [];

      const sampled = downsample(segment, maxPointsPerSegment);
      return smoothCoordinates(sampled, smoothIterations);
    })
    .filter((segment) => segment.length > 0);
}

/**
 * Smooth pre-segmented route (MultiLineString from database).
 * No gap detection needed - segments are already split.
 */
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
      // Need at least 2 points to draw a line segment
      if (segment.length < 2) return [];

      const sampled = downsample(segment, maxPointsPerSegment);
      return smoothCoordinates(sampled, smoothIterations);
    })
    .filter((segment) => segment.length > 0);
}
