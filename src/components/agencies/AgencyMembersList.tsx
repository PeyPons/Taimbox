import { useState, useMemo } from 'react';
import { useAgency, AgencyMember } from '@/contexts/AgencyContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Trash2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditMemberDialog } from './EditMemberDialog';

interface AgencyMembersListProps {
  members: AgencyMember[];
  onEdit: (member: AgencyMember) => void;
  onDelete: (member: AgencyMember) => void;
  isLoading?: boolean;
}

export function AgencyMembersList({ members, onEdit, onDelete, isLoading }: AgencyMembersListProps) {
  const { currentAgency } = useAgency();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Obtener roles y departamentos únicos para filtros
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    members.forEach(m => {
      if (m.role) roles.add(m.role);
    });
    return Array.from(roles).sort();
  }, [members]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    members.forEach(m => {
      if (m.department) depts.add(m.department);
    });
    return Array.from(depts).sort();
  }, [members]);

  // Filtrar miembros
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Búsqueda por nombre o email
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(query);
        const matchesEmail = member.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Filtro por rol
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      // Filtro por departamento
      if (departmentFilter !== 'all' && member.department !== departmentFilter) {
        return false;
      }

      // Filtro por estado
      if (statusFilter === 'active' && !member.isActive) return false;
      if (statusFilter === 'inactive' && member.isActive) return false;
      if (statusFilter === 'admin' && !member.isAdmin) return false;

      return true;
    });
  }, [members, searchQuery, roleFilter, departmentFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando miembros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {availableRoles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {availableDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de miembros */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
          <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No se encontraron miembros</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros'
              : 'Aún no hay miembros en esta agencia'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{member.name}</span>
                      {member.email && (
                        <span className="text-xs text-slate-500">{member.email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.role ? (
                      <Badge variant="outline" className="font-normal">
                        {member.role}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-sm">Sin rol</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.department ? (
                      <span className="text-sm text-slate-600">{member.department}</span>
                    ) : (
                      <span className="text-slate-400 text-sm">Sin departamento</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={member.isActive ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs',
                          !member.isActive && 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {member.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {member.isAdmin && (
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(member)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(member)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Resumen */}
      <div className="text-sm text-slate-500">
        Mostrando {filteredMembers.length} de {members.length} miembros
      </div>
    </div>
  );
}

