import { TrackPoint } from "@/types/session";

export function findWarmupStartIndex(
  track: TrackPoint[],
  accuracyThreshold = 20,
  requiredGoodFixes = 5,
): number | null {
  let goodFixCount = 0;

  for (let i = 0; i < track.length; i++) {
    const accuracy = track[i].accuracy ?? Infinity;

    if (accuracy <= accuracyThreshold) {
      goodFixCount += 1;
      if (goodFixCount >= requiredGoodFixes) {
        return i - requiredGoodFixes + 1;
      }
    } else {
      goodFixCount = 0;
    }
  }

  return null; // warm-up not finished yet
}
