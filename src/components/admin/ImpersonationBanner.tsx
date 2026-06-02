import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Eye, LogOut } from "lucide-react";
import { useAgency } from "@/contexts/AgencyContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useTranslation } from "react-i18next";

interface ImpersonationRow {
  agency_id: string;
  agency_name: string;
}

interface ImpersonationState {
  loading: boolean;
  isImpersonating: boolean;
  agencyName: string;
  agencyId: string;
  exiting: boolean;
  exitImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationState | null>(null);

function useImpersonationState(): ImpersonationState {
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
    return () => {
      cancelled = true;
    };
  }, []);

  const showRow = !loading && (info ?? (isPlatformAdmin && currentAgency));
  const agencyName = info?.agency_name ?? currentAgency?.name ?? "";
  const agencyId = info?.agency_id ?? currentAgency?.id ?? "";
  const isImpersonating = showRow && !!agencyName;

  const exitImpersonation = useCallback(async () => {
    const id = info?.agency_id ?? currentAgency?.id;
    if (!id) return;
    setExiting(true);
    try {
      const { error } = await supabase.rpc("admin_stop_impersonate", {
        p_agency_id: id,
      });
      if (error) throw error;
      setInfo(null);
      navigate("/admin/agencies");
    } catch (e) {
      console.error("[ImpersonationBanner] Error:", e);
    } finally {
      setExiting(false);
    }
  }, [currentAgency?.id, info?.agency_id, navigate]);

  return useMemo(
    () => ({
      loading,
      isImpersonating,
      agencyName,
      agencyId,
      exiting,
      exitImpersonation,
    }),
    [agencyId, agencyName, exiting, exitImpersonation, isImpersonating, loading]
  );
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const value = useImpersonationState();
  return (
    <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>
  );
}

export function useImpersonationStatus(): ImpersonationState {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    throw new Error("useImpersonationStatus debe usarse dentro de ImpersonationProvider");
  }
  return ctx;
}

/** Vista compacta en el sidebar (sustituye la franja superior). */
export function SidebarImpersonationPanel() {
  const { t } = useTranslation("app");
  const { loading, isImpersonating, agencyName, agencyId, exitImpersonation, exiting } =
    useImpersonationStatus();

  if (loading || !isImpersonating) return null;

  return (
    <div className="shrink-0 px-2 pt-1 pb-0.5 border-t border-slate-800/90">
      <div
        className="flex items-center gap-1.5 min-w-0 rounded-md border border-amber-500/25 bg-amber-950/45 px-1.5 py-1"
        title={t("impersonation.adminViewTitle", "Admin view: {{name}}", { name: agencyName })}
      >
        <Eye className="h-3 w-3 text-amber-400 shrink-0" aria-hidden />
        <span className="text-[10px] leading-tight text-amber-100/95 truncate flex-1 min-w-0">
          {agencyName}
        </span>
        <button
          type="button"
          onClick={exitImpersonation}
          disabled={exiting || !agencyId}
          className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded text-amber-200/90 hover:bg-amber-600/30 hover:text-white disabled:opacity-50"
          title={t("impersonation.exitTitle", "Exit agency view")}
          aria-label={t("impersonation.exitAria", "Exit agency view")}
        >
          <LogOut className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
