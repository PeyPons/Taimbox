import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Users, MessageSquare } from "lucide-react";
import { toast } from "@/lib/notify";

interface PlatformMetrics {
  total_agencies: number;
  active_agencies: number;
  suspended_agencies: number;
  total_employees: number;
  total_users_with_agency: number;
  support_tickets_open: number;
  support_tickets_in_progress: number;
  support_tickets_closed: number;
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("admin_platform_metrics");
        if (cancelled) return;
        if (error) throw error;
        setMetrics(data as PlatformMetrics);
      } catch (e) {
        if (!cancelled) {
          console.error("[AdminMetricsPage] Error:", e);
          toast.error("Error al cargar métricas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-slate-500">
        No se pudieron cargar las métricas.
      </div>
    );
  }

  const cards = [
    {
      title: "Agencias",
      icon: Building2,
      items: [
        { label: "Total", value: metrics.total_agencies },
        { label: "Activas", value: metrics.active_agencies },
        { label: "Suspendidas", value: metrics.suspended_agencies },
      ],
    },
    {
      title: "Usuarios y empleados",
      icon: Users,
      items: [
        { label: "Empleados (total)", value: metrics.total_employees },
        { label: "Usuarios con agencia", value: metrics.total_users_with_agency },
      ],
    },
    {
      title: "Tickets de soporte",
      icon: MessageSquare,
      items: [
        { label: "Abiertos", value: metrics.support_tickets_open },
        { label: "En curso", value: metrics.support_tickets_in_progress },
        { label: "Cerrados", value: metrics.support_tickets_closed },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Métricas de plataforma</h1>
        <p className="text-slate-600 mt-1">
          Resumen de agencias, usuarios y tickets de soporte.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ title, icon: Icon, items }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items.map(({ label, value }) => (
                  <li key={label} className="flex justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium tabular-nums">{value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
