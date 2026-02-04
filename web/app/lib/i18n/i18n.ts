import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import * as en from "./locales/en";
import * as fi from "./locales/fi";

const resources = {
  en,
  fi,
};

const supportedLangs = Object.keys(resources);

i18n.use(initReactI18next).init({
  resources,
  defaultNS: "common",
  lng: "en",
  fallbackLng: "en",
  supportedLngs: supportedLangs,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
