import { ViewMode } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleOption {
    label: string;
    value: ViewMode;
    icon?: React.ReactNode;
    description?: string;
}

interface ViewToggleProps {
    value: ViewMode;
    onChange: (value: ViewMode) => void;
    options?: ViewToggleOption[];
    disabled?: boolean;
    className?: string;
}

const defaultOptions: ViewToggleOption[] = [
    {
        label: 'Semanal',
        value: 'weekly',
        icon: <Calendar className="h-4 w-4" />,
        description: 'Vista completa de la semana'
    },
    {
        label: 'Modo Zen',
        value: 'daily',
        icon: <Sparkles className="h-4 w-4" />,
        description: 'Enfócate solo en el día de hoy'
    }
];

export function ViewToggle({
    value,
    onChange,
    options = defaultOptions,
    disabled = false,
    className
}: ViewToggleProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn(
                "inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}>
                {options.map((option) => (
                    <Tooltip key={option.value}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={disabled}
                                onClick={() => !disabled && onChange(option.value)}
                                className={cn(
                                    "h-8 px-3 gap-1.5 text-sm font-medium transition-all rounded-md",
                                    value === option.value
                                        ? "bg-white text-primary shadow-sm hover:bg-white"
                                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
                                )}
                            >
                                {option.icon}
                                <span className="hidden sm:inline">{option.label}</span>
                            </Button>
                        </TooltipTrigger>
                        {option.description && (
                            <TooltipContent side="bottom" className="text-xs">
                                {option.description}
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}

interface ViewModeIndicatorProps {
    isStrict: boolean;
    departmentView: ViewMode;
    className?: string;
}

/**
 * Indicador pequeño que muestra cuando la vista está gestionada por la empresa
 * (modo estricto activado por el departamento)
 */
export function ViewModeIndicator({ isStrict, departmentView, className }: ViewModeIndicatorProps) {
    if (!isStrict) return null;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium",
                        className
                    )}>
                        <Lock className="h-3 w-3" />
                        <span>Vista {departmentView === 'daily' ? 'Zen' : 'Semanal'}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    <p>Vista gestionada por tu empresa</p>
                    <p className="text-slate-400 mt-0.5">No puedes cambiar el modo de visualización</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
