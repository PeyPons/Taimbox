import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useDepartmentConfigs } from '@/hooks/useDashboardView';
import { ViewMode } from '@/types';
import { Calendar, Lock, Unlock, Loader2, Settings, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentViewConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departmentName: string;
}

export function DepartmentViewConfigDialog({
    open,
    onOpenChange,
    departmentName
}: DepartmentViewConfigDialogProps) {
    const { getConfigForDepartment, saveDepartmentConfig, isSaving } = useDepartmentConfigs();

    const [defaultView, setDefaultView] = useState<ViewMode>('weekly');
    const [isStrict, setIsStrict] = useState(false);

    // Cargar configuración existente cuando se abre el diálogo
    useEffect(() => {
        if (open && departmentName) {
            const config = getConfigForDepartment(departmentName);
            if (config) {
                setDefaultView(config.defaultView);
                setIsStrict(config.isViewStrict);
            } else {
                setDefaultView('weekly');
                setIsStrict(false);
            }
        }
    }, [open, departmentName, getConfigForDepartment]);

    const handleSave = async () => {
        const success = await saveDepartmentConfig(departmentName, defaultView, isStrict);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Configurar vista: {departmentName}
                    </DialogTitle>
                    <DialogDescription>
                        Define la vista por defecto y las restricciones para este departamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Vista por defecto del equipo</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setDefaultView('weekly')}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border-2 p-4 text-left transition-colors',
                                    defaultView === 'weekly'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                                )}
                            >
                                <Calendar className="h-8 w-8 text-primary shrink-0" />
                                <div>
                                    <span className="font-medium">Mi semana</span>
                                    <span className="text-xs text-slate-500 block">Calendario y carga mensual</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDefaultView('daily')}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border-2 p-4 text-left transition-colors',
                                    defaultView === 'daily'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                                )}
                            >
                                <Sun className="h-8 w-8 text-amber-500 shrink-0" />
                                <div>
                                    <span className="font-medium">Mi día</span>
                                    <span className="text-xs text-slate-500 block">En foco hoy y backlog semanal</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Switch de Estricto */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50">
                            <div className="flex items-center gap-3">
                                {isStrict ? (
                                    <Lock className="h-5 w-5 text-amber-600" />
                                ) : (
                                    <Unlock className="h-5 w-5 text-emerald-600" />
                                )}
                                <div>
                                    <Label className="font-medium cursor-pointer" htmlFor="strict-toggle">
                                        🔒 Forzar esta vista para todos
                                    </Label>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {isStrict
                                            ? "Los empleados NO pueden cambiar su modo de visualización"
                                            : "Los empleados pueden elegir su vista preferida"}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="strict-toggle"
                                checked={isStrict}
                                onCheckedChange={setIsStrict}
                            />
                        </div>

                        {/* Badges de estado */}
                        <div className="flex gap-2 justify-center">
                            <Badge
                                variant={isStrict ? "default" : "secondary"}
                                className={cn(
                                    "text-xs",
                                    isStrict ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : ""
                                )}
                            >
                                {isStrict ? "Modo estricto" : "Modo flexible"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                Vista por defecto: {defaultView === 'daily' ? 'Mi día' : 'Mi semana'}
                            </Badge>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                        <p className="font-medium mb-1">ℹ️ ¿Cómo funciona?</p>
                        <ul className="space-y-1 text-blue-700">
                            <li>• <strong>Flexible:</strong> Sugieres una vista, pero el empleado puede cambiarla.</li>
                            <li>• <strong>Estricto:</strong> Obligas la vista. El selector se oculta al empleado.</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar configuración'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
