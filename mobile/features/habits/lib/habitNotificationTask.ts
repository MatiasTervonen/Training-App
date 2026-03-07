import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import {
  HABIT_BG_TASK_NAME,
  HABIT_DONE_ACTION_ID,
} from "@/features/push-notifications/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const PENDING_KEY = "habit-pending-done";

async function getAccessToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem("sb-" + new URL(SUPABASE_URL).hostname.split(".")[0] + "-auth-token");
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed?.access_token ?? null;
}

type PendingEntry = { habitId: string; date: string };

async function addPending(habitId: string, date: string) {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  const pending: PendingEntry[] = raw ? JSON.parse(raw) : [];
  // Avoid duplicates
  if (!pending.some((p) => p.habitId === habitId && p.date === date)) {
    pending.push({ habitId, date });
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
}

async function insertHabitLog(habitId: string, date: string, token: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/habit_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        habit_id: habitId,
        completed_date: date,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    // 201 = created, 409 = unique violation (already done)
    return res.ok || res.status === 409;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

TaskManager.defineTask(HABIT_BG_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;

  const taskData = data as Record<string, unknown>;
  const actionIdentifier = taskData.actionIdentifier as string | undefined;
  if (actionIdentifier !== HABIT_DONE_ACTION_ID) return;

  const notification = taskData.notification as Record<string, unknown> | undefined;
  const request = notification?.request as Record<string, unknown> | undefined;
  const content = request?.content as Record<string, unknown> | undefined;

  // Android sends data as "dataString" (JSON string), iOS sends "data" (object)
  let notifData: Record<string, unknown> | undefined;
  if (typeof content?.dataString === "string") {
    notifData = JSON.parse(content.dataString) as Record<string, unknown>;
  } else {
    notifData = content?.data as Record<string, unknown> | undefined;
  }

  const habitId = notifData?.habitId as string | undefined;
  if (!habitId) return;

  // Dismiss the notification from the tray
  const notifIdentifier = request?.identifier as string | undefined;
  if (notifIdentifier) {
    Notifications.dismissNotificationAsync(notifIdentifier).catch(() => {});
  }

  // Use the notification's date (when it fired), not the current date
  const notifDate = notification?.date as number | undefined;
  const date = notifDate
    ? new Date(notifDate).toLocaleDateString("en-CA")
    : new Date().toLocaleDateString("en-CA");

  // Always save to pending first (survives if network fails)
  await addPending(habitId, date);

  // Try to insert immediately
  const token = await getAccessToken();
  if (!token) return;

  const success = await insertHabitLog(habitId, date, token);
  if (success) {
    // Remove from pending and flag for UI refresh
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const pending: PendingEntry[] = raw ? JSON.parse(raw) : [];
    const remaining = pending.filter((p) => !(p.habitId === habitId && p.date === date));
    if (remaining.length > 0) {
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(PENDING_KEY);
    }
    await AsyncStorage.setItem("habit-bg-dirty", "true");
  }
});

Notifications.registerTaskAsync(HABIT_BG_TASK_NAME);
