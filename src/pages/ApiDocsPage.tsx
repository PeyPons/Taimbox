import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ArrowLeft, ArrowRight, Code, Menu, BookOpen, Key } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTOC } from './api-docs/components/SidebarTOC';
import { getAllSectionIds } from './api-docs/data/toc';

import { OverviewIntro } from './api-docs/sections/OverviewIntro';
import { OverviewAuth } from './api-docs/sections/OverviewAuth';
import { OverviewBaseUrl } from './api-docs/sections/OverviewBaseUrl';
import { OverviewResponses } from './api-docs/sections/OverviewResponses';
import { OverviewChangelog } from './api-docs/sections/OverviewChangelog';
import { TutorialQuickStart } from './api-docs/sections/TutorialQuickStart';
import { TutorialSyncTeam } from './api-docs/sections/TutorialSyncTeam';
import { TutorialPlanning } from './api-docs/sections/TutorialPlanning';
import { TutorialReports } from './api-docs/sections/TutorialReports';
import { TutorialAbsences } from './api-docs/sections/TutorialAbsences';
import { SdkSection } from './api-docs/sections/SdkSection';
import { RestSection } from './api-docs/sections/RestSection';
import { FilteringSection } from './api-docs/sections/FilteringSection';
import { RealtimeSection } from './api-docs/sections/RealtimeSection';
import { ResourceReference } from './api-docs/sections/ResourceReference';

function useScrollSpy() {
  const location = useLocation();
  const navigate = useNavigate();
  const ids = getAllSectionIds();
  const hashId = location.hash.slice(1);
  const validHash = hashId && ids.includes(hashId);

  const [activeSection, setActiveSection] = useState(() => validHash ? hashId : 'intro');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingFromHashRef = useRef(false);

  const programmaticNavRef = useRef(false);

  const navigateToSection = (id: string) => {
    if (!ids.includes(id)) return;
    programmaticNavRef.current = true;
    navigate(`#${id}`, { replace: true });
    setActiveSection(id);
  };

  // Cuando hay hash (carga, recarga o atrás/adelante): scroll a la sección
  useEffect(() => {
    if (!validHash) return;
    setActiveSection(hashId);
    if (programmaticNavRef.current) {
      programmaticNavRef.current = false;
      isScrollingFromHashRef.current = true;
      setTimeout(() => { isScrollingFromHashRef.current = false; }, 800);
      return;
    }
    isScrollingFromHashRef.current = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        isScrollingFromHashRef.current = false;
      }, 1200);
    });
  }, [hashId, validHash]);

  // Scroll spy: la sección activa es la que está “en vista” (la más arriba entre las visibles)
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingFromHashRef.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Entre las visibles, elegir la que tiene el top más bajo (la que “acabas de entrar”)
        const sorted = [...visible].sort(
          (a, b) => b.boundingClientRect.top - a.boundingClientRect.top,
        );
        const id = sorted[0].target.id;
        setActiveSection(id);
        const newHash = `#${id}`;
        if (window.location.hash !== newHash) {
          navigate(newHash, { replace: true });
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [navigate]);

  return { activeSection, navigateToSection };
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 pt-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/40">
        {title}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function ApiDocsPage() {
  const { activeSection, navigateToSection } = useScrollSpy();
  const isMobile = useIsMobile();

  return (
    <>
      <Helmet>
        <title>Documentacion API - Timeboxing</title>
        <meta
          name="description"
          content="Documentacion de la API de integracion de Timeboxing. Conecta tus herramientas con datos de planificacion, equipo y proyectos."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Header fijo: siempre visible al hacer scroll */}
        <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-indigo-950/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex items-center justify-between h-14">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 bg-transparent border-0 text-white hover:bg-white/10 shrink-0"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-80 bg-indigo-950 border-white/10 p-6 overflow-y-auto"
                  >
                    <SheetTitle className="text-white text-lg font-bold mb-6">
                      Navegacion
                    </SheetTitle>
                    <SidebarTOC activeSection={activeSection} onNavigate={navigateToSection} />
                  </SheetContent>
                </Sheet>
              )}
              {!isMobile && (
                <>
                  <Link to="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white gap-1.5"
                    >
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Inicio</span>
                    </Button>
                  </Link>
                  <Link to="/guia">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:bg-white/10 hover:text-white gap-1.5"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Guia</span>
                    </Button>
                  </Link>
                  <span className="text-white/40 hidden sm:inline">|</span>
                </>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 text-white min-w-0">
                <Code className="h-4 w-4 text-indigo-300 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm truncate">API Docs</span>
                <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono shrink-0">
                  v1
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {!isMobile && (
                <Link to="/api-keys">
                  <Button
                    size="sm"
                    className="bg-indigo-900/60 border border-indigo-400/40 text-indigo-100 hover:bg-indigo-800/70 hover:text-white gap-1.5"
                  >
                    <Key className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden lg:inline">API & Integraciones</span>
                  </Button>
                </Link>
              )}
              <Link to="/login">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Acceder</span>
                  <span className="sm:hidden">App</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 hidden sm:inline" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Espaciador para que el contenido no quede bajo el header fijo */}
        <div className="h-14 shrink-0" aria-hidden />

        {/* Sidebar fijo (desktop): siempre visible sin hacer scroll */}
        {!isMobile && (
          <aside
            className="fixed left-0 top-14 z-20 w-60 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/10 bg-indigo-950/95 backdrop-blur-xl"
            aria-label="Navegacion documentacion"
          >
            <div className="p-4 pb-12">
              <SidebarTOC activeSection={activeSection} onNavigate={navigateToSection} />
            </div>
          </aside>
        )}

        {/* Contenido principal: margen izquierdo en desktop para no quedar bajo el sidebar */}
        <div className={isMobile ? 'relative z-10 px-4 sm:px-6 py-8' : 'relative z-10 ml-60 min-h-screen'}>
          <main className={isMobile ? 'max-w-4xl mx-auto space-y-16' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16'}>
              {/* Overview */}
              <OverviewIntro />
              <OverviewAuth />
              <OverviewBaseUrl />
              <OverviewResponses />
              <OverviewChangelog />

              {/* Tutorials */}
              <SectionDivider title="Tutoriales" />
              <TutorialQuickStart />
              <TutorialSyncTeam />
              <TutorialPlanning />
              <TutorialReports />
              <TutorialAbsences />

              {/* SDK y REST */}
              <SectionDivider title="SDK y REST" />
              <SdkSection />
              <RestSection />
              <FilteringSection />
              <RealtimeSection />

              {/* Resource Reference */}
              <SectionDivider title="Referencia de Recursos" />
              <ResourceReference />

              {/* Footer links */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4">
                <Link to="/guia">
                  <Button className="border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Guia de funcionalidades
                  </Button>
                </Link>
                <Link to="/">
                  <Button className="border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </main>
          </div>
      </div>
    </>
  );
}
