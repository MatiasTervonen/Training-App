import * as Notifications from "expo-notifications";
import { DeviceEventEmitter } from "react-native";
import { create } from "zustand";
import { t } from "i18next";
import {
  startNativeRestTimer,
  stopNativeRestTimer,
} from "@/native/android/NativeRestTimer";

const REST_TIMER_CHANNEL_ID = "rest-timer-end";

// Create notification channel with custom sound (Android only, idempotent)
Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
  name: "Rest Timer",
  sound: "mixkit_alert_bells_echo_765.wav",
  importance: Notifications.AndroidImportance.HIGH,
});

interface RestTimerState {
  isRunning: boolean;
  endTimestamp: number | null;
  uiTick: number;
  endNotificationId: string | null;

  startRestTimer: (durationSeconds: number) => void;
  skipRestTimer: () => void;
  clearRestTimer: () => void;
}

let restInterval: ReturnType<typeof setInterval> | null = null;

export const useRestTimerStore = create<RestTimerState>()((set, get) => ({
  isRunning: false,
  endTimestamp: null,
  uiTick: 0,
  endNotificationId: null,

  startRestTimer: (durationSeconds: number) => {
    const { endNotificationId: oldEndId } = get();

    // Clear existing timer if running
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }

    // Cancel old notifications
    stopNativeRestTimer();
    if (oldEndId) {
      Notifications.cancelScheduledNotificationAsync(oldEndId);
    }

    const endTimestamp = Date.now() + durationSeconds * 1000;

    // Start native countdown notification (with skip button)
    startNativeRestTimer(
      endTimestamp,
      t("gym:gym.restTimer.label"),
      t("gym:gym.restTimer.ongoingBody"),
      t("gym:gym.restTimer.skip"),
    );

    // Schedule end notification with custom sound on dedicated channel
    Notifications.scheduleNotificationAsync({
      content: {
        title: t("gym:gym.restTimer.finished"),
        sound: "mixkit_alert_bells_echo_765.wav",
        channelId: REST_TIMER_CHANNEL_ID,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTimestamp),
        channelId: REST_TIMER_CHANNEL_ID,
      },
    }).then((id) => {
      set({ endNotificationId: id });
    });

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

        // Auto-dismiss end notification after 5 seconds
        const { endNotificationId: firedId } = get();
        if (firedId) {
          setTimeout(() => {
            Notifications.dismissNotificationAsync(firedId);
          }, 5000);
        }

        set({
          isRunning: false,
          endNotificationId: null,
        });
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

    const { endNotificationId } = get();
    if (endNotificationId) {
      Notifications.cancelScheduledNotificationAsync(endNotificationId);
    }

    set({
      isRunning: false,
      endTimestamp: null,
      endNotificationId: null,
    });
  },

  clearRestTimer: () => {
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }

    stopNativeRestTimer();

    const { endNotificationId } = get();
    if (endNotificationId) {
      Notifications.cancelScheduledNotificationAsync(endNotificationId);
    }

    set({
      isRunning: false,
      endTimestamp: null,
      endNotificationId: null,
    });
  },
}));

// Listen for native skip button press
DeviceEventEmitter.addListener("REST_TIMER_SKIPPED", () => {
  useRestTimerStore.getState().skipRestTimer();
});
