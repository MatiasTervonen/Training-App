// TimerFinishListener.tsx
import { useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import { useRouter } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";

export default function TimerFinishListener() {
  const router = useRouter();
  const handleRef = useRef(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("TIMER_FINISHED", () => {
      if (handleRef.current) return;

      // Habit timers handle completion in HabitTimerListener — no navigation needed
      const session = useTimerStore.getState().activeSession;
      if (session?.type === "habit") return;

      handleRef.current = true;
      router.replace(`/timer/empty-timer`);

      // Reset after a short delay so the next timer can trigger navigation
      setTimeout(() => {
        handleRef.current = false;
      }, 1000);
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
