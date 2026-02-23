import { Helmet } from 'react-helmet-async';
import { WhatIsTimeboxingArticle } from '@/components/landing/WhatIsTimeboxingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function WhatIsTimeboxingPage() {
    return (
        <>
            <Helmet>
                <title>Qué es el Timeboxing: Guía Definitiva de Productividad | Taimbox</title>
                <meta name="description" content="Descubre qué es el Timeboxing, la técnica número uno de gestión del tiempo. Aprende a usar cajas de tiempo para aumentar la rentabilidad de tu agencia o empresa." />
                <link rel="canonical" href="/que-es-timeboxing" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@graph': [
                            {
                                '@type': 'Article',
                                headline: 'Qué es el Timeboxing: La Guía Definitiva de Productividad para Empresas',
                                description: 'Descubre qué es el Timeboxing, la técnica número uno de gestión del tiempo. Aprende a usar cajas de tiempo para aumentar la rentabilidad de tu agencia o empresa.',
                                author: { '@type': 'Organization', name: 'Taimbox' },
                                publisher: { '@type': 'Organization', name: 'Taimbox' }
                            },
                            {
                                '@type': 'SoftwareApplication',
                                name: 'Taimbox',
                                applicationCategory: 'BusinessApplication',
                                description: 'El planificador de recursos diseñado para el Timeboxing y la rentabilidad en agencias de servicios.'
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
                    <WhatIsTimeboxingArticle />
                </div>

                <LandingFooter />
            </div>
        </>
    );
}
