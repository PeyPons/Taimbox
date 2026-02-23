import { Helmet } from 'react-helmet-async';
import { LandingArticle } from '@/components/landing/LandingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function ArticlePage() {
  return (
    <>
      <Helmet>
        <title>Por qué tu lista de tareas mata la rentabilidad de tu agencia | Taimbox</title>
        <meta name="description" content="Taimbox: metodología y plataforma para agencias. Horas computadas, Team Pulse, API. Sistema operativo financiero basado en tiempo." />
        <link rel="canonical" href="/por-que-timeboxing" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: 'Taimbox: Por qué tu lista de tareas está matando la rentabilidad de tu agencia',
                description: 'Metodología Taimbox y sistema operativo financiero basado en tiempo para agencias. Horas computadas, Team Pulse, API.',
                author: { '@type': 'Organization', name: 'Taimbox' },
                publisher: { '@type': 'Organization', name: 'Taimbox' }
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Taimbox',
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

        <LandingHeader />

        <div className="relative z-10">
          <LandingArticle />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
