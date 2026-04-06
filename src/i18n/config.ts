import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esLanding from "../locales/es/landing.json";
import enLanding from "../locales/en/landing.json";
import esBlog from "../locales/es/blog.json";
import enBlog from "../locales/en/blog.json";
import esApp from "../locales/es/app.json";
import enApp from "../locales/en/app.json";

function getInitialLanguage(): "es" | "en" {
  if (typeof window === "undefined") return "es";
  const p = (window.location.pathname.split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  // Rutas públicas inglesas: forzar EN
  if (p === "/en" || p.startsWith("/en/")) return "en";
  // Para el resto, respetar preferencia guardada en localStorage (permite que
  // el panel autenticado funcione en el idioma elegido por el usuario).
  const stored = localStorage.getItem("i18nextLng");
  if (stored === "en") return "en";
  return "es";
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    defaultNS: "landing",
    ns: ["landing", "blog", "app"],
    resources: {
      es: {
        landing: esLanding,
        blog: esBlog,
        app: esApp,
      },
      en: {
        landing: enLanding,
        blog: enBlog,
        app: enApp,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;


