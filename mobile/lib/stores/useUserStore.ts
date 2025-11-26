import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role?: string;
  push_enabled?: boolean;
}

interface UserStore {
  preferences: UserPreferences | null;
  setUserPreferences: (preferences: UserPreferences) => void;
  clearUserPreferences: () => void;
  logoutUser: () => void; // Method to clear user state on logout
  loginUser: (prefs: UserPreferences) => void; // Method to set user state on login
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      preferences: null,
      setUserPreferences: (preferences) => set({ preferences }),
      clearUserPreferences: () => set({ preferences: null }),
      logoutUser: () => {
        set({
          preferences: null,
        });
      },
      loginUser: (prefs) =>
        set({
          preferences: prefs,
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
