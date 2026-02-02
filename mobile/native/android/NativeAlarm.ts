import { NativeModules, Platform } from "react-native";

const nativeAlarm = NativeModules.NativeAlarm;

export function scheduleNativeAlarm(
  timestamp: number,
  reminderId: string,
  title: string,
  soundType: string,
  content?: string,
  tapToOpenText?: string,
  timesUpText?: string,
  stopAlarmText?: string
) {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.scheduleAlarm(
      timestamp,
      reminderId,
      title,
      soundType,
      content || "",
      tapToOpenText || "Tap to open timer",
      timesUpText || "Time's up!",
      stopAlarmText || "Stop Alarm"
    );
  }
}

export function scheduleRepeatingNativeAlarm(
  timestamp: number,
  reminderId: string,
  title: string,
  soundType: string,
  content: string,
  repeatType: "daily" | "weekly",
  hour: number,
  minute: number,
  weekdays?: number[] // 1=Sun, 2=Mon, ..., 7=Sat (for weekly)
) {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.scheduleRepeatingAlarm(
      timestamp,
      reminderId,
      title,
      soundType,
      content,
      repeatType,
      weekdays || [],
      hour,
      minute
    );
  }
}

export function cancelNativeAlarm(reminderId: string) {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.cancelAlarm(reminderId);
  }
}

export function cancelAllNativeAlarms() {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.cancelAllAlarms();
  }
}

export function stopNativeAlarm() {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.stopAlarm();
  }
}
