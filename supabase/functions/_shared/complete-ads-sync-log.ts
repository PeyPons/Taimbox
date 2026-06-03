import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AdsSyncPlatform = "google" | "meta";
export type AdsSyncSource = "manual" | "cron";
export type AdsSyncStatus = "completed" | "error" | "running";

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
