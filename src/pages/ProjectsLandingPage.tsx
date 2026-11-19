import { ProjectsArticle } from '@/components/landing/ProjectsArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { CommercialSeoTags } from '@/seo/CommercialSeoTags';

export default function ProjectsLandingPage() {
    return (
        <>
            <CommercialSeoTags pathEs="/control-proyectos" pageKey="projects" />

            <div className="pub-stage min-h-screen bg-[#14123B] relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-950/35 rounded-full blur-3xl opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-600/10 rounded-full blur-3xl opacity-30" />
                </div>
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />

                <LandingHeader />

                <div className="relative z-10">
                    <ProjectsArticle />
                </div>

                <LandingFooter variant="stage" />
            </div>
        </>
    );
}
