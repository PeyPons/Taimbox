import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAgency } from "@/contexts/AgencyContext";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { toast } from "@/lib/notify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { CurrencySelect } from "@/components/agency/CurrencySelect";
import { DEFAULT_AGENCY_CURRENCY, type AgencyCurrencyCode } from "@/constants/currencies";
import { ONBOARDING_WIZARD_ALLOWED_KEY } from "@/utils/onboardingDefaults";
import { INPUT_LIMITS } from "@/constants/inputLimits";

interface CreateAgencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgencyDialog({ open, onOpenChange }: CreateAgencyDialogProps) {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { switchAgency, refreshAgency } = useAgency();
  const [agencyName, setAgencyName] = useState("");
  const [currency, setCurrency] = useState<AgencyCurrencyCode>(DEFAULT_AGENCY_CURRENCY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = (nextOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        setAgencyName("");
        setCurrency(DEFAULT_AGENCY_CURRENCY);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = agencyName.trim();
    if (trimmed.length < 2) {
      toast.error(t("agencies.create.errors.nameRequired", "Indica un nombre de al menos 2 caracteres"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: agencyExists } = await supabase.rpc("check_availability", {
        check_type: "agency_name",
        value: trimmed,
      });

      if (agencyExists) {
        toast.error(t("auth.register.errors.agencyAlreadyExists", "Ese nombre de empresa ya existe"));
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-agency", {
        body: { agencyName: trimmed, currency },
      });

      if (error) {
        throw new Error(error.message || t("agencies.create.errors.generic", "No se pudo crear la agencia"));
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      const newAgencyId = data?.agency?.id as string | undefined;
      if (!newAgencyId) {
        throw new Error(t("agencies.create.errors.generic", "No se pudo crear la agencia"));
      }

      toast.success(t("agencies.create.success", "Agencia creada correctamente"));
      handleClose(false);

      await switchAgency(newAgencyId);
      await refreshAgency();

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(ONBOARDING_WIZARD_ALLOWED_KEY);
      }
      navigate("/onboarding/choose", { replace: true });
    } catch (err) {
      console.error("[CreateAgencyDialog]", err);
      toast.error(err instanceof Error ? err.message : t("agencies.create.errors.generic", "No se pudo crear la agencia"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("agencies.create.title", "Crear nueva agencia")}</DialogTitle>
            <DialogDescription>
              {t(
                "agencies.create.description",
                "Añade otra agencia a tu cuenta. Tras crearla, configurarás los datos básicos en el asistente de inicio.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-agency-name">{t("agencies.create.nameLabel", "Nombre de la empresa")}</Label>
              <Input
                id="create-agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                maxLength={INPUT_LIMITS.agencyName}
                placeholder={t("agencies.create.namePlaceholder", "Mi nueva agencia")}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-agency-currency">{t("agencies.create.currencyLabel", "Moneda")}</Label>
              <CurrencySelect
                id="create-agency-currency"
                value={currency}
                onValueChange={setCurrency}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("agencies.create.submitting", "Creando…")}
                </>
              ) : (
                t("agencies.create.submit", "Crear agencia")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
