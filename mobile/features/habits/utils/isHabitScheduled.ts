import { Habit } from "@/types/habit";
import { getTrackingDate } from "@/lib/formatDate";

/**
 * Check if a habit is scheduled for a given date string (YYYY-MM-DD).
 * frequency_days uses 1=Sun, 2=Mon, ..., 7=Sat (Expo notification weekday numbering).
 * JS Date.getDay() returns 0=Sun, 1=Mon, ..., 6=Sat, so we add 1.
 */
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  // Don't schedule for dates before the habit was created (local time)
  const createdDate = getTrackingDate(habit.created_at);
  if (dateStr < createdDate) return false;

  if (!habit.frequency_days) return true; // daily
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay() + 1; // convert to 1-based
  return habit.frequency_days.includes(dayOfWeek);
}

/**
 * Count how many habits are scheduled for a given date.
 */
export function countScheduledHabits(habits: Habit[], dateStr: string): number {
  return habits.filter((h) => isHabitScheduledForDate(h, dateStr)).length;
}
