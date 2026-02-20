import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Calendar, ArrowRight, ArrowLeft, Clock, DollarSign, Target, Users,
    BarChart3, LayoutDashboard, CalendarRange, FolderKanban, Plug,
    TrendingUp, AlertTriangle, CheckCircle2, Zap, Shield, PieChart,
    Timer, ChevronLeft, ChevronRight, Sparkles, Building2, Eye, Layers,
    Table2, Mail, Gauge, FileText,
} from 'lucide-react';

import { Helmet } from 'react-helmet-async';
import {
    MockPlanningGrid, MockAllocationSheet, MockDashboard,
    MockTeamCapacity, MockReportsDashboard, MockDeadlines,
    MockIntegrations, MockWeeklyForecast, MockBeforeAfter,
} from '@/components/landing/PresentationMockups';

/* ─── SLIDE INFRASTRUCTURE ─── */

interface SlideProps {
    isActive: boolean;
    direction: 'left' | 'right' | 'none';
}

function SlideWrapper({ isActive, direction, children }: SlideProps & { children: React.ReactNode }) {
    return (
        <div
            className={`absolute inset-0 flex items-center justify-center p-5 sm:p-8 md:p-10 transition-all duration-700 ease-out ${isActive
                    ? 'opacity-100 translate-x-0 scale-100'
                    : direction === 'left'
                        ? 'opacity-0 -translate-x-full scale-95 pointer-events-none'
                        : direction === 'right'
                            ? 'opacity-0 translate-x-full scale-95 pointer-events-none'
                            : 'opacity-0 scale-95 pointer-events-none'
                }`}
        >
            {children}
        </div>
    );
}

/* ─── REUSABLE PIECES ─── */

function StatCard({ value, label, color, icon: Icon }: { value: string; label: string; color: string; icon: React.ElementType }) {
    const map: Record<string, string> = {
        red: 'bg-red-500/15 border-red-400/30 text-red-300',
        amber: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
        orange: 'bg-orange-500/15 border-orange-400/30 text-orange-300',
    };
    return (
        <div className={`p-5 sm:p-6 rounded-2xl border ${map[color]} text-center`}>
            <Icon className="h-7 w-7 mx-auto mb-2 opacity-80" />
            <p className="text-3xl sm:text-4xl font-black">{value}</p>
            <p className="text-base mt-1.5 opacity-80">{label}</p>
        </div>
    );
}

function CostRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-amber-300/60 shrink-0" />
                <span className="text-white/90 text-base">{label}</span>
            </div>
            <span className="font-bold text-amber-300 text-xl shrink-0">{value}</span>
        </div>
    );
}

function PillarCard({ icon: Icon, title, description, gradient, step }: { icon: React.ElementType; title: string; description: string; gradient: string; step: string }) {
    return (
        <div className="relative p-5 sm:p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm text-left group hover:bg-white/10 hover:border-white/25 transition-all duration-300">
            <span className="absolute top-3 right-3 text-xs font-mono font-bold text-white/30">{step}</span>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-base text-indigo-200/80 leading-relaxed">{description}</p>
        </div>
    );
}

function ROICard({ value, label, icon: Icon, color }: { value: string; label: string; icon: React.ElementType; color: string }) {
    const map: Record<string, string> = {
        emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
        blue: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
        purple: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
        indigo: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    };
    return (
        <div className={`p-5 sm:p-6 rounded-2xl border ${map[color]} text-center`}>
            <Icon className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <p className="text-2xl sm:text-3xl font-black">{value}</p>
            <p className="text-base mt-1.5 opacity-90 leading-snug">{label}</p>
        </div>
    );
}

/* ─── SLIDES ─── */

