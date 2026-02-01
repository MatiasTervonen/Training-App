/* eslint-disable import/no-named-as-default-member */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import * as en from "@/locales/en";
import * as fi from "@/locales/fi";

const resources = {
  en,
  fi,
};

// Get device language, fallback to 'en' if not supported
const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
const supportedLangs = Object.keys(resources);
const initialLang = supportedLangs.includes(deviceLang) ? deviceLang : "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: "common",
    lng: initialLang, // Use detected device language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
