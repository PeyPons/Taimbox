import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronDown,
    LayoutDashboard,
    CalendarRange,
    Users,
    BarChart3,
    FolderKanban,
    Plug,
    ArrowRight,
} from 'lucide-react';

const FEATURES = [
    {
        title: 'Dashboard del Empleado',
        href: '/dashboard-empleado',
        description: 'Tu centro de control personal',
        badge: 'Para empleados',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        icon: LayoutDashboard,
        gradient: 'from-indigo-500 to-purple-500',
    },
    {
        title: 'Planificador de Recursos',
        href: '/planificador-recursos',
        description: 'Visualiza cada hora de tu equipo',
        badge: 'Para directores',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        icon: CalendarRange,
        gradient: 'from-indigo-500 to-blue-500',
    },
    {
        title: 'Gestión de Equipos',
        href: '/gestion-equipos',
        description: 'Horarios, ausencias, capacidad y tiempos en vivo',
        badge: 'Para RRHH',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        icon: Users,
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        title: 'Reportes y Rentabilidad',
        href: '/reportes-rentabilidad',
        description: 'Rentabilidad al céntimo',
        badge: 'Para financieros',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        icon: BarChart3,
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        title: 'Proyectos y Deadlines',
        href: '/control-proyectos',
        description: 'Del briefing al deadline',
        badge: 'Para project managers',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: FolderKanban,
        gradient: 'from-amber-500 to-orange-500',
    },
    {
        title: 'Integraciones',
        href: '/integraciones',
        description: 'Conecta todo tu ecosistema',
        badge: 'Para equipos técnicos',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        icon: Plug,
        gradient: 'from-cyan-500 to-blue-500',
    },
];

export function FeaturesDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    };

    const handleClick = () => setIsOpen(!isOpen);

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger */}
            <button
                onClick={handleClick}
                className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white transition-colors font-medium"
            >
                Funcionalidades
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <div
                className={`absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-3 transition-all duration-300 origin-top ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-900/95 border-l border-t border-white/15 hidden sm:block" />

                <div className="w-[340px] sm:w-[580px] rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 border-b border-white/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">
                            Explora por rol
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Cada funcionalidad diseñada para un perfil específico
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {FEATURES.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Link
                                    key={feature.href}
                                    to={feature.href}
                                    onClick={() => setIsOpen(false)}
                                    className="group flex items-start gap-3 rounded-xl p-3 hover:bg-white/5 transition-all duration-200"
                                >
                                    <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm text-white font-semibold group-hover:text-indigo-200 transition-colors truncate">
                                                {feature.title}
                                            </p>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-snug mb-1">
                                            {feature.description}
                                        </p>
                                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${feature.badgeColor}`}>
                                            {feature.badge}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <Link
                            to="/guia"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-indigo-300 hover:text-white transition-colors font-medium flex items-center gap-1"
                        >
                            Guía técnica completa
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                            to="/por-que-timeboxing"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            ¿Por qué Taimbox?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
