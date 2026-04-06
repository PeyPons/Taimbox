import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getCookieConsent,
  setCookieConsent,
  syncConsentToGtm,
  acceptAllCookies,
  acceptOnlyNecessary,
  type CookieConsentState,
} from "@/lib/cookieConsent";
import { Cookie, Settings2, Shield, BarChart3, Megaphone } from "lucide-react";

export function CookieBanner() {
  const { t } = useTranslation("landing");
  const [visible, setVisible] = useState(false);
  const [openCustomize, setOpenCustomize] = useState(false);
  const [customState, setCustomState] = useState<Pick<CookieConsentState, "analytics" | "marketing">>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = getCookieConsent();
    setVisible(consent === null);
    if (consent) syncConsentToGtm(consent); // GTM: estado disponible en cookie + dataLayer al cargar
  }, []);

  // Abrir preferencias desde footer u otros enlaces (ej. "Cookies" / "Privacidad")
  useEffect(() => {
    const handler = () => {
      const consent = getCookieConsent();
      setCustomState({
        analytics: consent?.analytics ?? false,
        marketing: consent?.marketing ?? false,
      });
      setOpenCustomize(true);
    };
    window.addEventListener("open-cookie-preferences", handler);
    return () => window.removeEventListener("open-cookie-preferences", handler);
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setVisible(false);
  };

  const handleOnlyNecessary = () => {
    acceptOnlyNecessary();
    setVisible(false);
  };

  const handleOpenCustomize = () => {
    setCustomState({ analytics: false, marketing: false });
    setOpenCustomize(true);
  };

  const handleSaveCustom = () => {
    setCookieConsent({
      necessary: true,
      analytics: customState.analytics,
      marketing: customState.marketing,
      timestamp: Date.now(),
    });
    setOpenCustomize(false);
    setVisible(false); // Ya hay consentimiento guardado
  };

  return (
    <>
      {/* Overlay + barra más intrusiva: fondo oscurecido y CTA muy visible para maximizar aceptación */}
      {visible && (
        <>
          <div
            className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            aria-hidden
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[9998] border-t-2 border-indigo-500/50 bg-indigo-950 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]"
            role="dialog"
            aria-label={t("cookie.ariaDialog")}
          >
            <div className="max-w-5xl mx-auto px-4 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 sm:max-w-xl">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/30">
                    <Cookie className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-200" />
                  </div>
                  <div className="min-w-0 space-y-1.5 sm:space-y-2 flex-1">
                    <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                      {t("cookie.bannerTitle")}
                    </p>
                    <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                      {t("cookie.bannerBody")}{" "}
                      <button
                        type="button"
                        className="text-indigo-300 hover:text-white underline underline-offset-2 font-medium touch-manipulation min-h-[44px] min-w-[44px] -ml-2 -mb-1 inline-flex items-center"
                        onClick={() => setOpenCustomize(true)}
                      >
                        {t("cookie.moreInfo")}
                      </button>
                    </p>
                  </div>
                </div>
                {/* Mobile: dos botones principales en 2 columnas; Personalizar debajo. Desktop: fila horizontal */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                  <div className="grid grid-cols-2 sm:flex gap-3">
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="min-h-[44px] touch-manipulation text-sm sm:text-base font-semibold border-2 border-white/80 bg-transparent text-white hover:bg-white/15 hover:text-white hover:border-white shadow-md w-full min-w-0 sm:min-w-[160px]"
                      onClick={handleOnlyNecessary}
                    >
                      Solo necesarias
                    </Button>
                    <Button
                      size="lg"
                      className="min-h-[44px] touch-manipulation bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg w-full min-w-0 sm:min-w-[160px] text-sm sm:text-base font-semibold"
                      onClick={handleAcceptAll}
                    >
                      Aceptar todas
                    </Button>
                  </div>
                  <Button
                    size="default"
                    variant="outline"
                    className="min-h-[44px] touch-manipulation w-full sm:w-auto border-2 border-white/70 bg-white/5 text-white hover:bg-white/15 hover:text-white hover:border-white"
                    onClick={handleOpenCustomize}
                  >
                    <Settings2 className="h-4 w-4 mr-2 shrink-0" />
                    {t("cookie.customize")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de personalización (RGPD): priority high para quedar por encima del overlay del banner */}
      <Dialog open={openCustomize} onOpenChange={setOpenCustomize}>
        <DialogContent
          priority="high"
          className="sm:max-w-lg bg-slate-900 border-white/10 text-white p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
              <Cookie className="h-5 w-5 text-indigo-400 shrink-0" />
              {t("cookie.dialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm leading-relaxed">
              {t("cookie.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Shield className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <Label htmlFor="necessary" className="text-white font-medium cursor-pointer">
                    {t("cookie.necessary")}
                  </Label>
                  <p className="text-sm text-slate-400 leading-relaxed mt-0.5">{t("cookie.necessaryDesc")}</p>
                </div>
              </div>
              <Switch id="necessary" checked disabled className="data-[state=checked]:bg-indigo-600 shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center gap-3 min-w-0">
                <BarChart3 className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <Label htmlFor="analytics" className="text-white font-medium cursor-pointer">
                    {t("cookie.analytics")}
                  </Label>
                  <p className="text-sm text-slate-400 leading-relaxed mt-0.5">{t("cookie.analyticsDesc")}</p>
                </div>
              </div>
              <Switch
                id="analytics"
                checked={customState.analytics}
                onCheckedChange={(v) => setCustomState((s) => ({ ...s, analytics: v }))}
                className="data-[state=checked]:bg-indigo-600 shrink-0"
              />
            </div>
            <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Megaphone className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <Label htmlFor="marketing" className="text-white font-medium cursor-pointer">
                    {t("cookie.marketing")}
                  </Label>
                  <p className="text-sm text-slate-400 leading-relaxed mt-0.5">{t("cookie.marketingDesc")}</p>
                </div>
              </div>
              <Switch
                id="marketing"
                checked={customState.marketing}
                onCheckedChange={(v) => setCustomState((s) => ({ ...s, marketing: v }))}
                className="data-[state=checked]:bg-indigo-600 shrink-0"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] touch-manipulation w-full sm:w-auto border-white/40 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/60"
              onClick={() => setOpenCustomize(false)}
            >
              {t("cookie.cancel")}
            </Button>
            <Button
              className="min-h-[44px] touch-manipulation w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSaveCustom}
            >
              {t("cookie.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
