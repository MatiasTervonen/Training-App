import { create } from "zustand";

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
}

export const useUserStore = create<UserStore>((set) => ({
  preferences: null,
  setUserPreferences: (preferences) => set({ preferences }),
  clearUserPreferences: () => set({ preferences: null }),
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  isLoggedIn: false,
  isGuest: false, // Default to false, can be set later
  setIsGuest: (status) => set({ isGuest: status }),
}));
