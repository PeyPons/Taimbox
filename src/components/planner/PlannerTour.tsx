import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, ChevronLeft, ChevronRight, Calendar, Edit, Check, 
  Sparkles, CheckCircle2, Clock, Link, LayoutGrid,
  FoldVertical, ArrowUpDown, MousePointerClick, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
  customContent?: boolean;
  interactive?: boolean; // Indica si el usuario debe interactuar
  interactionHint?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: '¡Bienvenido al Planificador! 📋',
    description: 'Aquí organizas tus tareas de forma visual. Podrás ver qué tienes pendiente, marcar como completado y gestionar tu tiempo eficientemente.',
    icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
    position: 'center'
  },
  {
    id: 'view-toggle',
    target: '[data-tour="planner-view-toggle"]',
    title: 'Cambiar vista',
    description: 'Alterna entre la vista semanal (tareas de una semana) y mensual (todas las tareas del mes en una tabla compacta). Cada vista tiene sus ventajas.',
    icon: <LayoutGrid className="w-6 h-6 text-indigo-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'month-navigator',
    target: '[data-tour="planner-month-nav"]',
    title: 'Navegar entre meses',
    description: 'Cambia de mes para ver tareas pasadas o planificar el futuro. Las flechas te llevan al mes anterior o siguiente.',
    icon: <Calendar className="w-6 h-6 text-blue-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'project-list',
    target: '[data-tour="planner-projects"]',
    title: 'Tus proyectos',
    description: 'Cada proyecto muestra un resumen: horas asignadas, computadas, planificadas y el estado del presupuesto. Los colores te indican si vas bien (verde), ajustado (amarillo) o pasado (rojo).',
    icon: <Palette className="w-6 h-6 text-purple-500" />,
    position: 'right',
    highlight: true
  },
  {
    id: 'collapse-expand',
    target: '[data-tour="planner-collapse"]',
    title: 'Expandir/Colapsar',
    description: 'Haz clic en un proyecto para ver sus tareas. Usa el botón de expandir/colapsar todo para gestionar la vista rápidamente.',
    icon: <FoldVertical className="w-6 h-6 text-slate-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'task-row',
    target: '[data-tour="planner-task"]',
    title: 'Tus tareas',
    description: 'Cada tarea muestra: nombre, horas planificadas, computadas y si tiene dependencias. Los íconos de colores te indican el estado.',
    icon: <Check className="w-6 h-6 text-emerald-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'inline-edit',
    target: '[data-tour="planner-task-name"]',
    title: 'Edición rápida',
    description: 'Haz doble clic en el nombre de cualquier tarea para editarlo directamente. Pulsa Enter para guardar o Escape para cancelar.',
    icon: <MousePointerClick className="w-6 h-6 text-amber-500" />,
    position: 'bottom',
    highlight: true,
    interactive: true,
    interactionHint: '💡 Prueba: haz doble clic en el nombre de una tarea'
  },
  {
    id: 'checkbox-complete',
    target: '[data-tour="planner-checkbox"]',
    title: 'Marcar completado',
    description: 'Marca la casilla para indicar que una tarea está terminada. La tarea bajará al final de la lista después de unos segundos, dándote tiempo para ajustar las horas computadas.',
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
    position: 'right',
    highlight: true
  },
  {
    id: 'hours-input',
    target: '[data-tour="planner-hours"]',
    title: 'Registrar horas',
    description: 'Introduce las horas planificadas y computadas (reales). El sistema calcula automáticamente los totales y te avisa si te pasas del presupuesto.',
    icon: <Clock className="w-6 h-6 text-blue-500" />,
    position: 'left',
    highlight: true
  },
  {
    id: 'dependencies',
    target: '[data-tour="planner-dependency"]',
    title: 'Dependencias',
    description: 'Si una tarea depende de otra, verás un mensaje indicando de quién esperas. Si tú bloqueas a alguien, aparecerá "te espera" con su nombre.',
    icon: <Link className="w-6 h-6 text-orange-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'sort-options',
    target: '[data-tour="planner-sort"]',
    title: 'Ordenar proyectos',
    description: 'Ordena los proyectos por presupuesto usado, tus horas o nombre. Encuentra rápidamente lo más urgente o lo que más tiempo te lleva.',
    icon: <ArrowUpDown className="w-6 h-6 text-slate-500" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'add-task',
    target: '[data-tour="planner-add-task"]',
    title: 'Añadir tarea',
    description: 'Usa el botón + para añadir una nueva tarea al proyecto. Puedes especificar nombre, horas, semana y si depende de otra tarea.',
    icon: <Edit className="w-6 h-6 text-indigo-500" />,
    position: 'left',
    highlight: true
  },
  {
    id: 'finish',
    target: 'body',
    title: '¡Listo para planificar! 🚀',
    description: '',
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
    position: 'center',
    customContent: true
  }
];

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PlannerTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function PlannerTour({ onComplete, forceShow = false }: PlannerTourProps) {
  const { currentUser, updateEmployee } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPos, setHighlightPos] = useState<HighlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasBeenCompleted, setHasBeenCompleted] = useState(false);
  const lastCheckedUserIdRef = React.useRef<string | null>(null);

  // Verificar si debe mostrarse
  useEffect(() => {
    const completedInLocalStorage = localStorage.getItem('timeboxing_planner_tour_completed') === 'true';
    if (completedInLocalStorage) {
      setIsVisible(false);
      return;
    }

    if (hasBeenCompleted) {
      setIsVisible(false);
      return;
    }

    if (forceShow) {
      localStorage.removeItem('timeboxing_planner_tour_completed');
      setHasBeenCompleted(false);
      lastCheckedUserIdRef.current = null;
      setIsVisible(true);
      setCurrentStep(0);
      return;
    }

    if (currentUser === undefined) return;
    if (!currentUser) {
      lastCheckedUserIdRef.current = null;
      return;
    }

    const completedInDB = currentUser.plannerTourCompleted === true;
    if (completedInDB) {
      setIsVisible(false);
      localStorage.setItem('timeboxing_planner_tour_completed', 'true');
      lastCheckedUserIdRef.current = currentUser.id;
      return;
    }

    if (lastCheckedUserIdRef.current === currentUser.id) return;
    lastCheckedUserIdRef.current = currentUser.id;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800); // Un poco más de delay para que cargue el contenido del sheet
    return () => clearTimeout(timer);
  }, [forceShow, currentUser, hasBeenCompleted]);

  const calculatePositions = useCallback(() => {
    const step = tourSteps[currentStep];
    
    if (step.position === 'center' || !step.highlight) {
      setHighlightPos(null);
      setTooltipPos(null);
      setIsReady(true);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      // Si no existe el elemento, saltar al siguiente paso
      setHighlightPos(null);
      setTooltipPos(null);
      setIsReady(true);
      return;
    }

    const rect = element.getBoundingClientRect();
    
    const padding = 6;
    setHighlightPos({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    });

    const tooltipWidth = 360;
    const tooltipHeight = 280;
    const gap = 16;
    
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setTooltipPos({ top, left });
    setIsReady(true);
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;

    setIsReady(false);
    const step = tourSteps[currentStep];

    if (step.position === 'center' || !step.highlight) {
      calculatePositions();
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      calculatePositions();
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timer = setTimeout(() => {
      calculatePositions();
    }, 400);

    return () => clearTimeout(timer);
  }, [currentStep, isVisible, calculatePositions]);

  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => calculatePositions();
    const handleScroll = () => calculatePositions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, calculatePositions]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    setIsVisible(false);
    setHasBeenCompleted(true);
    localStorage.setItem('timeboxing_planner_tour_completed', 'true');

    if (currentUser) {
      try {
        await supabase
          .from('employees')
          .update({ planner_tour_completed: true })
          .eq('id', currentUser.id);
        
        updateEmployee({ ...currentUser, plannerTourCompleted: true });
      } catch (error) {
        console.error('Error guardando estado del tour:', error);
      }
    }

    onComplete?.();
  }, [currentUser, updateEmployee, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleNext, handlePrev, handleSkip]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Renderizamos directamente sin portal
  return (
    <div className="fixed inset-0" style={{ zIndex: 999999, pointerEvents: 'none' }}>
      {/* Overlay oscuro - 4 partes para permitir interacción con elemento destacado */}
      {highlightPos ? (
        <>
          {/* Arriba */}
          <div 
            className="absolute left-0 right-0 top-0 bg-black/60"
            style={{ height: highlightPos.top, pointerEvents: 'auto' }}
            onClick={handleSkip}
          />
          {/* Izquierda */}
          <div 
            className="absolute left-0 bg-black/60"
            style={{ 
              top: highlightPos.top, 
              width: highlightPos.left, 
              height: highlightPos.height,
              pointerEvents: 'auto'
            }}
            onClick={handleSkip}
          />
          {/* Derecha */}
          <div 
            className="absolute right-0 bg-black/60"
            style={{ 
              top: highlightPos.top, 
              left: highlightPos.left + highlightPos.width, 
              height: highlightPos.height,
              pointerEvents: 'auto'
            }}
            onClick={handleSkip}
          />
          {/* Abajo */}
          <div 
            className="absolute left-0 right-0 bottom-0 bg-black/60"
            style={{ top: highlightPos.top + highlightPos.height, pointerEvents: 'auto' }}
            onClick={handleSkip}
          />
          {/* Borde brillante */}
          <div 
            className="absolute rounded-lg ring-4 ring-indigo-400 ring-opacity-80 transition-all duration-300"
            style={{
              top: highlightPos.top,
              left: highlightPos.left,
              width: highlightPos.width,
              height: highlightPos.height,
              pointerEvents: 'none'
            }}
          />
        </>
      ) : (
        /* Sin elemento destacado - overlay completo */
        <div 
          className="absolute inset-0 bg-black/60"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        />
      )}

      {/* Tooltip */}
      <Card 
        className={cn(
          "absolute p-0 shadow-2xl border-0 overflow-hidden transition-all duration-300",
          !isReady && "opacity-0",
          step.position === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={{
          width: 360,
          zIndex: 1000000,
          pointerEvents: 'auto',
          ...(step.position !== 'center' && tooltipPos ? { top: tooltipPos.top, left: tooltipPos.left } : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {step.icon}
              </div>
              <h3 className="font-bold text-lg">{step.title}</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleSkip(); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 bg-white">
          {step.customContent && isLastStep ? (
            <div className="space-y-4">
              <p className="text-slate-600">
                Ya conoces las herramientas del planificador. Recuerda:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Doble clic para editar nombres rápidamente</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Los colores te indican el estado del presupuesto</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Las tareas completadas bajan automáticamente</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Puedes ver las dependencias con compañeros</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              >
                ¡Empezar a planificar!
              </Button>
            </div>
          ) : (
            <>
              <p className="text-slate-600 leading-relaxed mb-4">
                {step.description}
              </p>
              {step.interactive && step.interactionHint && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 font-medium">
                    {step.interactionHint}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con navegación */}
        {!step.customContent && (
          <div className="px-4 pb-4 pt-2 bg-white border-t">
            <div className="flex items-center justify-between gap-4">
              {/* Indicador de paso */}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {currentStep + 1} / {tourSteps.length}
              </span>
              
              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleSkip(); }} 
                  className="text-slate-400 hover:text-slate-600 h-8 px-2"
                >
                  Saltar
                </Button>
                {!isFirstStep && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 h-8 px-4"
                  onClick={(e) => { e.stopPropagation(); isLastStep ? handleComplete() : handleNext(); }}
                >
                  {isLastStep ? '¡Listo!' : 'Siguiente'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

