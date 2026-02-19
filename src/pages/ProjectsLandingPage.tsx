import { Helmet } from 'react-helmet-async';
import { ProjectsArticle } from '@/components/landing/ProjectsArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function ProjectsLandingPage() {
    return (
        <>
            <Helmet>
                <title>Proyectos y Deadlines — Del briefing al deadline sin sorpresas | Timeboxing</title>
                <meta name="description" content="Gestiona clientes, proyectos, presupuestos, deadlines mensuales y OKRs con control de coherencia automática para agencias." />
                <link rel="canonical" href="/control-proyectos" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'Proyectos y Deadlines — Timeboxing',
                        description: 'Control total de proyectos con presupuestos en vivo, deadlines mensuales, OKRs y validación automática.',
                    })}
                </script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
                </div>
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />

                <LandingHeader />

                <div className="relative z-10">
                    <ProjectsArticle />
                </div>

                <LandingFooter />
            </div>
        </>
    );
}
