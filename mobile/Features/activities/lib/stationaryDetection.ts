export type MovementState = {
    confidence: number;
    lastMovingPoint: { latitude: number; longitude: number; timestamp: number } | null;
    lastAcceptedTimestamp: number | null;
};

export type MovementResult = {
    isMoving: boolean;
    shouldSave: boolean;
    newState: MovementState;
};

const CONFIG = {
    ACCURACY_THRESHOLD: 15,
    MIN_MOVE_DISTANCE: 4, // meters
    CONFIDENCE_THRESHOLD: 3,
    CONFIDENCE_INCREMENT: 2,
    CONFIDENCE_DECAY: 1,
    STATIONARY_THROTTLE_MS: 5000,
};

export function detectMovement(
    point: { latitude: number; longitude: number; accuracy?: number | null | undefined; timestamp: number },
    anchor: { latitude: number; longitude: number } | null,
    state: MovementState,
    haversine: (lat1: number, lon1: number, lat2: number, lon2: number) => number
): MovementResult {
    // Filter low accuracy
    if ((point.accuracy ?? Infinity) > CONFIG.ACCURACY_THRESHOLD) {
        return { isMoving: false, shouldSave: false, newState: state };
    }

    let isMoving = false;
    const effectiveAnchor = state.lastMovingPoint ?? anchor;

    if (effectiveAnchor) {
        const distance = haversine(
            effectiveAnchor.latitude,
            effectiveAnchor.longitude,
            point.latitude,
            point.longitude
        );
        isMoving = distance > CONFIG.MIN_MOVE_DISTANCE && distance > (point.accuracy ?? 0);
    }

    // Update confidence
    let newConfidence = state.confidence;
    if (isMoving) {
        newConfidence = Math.min(newConfidence + CONFIG.CONFIDENCE_INCREMENT, CONFIG.CONFIDENCE_THRESHOLD + 2);
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
        newState: {
            confidence: newConfidence,
            lastMovingPoint: confirmedMoving
                ? { latitude: point.latitude, longitude: point.longitude, timestamp: point.timestamp }
                : state.lastMovingPoint,
            lastAcceptedTimestamp: shouldSave ? point.timestamp : state.lastAcceptedTimestamp,
        },
    };
}

export function createInitialState(): MovementState {
    return {
        confidence: 0,
        lastMovingPoint: null,
        lastAcceptedTimestamp: null,
    };
}