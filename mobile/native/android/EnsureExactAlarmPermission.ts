import { Alert, NativeModules } from "react-native";

const { NativeAlarm } = NativeModules;

export async function ensureExactAlarmPermission() {
  const allowed = await NativeAlarm.canScheduleExactAlarms();

  if (!allowed) {
    // Show explanation first
    Alert.alert(
      "High-priority reminder",
      "To ring exactly on time, this reminder needs permission to schedule alarms.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Allow",
          onPress: () => NativeAlarm.requestExactAlarmPermission(),
        },
      ]
    );
    return false;
  }

  return true;
}