function S00_Portada({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-8">
                    <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                        <Calendar className="h-14 w-14 text-white" />
                    </div>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">Timeboxing</h1>
                <p className="text-xl sm:text-2xl md:text-3xl text-indigo-200/90 max-w-xl font-light">
                    Sistema operativo financiero<br />
                    <span className="text-white font-semibold">basado en tiempo</span>
                </p>
                <div className="mt-14 flex items-center gap-2.5 text-indigo-300/60 text-base animate-bounce">
                    <span>Pulsa</span>
                    <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-sm font-mono">→</kbd>
                    <span>o haz clic para avanzar</span>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S01_Contexto({ isActive, direction }: SlideProps) {
    const items: { icon: React.ElementType; text: string }[] = [
        { icon: Table2, text: 'Excels compartidos que nadie actualiza' },
        { icon: Mail, text: 'Emails y chats para saber "quién hace qué"' },
        { icon: Gauge, text: 'Estimaciones de presupuesto "a ojo"' },
        { icon: FileText, text: 'Reporting manual al final de mes' },
    ];
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto px-4 sm:px-6">
                {/* Título e icono en bloque compacto */}
                <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-indigo-300" />
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                        ¿Cómo gestiona hoy
                        <span className="block text-indigo-300 mt-1">una agencia su tiempo?</span>
                    </h2>
                </div>

                {/* Grid de 4 problemas: iconos Lucide, sin emojis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-3xl mb-6 sm:mb-8">
                    {items.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/25 text-left shadow-lg shadow-red-950/20"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                                    <Icon className="h-6 w-6 text-red-200" />
                                </div>
                                <p className="text-lg sm:text-xl font-semibold text-white/95 leading-snug">
                                    {item.text}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Conclusión destacada */}
                <div className="w-full max-w-2xl rounded-2xl bg-white/5 border border-white/15 px-5 sm:px-6 py-4 sm:py-5 text-center">
                    <p className="text-lg sm:text-xl md:text-2xl text-white/95 font-medium leading-snug">
                        Resultado: las horas se pierden, la rentabilidad es incierta y las decisiones se toman sin datos.
                    </p>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S02_Problema({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/25 border border-red-400/40 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-8 w-8 text-red-300" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 sm:mb-8">
                    ¿Cuánto dinero<br /><span className="text-red-400">se pierde cada mes?</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
                    <StatCard value="30%" label="de horas no se registran" color="red" icon={Clock} />
                    <StatCard value="15h" label="por empleado/mes sin planificar" color="amber" icon={Timer} />
                    <StatCard value="€€€" label="de rentabilidad invisible" color="orange" icon={DollarSign} />
                </div>
            </div>
        </SlideWrapper>
    );
}

function S03_Coste({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 sm:mb-8">
                    El coste de <span className="text-amber-400">no medir</span>
                </h2>
                <div className="w-full max-w-xl">
                    <div className="relative p-6 sm:p-8 rounded-2xl border-2 border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                        <div className="space-y-5">
                            <CostRow icon={Users} label="20 empleados × 15h/mes" value="300h" />
                            <CostRow icon={DollarSign} label="× Tarifa media 50€/h" value="×50€" />
                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                            <div className="flex items-center justify-between">
                                <span className="text-lg text-white font-bold">Pérdida mensual</span>
                                <span className="text-3xl sm:text-4xl font-black text-amber-400">15.000€</span>
                            </div>
                            <p className="text-amber-200/70 text-base text-center">= 180.000€/año en rentabilidad invisible</p>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S04_BeforeAfter({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 sm:mb-8">
                    Antes vs <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Después</span>
                </h2>
                <MockBeforeAfter />
            </div>
        </SlideWrapper>
    );
}

function S05_Solucion({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                    La solución: <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Timeboxing</span>
                </h2>
                <p className="text-lg sm:text-xl text-indigo-200/90 mb-8 max-w-lg">Convierte el tiempo en el activo más rentable de la agencia.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
                    <PillarCard icon={CalendarRange} title="Planificar" description="Asigna horas por proyecto, persona y semana con vista de carga en tiempo real." gradient="from-indigo-500 to-blue-500" step="01" />
                    <PillarCard icon={BarChart3} title="Medir" description="Compara planificado vs real. Detecta desvíos antes de que cuesten dinero." gradient="from-purple-500 to-pink-500" step="02" />
                    <PillarCard icon={TrendingUp} title="Optimizar" description="Informes de rentabilidad, previsiones y redistribución inteligente." gradient="from-emerald-500 to-teal-500" step="03" />
                </div>
            </div>
        </SlideWrapper>
    );
}

function S06_Planificador({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="text-center lg:text-left order-2 lg:order-1">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-xl shrink-0">
                            <CalendarRange className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Para directores</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Planificador</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Vista semanal del equipo completo', 'Barras de carga en tiempo real', 'Asignación con vista de impacto', 'Alertas de sobrecarga automáticas'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center items-center order-1 lg:order-2">
                    <div className="w-full max-w-md flex flex-col gap-3 scale-105 origin-center">
                        <MockPlanningGrid />
                        <MockAllocationSheet />
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S07_Dashboard({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="flex justify-center items-center order-1">
                    <div className="w-full max-w-sm scale-105 origin-center">
                        <MockDashboard />
                    </div>
                </div>
                <div className="text-center lg:text-left order-2">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shrink-0">
                            <LayoutDashboard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Para empleados</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Dashboard Personal</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Vista diaria con prioridades', 'Control planificación vs deadline', 'Índice de fiabilidad personal', 'Gestión interna y no facturables'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S08_Equipos({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="text-center lg:text-left order-2 lg:order-1">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shrink-0">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Para RRHH</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Gestión de Equipos</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Horarios personalizados L–D', 'Calendario de ausencias integrado', 'Capacidad semanal automática', 'Team Pulse: estado del equipo'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center items-center order-1 lg:order-2">
                    <div className="w-full max-w-sm scale-105 origin-center">
                        <MockTeamCapacity />
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S09_Reportes({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="flex justify-center items-center order-1">
                    <div className="w-full max-w-md scale-105 origin-center">
                        <MockReportsDashboard />
                    </div>
                </div>
                <div className="text-center lg:text-left order-2">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shrink-0">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Para financieros</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Reportes</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Rentabilidad por cliente en tiempo real', 'Exportar Excel/CSV/JSON en 1 clic', 'Coherencia global: alertas de desvío', 'Alias de proyectos para el cliente'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S10_Deadlines({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="text-center lg:text-left order-2 lg:order-1">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shrink-0">
                            <FolderKanban className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Para PMs</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Deadlines y OKRs</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Objetivos de horas por proyecto/mes', 'Override de presupuesto al cambiar scope', 'Alertas de coherencia automáticas', 'Weekly Forecast con redistribución'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center items-center order-1 lg:order-2">
                    <div className="w-full max-w-sm flex flex-col gap-3 scale-105 origin-center">
                        <MockDeadlines />
                        <MockWeeklyForecast />
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S11_Integraciones({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full max-w-6xl mx-auto px-4 h-full py-4">
                <div className="flex justify-center items-center order-1">
                    <div className="w-full max-w-sm scale-105 origin-center">
                        <MockIntegrations />
                    </div>
                </div>
                <div className="text-center lg:text-left order-2">
                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-xl shrink-0">
                            <Plug className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Para técnicos</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Integraciones</h2>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-w-md mx-auto lg:mx-0">
                        {['Google Ads y Meta Ads sincronizados', 'API REST con documentación completa', 'SDK JavaScript para custom', 'Webhooks Realtime para CRM/ERP'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                <span className="text-base text-white/90">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S12_Seguridad({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center mb-6">
                    <Shield className="h-8 w-8 text-indigo-300" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 sm:mb-8">
                    Seguridad y <span className="text-indigo-300">Arquitectura</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                    {[
                        { icon: Shield, title: 'Row Level Security', desc: 'Cada agencia solo ve sus datos. Aislamiento total.' },
                        { icon: Layers, title: 'Multi-agencia', desc: 'Un usuario puede pertenecer a varias agencias.' },
                        { icon: Eye, title: 'Permisos granulares', desc: 'Roles y accesos por ruta y funcionalidad.' },
                        { icon: Sparkles, title: 'Tiempo real', desc: 'Cambios se reflejan al instante vía Supabase Realtime.' },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="p-5 sm:p-6 rounded-2xl border border-white/15 bg-white/5 text-left">
                                <Icon className="h-6 w-6 text-indigo-400 mb-2" />
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-base text-indigo-200/85">{item.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SlideWrapper>
    );
}

function S13_ROI({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 sm:mb-8">
                    Retorno de la <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">inversión</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 w-full max-w-3xl mb-6">
                    <ROICard value="+25%" label="horas facturables recuperadas" icon={TrendingUp} color="emerald" />
                    <ROICard value="90%" label="precisión en estimaciones" icon={Target} color="blue" />
                    <ROICard value="-40%" label="tiempo en reporting" icon={PieChart} color="purple" />
                    <ROICard value="100%" label="visibilidad financiera" icon={Shield} color="indigo" />
                </div>
                <div className="p-6 sm:p-7 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 max-w-md">
                    <p className="text-emerald-100 font-medium text-lg">Con un equipo de 20 personas, Timeboxing puede recuperar hasta</p>
                    <p className="text-4xl sm:text-5xl font-black text-emerald-400 mt-2">180.000€/año</p>
                    <p className="text-emerald-200/80 text-lg mt-1.5">en rentabilidad hoy invisible</p>
                </div>
            </div>
        </SlideWrapper>
    );
}

function S14_CTA({ isActive, direction }: SlideProps) {
    return (
        <SlideWrapper isActive={isActive} direction={direction}>
            <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto px-4">
                <div className="relative mb-6">
                    <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                        <Zap className="h-10 w-10 text-white" />
                    </div>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">¿Empezamos?</h2>
                <p className="text-lg sm:text-xl text-indigo-200/90 mb-8 max-w-lg">
                    Timeboxing se configura en minutos. Vuestro equipo puede empezar a planificar <span className="text-white font-semibold">esta misma semana</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/login">
                        <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg px-8 py-6 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            Acceder a Timeboxing <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </Link>
                    <Link to="/">
                        <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white text-lg px-8 py-6">
                            Ver la web completa
                        </Button>
                    </Link>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 items-center">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /><span className="text-base text-indigo-200/90">Setup en 10 min</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /><span className="text-base text-indigo-200/90">Sin coste inicial</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /><span className="text-base text-indigo-200/90">Soporte dedicado</span></div>
                </div>
            </div>
        </SlideWrapper>
    );
}

/* ─── ALL SLIDES ─── */
const SLIDES = [
    S00_Portada,
    S01_Contexto,
    S02_Problema,
    S03_Coste,
    S04_BeforeAfter,
    S05_Solucion,
    S06_Planificador,
    S07_Dashboard,
    S08_Equipos,
    S09_Reportes,
    S10_Deadlines,
    S11_Integraciones,
    S12_Seguridad,
    S13_ROI,
    S14_CTA,
];

/* ─── MAIN PAGE ─── */
export default function PresentationPage() {
    const [current, setCurrent] = useState(0);
    const total = SLIDES.length;

    const goTo = useCallback((n: number) => {
        if (n < 0 || n >= total || n === current) return;
        setCurrent(n);
    }, [current, total]);

    const next = useCallback(() => goTo(current + 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1), [current, goTo]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            else if (e.key === 'Escape') { e.preventDefault(); goTo(0); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [next, prev, goTo]);

    useEffect(() => {
        let startX = 0;
        const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
        const onEnd = (e: TouchEvent) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 60) { diff > 0 ? next() : prev(); }
        };
        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchend', onEnd, { passive: true });
        return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
    }, [next, prev]);

    return (
        <>
            <Helmet>
                <title>Timeboxing — Presentación</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 overflow-hidden select-none">
                {/* BG effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                    <div className="absolute top-1/2 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
                </div>
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }} />

                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out" style={{ width: `${((current + 1) / total) * 100}%` }} />
                </div>

                {/* Slide counter */}
                <div className="absolute top-4 right-5 z-50 text-sm font-mono text-white/40">
                    {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </div>

                {/* Slides */}
                <div className="relative w-full h-full">
                    {SLIDES.map((SlideComp, i) => (
                        <SlideComp key={i} isActive={i === current} direction={i < current ? 'left' : i > current ? 'right' : 'none'} />
                    ))}
                </div>

                {/* Click zones */}
                {current > 0 && (
                    <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/6 z-40 cursor-w-resize group" aria-label="Anterior">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-10 w-10 text-white/50" /></div>
                    </button>
                )}
                {current < total - 1 && (
                    <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/6 z-40 cursor-e-resize group" aria-label="Siguiente">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-10 w-10 text-white/50" /></div>
                    </button>
                )}

                {/* Bottom nav */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
                    <button onClick={prev} disabled={current === 0} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white" aria-label="Slide anterior">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex gap-2">
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)} className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-400' : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/50'}`} aria-label={`Slide ${i + 1}`} />
                        ))}
                    </div>
                    <button onClick={next} disabled={current === total - 1} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white" aria-label="Slide siguiente">
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </>
    );
}
