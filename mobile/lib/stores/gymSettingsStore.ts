import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GymSettings {
  restTimerEnabled: boolean;
  restTimerDurationSeconds: number;
}

interface GymSettingsStore extends GymSettings {
  setRestTimerEnabled: (enabled: boolean) => void;
  setRestTimerDuration: (seconds: number) => void;
}

export const useGymSettingsStore = create<GymSettingsStore>()(
  persist(
    (set) => ({
      restTimerEnabled: false,
      restTimerDurationSeconds: 90,
      setRestTimerEnabled: (enabled) => set({ restTimerEnabled: enabled }),
      setRestTimerDuration: (seconds) =>
        set({ restTimerDurationSeconds: seconds }),
    }),
    {
      name: "gym-settings-store",
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
    },
  ),
);
