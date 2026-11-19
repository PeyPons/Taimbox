import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esLanding from "../locales/es/landing.json";
import enLanding from "../locales/en/landing.json";
import esHomeLiteral from "../locales/es/homeLiteral.json";
import enHomeLiteral from "../locales/en/homeLiteral.json";

function getInitialLanguage(): "es" | "en" {
  if (typeof window === "undefined") return "es";
  const path = (window.location.pathname.split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  if (path === "/en" || path.startsWith("/en/")) return "en";
  const stored = localStorage.getItem("i18nextLng");
  if (stored === "en") return "en";
  return "es";
}

/** Solo copy de marketing. El panel sigue en `i18n/config.ts` (incluye app.json). */
void i18n.use(LanguageDetector).use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: "es",
  supportedLngs: ["es", "en"],
  defaultNS: "landing",
  ns: ["landing"],
  resources: {
    es: {
      landing: {
        ...esLanding,
        home: { ...esLanding.home, literal: esHomeLiteral },
      },
    },
    en: {
      landing: {
        ...enLanding,
        home: { ...enLanding.home, literal: enHomeLiteral },
      },
    },
  },
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
  detection: {
    order: ["querystring", "localStorage", "navigator"],
    lookupQuerystring: "lng",
    caches: ["localStorage"],
  },
  react: { useSuspense: false },
});

export default i18n;
