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

  // On mount, check if alarm state is stale (alarm fired but native service no longer running)
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const checkStaleAlarmState = async () => {
      const { alarmFired } = useTimerStore.getState();
      if (!alarmFired) return;

      const running = await isNativeAlarmRunning();
      if (!running) {
        clearAlarmState();
      }
    };

    checkStaleAlarmState();
  }, []);

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
