"use client";

import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

type Role = "user" | "admin" | "super_admin" | "guest" | null;

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

export default function HydrateUser({
  preferences,
  role,
}: {
  preferences: UserPreferences | null;
  role: Role;
}) {
  const loginUser = useUserStore((state) => state.loginUser);

  useEffect(() => {
    if (preferences) {
      loginUser(preferences, role);
    } else {
      toast.error("Failed to load user preferences. Using default values.");
      loginUser(
        { display_name: "guest", weight_unit: "kg", profile_picture: null },
        role
      );
    }
  }, [loginUser, preferences, role]);

  return null;
}
