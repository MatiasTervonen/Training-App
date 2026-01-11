import { NativeModules } from "react-native";

const { NativeAlarm } = NativeModules;

export async function canUseExactAlarm() {
  return NativeAlarm.canScheduleExactAlarms();
}

export function requestExactAlarm() {
  return NativeAlarm.requestExactAlarmPermission();
}
