import { useEffect } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  stopNativeAlarm,
  isNativeAlarmRunning,
} from "@/native/android/NativeAlarm";
import { useTimerStore } from "@/lib/stores/timerStore";

type AlarmInfo = {
  reminderId: string;
  soundType: string;
  title: string;
  content: string;
};

function clearAlarmState() {
  const store = useTimerStore.getState();
  if (store.alarmFired) store.setAlarmFired(false);
  if (store.alarmSoundPlaying) store.setAlarmSoundPlaying(false);
}

export default function AlarmPlayingListener() {
  const router = useRouter();
  const alarmFired = useTimerStore((s) => s.alarmFired);

  // When alarmFired is true (including after store rehydration), check if
  // the native alarm service is actually still running. If not, the user
  // already stopped it from the notification — clear the stale JS state.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!alarmFired) return;

    const checkStaleAlarmState = async () => {
      const running = await isNativeAlarmRunning();
      if (!running) {
        clearAlarmState();
      }
    };

    checkStaleAlarmState();
  }, [alarmFired]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const alarmSub = DeviceEventEmitter.addListener(
      "ALARM_PLAYING",
      (data: AlarmInfo) => {
        // Stop the alarm immediately
        stopNativeAlarm();
        clearAlarmState();

        const isHabitSession =
          useTimerStore.getState().activeSession?.type === "habit";

        // Navigate based on alarm type - this will expand the reminder
        if (
          (data.soundType === "reminder" ||
            data.soundType === "global-reminder") &&
          data.reminderId
        ) {
          router.push(`/dashboard?reminderId=${data.reminderId}`);
        } else if (data.soundType === "timer" && !isHabitSession) {
          router.push("/timer/empty-timer");
        } else {
          router.push("/dashboard");
        }
      }
    );

    // Listen for STOP_ALARM_SOUND to clear stale alarm state
    const stopSub = DeviceEventEmitter.addListener("STOP_ALARM_SOUND", () => {
      clearAlarmState();
    });

    return () => {
      alarmSub.remove();
      stopSub.remove();
    };
  }, [router]);

  return null;
}
