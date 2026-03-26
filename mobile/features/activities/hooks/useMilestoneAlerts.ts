import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import {
  setAppInForeground,
  getMilestoneThresholds,
} from "@/native/android/NativeTimer";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

setAudioModeAsync({
  interruptionMode: "duckOthers",
  interruptionModeAndroid: "duckOthers",
});

const milestoneSound = createAudioPlayer(
  require("@/assets/audio/mixkit_alert_bells_echo_765.wav"),
);

interface MilestoneMetrics {
  steps: number;
  durationSeconds: number;
  distanceMeters: number;
  calories: number;
}

interface ThresholdState {
  steps: number | null;
  duration: number | null;
  distance: number | null;
  calories: number | null;
}

export function useMilestoneAlerts(
  metrics: MilestoneMetrics,
  isActive: boolean,
) {
  const { t } = useTranslation("activities");
  const thresholds = useRef<ThresholdState>({
    steps: null,
    duration: null,
    distance: null,
    calories: null,
  });
  const isInForeground = useRef(AppState.currentState === "active");
  const isInitialized = useRef(false);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const milestoneSettings = useActivitySettingsStore(
    (s) => s.milestoneAlerts,
  );

  // Track foreground/background state and tell native service
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        const wasForeground = isInForeground.current;
        isInForeground.current = nextState === "active";

        setAppInForeground(nextState === "active");

        // When returning to foreground, sync thresholds from native service.
        // Native service always tracks thresholds (even in foreground),
        // so it's always the source of truth.
        if (!wasForeground && nextState === "active" && isActive) {
          const nativeThresholds = await getMilestoneThresholds();
          if (nativeThresholds) {
            thresholds.current = {
              steps: nativeThresholds.steps,
              duration: nativeThresholds.durationSecs,
              distance: nativeThresholds.distanceMeters,
              calories: nativeThresholds.calories,
            };
          }
        }
      },
    );

    setAppInForeground(true);

    return () => {
      subscription.remove();
      setAppInForeground(false);
    };
  }, [isActive]);

  const showMilestoneToast = (lines: string[]) => {
    Toast.show({
      type: "milestone",
      text1: lines[0],
      text2: lines.length > 1 ? lines.slice(1).join("\n") : undefined,
      visibilityTime: 5000,
    });
  };

  // Initialize thresholds when session becomes active.
  // Always read from native service first — it tracks thresholds persistently
  // and stays in sync even across component unmount/remount (navigation).
  // Only fall back to settings values if native has no thresholds yet (fresh session).
  // When settings change mid-session, update thresholds directly without re-reading
  // stale native state.
  useEffect(() => {
    if (!isActive || !milestoneSettings) {
      isInitialized.current = false;
      return;
    }

    // Mid-session settings change — update thresholds directly from new settings
    if (isInitialized.current) {
      const th = thresholds.current;
      const m = metricsRef.current;

      // Steps
      if (milestoneSettings.steps.enabled && th.steps === null) {
        const interval = milestoneSettings.steps.interval;
        th.steps = Math.ceil((m.steps + 1) / interval) * interval;
      } else if (!milestoneSettings.steps.enabled) {
        th.steps = null;
      }

      // Duration
      if (milestoneSettings.duration.enabled && th.duration === null) {
        const intervalSecs = milestoneSettings.duration.interval * 60;
        th.duration =
          Math.ceil((m.durationSeconds + 1) / intervalSecs) * intervalSecs;
      } else if (!milestoneSettings.duration.enabled) {
        th.duration = null;
      }

      // Distance
      if (milestoneSettings.distance.enabled && th.distance === null) {
        const intervalMeters = milestoneSettings.distance.interval * 1000;
        th.distance =
          Math.ceil((m.distanceMeters + 1) / intervalMeters) * intervalMeters;
      } else if (!milestoneSettings.distance.enabled) {
        th.distance = null;
      }

      // Calories
      if (milestoneSettings.calories.enabled && th.calories === null) {
        const interval = milestoneSettings.calories.interval;
        th.calories = Math.ceil((m.calories + 1) / interval) * interval;
      } else if (!milestoneSettings.calories.enabled) {
        th.calories = null;
      }

      return;
    }

    // First initialization — read from native or initialize from settings
    isInitialized.current = false;

    getMilestoneThresholds().then((nativeThresholds) => {
      if (nativeThresholds) {
        thresholds.current = {
          steps: nativeThresholds.steps,
          duration: nativeThresholds.durationSecs,
          distance: nativeThresholds.distanceMeters,
          calories: nativeThresholds.calories,
        };
      } else {
        // Fresh session start — initialize from settings
        thresholds.current = {
          steps: milestoneSettings.steps.enabled
            ? milestoneSettings.steps.interval
            : null,
          duration: milestoneSettings.duration.enabled
            ? milestoneSettings.duration.interval * 60
            : null,
          distance: milestoneSettings.distance.enabled
            ? milestoneSettings.distance.interval * 1000
            : null,
          calories: milestoneSettings.calories.enabled
            ? milestoneSettings.calories.interval
            : null,
        };
      }

      // Advance past any already-exceeded thresholds silently (no toast).
      // This prevents re-firing old milestones when the component remounts
      // mid-session (e.g. navigating away and back).
      const m = metricsRef.current;
      const th = thresholds.current;
      if (th.steps !== null && milestoneSettings.steps.interval > 0) {
        while (th.steps <= m.steps)
          th.steps += milestoneSettings.steps.interval;
      }
      if (th.duration !== null && milestoneSettings.duration.interval > 0) {
        const intervalSecs = milestoneSettings.duration.interval * 60;
        while (th.duration <= m.durationSeconds) th.duration += intervalSecs;
      }
      if (th.distance !== null && milestoneSettings.distance.interval > 0) {
        const intervalMeters = milestoneSettings.distance.interval * 1000;
        while (th.distance <= m.distanceMeters) th.distance += intervalMeters;
      }
      if (th.calories !== null && milestoneSettings.calories.interval > 0) {
        while (th.calories <= m.calories)
          th.calories += milestoneSettings.calories.interval;
      }

      isInitialized.current = true;
    });
  }, [isActive, milestoneSettings]);

  // Check thresholds on every metric update (foreground only)
  useEffect(() => {
    if (!isActive || !isInForeground.current || !isInitialized.current) return;

    const th = thresholds.current;
    const hitLines: string[] = [];

    if (th.steps !== null && metrics.steps >= th.steps) {
      hitLines.push(
        t("activities.milestoneAlerts.toastSteps", { count: th.steps }),
      );
      th.steps += milestoneSettings.steps.interval;
    }

    if (th.duration !== null && metrics.durationSeconds >= th.duration) {
      const mins = th.duration / 60;
      hitLines.push(
        t("activities.milestoneAlerts.toastMinutes", { count: mins }),
      );
      th.duration += milestoneSettings.duration.interval * 60;
    }

    if (th.distance !== null && metrics.distanceMeters >= th.distance) {
      const km = th.distance / 1000;
      hitLines.push(
        t("activities.milestoneAlerts.toastKm", { count: km }),
      );
      th.distance += milestoneSettings.distance.interval * 1000;
    }

    if (th.calories !== null && metrics.calories >= th.calories) {
      hitLines.push(
        t("activities.milestoneAlerts.toastCalories", {
          count: th.calories,
        }),
      );
      th.calories += milestoneSettings.calories.interval;
    }

    if (hitLines.length > 0) {
      // Re-apply ducking — other components (recording, voice playback) may have
      // overridden the global audio mode since module load
      setAudioModeAsync({
        interruptionMode: "duckOthers",
        interruptionModeAndroid: "duckOthers",
      }).then(() => {
        milestoneSound.volume = 1.0;
        milestoneSound.seekTo(0);
        milestoneSound.play();
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showMilestoneToast(hitLines);
    }
  }, [
    isActive,
    metrics.steps,
    metrics.durationSeconds,
    metrics.distanceMeters,
    metrics.calories,
    milestoneSettings,
    t,
  ]);

  // Reset thresholds when session deactivates
  useEffect(() => {
    if (!isActive) {
      thresholds.current = {
        steps: null,
        duration: null,
        distance: null,
        calories: null,
      };
      isInitialized.current = false;
    }
  }, [isActive]);

  return {};
}
