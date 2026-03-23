import { Helmet } from 'react-helmet-async';
import { PlantillaPlanificacionRecursosArticle } from '@/components/landing/blog/PlantillaPlanificacionRecursosArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'plantilla-planificacion-recursos-agencia';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'intro-excel-primer-amor', label: 'I. Excel como primer paso' },
  { id: 'capacidad-bruta-vs-neta', label: 'II. Capacidad bruta vs neta' },
  { id: 'anatomia-plantilla-profesional', label: 'III. Anatomía de la plantilla (4 hojas)' },
  { id: 'formula-utilizacion-formato', label: 'IV. Fórmula de utilización y alerta' },
  { id: 'pacing-proyecto-margen', label: 'V. Pacing por proyecto y margen' },
  { id: 'impuesto-excel-techo', label: 'VI. El impuesto Excel' },
  { id: 'techo-cristal-errores', label: 'VII. Techo de cristal (3 errores)' },
  { id: 'validacion-proteccion-errores', label: 'VIII. Validación y protección' },
  { id: 'escalar-semana-semana', label: 'IX. Escalar semana a semana' },
  { id: 'google-sheets-diferencias', label: 'X. Google Sheets vs Excel' },
  { id: 'evolucion-taimbox-passiva', label: 'XI. Evolución a Taimbox' },
  { id: 'faq-plantilla-recursos', label: 'Preguntas frecuentes' },
  { id: 'resumen-recursos', label: 'Resumen' },
  { id: 'cta-plantilla-recursos', label: 'Siguiente paso' },
];

const CANONICAL = 'https://taimbox.com/blog/plantilla-planificacion-recursos-agencia';

export default function PlantillaPlanificacionRecursosPage() {
  const titleShort = 'Plantilla gratuita de planificación de recursos para agencias';
  const seoTitle =
    'Plantillas gratuitas de planificación de recursos: descarga plantilla para agencias (Excel y Google Sheets)';
  const description =
    'Descarga gratis una plantilla de planificación de recursos para agencias en Excel o Google Sheets: 5 hojas con fórmulas, formato condicional, desplegables y protección de celdas. Calcula capacidad neta, utilización y margen.';

  const howToSteps = [
    {
      name: 'Definir equipo y capacidad neta',
      text: 'Inventario de horas: capacidad bruta menos reuniones, admin/formación y ausencias para obtener la capacidad neta por persona.',
    },
    {
      name: 'Registrar proyectos con fee y presupuesto',
      text: 'Cada proyecto con fee mensual y horas presupuestadas. Las columnas de pacing, coste y margen se calculan solas.',
    },
    {
      name: 'Repartir horas en el cuadrante semanal',
      text: 'Asignación cruzada personas × proyectos × semana usando desplegables para evitar errores de nombre.',
    },
    {
      name: 'Analizar utilización y KPIs en el dashboard',
      text: 'Calcular utilización como horas asignadas sobre capacidad neta, con formato condicional y 4 estados (Óptimo, Riesgo, Sobrecarga, Baja carga).',
    },
  ];

  const faqItems = [
    { q: '¿Necesito macros o VBA para que funcione la plantilla?', a: 'No. Solo usa fórmulas estándar (SUMA, SI, SUMIF, VLOOKUP, SUMPRODUCT, COUNTIF) y formato condicional nativo. Funciona en Excel, LibreOffice y Google Sheets sin macros.' },
    { q: '¿Cada cuánto hay que actualizar la plantilla?', a: 'Lo ideal es revisarla al inicio de cada semana: ajustar ausencias en Equipo y añadir asignaciones de la nueva semana.' },
    { q: '¿A partir de cuántas personas deja de ser práctico el Excel?', a: 'Muchas agencias notan la fricción entre 8 y 15 personas con múltiples proyectos simultáneos.' },
    { q: '¿Puedo usar esta plantilla junto a un tablero Kanban?', a: 'Sí: el Kanban gestiona el flujo de tareas; la plantilla gestiona horas y capacidad. Se complementan.' },
    { q: '¿Qué rango de utilización es «sano» en una agencia?', a: 'Orientativo: 70–85% sobre capacidad neta. Por encima del 90% empieza el riesgo de quemazo.' },
    { q: '¿Qué diferencia hay entre esta plantilla y un diagrama de Gantt?', a: 'El Gantt ordena tareas en un eje temporal; la plantilla se centra en capacidad y carga por persona.' },
    { q: '¿El pacing tiene en cuenta que no todos los meses duran lo mismo?', a: 'La fórmula divide las horas presupuestadas entre 4 semanas como aproximación. En meses de 5 semanas laborales, el pacing real será ligeramente inferior.' },
    { q: '¿Cómo actualizo los desplegables si añado una persona o proyecto nuevo?', a: 'En Excel: Datos → Validación de datos y amplía la lista. En Google Sheets: clic en la celda, icono de desplegable, editar lista.' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: titleShort,
        description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-24',
        mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL },
      },
      {
        '@type': 'HowTo',
        name: 'Cómo usar la plantilla de planificación de recursos para agencias',
        description:
          'Pasos para configurar inventario de horas, catálogo de proyectos, cuadrante semanal y dashboard de utilización en Excel o Google Sheets.',
        step: howToSteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Taimbox',
        applicationCategory: 'BusinessApplication',
        description:
          'Planificador de recursos y tiempo para agencias. Timeboxing, cronograma por horas y reportes de rentabilidad.',
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle} | Taimbox</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${seoTitle} | Taimbox`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
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

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <BlogBreadcrumb title={post?.title ?? titleShort} />
        </div>

        <div className="relative z-10">
          <PlantillaPlanificacionRecursosArticle
            readingMinutes={post?.readingMinutes ?? 22}
            tocItems={TOC_ITEMS}
            relatedPost={
              relatedPost
                ? { title: relatedPost.title, description: relatedPost.description, href: relatedPost.href }
                : undefined
            }
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
