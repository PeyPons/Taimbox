import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { LandingArticle } from '@/components/landing/LandingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function ArticlePage() {
  return (
    <>
      <Helmet>
        <title>Por qué tu lista de tareas mata la rentabilidad de tu agencia | Timeboxing</title>
        <meta name="description" content="Timeboxing: metodología y plataforma para agencias. Horas computadas, Team Pulse, API. Sistema operativo financiero basado en tiempo." />
        <link rel="canonical" href="/por-que-timeboxing" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: 'Timeboxing: Por qué tu lista de tareas está matando la rentabilidad de tu agencia',
                description: 'Metodología Timeboxing y sistema operativo financiero basado en tiempo para agencias. Horas computadas, Team Pulse, API.',
                author: { '@type': 'Organization', name: 'Timeboxing' },
                publisher: { '@type': 'Organization', name: 'Timeboxing' }
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Timeboxing',
                applicationCategory: 'BusinessApplication',
                description: 'Plataforma de gestión de recursos, planificación y control financiero para agencias.'
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-indigo-950/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-200 transition-colors">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Timeboxing
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-indigo-200 hover:text-white">
                Inicio
              </Link>
              <Link to="/api-docs" className="text-sm text-indigo-200 hover:text-white hidden sm:inline">
                API
              </Link>
              <Link to="/guia" className="text-sm text-indigo-200 hover:text-white hidden sm:inline">
                Guía
              </Link>
              <Link to="/login">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10">
          <LandingArticle />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
