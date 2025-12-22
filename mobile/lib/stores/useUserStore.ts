import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role: string;
}

interface UserSettings {
  push_enabled: boolean;
  gps_tracking_enabled: boolean;
}

interface UserStore {
  profile: UserProfile | null;
  settings: UserSettings | null;
  setUserProfile: (patch: Partial<UserProfile>) => void;
  setUserSettings: (patch: Partial<UserSettings>) => void;
  logoutUser: () => void; // Method to clear user state on logout
  loginUser: (profile: UserProfile, settings: UserSettings) => void; // Method to set user state on login
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      settings: null,
      setUserProfile: (patch) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...patch }
            : state.profile,
        })),
      setUserSettings: (patch) =>
        set((state) => ({
          settings: state.settings
            ? { ...state.settings, ...patch }
            : state.settings,
        })),
      logoutUser: () => {
        set({
          profile: null,
          settings: null,
        });
      },
      loginUser: (profile, settings) =>
        set({
          profile: profile,
          settings: settings,
        }),
    }),
    {
      name: "user-store",
      version: 2,
      migrate: async (persistedState, version) => {
        if (version < 2 && persistedState) {
          const { isGuest, ...rest } = persistedState as any;
          return rest;
        }
        return persistedState;
      },
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
    }
  )
);
