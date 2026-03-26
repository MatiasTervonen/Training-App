import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import { useState, useEffect } from "react";
import { getEnergyBalance } from "@/database/energy-balance/get-energy-balance";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import { getTrackingDate } from "@/lib/formatDate";

export function useEnergyBalance(date: string) {
  const isToday = date === getTrackingDate();
  const [todaySteps, setTodaySteps] = useState<number | null>(null);

  useEffect(() => {
    if (isToday && Platform.OS === "android") {
      getTodaySteps().then(setTodaySteps);
    } else {
      setTodaySteps(null);
    }
  }, [isToday]);

  return useQuery({
    queryKey: ["energyBalance", date, todaySteps],
    queryFn: () => getEnergyBalance(date, isToday ? todaySteps : null),
    enabled: !!date && (!isToday || Platform.OS !== "android" || todaySteps !== null),
    staleTime: 60_000,
  });
}
