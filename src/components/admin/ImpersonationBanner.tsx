import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAgency } from "@/contexts/AgencyContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";

interface ImpersonationRow {
  agency_id: string;
  agency_name: string;
}

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<ImpersonationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const { currentAgency } = useAgency();
  const { isPlatformAdmin } = usePlatformAdmin();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("admin_get_impersonating_agency");
        if (cancelled) return;
        if (error) {
          setInfo(null);
          return;
        }
        const row = (data as unknown[])?.[0];
        setInfo(row ? (row as ImpersonationRow) : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExit = async () => {
    const agencyId = info?.agency_id ?? currentAgency?.id;
    if (!agencyId) return;
    setExiting(true);
    try {
      const { error } = await supabase.rpc("admin_stop_impersonate", {
        p_agency_id: agencyId,
      });
      if (error) throw error;
      setInfo(null);
      navigate("/admin/agencies");
    } catch (e) {
      console.error("[ImpersonationBanner] Error:", e);
    } finally {
      setExiting(false);
    }
  };

  // Mostrar cuando la RPC devuelve agencia en impersonación o cuando es platform admin viendo una agencia (fallback)
  const showBanner = !loading && (info ?? (isPlatformAdmin && currentAgency));
  const agencyName = info?.agency_name ?? currentAgency?.name ?? "";
  const agencyId = info?.agency_id ?? currentAgency?.id ?? "";

  useEffect(() => {
    document.body.style.setProperty('--impersonation-banner-height', showBanner && agencyName ? '2.5rem' : '0');
    return () => document.body.style.removeProperty('--impersonation-banner-height');
  }, [showBanner, agencyName]);

  if (!showBanner || !agencyName) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-sm font-medium px-4 py-2 flex items-center justify-center gap-4 flex-wrap sticky top-0 z-50 shrink-0">
      <span>
        Viendo la app como agencia: <strong>{agencyName}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-700 text-amber-900 hover:bg-amber-600 hover:text-white h-7 gap-1"
        onClick={handleExit}
        disabled={exiting || !agencyId}
      >
        <LogOut className="h-3.5 w-3.5" />
        Salir de vista
      </Button>
    </div>
  );
}
