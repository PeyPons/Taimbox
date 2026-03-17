import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { RevealOnScroll } from '@/components/landing/blog/RevealOnScroll';
import { blogPosts } from '@/data/blogPosts';
import {
  Calendar,
  ArrowRight,
  LayoutGrid,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';

function getPostIcon(slug: string) {
  if (slug.includes('planificacion') || slug.includes('cronograma')) return LayoutGrid;
  if (slug.includes('timeboxing')) return Clock;
  return BookOpen;
}

function getPostAccent(slug: string): 'indigo' | 'emerald' | 'purple' {
  if (slug.includes('planificacion') || slug.includes('cronograma')) return 'indigo';
  if (slug.includes('timeboxing')) return 'emerald';
  return 'purple';
}

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog | Taimbox</title>
        <meta
          name="description"
          content="Artículos sobre planificación de proyectos, timeboxing, cronograma, presupuesto y recursos para agencias y equipos."
        />
        <link rel="canonical" href="https://taimbox.com/blog" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <LandingHeader />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          {/* Hero */}
          <header className="mb-16 sm:mb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-500/20 border border-indigo-400/30 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Guías y recursos
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-5 sm:mb-6 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-indigo-100/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Guías prácticas sobre planificación de proyectos, timeboxing y gestión de recursos para agencias. Aprende a unir cronograma, presupuesto y capacidad.
            </p>
            <p className="mt-4 text-indigo-200/60 text-sm">
              {blogPosts.length} {blogPosts.length === 1 ? 'artículo' : 'artículos'}
            </p>
          </header>

          {/* Lista de artículos */}
          <ul className="space-y-8">
            {blogPosts.map((post: BlogPost, index: number) => {
              const Icon = getPostIcon(post.slug);
              const accent = getPostAccent(post.slug);
              const isIndigo = accent === 'indigo';
              const isEmerald = accent === 'emerald';
              const isPurple = accent === 'purple';
              const borderClass = isIndigo
                ? 'border-indigo-500/30 hover:border-indigo-400/50'
                : isEmerald
                  ? 'border-emerald-500/30 hover:border-emerald-400/50'
                  : 'border-purple-500/30 hover:border-purple-400/50';
              const glowClass = isIndigo
                ? 'hover:shadow-indigo-500/20'
                : isEmerald
                  ? 'hover:shadow-emerald-500/20'
                  : 'hover:shadow-purple-500/20';
              const iconBgClass = isIndigo
                ? 'bg-indigo-500/20 border-indigo-400/30'
                : isEmerald
                  ? 'bg-emerald-500/20 border-emerald-400/30'
                  : 'bg-purple-500/20 border-purple-400/30';
              const iconColorClass = isIndigo ? 'text-indigo-300' : isEmerald ? 'text-emerald-300' : 'text-purple-300';
              const btnClass = isIndigo
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40'
                : isEmerald
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40';

              return (
                <li key={post.slug}>
                  <RevealOnScroll delay={index === 0 ? 0 : 1}>
                    <Link
                      to={post.href}
                      className={`block rounded-2xl border-2 ${borderClass} bg-white/5 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${glowClass} hover:bg-white/[0.08] group`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border ${iconBgClass} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}
                        >
                          <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${iconColorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-indigo-100 transition-colors">
                            {post.title}
                          </h2>
                          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-4">
                            {post.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-200/70">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(post.date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group-hover:scale-105 ${btnClass}`}
                            >
                              Leer artículo
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </RevealOnScroll>
                </li>
              );
            })}
          </ul>
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
