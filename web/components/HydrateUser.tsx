"use client";

import { useUserStore } from "@/lib/stores/useUserStore";
import { useAppReadyStore } from "@/lib/stores/useAppReadyStore";
import { useEffect, useRef } from "react";
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
  const setAppReady = useAppReadyStore((state) => state.setAppReady);
  const { i18n } = useTranslation();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Only hydrate once on initial mount
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const hydrate = async () => {
      if (preferences) {
        loginUser(preferences, role);
        // Set i18n language from user preferences, or detect from browser
        if (preferences.language) {
          await i18n.changeLanguage(preferences.language);
        } else {
          // Detect language from browser if user hasn't set a preference
          const browserLang = navigator.language.split("-")[0];
          const supportedLangs = ["en", "fi"];
          const detectedLang = supportedLangs.includes(browserLang)
            ? browserLang
            : "en";
          await i18n.changeLanguage(detectedLang);
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
      // Signal that app is ready after hydration and language is set
      setAppReady(true);
    };

    hydrate();
  }, [loginUser, preferences, role, i18n, setAppReady]);

  return null;
}
