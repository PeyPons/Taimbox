import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Pause, Play, LogIn } from "lucide-react";
import { toast } from "sonner";

interface AgencyRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  setup_completed: boolean;
  created_at: string;
  employees_count: number;
  projects_count: number;
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_agencies", {
        p_search: search || null,
        p_status: statusFilter === "all" ? null : statusFilter,
      });
      if (error) throw error;
      setAgencies((data as AgencyRow[]) || []);
    } catch (e: unknown) {
      console.error("[AdminAgenciesPage] Error listing agencies:", e);
      toast.error("Error al cargar agencias");
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const updateStatus = async (agencyId: string, newStatus: "active" | "suspended") => {
    setUpdatingId(agencyId);
    try {
      const { error } = await supabase.rpc("admin_update_agency_status", {
        p_agency_id: agencyId,
        p_status: newStatus,
      });
      if (error) throw error;
      toast.success(newStatus === "suspended" ? "Agencia suspendida" : "Agencia reactivada");
      setAgencies((prev) =>
        prev.map((a) => (a.id === agencyId ? { ...a, status: newStatus } : a))
      );
    } catch (e: unknown) {
      console.error("[AdminAgenciesPage] Error updating status:", e);
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const accessAsAgency = async (agencyId: string) => {
    setImpersonatingId(agencyId);
    try {
      const { error } = await supabase.rpc("admin_impersonate_agency", {
        p_agency_id: agencyId,
      });
      if (error) throw error;
      toast.success("Redirigiendo a la app con la agencia seleccionada");
      window.location.href = `/dashboard?agency=${agencyId}`;
    } catch (e: unknown) {
      console.error("[AdminAgenciesPage] Error accediendo como agencia:", e);
      toast.error("No se pudo acceder como esta agencia");
      setImpersonatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de agencias</h1>
        <p className="text-slate-600 mt-1">
          Listado y estado de agencias. Suspender bloquea el acceso sin borrar datos.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="suspended">Suspendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAgencies} disabled={loading}>
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : agencies.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay agencias que coincidan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead>Proyectos</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-medium">{agency.name}</TableCell>
                    <TableCell className="text-slate-600">{agency.slug}</TableCell>
                    <TableCell>
                      <Badge variant={agency.status === "suspended" ? "destructive" : "default"}>
                        {agency.status === "suspended" ? "Suspendida" : "Activa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agency.setup_completed ? (
                        <span className="text-green-600">Completado</span>
                      ) : (
                        <span className="text-amber-600">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>{agency.employees_count}</TableCell>
                    <TableCell>{agency.projects_count}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(agency.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1"
                          onClick={() => accessAsAgency(agency.id)}
                          disabled={impersonatingId === agency.id}
                          title="Ver la app como si fueras de esta agencia"
                        >
                          {impersonatingId === agency.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogIn className="h-4 w-4" />
                              Entrar
                            </>
                          )}
                        </Button>
                        {agency.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(agency.id, "active")}
                            disabled={updatingId === agency.id}
                          >
                            {updatingId === agency.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Reactivar
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => updateStatus(agency.id, "suspended")}
                            disabled={updatingId === agency.id}
                          >
                            {updatingId === agency.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Suspender
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
