import { useMemo } from "react";
import {
  getMovementType,
  getStrideLength,
  getDistanceFromSteps,
} from "@/features/activities/lib/strideLength";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function useStepDistance(
  steps: number,
  activitySlug: string | null,
): number {
  const heightCm = useUserStore((state) => state.profile?.height_cm ?? null);

  return useMemo(() => {
    if (steps <= 0) return 0;
    const movementType = getMovementType(activitySlug);
    const stride = getStrideLength(heightCm, movementType);
    return getDistanceFromSteps(steps, stride);
  }, [steps, activitySlug, heightCm]);
}
