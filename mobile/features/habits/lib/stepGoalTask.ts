import { AppRegistry } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const PENDING_KEY = "habit-pending-done";

async function getAccessToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(
    "sb-" + new URL(SUPABASE_URL).hostname.split(".")[0] + "-auth-token",
  );
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed?.access_token ?? null;
}

type PendingEntry = { habitId: string; date: string };

async function stepGoalTask(data: { habitId: string; date: string }) {
  const { habitId, date } = data;
  if (!habitId || !date) return;

  // Save to pending first (survives if network fails)
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  const pending: PendingEntry[] = raw ? JSON.parse(raw) : [];
  if (!pending.some((p) => p.habitId === habitId && p.date === date)) {
    pending.push({ habitId, date });
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }

  // Try to insert immediately
  const token = await getAccessToken();
  if (!token) return;

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
    if (res.ok || res.status === 409) {
      // Remove from pending and flag for UI refresh
      const rawPending = await AsyncStorage.getItem(PENDING_KEY);
      const currentPending: PendingEntry[] = rawPending
        ? JSON.parse(rawPending)
        : [];
      const remaining = currentPending.filter(
        (p) => !(p.habitId === habitId && p.date === date),
      );
      if (remaining.length > 0) {
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
      } else {
        await AsyncStorage.removeItem(PENDING_KEY);
      }
      await AsyncStorage.setItem("habit-bg-dirty", "true");
    }
  } catch {
    clearTimeout(timeout);
  }
}

AppRegistry.registerHeadlessTask("StepGoalTask", () => stepGoalTask);
