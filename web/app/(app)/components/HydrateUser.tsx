"use client";

import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

type Role = "user" | "admin" | "super_admin" | "guest" | null;

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
  language: "en" | "fi" | null;
}

export default function HydrateUser({
  preferences,
  role,
}: {
  preferences: UserPreferences | null;
  role: Role;
}) {
  const loginUser = useUserStore((state) => state.loginUser);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (preferences) {
      loginUser(preferences, role);
      // Set i18n language from user preferences
      if (preferences.language) {
        i18n.changeLanguage(preferences.language);
      }
    } else {
      toast.error("Failed to load user preferences. Using default values.");
      loginUser(
        {
          display_name: "guest",
          weight_unit: "kg",
          profile_picture: null,
          language: null,
        },
        role
      );
    }
  }, [loginUser, preferences, role, i18n]);

  return null;
}
