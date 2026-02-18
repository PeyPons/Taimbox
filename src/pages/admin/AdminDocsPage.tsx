import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AdminDocsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documentación interna</h1>
        <p className="text-slate-600 mt-1">
          Procedimientos y referencia para el equipo de administración de plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Agencias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p><strong>Suspender una agencia:</strong> En Admin → Agencias, localiza la agencia y cambia el estado a &quot;Suspendida&quot;. Los usuarios de esa agencia serán redirigidos a /suspended al iniciar sesión.</p>
          <p><strong>Reactivar:</strong> Cambia el estado a &quot;Activa&quot; desde el mismo listado.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Soporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p><strong>Tickets:</strong> Los usuarios envían solicitudes desde Configuración → Contactar soporte. En Admin → Soporte puedes listar tickets, ver detalle (botón Ver), añadir comentarios internos y cambiar estado (Abierto / En curso / Cerrado).</p>
          <p><strong>Crear ticket en nombre de una agencia:</strong> Usa el botón &quot;Nuevo ticket&quot;, selecciona la agencia y rellena asunto y mensaje.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p><strong>Métricas:</strong> Admin → Métricas muestra totales de agencias (activas/suspendidas), empleados, usuarios con agencia y tickets de soporte.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Administradores de plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>En <strong>Admin → Administradores</strong> puedes listar quién tiene acceso al panel /admin, <strong>añadir</strong> un nuevo administrador por email (si ya existe) o <strong>crear una cuenta nueva</strong> indicando email y contraseña, y <strong>quitar</strong> acceso. No se puede quitar al último admin. Estos usuarios no están vinculados a ninguna agencia.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Acceso admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Solo los usuarios incluidos en la tabla <code className="bg-slate-100 px-1 rounded">platform_admins</code> pueden acceder al área /admin. El primer admin se añade insertando su <code className="bg-slate-100 px-1 rounded">auth.users.id</code> en <code className="bg-slate-100 px-1 rounded">platform_admins</code> (SQL o Dashboard). El resto de rutas de la app usan permisos por rol y agencia (user_agencies, employees).</p>
        </CardContent>
      </Card>
    </div>
  );
}
