import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  X, ChevronLeft, ChevronRight, Calendar, Edit, Check,
  Sparkles, CheckCircle2, Clock, Link, LayoutGrid,
  ArrowUpDown, MousePointerClick, Palette
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
    icon: <Sparkles className="w-6 h-6 text-white" />,
    position: 'center'
  },
  {
    id: 'view-toggle',
    target: '[data-tour="planner-view-toggle"]',
    title: 'Cambiar vista',
    description: 'Alterna entre la vista semanal (tareas de una semana) y la vista mensual (todas las semanas del mes). En vista mensual puedes expandir o colapsar cada proyecto para ver sus tareas.',
    icon: <LayoutGrid className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'week-nav',
    target: '[data-tour="planner-week-nav"]',
    title: 'Navegar entre semanas',
    description: 'Cambia de semana para ver tareas pasadas o planificar la siguiente. Las flechas te llevan a la semana anterior o siguiente dentro del mes.',
    icon: <Calendar className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'project-list',
    target: '[data-tour="planner-projects"]',
    title: 'Tus proyectos',
    description: 'Cada proyecto muestra un resumen: horas estimadas, reales y computadas, y el estado de las horas contratadas. Los colores indican si vas bien (verde), ajustado (amarillo) o pasado (rojo). Haz clic en un proyecto para ver el detalle.',
    icon: <Palette className="w-6 h-6 text-white" />,
    position: 'right',
    highlight: true
  },
  {
    id: 'task-row',
    target: '[data-tour="planner-task"]',
    title: 'Tus tareas',
    description: 'Cada tarea muestra: nombre, horas planificadas, computadas y si tiene dependencias. Los íconos de colores te indican el estado.',
    icon: <Check className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'inline-edit',
    target: '[data-tour="planner-task-name"]',
    title: 'Edición rápida',
    description: 'Haz doble clic en el nombre de cualquier tarea para editarlo directamente. Pulsa Enter para guardar o Escape para cancelar. ¡Pruébalo cuando termines el tour!',
    icon: <MousePointerClick className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'checkbox-complete',
    target: '[data-tour="planner-checkbox"]',
    title: 'Marcar completado',
    description: 'Marca la casilla para indicar que una tarea está terminada. La tarea bajará al final de la lista después de unos segundos, dándote tiempo para ajustar las horas computadas.',
    icon: <CheckCircle2 className="w-6 h-6 text-white" />,
    position: 'right',
    highlight: true
  },
  {
    id: 'hours-input',
    target: '[data-tour="planner-hours"]',
    title: 'Registrar horas',
    description: 'Introduce las horas planificadas y computadas (reales). El sistema calcula automáticamente los totales y te avisa si te pasas de las horas contratadas.',
    icon: <Clock className="w-6 h-6 text-white" />,
    position: 'left',
    highlight: true
  },
  {
    id: 'dependencies',
    target: '[data-tour="planner-dependency"]',
    title: 'Dependencias',
    description: 'Si una tarea depende de otra, verás un mensaje indicando de quién esperas. Si tú bloqueas a alguien, aparecerá "te espera" con su nombre.',
    icon: <Link className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'sort-options',
    target: '[data-tour="planner-sort"]',
    title: 'Vistas y orden',
    description: 'Abre el menú "Vistas" para ordenar proyectos por horas contratadas o por tus horas, y activar "Proyectos expandidos" para ver todas las tareas desplegadas por defecto.',
    icon: <ArrowUpDown className="w-6 h-6 text-white" />,
    position: 'bottom',
    highlight: true
  },
  {
    id: 'add-task',
    target: '[data-tour="planner-add-task"]',
    title: 'Añadir tarea',
    description: 'Usa el botón + para añadir una nueva tarea al proyecto. Puedes especificar nombre, horas, semana y si depende de otra tarea.',
    icon: <Edit className="w-6 h-6 text-white" />,
    position: 'left',
    highlight: true
  },
  {
    id: 'finish',
    target: 'body',
    title: '¡Listo para planificar! 🚀',
    description: '',
    icon: <CheckCircle2 className="w-6 h-6 text-white" />,
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
  onVisibilityChange?: (visible: boolean) => void;
}

export function PlannerTour({ onComplete, forceShow = false, onVisibilityChange }: PlannerTourProps) {
  const { currentUser, updateEmployee } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  // Notificar cambios de visibilidad al padre
  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPos, setHighlightPos] = useState<HighlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasBeenCompleted, setHasBeenCompleted] = useState(false);
  const lastCheckedUserIdRef = React.useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

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

    // Primer cálculo después del scroll
    const timer1 = setTimeout(() => {
      calculatePositions();
    }, 500);

    // Segundo cálculo para asegurar precisión después de animaciones
    const timer2 = setTimeout(() => {
      calculatePositions();
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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

  // Handler para capturar clics en el overlay (ya no cierra nada, solo bloquea propagación)
  // IMPORTANTE: Debe estar ANTES del return condicional para cumplir reglas de hooks
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // No hacemos nada más - el Sheet ya tiene onInteractOutside para prevenir cierre
  }, []);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const isCentered = step.position === 'center' || !highlightPos;

  // Renderizamos en un portal igual que WelcomeTour para mejor posicionamiento
  const tourContent = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
      {/* Overlay SVG con spotlight - mismo enfoque que WelcomeTour */}
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'auto'
        }}
        onClick={handleOverlayClick}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="planner-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightPos && isReady && (
              <rect
                x={highlightPos.left - 2}
                y={highlightPos.top - 2}
                width={highlightPos.width + 4}
                height={highlightPos.height + 4}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#planner-tour-spotlight-mask)"
        />
      </svg>

      {/* Borde del highlight con animación */}
      {highlightPos && isReady && (
        <div
          style={{
            position: 'fixed',
            top: highlightPos.top - 2,
            left: highlightPos.left - 2,
            width: highlightPos.width + 4,
            height: highlightPos.height + 4,
            border: '3px solid #818cf8',
            borderRadius: '10px',
            boxShadow: '0 0 0 4px rgba(129, 140, 248, 0.3), 0 0 20px rgba(129, 140, 248, 0.4)',
            pointerEvents: 'none',
            zIndex: 100000
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '10px',
              border: '2px solid #a5b4fc',
              animation: 'planner-tour-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: 0.3
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      {isReady && (
        <Card
          className="shadow-2xl border-0 overflow-hidden"
          ref={cardRef}
          style={{
            position: 'fixed',
            width: 360,
            top: isCentered ? '50%' : tooltipPos?.top,
            left: isCentered ? '50%' : tooltipPos?.left,
            transform: isCentered ? 'translate(-50%, -50%)' : undefined,
            zIndex: 100001,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
                    <span>Los colores te indican el estado de las horas contratadas</span>
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
                    className="bg-primary hover:bg-primary/90 h-8 px-4"
                    onClick={(e) => { e.stopPropagation(); if (isLastStep) handleComplete(); else handleNext(); }}
                  >
                    {isLastStep ? '¡Listo!' : 'Siguiente'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Estilos de animación */}
      <style>{`
        @keyframes planner-tour-ping {
          75%, 100% {
            transform: scale(1.05);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );

  // Usar portal para renderizar fuera del árbol DOM del Sheet
  return createPortal(tourContent, document.body);
}

