import { useEffect, useRef, useState, useCallback } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import {
  setAppInForeground,
  getMilestoneThresholds,
} from "@/native/android/NativeTimer";
import { useTranslation } from "react-i18next";

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

export interface MilestoneToast {
  id: string;
  lines: string[];
}

export function useMilestoneAlerts(
  metrics: MilestoneMetrics,
  isActive: boolean,
) {
  const { t } = useTranslation("activities");
  const [toast, setToast] = useState<MilestoneToast | null>(null);
  const thresholds = useRef<ThresholdState>({
    steps: null,
    duration: null,
    distance: null,
    calories: null,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInForeground = useRef(AppState.currentState === "active");
  const isInitialized = useRef(false);

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

  const showToast = useCallback((lines: string[]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToast({ id: Date.now().toString(), lines });

    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3500);
  }, []);

  // Initialize thresholds when session becomes active.
  // Always read from native service first — it tracks thresholds persistently
  // and stays in sync even across component unmount/remount (navigation).
  // Only fall back to settings values if native has no thresholds yet (fresh session).
  useEffect(() => {
    if (!isActive || !milestoneSettings) {
      isInitialized.current = false;
      return;
    }

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
      milestoneSound.seekTo(0);
      milestoneSound.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(hitLines);
    }
  }, [
    isActive,
    metrics.steps,
    metrics.durationSeconds,
    metrics.distanceMeters,
    metrics.calories,
    milestoneSettings,
    showToast,
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

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return { toast };
}
