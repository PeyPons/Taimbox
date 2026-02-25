import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { ViewMode, DepartmentConfig } from '@/types';
import { toast } from 'sonner';

interface DepartmentConfigRow {
    id: string;
    agency_id: string;
    department_name: string;
    default_view: ViewMode;
    is_view_strict: boolean;
}

/**
 * Hook para gestionar la vista del dashboard con control de rigidez.
 * 
 * Lógica de prioridad:
 * 1. Si el Departamento es ESTRICTO -> Devuelve la vista del departamento (Ignora al usuario).
 * 2. Si NO es estricto y el Usuario tiene preferencia -> Devuelve preferencia de usuario.
 * 3. Si no hay preferencia -> Devuelve la vista del departamento.
 * 4. Fallback -> 'weekly'.
 */
export function useDashboardView() {
    const { currentUser, updateEmployee } = useApp();
    const { currentAgency } = useAgency();

    // State para la configuración del departamento del usuario actual
    const [departmentConfig, setDepartmentConfig] = useState<DepartmentConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Estado local para cambio inmediato de vista (override temporal)
    const [localViewOverride, setLocalViewOverride] = useState<ViewMode | null>(null);

    // Cargar configuración del departamento
    const loadDepartmentConfig = useCallback(async () => {
        if (!currentAgency?.id || !currentUser?.department) {
            setDepartmentConfig(null);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('department_config')
                .select('*')
                .eq('agency_id', currentAgency.id)
                .eq('department_name', currentUser.department)
                .limit(1);

            if (error) {
                console.error('[useDashboardView] Error loading department config:', error);
            }

            if (data && data.length > 0) {
                const row = data[0] as DepartmentConfigRow;
                setDepartmentConfig({
                    id: row.id,
                    agencyId: row.agency_id,
                    departmentName: row.department_name,
                    defaultView: row.default_view,
                    isViewStrict: row.is_view_strict
                });
            } else {
                setDepartmentConfig(null);
            }
        } catch (error) {
            console.error('[useDashboardView] Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentAgency?.id, currentUser?.department]);

    // Cargar configuración al montar o cuando cambie el departamento
    useEffect(() => {
        loadDepartmentConfig();
    }, [loadDepartmentConfig]);

    // Sincronizar override local con el valor del usuario cuando se carga
    useEffect(() => {
        if (currentUser?.preferredView && !localViewOverride) {
            setLocalViewOverride(currentUser.preferredView);
        }
    }, [currentUser?.preferredView]);

    // Estado derivado (modo Zen/daily eliminado: convertir a weekly; kanban pasa limpio)
    const isStrict = departmentConfig?.isViewStrict ?? false;
    const deptViewRaw = departmentConfig?.defaultView ?? 'weekly';
    const deptView: ViewMode = deptViewRaw === 'daily' ? 'weekly' : deptViewRaw;
    const userViewRaw = localViewOverride || currentUser?.preferredView;
    const userView: ViewMode | null = userViewRaw === 'daily' ? 'weekly' : userViewRaw;

    // Siempre vista semanal (modo Zen eliminado)
    const activeView: ViewMode = useMemo(() => {
        if (isStrict) return deptView;
        return userView || deptView;
    }, [isStrict, deptView, userView]);

    const showToggle = false;

    // Función para cambiar la preferencia del usuario
    const setView = useCallback(async (newView: ViewMode) => {
        if (!currentUser || isStrict || isSaving) return;

        // Cambio inmediato local (optimistic update)
        setLocalViewOverride(newView);
        setIsSaving(true);

        try {
            // Actualizar en la base de datos
            const { error } = await supabase
                .from('employees')
                .update({ preferred_view: newView })
                .eq('id', currentUser.id);

            if (error) throw error;

            // Actualizar en el contexto local (background)
            if (updateEmployee) {
                updateEmployee({
                    ...currentUser,
                    preferredView: newView
                }).catch(console.error);
            }

            toast.success('Vista semanal activada');
        } catch (error) {
            console.error('[useDashboardView] Error updating view preference:', error);
            toast.error('Error al guardar la preferencia de vista');
            // Revertir el cambio local si falla
            setLocalViewOverride(currentUser.preferredView || null);
        } finally {
            setIsSaving(false);
        }
    }, [currentUser, isStrict, isSaving, updateEmployee]);

    return {
        // Vista activa calculada
        activeView,
        // Si mostrar el toggle de cambio de vista
        showToggle,
        // Función para cambiar la vista del usuario
        setView,
        // Si está cargando la configuración
        isLoading,
        // Si está guardando cambios
        isSaving,
        // Configuración del departamento actual
        departmentConfig,
        // Si el modo es estricto
        isStrict,
        // Vista por defecto del departamento
        departmentDefaultView: deptView,
        // Recargar la configuración
        refreshConfig: loadDepartmentConfig
    };
}

/**
 * Hook para gestionar TODAS las configuraciones de departamentos de una agencia.
 * Usado en la pantalla de configuración del admin.
 */
export function useDepartmentConfigs() {
    const { currentAgency } = useAgency();

    const [configs, setConfigs] = useState<DepartmentConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Cargar todas las configuraciones de departamentos
    const loadConfigs = useCallback(async () => {
        if (!currentAgency?.id) {
            setConfigs([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('department_config')
                .select('*')
                .eq('agency_id', currentAgency.id);

            if (error) {
                console.error('[useDepartmentConfigs] Error loading configs:', error);
                setConfigs([]);
                return;
            }

            const mappedConfigs: DepartmentConfig[] = (data || []).map((row: DepartmentConfigRow) => ({
                id: row.id,
                agencyId: row.agency_id,
                departmentName: row.department_name,
                defaultView: row.default_view,
                isViewStrict: row.is_view_strict
            }));

            setConfigs(mappedConfigs);
        } catch (error) {
            console.error('[useDepartmentConfigs] Error:', error);
            setConfigs([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentAgency?.id]);

    // Cargar al montar
    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    // Obtener config de un departamento
    const getConfigForDepartment = useCallback((departmentName: string) => {
        return configs.find(c => c.departmentName === departmentName) || null;
    }, [configs]);

    // Guardar o actualizar configuración de un departamento
    const saveDepartmentConfig = useCallback(async (
        departmentName: string,
        defaultView: ViewMode,
        isViewStrict: boolean
    ): Promise<boolean> => {
        if (!currentAgency?.id) return false;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('department_config')
                .upsert({
                    agency_id: currentAgency.id,
                    department_name: departmentName,
                    default_view: defaultView,
                    is_view_strict: isViewStrict
                }, {
                    onConflict: 'agency_id,department_name'
                });

            if (error) throw error;

            // Recargar configs
            await loadConfigs();
            return true;
        } catch (error) {
            console.error('[useDepartmentConfigs] Error saving config:', error);
            toast.error('Error al guardar la configuración del departamento');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [currentAgency?.id, loadConfigs]);

    // Eliminar configuración de un departamento
    const deleteDepartmentConfig = useCallback(async (departmentName: string): Promise<boolean> => {
        if (!currentAgency?.id) return false;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('department_config')
                .delete()
                .eq('agency_id', currentAgency.id)
                .eq('department_name', departmentName);

            if (error) throw error;

            // Recargar configs
            await loadConfigs();
            return true;
        } catch (error) {
            console.error('[useDepartmentConfigs] Error deleting config:', error);
            toast.error('Error al eliminar la configuración');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [currentAgency?.id, loadConfigs]);

    return {
        configs,
        isLoading,
        isSaving,
        getConfigForDepartment,
        saveDepartmentConfig,
        deleteDepartmentConfig,
        refreshConfigs: loadConfigs
    };
}
