import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListTodo, Trash2, Plus, Clock, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RoutineManagerDialogProps {
    children?: React.ReactNode;
}

export function RoutineManagerDialog({ children }: RoutineManagerDialogProps) {
    const { userRoutines, addRoutine, deleteRoutine, toggleRoutine, employees } = useApp();
    const { user } = useAuth();

    // Identificar empleado actual
    const currentEmployee = employees.find(e => e.user_id === user?.id || e.email === user?.email);
    const myRoutines = userRoutines.filter(r => r.employeeId === currentEmployee?.id);

    const [newTitle, setNewTitle] = useState('');
    const [newMinutes, setNewMinutes] = useState('30');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newTitle.trim() || !currentEmployee) return;
        setIsAdding(true);
        try {
            await addRoutine({
                employeeId: currentEmployee.id,
                title: newTitle,
                estimatedMinutes: parseInt(newMinutes) || 30,
                isActive: true,
                projectId: undefined // Usará default o null
            });
            setNewTitle('');
            toast.success("Rutina añadida");
        } catch (e) {
            console.error(e);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <ListTodo className="h-4 w-4" />
                        Mis Rutinas
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-indigo-500" />
                        Configurar Rutinas Diarias
                    </DialogTitle>
                    <DialogDescription>
                        Estas tareas se generarán automáticamente cada día para ti.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Lista */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {myRoutines.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-8 italic border border-dashed rounded-lg">
                                No tienes rutinas configuradas.
                            </p>
                        ) : (
                            myRoutines.map(routine => (
                                <div key={routine.id} className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                    routine.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
                                )}>
                                    <button
                                        onClick={() => toggleRoutine(routine.id)}
                                        className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                                            routine.isActive ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-slate-400 bg-slate-200 hover:bg-slate-300"
                                        )}
                                        title={routine.isActive ? "Desactivar" : "Activar"}
                                    >
                                        <Power className="h-4 w-4" />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{routine.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            {routine.estimatedMinutes} min
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => deleteRoutine(routine.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Añadir Nueva */}
                    <div className="flex items-end gap-2 pt-4 border-t">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Nueva Rutina</label>
                            <Input
                                placeholder="Ej: Revisar emails"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div className="w-24 space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Minutos</label>
                            <Input
                                type="number"
                                value={newMinutes}
                                onChange={(e) => setNewMinutes(e.target.value)}
                                min="5"
                                step="5"
                            />
                        </div>
                        <Button onClick={handleAdd} disabled={isAdding || !newTitle.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
