type MovementType = "walking" | "running";

const DEFAULTS: Record<MovementType, number> = {
  walking: 0.72,
  running: 0.78,
};

const MULTIPLIERS: Record<MovementType, number> = {
  walking: 0.00414,
  running: 0.0045,
};

const RUNNING_SLUGS = new Set(["running", "running_treadmill"]);

export function getMovementType(slug: string | null): MovementType {
  if (slug && RUNNING_SLUGS.has(slug)) return "running";
  return "walking";
}

export function getStrideLength(
  heightCm: number | null,
  movementType: MovementType,
): number {
  if (!heightCm) return DEFAULTS[movementType];
  return heightCm * MULTIPLIERS[movementType];
}

export function getDistanceFromSteps(
  steps: number,
  strideLengthMeters: number,
): number {
  return steps * strideLengthMeters;
}
