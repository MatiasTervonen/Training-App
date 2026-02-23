export type MovementState = {
  confidence: number;
  badSignalCount: number; // Consecutive bad accuracy readings
  lastMovingPoint: {
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null;
  lastAcceptedTimestamp: number | null;
};

export type MovementResult = {
  isMoving: boolean;
  shouldSave: boolean;
  isBadSignal: boolean;
  newState: MovementState;
};

const CONFIG = {
  ACCURACY_THRESHOLD: 25, // meters - increased from 25 to reduce false bad signals
  BAD_SIGNAL_THRESHOLD: 3, // consecutive bad readings before marking as bad signal
  MIN_SPEED: 0.5, // m/s (~1.8 km/h) - slow walking threshold
  MIN_DISTANCE: 5, // meters - raised from 2 to filter indoor GPS drift
  CONFIDENCE_THRESHOLD: 3, // raised from 3 - needs 4 consecutive moving readings
  CONFIDENCE_INCREMENT: 1, // lowered from 2 - slower ramp prevents drift false positives
  CONFIDENCE_DECAY: 1,
  STATIONARY_THROTTLE_MS: 5000,
};

export function detectMovement(
  point: {
    latitude: number;
    longitude: number;
    accuracy?: number | null | undefined;
    timestamp: number;
  },
  anchor: { latitude: number; longitude: number } | null,
  state: MovementState,
  haversine: (lat1: number, lon1: number, lat2: number, lon2: number) => number,
): MovementResult {
  const effectiveAnchor = state.lastMovingPoint ?? anchor;

  // No anchor = first point ever, assume moving to establish baseline
  if (!effectiveAnchor) {
    return {
      isMoving: true,
      shouldSave: true,
      isBadSignal: false,
      newState: {
        confidence: CONFIG.CONFIDENCE_THRESHOLD,
        badSignalCount: 0,
        lastMovingPoint: {
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        },
        lastAcceptedTimestamp: point.timestamp,
      },
    };
  }

  // Check if current reading has bad accuracy
  const hasLowAccuracy =
    (point.accuracy ?? Infinity) > CONFIG.ACCURACY_THRESHOLD;

  // Update bad signal count (consecutive bad readings)
  const newBadSignalCount = hasLowAccuracy ? state.badSignalCount + 1 : 0;

  // Only mark as bad signal after consecutive bad readings
  // This prevents brief accuracy spikes from being marked as bad signal
  const isBadSignal = newBadSignalCount >= CONFIG.BAD_SIGNAL_THRESHOLD;

  if (isBadSignal) {
    // Bad signal: GPS accuracy too poor to trust for multiple consecutive readings
    // Save these points to prevent time gaps, but mark them as bad_signal
    let shouldSave = true;
    if (state.lastAcceptedTimestamp !== null) {
      const timeSinceLast = point.timestamp - state.lastAcceptedTimestamp;
      if (timeSinceLast < CONFIG.STATIONARY_THROTTLE_MS) {
        shouldSave = false;
      }
    }

    return {
      isMoving: false,
      shouldSave,
      isBadSignal: true,
      newState: {
        ...state,
        badSignalCount: newBadSignalCount,
        // Don't update lastMovingPoint - keep the last known good position
        lastAcceptedTimestamp: shouldSave
          ? point.timestamp
          : state.lastAcceptedTimestamp,
      },
    };
  }

  let isMoving = false;

  if (effectiveAnchor) {
    const distance = haversine(
      effectiveAnchor.latitude,
      effectiveAnchor.longitude,
      point.latitude,
      point.longitude,
    );

    // Calculate speed if we have a recent timestamp from last moving point
    const anchorTimestamp = state.lastMovingPoint?.timestamp;
    const dt = anchorTimestamp ? (point.timestamp - anchorTimestamp) / 1000 : 0;

    // Only use speed if timestamp is recent (< 10s), otherwise it's stale
    // (e.g., after being stationary for minutes)
    const MAX_DT_FOR_SPEED = 10;
    const dtIsValid = dt > 0 && dt < MAX_DT_FOR_SPEED;
    const speed = dtIsValid ? distance / dt : 0;

    // Must exceed accuracy AND minimum distance (filter GPS noise)
    // Then check speed (preferred) or fall back to larger distance threshold
    const exceedsAccuracy = distance > (point.accuracy ?? 0);
    const exceedsMinDistance = distance > CONFIG.MIN_DISTANCE;
    const exceedsSpeed = dtIsValid && speed > CONFIG.MIN_SPEED;
    const exceedsFallbackDistance = distance > CONFIG.MIN_DISTANCE * 2; // 10m fallback

    isMoving =
      exceedsAccuracy &&
      exceedsMinDistance &&
      (exceedsSpeed || exceedsFallbackDistance);
  }

  // Update confidence
  let newConfidence = state.confidence;
  if (isMoving) {
    newConfidence = Math.min(
      newConfidence + CONFIG.CONFIDENCE_INCREMENT,
      CONFIG.CONFIDENCE_THRESHOLD + 2,
    );
  } else {
    newConfidence = Math.max(newConfidence - CONFIG.CONFIDENCE_DECAY, 0);
  }

  const confirmedMoving = newConfidence >= CONFIG.CONFIDENCE_THRESHOLD;

  // Throttle stationary points
  let shouldSave = true;
  if (!confirmedMoving && state.lastAcceptedTimestamp !== null) {
    const timeSinceLast = point.timestamp - state.lastAcceptedTimestamp;
    if (timeSinceLast < CONFIG.STATIONARY_THROTTLE_MS) {
      shouldSave = false;
    }
  }

  return {
    isMoving: confirmedMoving,
    shouldSave,
    isBadSignal: false,
    newState: {
      confidence: newConfidence,
      badSignalCount: newBadSignalCount, // Reset or increment based on accuracy
      lastMovingPoint: confirmedMoving
        ? {
            latitude: point.latitude,
            longitude: point.longitude,
            timestamp: point.timestamp,
          }
        : state.lastMovingPoint,
      lastAcceptedTimestamp: shouldSave
        ? point.timestamp
        : state.lastAcceptedTimestamp,
    },
  };
}

export function createInitialState(): MovementState {
  return {
    confidence: 0,
    badSignalCount: 0,
    lastMovingPoint: null,
    lastAcceptedTimestamp: null,
  };
}
