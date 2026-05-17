import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esLanding from "../locales/es/landing.json";
import enLanding from "../locales/en/landing.json";
import esHomeLiteral from "../locales/es/homeLiteral.json";
import enHomeLiteral from "../locales/en/homeLiteral.json";
import esBlog from "../locales/es/blog.json";
import enBlog from "../locales/en/blog.json";
import esApp from "../locales/es/app.json";
import enApp from "../locales/en/app.json";
import esApiDocs from "../locales/es/apiDocs.json";
import enApiDocs from "../locales/en/apiDocs.json";

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
    ns: ["landing", "blog", "app", "apiDocs"],
    resources: {
      es: {
        landing: {
          ...esLanding,
          home: { ...esLanding.home, literal: esHomeLiteral },
        },
        blog: esBlog,
        app: esApp,
        apiDocs: esApiDocs,
      },
      en: {
        landing: {
          ...enLanding,
          home: { ...enLanding.home, literal: enHomeLiteral },
        },
        blog: enBlog,
        app: enApp,
        apiDocs: enApiDocs,
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


