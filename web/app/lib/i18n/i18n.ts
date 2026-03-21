import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import * as en from "./locales/en";
import * as fi from "./locales/fi";
import { APP_NAME } from "@/lib/app-config";

const resources = {
  en,
  fi,
};

const supportedLangs = Object.keys(resources);

function getInitialLang(): string {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("marketing-lang");
  if (saved && supportedLangs.includes(saved)) return saved;
  const browserLang = navigator.language?.split("-")[0];
  if (browserLang && supportedLangs.includes(browserLang)) return browserLang;
  return "en";
}

i18n.use(initReactI18next).init({
  resources,
  defaultNS: "common",
  lng: getInitialLang(),
  fallbackLng: "en",
  supportedLngs: supportedLangs,
  interpolation: {
    escapeValue: false,
    defaultVariables: { appName: APP_NAME },
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
