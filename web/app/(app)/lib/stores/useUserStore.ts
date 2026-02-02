import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null | undefined;
  language: "en" | "fi" | null;
}

interface UserStore {
  preferences: UserPreferences | null;
  setUserPreferences: (preferences: UserPreferences) => void;
  clearUserPreferences: () => void;
  setLanguage: (language: "en" | "fi") => void;
  role: "user" | "admin" | "super_admin" | "guest" | null; // keep role separate
  setRole: (role: UserStore["role"]) => void;
  logoutUser: () => void; // Method to clear user state on logout
  loginUser: (
    prefs: UserPreferences,
    role: UserStore["role"],
  ) => void; // Method to set user state on login
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferences: null,
      setUserPreferences: (preferences) => set({ preferences }),
      clearUserPreferences: () => set({ preferences: null }),
      setLanguage: (language) =>
        set((state) => ({
          preferences: state.preferences
            ? { ...state.preferences, language }
            : null,
        })),
      role: null, 
      setRole: (role) => set({ role }),
      logoutUser: () => {
        set({
          preferences: null,
          role: null,
        });
      },
      loginUser: (prefs, role) =>
        set({
          preferences: prefs,
          role,
        }),
    }),
    {
      name: "user-store", // Name of the storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
