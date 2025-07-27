import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

interface UserStore {
  preferences: UserPreferences | null;
  setUserPreferences: (preferences: UserPreferences) => void;
  clearUserPreferences: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  isGuest: boolean; // Optional property for guest users
  setIsGuest: (status: boolean) => void; // Optional method for setting guest status
  logoutUser: () => void; // Method to clear user state on logout
  loginUser: (prefs: UserPreferences, isGuest: boolean) => void; // Method to set user state on login
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferences: null,
      setUserPreferences: (preferences) => set({ preferences }),
      clearUserPreferences: () => set({ preferences: null }),
      setIsLoggedIn: (status) => set({ isLoggedIn: status }),
      isLoggedIn: false,
      isGuest: false, // Default to false, can be set later
      setIsGuest: (status) => set({ isGuest: status }),
      logoutUser: () => {
        set({
          preferences: null,
          isLoggedIn: false,
          isGuest: false,
        });
      },
      loginUser: (prefs, isGuest) =>
        set({
          preferences: prefs,
          isLoggedIn: true,
          isGuest,
        }),
    }),
    {
      name: "user-store", // Name of the storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
