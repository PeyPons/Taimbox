import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { pathEsToEn, localizedPathFromEs } from '@/i18n/publicPaths';
import { SeoTags } from '@/seo/SeoTags';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
    Shield,
    Database,
    Cookie,
    Globe,
    Clock,
    UserCheck,
    Mail,
    Server,
    CreditCard,
    FileText,
    Lock,
    KeyRound,
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

export default function PrivacyPolicyPage() {
    const { t, i18n } = useTranslation('landing');
    const lang = i18n.language.startsWith('en') ? 'en' : 'es';
    
    // Helper for Trans components to keep it consistent
    const comps = {
        strong: <strong className="text-slate-200" />,
        em: <em />,
        a_mail: <a href="mailto:hello@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        a_google_policy: <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        a_google_perms: <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        a_aepd: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" />,
        br: <br />,
    };

    const S = 'static.privacy';

    return (
        <>
            <SeoTags
                pathEs="/privacidad"
                pathEn={pathEsToEn('/privacidad')}
                title={t(`${S}.seoTitle`)}
                description={t(`${S}.seoDescription`)}
                lang={lang}
            />
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <LandingHeader />

            <main className="flex-1 relative z-10 pt-32 pb-24">
                {/* Ambient glow */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                {/* ─── HERO ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-8">
                            <Shield className="h-4 w-4" />
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

                    <SectionCard icon={UserCheck} iconColor="indigo" title={t(`${S}.sections.responsible.title`)}>
                        <p>
                            <Trans i18nKey={`${S}.sections.responsible.p1`} t={t} components={{ 0: comps.strong }} />
                        </p>
                        <p>
                            <Trans i18nKey={`${S}.sections.responsible.p2`} t={t} components={{ 1: comps.a_mail }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={Database} iconColor="emerald" title={t(`${S}.sections.data.title`)}>
                        <p><Trans i18nKey={`${S}.sections.data.account`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.data.agency`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.data.payment`} t={t} components={{ 0: comps.strong, 2: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.data.integrations`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.data.usage`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    <SectionCard icon={KeyRound} iconColor="emerald" title={t(`${S}.sections.google.title`)}>
                        <p>
                            <Trans i18nKey={`${S}.sections.google.intro`} t={t} components={{ 1: comps.a_google_policy, em: comps.em }} />
                        </p>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s31Title`)}</strong></p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>{t(`${S}.sections.google.s31Item1`)}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>{t(`${S}.sections.google.s31Item2`)}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.google.s31Item3`} t={t} components={{ em: comps.em }} />
                            </li>
                        </ul>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s32Title`)}</strong></p>
                        <p><Trans i18nKey={`${S}.sections.google.s32P`} t={t} components={{ 0: comps.strong }} /></p>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s33Title`)}</strong></p>
                        <p>{t(`${S}.sections.google.s33P`)}</p>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s34Title`)}</strong></p>
                        <p>{t(`${S}.sections.google.s34P`)}</p>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s35Title`)}</strong></p>
                        <p><Trans i18nKey={`${S}.sections.google.s35P`} t={t} components={{ 0: comps.strong }} /></p>
                        <ul className="space-y-2 ml-1">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                    <Trans i18nKey={`${S}.sections.google.s35Item${i}`} t={t} components={{ em: comps.em }} />
                                </li>
                            ))}
                        </ul>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s36Title`)}</strong></p>
                        <p><Trans i18nKey={`${S}.sections.google.s36P`} t={t} components={{ em: comps.em }} /></p>

                        <p><strong className="text-slate-200">{t(`${S}.sections.google.s37Title`)}</strong></p>
                        <p>{t(`${S}.sections.google.s37P`)}</p>

                        <p>
                            <Trans i18nKey={`${S}.sections.google.s38Title`} t={t} components={{ 1: comps.a_google_perms, strong: comps.strong }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={FileText} iconColor="blue" title={t(`${S}.sections.purpose.title`)}>
                        <p>{t(`${S}.sections.purpose.intro`)}</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.purpose.p1`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.purpose.p2`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.purpose.p3`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.purpose.p4`} t={t} components={{ 0: comps.strong }} />
                            </li>
                        </ul>
                    </SectionCard>

                    <SectionCard icon={Cookie} iconColor="orange" title={t(`${S}.sections.cookies.title`)}>
                        <p>{t(`${S}.sections.cookies.intro`)}</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.cookies.necessary`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.cookies.analytical`} t={t} components={{ 0: comps.strong }} />
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <Trans i18nKey={`${S}.sections.cookies.marketing`} t={t} components={{ 0: comps.strong }} />
                            </li>
                        </ul>
                        <p>
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 text-sm"
                            >
                                {t(`${S}.sections.cookies.cta`)}
                            </button>
                        </p>
                    </SectionCard>

                    <SectionCard icon={Server} iconColor="teal" title={t(`${S}.sections.subprocessors.title`)}>
                        <p>{t(`${S}.sections.subprocessors.intro`)}</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse mt-2">
                                <thead>
                                    <tr className="text-left border-b border-slate-700">
                                        <th className="py-2 pr-4 text-slate-200 font-semibold">{t(`${S}.sections.subprocessors.table.vendor`)}</th>
                                        <th className="py-2 pr-4 text-slate-200 font-semibold">{t(`${S}.sections.subprocessors.table.function`)}</th>
                                        <th className="py-2 text-slate-200 font-semibold">{t(`${S}.sections.subprocessors.table.location`)}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-400">
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Amazon Web Services (AWS)</td>
                                        <td className="py-2 pr-4">{t(`${S}.sections.subprocessors.table.awsFunction`)}</td>
                                        <td className="py-2">{t(`${S}.sections.subprocessors.table.locationFrankfurt`)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Supabase</td>
                                        <td className="py-2 pr-4">{t(`${S}.sections.subprocessors.table.supabaseFunction`)}</td>
                                        <td className="py-2">{t(`${S}.sections.subprocessors.table.locationUE`)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Stripe</td>
                                        <td className="py-2 pr-4">{t(`${S}.sections.subprocessors.table.stripeFunction`)}</td>
                                        <td className="py-2">{t(`${S}.sections.subprocessors.table.locationStripe`)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Google (API Ads)</td>
                                        <td className="py-2 pr-4">{t(`${S}.sections.subprocessors.table.googleFunction`)}</td>
                                        <td className="py-2">{t(`${S}.sections.subprocessors.table.locationGlobal`)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-medium text-slate-300">Meta (API Ads)</td>
                                        <td className="py-2 pr-4">{t(`${S}.sections.subprocessors.table.metaFunction`)}</td>
                                        <td className="py-2">{t(`${S}.sections.subprocessors.table.locationGlobal`)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    <SectionCard icon={Globe} iconColor="cyan" title={t(`${S}.sections.transfers.title`)}>
                        <p><Trans i18nKey={`${S}.sections.transfers.p1`} t={t} components={{ 0: comps.strong }} /></p>
                        <p><Trans i18nKey={`${S}.sections.transfers.p2`} t={t} components={{ 0: comps.strong }} /></p>
                    </SectionCard>

                    <SectionCard icon={Clock} iconColor="amber" title={t(`${S}.sections.retention.title`)}>
                        <p>{t(`${S}.sections.retention.p1`)}</p>
                        <p><Trans i18nKey={`${S}.sections.retention.p2`} t={t} components={{ 0: comps.strong }} /></p>
                        <p>{t(`${S}.sections.retention.p3`)}</p>
                    </SectionCard>

                    <SectionCard icon={Lock} iconColor="violet" title={t(`${S}.sections.rights.title`)}>
                        <p>{t(`${S}.sections.rights.intro`)}</p>
                        <ul className="space-y-2 ml-1">
                            {[
                                { key: 'access', label: t(`${S}.sections.rights.access`), desc: t(`${S}.sections.rights.accessDesc`) },
                                { key: 'rectification', label: t(`${S}.sections.rights.rectification`), desc: t(`${S}.sections.rights.rectificationDesc`) },
                                { key: 'erasure', label: t(`${S}.sections.rights.erasure`), desc: t(`${S}.sections.rights.erasureDesc`) },
                                { key: 'portability', label: t(`${S}.sections.rights.portability`), desc: t(`${S}.sections.rights.portabilityDesc`) },
                                { key: 'objection', label: t(`${S}.sections.rights.objection`), desc: t(`${S}.sections.rights.objectionDesc`) },
                                { key: 'limitation', label: t(`${S}.sections.rights.limitation`), desc: t(`${S}.sections.rights.limitationDesc`) },
                            ].map((right) => (
                                <li key={right.key} className="flex items-start gap-2">
                                    <span className="text-violet-400 mt-1.5 shrink-0">•</span>
                                    <span><strong className="text-slate-200">{right.label}:</strong> {right.desc}</span>
                                </li>
                            ))}
                        </ul>
                        <p>
                            <Trans i18nKey={`${S}.sections.rights.cta`} t={t} components={{ 1: comps.a_mail }} />
                        </p>
                    </SectionCard>

                    <SectionCard icon={Mail} iconColor="rose" title={t(`${S}.sections.contact.title`)}>
                        <p><Trans i18nKey={`${S}.sections.contact.p1`} t={t} components={{ 1: comps.a_mail }} /></p>
                        <p><Trans i18nKey={`${S}.sections.contact.p2`} t={t} components={{ 1: comps.a_aepd }} /></p>
                    </SectionCard>

                    <SectionCard icon={CreditCard} iconColor="fuchsia" title={t(`${S}.sections.modifications.title`)}>
                        <p>{t(`${S}.sections.modifications.p1`)}</p>
                        <p>{t(`${S}.sections.modifications.p2`)}</p>
                    </SectionCard>

                    {/* ─── Otros enlaces ─── */}
                    <div className="pt-8 flex flex-wrap gap-4 justify-center text-sm">
                        <Link to={localizedPathFromEs('/condiciones', lang)} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {t(`${S}.sections.links.terms`)}
                        </Link>
                        <Link to={localizedPathFromEs('/seguridad', lang)} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            {t(`${S}.sections.links.security`)}
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
                        >
                            {t(`${S}.sections.links.cookies`)}
                        </button>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
        </>
    );
}
