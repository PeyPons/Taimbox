import i18n from "i18next";
import esBlog from "../locales/es/blog.json";
import enBlog from "../locales/en/blog.json";

/** El panel ya trae `blog` en `i18n/config`. La entrada pública lo añade al abrir el blog. */
if (!i18n.hasResourceBundle("es", "blog")) {
  i18n.addResourceBundle("es", "blog", esBlog, true, true);
  i18n.addResourceBundle("en", "blog", enBlog, true, true);
}
