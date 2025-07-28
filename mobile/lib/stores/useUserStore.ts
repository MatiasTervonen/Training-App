import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  role?: string; // Optional role for guest users
}

interface UserStore {
  session: Session | null;
  preferences: UserPreferences | null;
  setUserPreferences: (preferences: UserPreferences) => void;
  clearUserPreferences: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  logoutUser: () => void; // Method to clear user state on logout
  loginUser: (prefs: UserPreferences, session: Session) => void; // Method to set user state on login
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      preferences: null,
      setUserPreferences: (preferences) => set({ preferences }),
      clearUserPreferences: () => set({ preferences: null }),
      setIsLoggedIn: (status) => set({ isLoggedIn: status }),
      isLoggedIn: false,
      logoutUser: () => {
        set({
          preferences: null,
          isLoggedIn: false,
          session: null,
        });
      },
      loginUser: (prefs, session) =>
        set({
          preferences: prefs,
          isLoggedIn: true,
          session,
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
