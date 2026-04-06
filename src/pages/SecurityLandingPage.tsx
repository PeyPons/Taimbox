import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { CommercialSeoTags } from '@/seo/CommercialSeoTags';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Lock,
    Key,
    Database,
    Server,
    CheckCircle2,
    Building2,
    ArrowRight,
    Globe,
    FileText,
    Users,
    Activity,
    AlertTriangle,
    Mail,
    CreditCard,
    Download,
} from 'lucide-react';
import { localizedPathFromEs } from '@/i18n/publicPaths';

const P = 'commercial.security.page';

export default function SecurityLandingPage() {
    const { t, i18n } = useTranslation('landing');
    const infraBullets = t(`${P}.infraBullets`, { returnObjects: true }) as string[];

    return (
        <>
            <CommercialSeoTags pathEs="/seguridad" pageKey="security" />
            <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
                <LandingHeader />

                <main className="flex-1 relative z-10 pt-32 pb-24">
                    <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-emerald-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 relative">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8">
                                <Shield className="h-4 w-4" />
                                {t(`${P}.heroBadge`)}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                                {t(`${P}.heroTitle1`)} <br />
                                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                    {t(`${P}.heroTitleGradient`)}
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">{t(`${P}.heroSubtitle`)}</p>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                        <div className="text-center mb-12">
                            <h2 className="text-sm font-semibold text-emerald-500 tracking-wider uppercase mb-2">{t(`${P}.threePillarsKicker`)}</h2>
                            <h3 className="text-3xl font-bold text-white">{t(`${P}.threePillarsH2`)}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-6">
                                    <Database className="h-6 w-6 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{t(`${P}.pillar1Title`)}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.pillar1Body`}
                                        ns="landing"
                                        components={{ strong: <strong className="text-slate-200" /> }}
                                    />
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6">
                                    <Lock className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{t(`${P}.pillar2Title`)}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.pillar2Body`}
                                        ns="landing"
                                        components={{ strong: <strong className="text-slate-200" /> }}
                                    />
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6">
                                    <Key className="h-6 w-6 text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{t(`${P}.pillar3Title`)}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.pillar3Body`}
                                        ns="landing"
                                        components={{ strong: <strong className="text-slate-200" /> }}
                                    />
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 sm:p-12 overflow-hidden relative shadow-2xl">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />

                            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6">{t(`${P}.infraH2`)}</h2>
                                    <p className="text-slate-400 leading-relaxed mb-6">
                                        <Trans
                                            i18nKey={`${P}.infraP`}
                                            ns="landing"
                                            components={{ strong: <strong className="text-slate-200" /> }}
                                        />
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {infraBullets.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                                                <span className="text-slate-300 text-sm">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex justify-center relative">
                                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl w-full max-w-sm relative z-10">
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                                            <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                                                <Server className="h-4 w-4" /> {t(`${P}.mockNodeLabel`)}
                                            </span>
                                            <span className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {t(`${P}.mockHealthy`)}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-90 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                                                <Building2 className="h-5 w-5 text-indigo-400 relative z-10" />
                                                <div className="flex-1 relative z-10">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[10px] text-slate-400 font-mono">{t(`${P}.mockAgency1`)}</span>
                                                        <Lock className="h-3 w-3 text-emerald-400" />
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="w-1/3 h-full bg-indigo-500" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center -my-1 relative z-20">
                                                <div className="px-3 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase tracking-widest shadow-lg">
                                                    {t(`${P}.mockRlsWall`)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-90 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                                                <Building2 className="h-5 w-5 text-orange-400 relative z-10" />
                                                <div className="flex-1 relative z-10">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[10px] text-slate-400 font-mono">{t(`${P}.mockAgency2`)}</span>
                                                        <Lock className="h-3 w-3 text-emerald-400" />
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="w-2/3 h-full bg-orange-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                                            <Shield className="h-3 w-3 text-emerald-500" /> {t(`${P}.mockPartitionFooter`)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                        <div className="text-center mb-12">
                            <h2 className="text-sm font-semibold text-blue-500 tracking-wider uppercase mb-2">{t(`${P}.ppcSectionKicker`)}</h2>
                            <h3 className="text-3xl font-bold text-white">{t(`${P}.ppcSectionH2`)}</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-blue-500/20 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                                    <div className="flex flex-col gap-4 relative z-10">
                                        <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/5 p-2 rounded-lg">
                                                    <Globe className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{t(`${P}.googleApiTitle`)}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{t(`${P}.googleApiScope`)}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                {t(`${P}.oauthScopeBadge`)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center py-2 relative h-12">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-emerald-500/50 -translate-x-1/2 border-dashed border-l border-white/20" />
                                            <ArrowRight className="h-5 w-5 text-emerald-400 rotate-90 transform bg-slate-950 p-1 z-10 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                        </div>

                                        <div className="p-5 rounded-xl bg-slate-900/90 border border-emerald-500/20 relative shadow-xl backdrop-blur-sm">
                                            <p className="text-xs font-bold text-emerald-400 mb-4 px-1">{t(`${P}.permHeader`)}</p>
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-3 text-xs text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {t(`${P}.perm1`)}
                                                </li>
                                                <li className="flex items-center gap-3 text-xs text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {t(`${P}.perm2`)}
                                                </li>
                                                <li className="flex items-center gap-3 text-xs text-slate-500 opacity-60 px-2 mt-4">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />{' '}
                                                    <span className="line-through decoration-red-500/50">{t(`${P}.denied1`)}</span> ({t(`${P}.deniedSuffix`)})
                                                </li>
                                                <li className="flex items-center gap-3 text-xs text-slate-500 opacity-60 px-2">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />{' '}
                                                    <span className="line-through decoration-red-500/50">{t(`${P}.denied2`)}</span> ({t(`${P}.deniedSuffix`)})
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2">
                                <h4 className="text-xl font-bold text-white mb-4">{t(`${P}.ppcRightH4`)}</h4>
                                <p className="text-slate-400 mb-6 leading-relaxed">{t(`${P}.ppcRightP1`)}</p>
                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.ppcRightP2`}
                                        ns="landing"
                                        components={{ strong: <strong className="text-slate-200" /> }}
                                    />
                                </p>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.ppcRightP3`}
                                        ns="landing"
                                        components={{
                                            code: <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-fuchsia-300" />,
                                        }}
                                    />
                                </p>
                                <Link to={localizedPathFromEs('/monitor-ppc', i18n.language)}>
                                    <Button className="bg-white/10 hover:bg-white/20 text-white border-0 transition-colors">
                                        {t(`${P}.monitorCtaBtn`)} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">{t(`${P}.appSectionH2`)}</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">{t(`${P}.appSectionSubtitle`)}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-blue-500/20 transition-all group flex items-start gap-5">
                                <div className="mt-1 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 group-hover:scale-105 transition-transform">
                                    <Users className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg text-white font-bold mb-2">{t(`${P}.appCard1Title`)}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">{t(`${P}.appCard1P`)}</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-fuchsia-500/20 transition-all group flex items-start gap-5">
                                <div className="mt-1 bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20 group-hover:scale-105 transition-transform">
                                    <Activity className="h-6 w-6 text-fuchsia-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg text-white font-bold mb-2">{t(`${P}.appCard2Title`)}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">{t(`${P}.appCard2P`)}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">{t(`${P}.complianceH2`)}</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">{t(`${P}.complianceSubtitle`)}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-emerald-500/20 transition-all group flex items-start gap-5">
                                <div className="mt-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-transform">
                                    <CreditCard className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg text-white font-bold mb-2">{t(`${P}.complianceCard1Title`)}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        <Trans
                                            i18nKey={`${P}.complianceCard1P`}
                                            ns="landing"
                                            components={{ strong: <strong className="text-slate-200" /> }}
                                        />
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-indigo-500/20 transition-all group flex items-start gap-5">
                                <div className="mt-1 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                    <Download className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg text-white font-bold mb-2">{t(`${P}.complianceCard2Title`)}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">{t(`${P}.complianceCard2P`)}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-20 bg-slate-950">
                        <h3 className="text-2xl font-bold text-white mb-8 text-center">{t(`${P}.faqH3`)}</h3>

                        <div className="space-y-4">
                            {(
                                [
                                    ['faq1q', 'faq1a'],
                                    ['faq2q', 'faq2a'],
                                    ['faq3q', 'faq3a'],
                                    ['faq4q', 'faq4a'],
                                ] as const
                            ).map(([qk, ak]) => (
                                <div key={qk} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:bg-slate-900/80">
                                    <h4 className="text-white font-semibold mb-3 text-lg">{t(`${P}.${qk}`)}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        <Trans
                                            i18nKey={`${P}.${ak}`}
                                            ns="landing"
                                            components={{ strong: <strong className="text-slate-200" /> }}
                                        />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Lock className="w-64 h-64 text-emerald-500" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-4xl font-black text-white mb-6">{t(`${P}.ctaH2`)}</h2>
                                <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-base">{t(`${P}.ctaP`)}</p>
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <Link to={localizedPathFromEs('/api-docs', i18n.language)} className="w-full sm:w-auto">
                                        <Button className="w-full h-12 bg-white hover:bg-slate-200 text-slate-950 font-bold px-8 transition-colors">
                                            <FileText className="mr-2 h-4 w-4" />
                                            {t(`${P}.ctaApiBtn`)}
                                        </Button>
                                    </Link>
                                    <a href="mailto:security@taimbox.com" className="w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-8 transition-colors"
                                        >
                                            <Mail className="mr-2 h-4 w-4" />
                                            {t(`${P}.ctaMailBtn`)}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <LandingFooter />
            </div>
        </>
    );
}
