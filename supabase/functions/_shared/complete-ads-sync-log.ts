import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AdsSyncPlatform = "google" | "meta";
export type AdsSyncSource = "manual" | "cron";
export type AdsSyncStatus = "completed" | "warning" | "error" | "running";

export const ADS_SYNC_RELINK_LINE =
  "⚠️ No se ha actualizado ninguna campaña. Hay que volver a vincular la cuenta en Configuración → Integraciones.";

/** Si ninguna cuenta trae campañas, el enlace está roto aunque el worker termine sin excepción. */
export function classifyAdsSync(logs: string[]): "completed" | "warning" {
  const updated = logs.some((line) => /✅\s.+:\s*[1-9]\d*\s+campañas/.test(line));
  if (updated) return "completed";
  const attempted = logs.some((line) =>
    /campañas|Consultando métricas|Procesando \d+ cuentas|devolvió \d+ cuentas|Sin cuentas|Access Token|❌/.test(line)
  );
  return attempted ? "warning" : "completed";
}

export async function completeAdsSyncLog(
  supabase: SupabaseClient,
  params: {
    platform: AdsSyncPlatform;
    agencyId?: string;
    jobId?: string;
    logMessages: string[];
    status: AdsSyncStatus;
    source: AdsSyncSource;
  },
): Promise<void> {
  const table = params.platform === "google" ? "ads_sync_logs" : "meta_sync_logs";
  const payload = {
    logs: params.logMessages.slice(-50),
    status: params.status,
    source: params.source,
    ...(params.agencyId ? { agency_id: params.agencyId } : {}),
  };

  if (params.jobId) {
    await supabase.from(table).update(payload).eq("id", params.jobId);
    return;
  }

  if (params.agencyId && params.status === "completed") {
    await supabase.from(table).insert(payload);
  }
}
