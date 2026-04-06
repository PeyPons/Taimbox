import { useTranslation, Trans } from 'react-i18next';
import { pathEsToEn, localizedPathFromEs } from '@/i18n/publicPaths';
import { SeoTags } from '@/seo/SeoTags';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
    Scale,
    Users,
    Settings2,
    CreditCard,
    ShieldAlert,
    ArchiveX,
    RefreshCcw,
    BookOpen,
    LayoutTemplate,
    Gavel,
    ShieldCheck,
    Building2,
} from 'lucide-react';

function SectionCard({ icon: Icon, iconColor, title, children }: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
        teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    };
    return (
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[iconColor] || colorMap.indigo}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="text-slate-400 text-sm leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    );
}

export default function TermsOfServicePage() {
    const { t, i18n } = useTranslation('landing');
    
    const lang = i18n.language.startsWith('en') ? 'en' : 'es';
    
    const S = 'static.terms';

    const comps = {
        strong: <strong className="text-slate-200" />,
        em: <em />,
        a_mail: <a href="mailto:hello@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        a_google_policy: <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        link_privacy: <Link to={localizedPathFromEs('/privacidad', lang)} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" />,
    };

    return (
        <>
            <SeoTags
                pathEs="/condiciones"
                pathEn={pathEsToEn('/condiciones')}
                title={t(`${S}.seoTitle`)}
                description={t(`${S}.seoDescription`)}
                lang={lang}
            />
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <LandingHeader />

            <main className="flex-1 relative z-10 pt-32 pb-24">
                {/* Ambient glow */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

                {/* ─── HERO ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-medium mb-8">
                            <Scale className="h-4 w-4" />
                            {t(`${S}.badge`)}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                            {t(`${S}.title`)}
                        </h1>
                        <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            {t(`${S}.description`)}
                        </p>
                        <p className="text-xs text-slate-500 mt-4">
                            {t(`${S}.lastUpdate`)}
                        </p>
                    </div>
                </section>

                {/* ─── SECTIONS ─── */}
                <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 relative z-10">

                    <SectionCard icon={BookOpen} iconColor="indigo" title={t(`${S}.sections.definitions.title`)}>
                        <p>{t(`${S}.sections.definitions.intro`)}</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.definitions.service`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.definitions.agency`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.definitions.user`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.definitions.data`} t={t} components={{ 0: comps.strong }} />
                            </li>
                        </ul>
                    </SectionCard>

                    <SectionCard icon={Users} iconColor="emerald" title={t(`${S}.sections.acceptance.title`)}>
                        <p>
                            <Trans i18nKey={`${S}.sections.acceptance.p1`} t={t} components={{ strong: comps.strong }} />
                        </p>
                        <p>
                            {t(`${S}.sections.acceptance.p2`)}
                        </p>
                    </SectionCard>

                    <SectionCard icon={CreditCard} iconColor="blue" title={t(`${S}.sections.billing.title`)}>
                        <p><Trans i18nKey={`${S}.sections.billing.plans`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.billing.process`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.billing.trial`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.billing.mod`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    <SectionCard icon={Settings2} iconColor="orange" title={t(`${S}.sections.acceptableUse.title`)}>
                        <p>
                            {t(`${S}.sections.acceptableUse.intro`)}
                        </p>
                        <ul className="space-y-2 ml-1">
                            {[1, 2, 3, 4].map(i => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                    <span>{t(`${S}.sections.acceptableUse.forbidden${i}`)}</span>
                                </li>
                            ))}
                        </ul>
                        <p>
                            {t(`${S}.sections.acceptableUse.outro`)}
                        </p>
                    </SectionCard>

                    <SectionCard icon={Building2} iconColor="fuchsia" title={t(`${S}.sections.externalPlatforms.title`)}>
                        <p>
                            {t(`${S}.sections.externalPlatforms.p1`)}
                        </p>
                        <p>
                            <Trans i18nKey={`${S}.sections.externalPlatforms.p2`} t={t} components={{ strong: comps.strong, em: comps.em }} />
                        </p>
                        <p>
                            <Trans i18nKey={`${S}.sections.externalPlatforms.p3`} t={t} components={{ 0: comps.strong, 1: comps.a_google_policy }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={LayoutTemplate} iconColor="teal" title={t(`${S}.sections.property.title`)}>
                        <p><Trans i18nKey={`${S}.sections.property.software`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.property.data`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    <SectionCard icon={ShieldCheck} iconColor="cyan" title={t(`${S}.sections.privacySection.title`)}>
                        <p>
                            {t(`${S}.sections.privacySection.p1`)}
                        </p>
                        <p>
                            <Trans i18nKey={`${S}.sections.privacySection.p2`} t={t} components={{ link_privacy: comps.link_privacy, 0: comps.strong }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={RefreshCcw} iconColor="rose" title={t(`${S}.sections.availability.title`)}>
                        <p>
                            {t(`${S}.sections.availability.p1`)}
                        </p>
                        <p>
                            {t(`${S}.sections.availability.p2`)}
                        </p>
                    </SectionCard>

                    <SectionCard icon={ShieldAlert} iconColor="amber" title={t(`${S}.sections.liability.title`)}>
                        <p>
                            {t(`${S}.sections.liability.p1`)}
                        </p>
                        <p>
                            {t(`${S}.sections.liability.p2`)}
                        </p>
                        <p>
                            <Trans i18nKey={`${S}.sections.liability.p3`} t={t} components={{ strong: comps.strong }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={ArchiveX} iconColor="violet" title={t(`${S}.sections.termination.title`)}>
                        <p><Trans i18nKey={`${S}.sections.termination.agency`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.termination.taimbox`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.termination.deletion`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    <SectionCard icon={Gavel} iconColor="indigo" title={t(`${S}.sections.modificationsSection.title`)}>
                        <p><Trans i18nKey={`${S}.sections.modificationsSection.changes`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.modificationsSection.law`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    {/* ─── Links ─── */}
                    <div className="pt-8 flex flex-wrap gap-4 justify-center text-sm">
                        <Link to={localizedPathFromEs('/privacidad', lang)} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {t(`${S}.sections.links.privacy`)}
                        </Link>
                        <Link to={localizedPathFromEs('/seguridad', lang)} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {t(`${S}.sections.links.security`)}
                        </Link>
                        <a href="mailto:hello@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {t(`${S}.sections.links.support`)}
                        </a>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
        </>
    );
}
