import i18n from "i18next";
import esApiDocs from "../locales/es/apiDocs.json";
import enApiDocs from "../locales/en/apiDocs.json";

if (!i18n.hasResourceBundle("es", "apiDocs")) {
  i18n.addResourceBundle("es", "apiDocs", esApiDocs, true, true);
  i18n.addResourceBundle("en", "apiDocs", enApiDocs, true, true);
}
