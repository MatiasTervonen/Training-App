import AsyncStorage from "@react-native-async-storage/async-storage";
import Mapbox from "@rnmapbox/maps";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActivitySettings {
  defaultMapStyle: string;
  defaultLineColorIndex: number;
}

interface ActivitySettingsStore extends ActivitySettings {
  setDefaultMapStyle: (style: string) => void;
  setDefaultLineColorIndex: (index: number) => void;
}

export const useActivitySettingsStore = create<ActivitySettingsStore>()(
  persist(
    (set) => ({
      defaultMapStyle: Mapbox.StyleURL.Dark,
      defaultLineColorIndex: 0,
      setDefaultMapStyle: (style) => set({ defaultMapStyle: style }),
      setDefaultLineColorIndex: (index) =>
        set({ defaultLineColorIndex: index }),
    }),
    {
      name: "activity-settings-store",
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
