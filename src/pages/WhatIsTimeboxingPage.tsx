import { Helmet } from 'react-helmet-async';
import { WhatIsTimeboxingArticle } from '@/components/landing/WhatIsTimeboxingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'que-es-timeboxing';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'que-es-timeboxing-diferencia', label: '1. ¿Qué es el Timeboxing y en qué se diferencia?' },
  { id: 'bloques-rigidos-flexibles', label: '2. Bloques de tiempo rígidos vs. flexibles' },
  { id: 'neurociencia', label: '3. La neurociencia: por qué funciona' },
  { id: 'implementacion-paso-a-paso', label: '4. Cómo aplicar el Timeboxing paso a paso' },
  { id: 'equipos-rentabilidad', label: '5. Timeboxing para equipos: de la tarea a la rentabilidad' },
  { id: 'timeboxing-reuniones', label: '6. Timeboxing en reuniones' },
  { id: 'preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { id: 'cta-rentabilidad', label: 'Empezar a ganar rentabilidad' },
];

export default function WhatIsTimeboxingPage() {
  return (
    <>
      <Helmet>
        <title>Qué es el Timeboxing: Guía Definitiva de Productividad | Taimbox</title>
        <meta name="description" content="Descubre qué es el Timeboxing, la técnica número uno de gestión del tiempo. Aprende a usar cajas de tiempo para aumentar la rentabilidad de tu agencia o empresa." />
        <link rel="canonical" href="https://taimbox.com/blog/que-es-timeboxing" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Qué es el Timeboxing: Guía Definitiva de Productividad | Taimbox" />
        <meta property="og:description" content="Descubre qué es el Timeboxing, la técnica número uno de gestión del tiempo. Aprende a usar cajas de tiempo para aumentar la rentabilidad." />
        <meta property="og:url" content="https://taimbox.com/blog/que-es-timeboxing" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: 'Qué es el Timeboxing: La Guía Definitiva de Productividad para Empresas',
                description: 'Descubre qué es el Timeboxing, la técnica número uno de gestión del tiempo. Aprende a usar cajas de tiempo para aumentar la rentabilidad de tu agencia o empresa.',
                author: { '@type': 'Organization', name: 'Taimbox' },
                publisher: { '@type': 'Organization', name: 'Taimbox' },
                datePublished: post?.date ?? '2024-01-15',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Taimbox',
                applicationCategory: 'BusinessApplication',
                description: 'El planificador de recursos diseñado para el Timeboxing y la rentabilidad en agencias de servicios.',
              },
            ],
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
          backgroundSize: '50px 50px',
        }} />

        <LandingHeader />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <BlogBreadcrumb title={post?.title ?? 'Qué es el timeboxing'} />
        </div>

        <div className="relative z-10">
          <WhatIsTimeboxingArticle
            readingMinutes={post?.readingMinutes ?? 12}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ? { title: relatedPost.title, description: relatedPost.description, href: relatedPost.href } : undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
