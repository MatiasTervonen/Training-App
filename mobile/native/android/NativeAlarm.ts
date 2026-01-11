import { NativeModules, Platform } from "react-native";

const nativeAlarm = NativeModules.NativeAlarm;

export function scheduleNativeAlarm(
  timestamp: number,
  reminderId: string,
  title: string,
  soundType: string
) {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.scheduleAlarm(timestamp, reminderId, title, soundType);
  }
}

export function cancelNativeAlarm(reminderId: string) {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.cancelAlarm(reminderId);
  }
}

export function stopNativeAlarm() {
  if (Platform.OS === "android" && nativeAlarm) {
    nativeAlarm.stopAlarm();
  }
}
