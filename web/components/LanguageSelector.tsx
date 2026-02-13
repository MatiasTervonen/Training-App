"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { saveUserLanguage } from "@/database/settings/save-user-language";
import toast from "react-hot-toast";

export default function LanguageSelector() {
  const { t, i18n } = useTranslation("menu");
  const setLanguage = useUserStore((state) => state.setLanguage);
  const preferences = useUserStore((state) => state.preferences);
  const currentLanguage = preferences?.language;

  console.log("LanguageSelector render - currentLanguage:", currentLanguage, "preferences:", preferences);

  const changeLanguage = async (lng: "en" | "fi") => {
    console.log("changeLanguage called with:", lng);
    // Update i18n immediately for instant UI feedback
    i18n.changeLanguage(lng);

    // Update zustand store
    setLanguage(lng);

    // Save to database
    try {
      await saveUserLanguage(lng);
    } catch {
      toast.error(t("profile.updateError"));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={20} />
        <span className="text-lg">{t("settings.language")}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => changeLanguage("en")}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentLanguage === "en"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          {t("settings.languages.en")}
        </button>
        <button
          onClick={() => changeLanguage("fi")}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentLanguage === "fi"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          {t("settings.languages.fi")}
        </button>
      </div>
    </div>
  );
}
