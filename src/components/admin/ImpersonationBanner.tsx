import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ImpersonationRow {
  agency_id: string;
  agency_name: string;
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);

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
    if (!info?.agency_id) return;
    setExiting(true);
    try {
      const { error } = await supabase.rpc("admin_stop_impersonate", {
        p_agency_id: info.agency_id,
      });
      if (error) throw error;
      setInfo(null);
      window.location.href = "/admin/agencies";
    } catch (e) {
      console.error("[ImpersonationBanner] Error:", e);
    } finally {
      setExiting(false);
    }
  };

  if (loading || !info) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-sm font-medium px-4 py-2 flex items-center justify-center gap-4 flex-wrap">
      <span>
        Viendo la app como agencia: <strong>{info.agency_name}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-700 text-amber-900 hover:bg-amber-600 hover:text-white h-7 gap-1"
        onClick={handleExit}
        disabled={exiting}
      >
        <LogOut className="h-3.5 w-3.5" />
        Salir de vista
      </Button>
    </div>
  );
}
