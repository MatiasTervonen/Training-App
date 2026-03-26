import { DeviceEventEmitter } from "react-native";
import { create } from "zustand";
import { t } from "i18next";
import {
  startNativeRestTimer,
  stopNativeRestTimer,
} from "@/native/android/NativeRestTimer";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

// Duck other audio (e.g. YouTube) instead of pausing it
setAudioModeAsync({
  interruptionMode: "duckOthers",
  interruptionModeAndroid: "duckOthers",
});

const restTimerSound = createAudioPlayer(
  require("@/assets/audio/mixkit_alert_bells_echo_765.wav"),
);

interface RestTimerState {
  isRunning: boolean;
  endTimestamp: number | null;
  uiTick: number;

  startRestTimer: (durationSeconds: number) => void;
  skipRestTimer: () => void;
  clearRestTimer: () => void;
}

let restInterval: ReturnType<typeof setInterval> | null = null;

export const useRestTimerStore = create<RestTimerState>()((set, get) => ({
  isRunning: false,
  endTimestamp: null,
  uiTick: 0,

  startRestTimer: (durationSeconds: number) => {
    // Clear existing timer if running
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }

    stopNativeRestTimer();

    const endTimestamp = Date.now() + durationSeconds * 1000;

    // Start native countdown notification (with skip button)
    // Native service handles the "finished" notification with auto-dismiss
    startNativeRestTimer(
      endTimestamp,
      t("gym:gym.restTimer.label"),
      t("gym:gym.restTimer.ongoingBody"),
      t("gym:gym.restTimer.skip"),
      t("gym:gym.restTimer.finished"),
    );

    set({
      isRunning: true,
      endTimestamp,
    });

    restInterval = setInterval(() => {
      const { endTimestamp: end } = get();

      if (end && Date.now() >= end) {
        if (restInterval) {
          clearInterval(restInterval);
          restInterval = null;
        }
        stopNativeRestTimer();

        const timeSinceEnd = Date.now() - end;

        // Only play JS sound if caught in real-time (foreground).
        // If app was backgrounded the native notification already played the sound.
        if (timeSinceEnd < 2000) {
          setAudioModeAsync({
            interruptionMode: "duckOthers",
            interruptionModeAndroid: "duckOthers",
          }).then(() => {
            restTimerSound.volume = 1.0;
            restTimerSound.seekTo(0);
            restTimerSound.play();
          });
        }

        set({ isRunning: false });
        return;
      }

      set((state) => ({ uiTick: state.uiTick + 1 }));
    }, 1000);
  },

  skipRestTimer: () => {
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }

    stopNativeRestTimer();

    set({
      isRunning: false,
      endTimestamp: null,
    });
  },

  clearRestTimer: () => {
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }

    stopNativeRestTimer();

    set({
      isRunning: false,
      endTimestamp: null,
    });
  },
}));

// Listen for native skip button press
DeviceEventEmitter.addListener("REST_TIMER_SKIPPED", () => {
  useRestTimerStore.getState().skipRestTimer();
});
