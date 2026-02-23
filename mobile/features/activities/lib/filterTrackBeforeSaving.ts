type TrackPoint = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
  is_stationary: number;
  bad_signal: number;
};

export function filterTrackBeforeSaving(
  track: TrackPoint[],
  accuracyThreshold = 20,
  requiredGoodFixes = 5,
) {
  let goodFixCount = 0;
  let startIndex = 0;

  for (let i = 0; i < track.length; i++) {
    const accuracy = track[i].accuracy ?? Infinity;

    if (accuracy <= accuracyThreshold) {
      goodFixCount += 1;
      if (goodFixCount >= requiredGoodFixes) {
        startIndex = i - requiredGoodFixes + 1;
        break;
      }
    } else {
      goodFixCount = 0;
    }
  }

  return track.slice(startIndex);
}
