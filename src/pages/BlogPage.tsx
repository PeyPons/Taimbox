import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
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
  BarChart3,
  Search,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';

function getPostIcon(slug: string) {
  if (slug.includes('kpis')) return BarChart3;
  if (slug.includes('plantilla')) return LayoutGrid;
  if (slug.includes('planificacion') || slug.includes('cronograma')) return LayoutGrid;
  if (slug.includes('timeboxing')) return Clock;
  return BookOpen;
}

function getPostAccent(slug: string): 'indigo' | 'emerald' | 'purple' {
  if (slug.includes('plantilla')) return 'indigo';
  if (slug.includes('planificacion') || slug.includes('cronograma')) return 'indigo';
  if (slug.includes('timeboxing')) return 'emerald';
  return 'purple';
}

type BlogCategory = 'todos' | 'plantillas' | 'kpis' | 'planificacion' | 'productividad' | 'gestion';

function getPostCategory(slug: string): Exclude<BlogCategory, 'todos'> {
  if (slug.includes('plantilla')) return 'plantillas';
  if (slug.includes('kpis')) return 'kpis';
  if (slug.includes('planificacion') || slug.includes('cronograma')) return 'planificacion';
  if (slug.includes('timeboxing') || slug.includes('parkinson')) return 'productividad';
  return 'gestion';
}

function getCategoryLabel(category: BlogCategory): string {
  switch (category) {
    case 'todos':
      return 'Todos';
    case 'plantillas':
      return 'Plantillas';
    case 'kpis':
      return 'KPIs';
    case 'planificacion':
      return 'Planificación';
    case 'productividad':
      return 'Productividad';
    case 'gestion':
      return 'Gestión';
    default:
      return 'Todos';
  }
}

function formatDateEs(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BlogCategory>('todos');

  const sortedPosts = useMemo(
    () =>
      [...blogPosts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const featuredPost = sortedPosts[0];
  const restPosts = sortedPosts.slice(1);

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return restPosts.filter((post) => {
      const categoryMatch =
        category === 'todos' || getPostCategory(post.slug) === category;
      const textMatch =
        needle.length === 0 ||
        post.title.toLowerCase().includes(needle) ||
        post.description.toLowerCase().includes(needle);
      return categoryMatch && textMatch;
    });
  }, [restPosts, category, query]);

  const categoryOptions: BlogCategory[] = [
    'todos',
    'plantillas',
    'kpis',
    'planificacion',
    'productividad',
    'gestion',
  ];

  const totalReadingMinutes = sortedPosts.reduce(
    (acc, post) => acc + post.readingMinutes,
    0,
  );

  return (
    <>
      <Helmet>
        <title>Blog de plantillas, KPIs y planificación | Taimbox</title>
        <meta
          name="description"
          content="Explora el blog de Taimbox: plantillas gratuitas, KPIs y guías de planificación para agencias. Filtra por temática y encuentra recursos prácticos en minutos."
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
              Guías prácticas sobre planificación de proyectos, timeboxing y gestión de recursos para agencias. Encuentra plantillas gratuitas, métricas y marcos de trabajo listos para aplicar.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-indigo-200/60 m-0">
                  Publicados
                </p>
                <p className="text-2xl font-bold text-white m-0">
                  {sortedPosts.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-indigo-200/60 m-0">
                  Min de lectura
                </p>
                <p className="text-2xl font-bold text-white m-0">
                  {totalReadingMinutes}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-indigo-200/60 m-0">
                  Temáticas
                </p>
                <p className="text-2xl font-bold text-white m-0">
                  {categoryOptions.length - 1}
                </p>
              </div>
            </div>
          </header>

          {/* Destacado */}
          {featuredPost != null && (
            <section className="mb-10">
              <p className="text-xs uppercase tracking-wider text-indigo-200/70 font-semibold mb-3">
                Artículo destacado
              </p>
              <RevealOnScroll>
                <Link
                  to={featuredPost.href}
                  className="block rounded-2xl border-2 border-indigo-400/35 hover:border-indigo-300/60 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-500/25 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl border border-indigo-400/35 bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-7 w-7 text-indigo-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-4">
                        {featuredPost.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-200/70">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateEs(featuredPost.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-200/70">
                          <Clock className="h-3.5 w-3.5" />
                          {featuredPost.readingMinutes} min de lectura
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-200 group-hover:scale-105">
                          Leer destacado
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            </section>
          )}

          {/* Buscador + filtros */}
          <section className="mb-10">
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="h-4 w-4 text-indigo-300" />
                <p className="text-sm text-indigo-100/90 font-medium m-0">
                  Encuentra artículos por tema
                </p>
              </div>
              <div className="relative mb-4">
                <Search className="h-4 w-4 text-indigo-200/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título o contenido..."
                  className="w-full rounded-xl border border-white/15 bg-indigo-950/40 text-white placeholder:text-indigo-200/45 px-10 py-3 text-sm sm:text-base outline-none focus:border-indigo-300/50 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-indigo-200/70 mr-1">
                  <Filter className="h-3.5 w-3.5" />
                  Categoría:
                </span>
                {categoryOptions.map((option) => {
                  const active = option === category;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-all ${
                        active
                          ? 'bg-indigo-500/25 border-indigo-300/50 text-white'
                          : 'bg-white/[0.03] border-white/15 text-indigo-100/85 hover:bg-white/[0.08] hover:border-indigo-300/30'
                      }`}
                    >
                      {getCategoryLabel(option)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Lista de artículos */}
          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-8 text-center">
              <p className="text-white text-lg font-semibold m-0 mb-2">
                No hay resultados para ese filtro.
              </p>
              <p className="text-indigo-100/80 text-sm m-0">
                Prueba otra palabra clave o cambia la categoría.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.map((post: BlogPost, index: number) => {
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
                      className={`block h-full rounded-2xl border-2 ${borderClass} bg-white/5 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${glowClass} hover:bg-white/[0.08] group`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-4 mb-4">
                        <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border ${iconBgClass} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}
                        >
                            <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColorClass}`} />
                        </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs uppercase tracking-wider text-indigo-200/65 m-0 mb-1">
                              {getCategoryLabel(getPostCategory(post.slug))}
                            </p>
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-indigo-100 transition-colors leading-snug">
                            {post.title}
                          </h2>
                          </div>
                        </div>
                        <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-5 flex-1">
                            {post.description}
                          </p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-200/70">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateEs(post.date)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-200/70">
                              <Clock className="h-3.5 w-3.5" />
                              {post.readingMinutes} min
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group-hover:scale-105 ${btnClass}`}
                          >
                            Leer
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </RevealOnScroll>
                </li>
              );
            })}
            </ul>
          )}
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
