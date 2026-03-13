import AsyncStorage from "@react-native-async-storage/async-storage";
import Mapbox from "@rnmapbox/maps";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MilestoneMetricSetting {
  enabled: boolean;
  interval: number;
}

export interface MilestoneAlertSettings {
  steps: MilestoneMetricSetting;
  duration: MilestoneMetricSetting;
  distance: MilestoneMetricSetting;
  calories: MilestoneMetricSetting;
}

interface ActivitySettings {
  defaultMapStyle: string;
  defaultLineColorIndex: number;
  milestoneAlerts: MilestoneAlertSettings;
}

interface ActivitySettingsStore extends ActivitySettings {
  setDefaultMapStyle: (style: string) => void;
  setDefaultLineColorIndex: (index: number) => void;
  setMilestoneAlerts: (alerts: MilestoneAlertSettings) => void;
}

export const useActivitySettingsStore = create<ActivitySettingsStore>()(
  persist(
    (set) => ({
      defaultMapStyle: Mapbox.StyleURL.Dark,
      defaultLineColorIndex: 0,
      milestoneAlerts: {
        steps: { enabled: false, interval: 1000 },
        duration: { enabled: false, interval: 10 },
        distance: { enabled: false, interval: 1 },
        calories: { enabled: false, interval: 100 },
      },
      setDefaultMapStyle: (style) => set({ defaultMapStyle: style }),
      setDefaultLineColorIndex: (index) =>
        set({ defaultLineColorIndex: index }),
      setMilestoneAlerts: (alerts) => set({ milestoneAlerts: alerts }),
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
