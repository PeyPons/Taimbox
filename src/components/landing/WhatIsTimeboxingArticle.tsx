import { LocaleLink } from './blog/LocaleLink';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Clock,
    Target,
    Brain,
    Zap,
    AlertTriangle,
    TrendingUp,
    Users,
    CalendarDays,
    ListTodo,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { BlogReadingTime } from '@/components/landing/blog/BlogReadingTime';
import { BlogTOC, type BlogTOCItem } from '@/components/landing/blog/BlogTOC';
import { BlogRelatedPost } from '@/components/landing/blog/BlogRelatedPost';

export interface WhatIsTimeboxingArticleProps {
    readingMinutes?: number;
    tocItems?: BlogTOCItem[];
    relatedPost?: { title: string; description: string; href: string };
}

export function WhatIsTimeboxingArticle({ readingMinutes, tocItems, relatedPost }: WhatIsTimeboxingArticleProps = {}) {
    const { t } = useTranslation('blog');

    return (
        <article id="que-es-timeboxing" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* Gancho y Título Principal */}
            <section className="mb-12 sm:mb-14">
                <div className="mb-6 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                        {t('posts.whatIsTimeboxing.badge')}
                    </span>
                    {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
                    {t('posts.whatIsTimeboxing.title')}
                </h1>
                <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
                    <p>
                        <Trans
                            ns="blog"
                            i18nKey="posts.whatIsTimeboxing.intro.p1"
                            components={{ strong: <strong />, em: <em /> }}
                        />
                    </p>
                    <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
                        <p className="text-white/95 font-medium m-0">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.intro.callout"
                                components={{ strong: <strong /> }}
                            />
                        </p>
                    </div>
                    <p>
                        <Trans
                            ns="blog"
                            i18nKey="posts.whatIsTimeboxing.intro.p2"
                            components={{ strong: <strong /> }}
                        />
                    </p>
                </div>
                {tocItems != null && tocItems.length > 0 && (
                    <div className="mt-8">
                        <BlogTOC items={tocItems} />
                    </div>
                )}
            </section>

            {/* 1. Qué es el Timeboxing */}
            <section id="que-es-timeboxing-diferencia" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                    {t('posts.whatIsTimeboxing.section1.title')}
                </h2>
                <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    <p>
                        <Trans
                            ns="blog"
                            i18nKey="posts.whatIsTimeboxing.section1.p1"
                            components={{ strong: <strong />, em: <em /> }}
                        />
                    </p>
                    <p>
                        <Trans
                            ns="blog"
                            i18nKey="posts.whatIsTimeboxing.section1.p2"
                            components={{ strong: <strong /> }}
                        />
                    </p>
                    <ul className="space-y-3 mt-4">
                        <li className="flex gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
                            <span>
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section1.list.traditional"
                                    components={{ strong: <strong className="text-white" /> }}
                                />
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                            <span>
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section1.list.timeboxing"
                                    components={{ strong: <strong className="text-white" /> }}
                                />
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                        {t('posts.whatIsTimeboxing.section1.comparison.title')}
                    </h3>
                    <p className="text-indigo-100/90 mb-4">
                        {t('posts.whatIsTimeboxing.section1.comparison.p1')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
                            <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
                                <CalendarDays className="h-5 w-5 text-indigo-400" />
                                {t('posts.whatIsTimeboxing.section1.comparison.timeBlocking.title')}
                            </h4>
                            <p className="text-sm text-indigo-200/90">
                                {t('posts.whatIsTimeboxing.section1.comparison.timeBlocking.p1')}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center flex flex-col items-center">
                            <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
                                <Target className="h-5 w-5 text-purple-400" />
                                {t('posts.whatIsTimeboxing.section1.comparison.timeboxing.title')}
                            </h4>
                            <p className="text-sm text-indigo-200/90">
                                {t('posts.whatIsTimeboxing.section1.comparison.timeboxing.p1')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Bloques de Tiempo Rígidos vs. Flexibles */}
            <section id="bloques-rigidos-flexibles" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    {t('posts.whatIsTimeboxing.section2.title')}
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    <Trans
                        ns="blog"
                        i18nKey="posts.whatIsTimeboxing.section2.p1"
                        components={{ em: <em /> }}
                    />
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-orange-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg">
                        <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-red-300" />
                        </div>
                        <h3 className="text-white font-bold mb-3 text-xl">
                            {t('posts.whatIsTimeboxing.section2.hard.title')}
                        </h3>
                        <p className="text-indigo-100/90 text-sm leading-relaxed mb-4">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section2.hard.p1"
                                components={{ strong: <strong /> }}
                            />
                        </p>
                        <ul className="text-sm text-indigo-200/85 space-y-2 mt-auto">
                            <li>
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section2.hard.when"
                                    components={{ strong: <strong className="text-white" /> }}
                                />
                            </li>
                            <li>
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section2.hard.benefit"
                                    components={{ strong: <strong className="text-white" /> }}
                                />
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-emerald-300" />
                        </div>
                        <h3 className="text-white font-bold mb-3 text-xl">
                            {t('posts.whatIsTimeboxing.section2.soft.title')}
                        </h3>
                        <p className="text-indigo-100/90 text-sm leading-relaxed mb-4">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section2.soft.p1"
                                components={{ strong: <strong /> }}
                            />
                        </p>
                        <ul className="text-sm text-indigo-200/85 space-y-2 mt-auto">
                            <li>
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section2.soft.when"
                                    components={{ strong: <strong className="text-white" /> }}
                                />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Cápsula Taimbox 1 */}
                <div className="rounded-2xl border-2 border-indigo-500/40 bg-indigo-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">💡</span>
                            {t('posts.whatIsTimeboxing.section2.capsule.title')}
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section2.capsule.p1"
                                components={{ strong: <strong /> }}
                            />
                        </p>
                        <LocaleLink to="/planificador-recursos" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                                {t('posts.whatIsTimeboxing.section2.capsule.cta')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </LocaleLink>
                    </div>
                </div>
            </section>

            {/* 3. Neurociencia */}
            <section id="neurociencia" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    {t('posts.whatIsTimeboxing.section3.title')}
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    {t('posts.whatIsTimeboxing.section3.p1')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5 flex flex-col items-center text-center">
                        <Brain className="h-8 w-8 text-purple-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">
                            {t('posts.whatIsTimeboxing.section3.cards.decisionFatigue.title')}
                        </h4>
                        <p className="text-sm text-indigo-200/85">
                            {t('posts.whatIsTimeboxing.section3.cards.decisionFatigue.p1')}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5 flex flex-col items-center text-center">
                        <Target className="h-8 w-8 text-indigo-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">
                            {t('posts.whatIsTimeboxing.section3.cards.flowState.title')}
                        </h4>
                        <p className="text-sm text-indigo-200/85">
                            {t('posts.whatIsTimeboxing.section3.cards.flowState.p1')}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 flex flex-col items-center text-center">
                        <Zap className="h-8 w-8 text-emerald-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">
                            {t('posts.whatIsTimeboxing.section3.cards.reward.title')}
                        </h4>
                        <p className="text-sm text-indigo-200/85">
                            {t('posts.whatIsTimeboxing.section3.cards.reward.p1')}
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. Implementación paso a paso */}
            <section id="implementacion-paso-a-paso" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    {t('posts.whatIsTimeboxing.section4.title')}
                </h2>

                <div className="space-y-6 mb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">1</div>
                        <div className="flex-1 w-full">
                            <h4 className="text-white font-bold text-lg mb-2">
                                {t('posts.whatIsTimeboxing.section4.steps.1.title')}
                            </h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base mb-2">
                                {t('posts.whatIsTimeboxing.section4.steps.1.p1')}
                            </p>
                            <div className="text-sm px-4 py-3 bg-indigo-950/50 rounded-lg border border-indigo-500/30 text-indigo-100">
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section4.steps.1.example"
                                    components={{ strong: <strong className="text-indigo-300" /> }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">2</div>
                        <div className="flex-1 w-full">
                            <h4 className="text-white font-bold text-lg mb-2">
                                {t('posts.whatIsTimeboxing.section4.steps.2.title')}
                            </h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base mb-2">
                                {t('posts.whatIsTimeboxing.section4.steps.2.p1')}
                            </p>
                            <div className="text-sm px-4 py-3 bg-indigo-950/50 rounded-lg border border-indigo-500/30 text-indigo-100">
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.section4.steps.2.example"
                                    components={{ strong: <strong className="text-indigo-300" /> }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">3</div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-2">
                                {t('posts.whatIsTimeboxing.section4.steps.3.title')}
                            </h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base">
                                {t('posts.whatIsTimeboxing.section4.steps.3.p1')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cápsula Taimbox 2 */}
                <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">⏱️</span>
                            {t('posts.whatIsTimeboxing.section4.capsule.title')}
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            {t('posts.whatIsTimeboxing.section4.capsule.p1')}
                        </p>
                        <LocaleLink to="/dashboard-empleado" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
                                {t('posts.whatIsTimeboxing.section4.capsule.cta')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </LocaleLink>
                    </div>
                </div>
            </section>

            {/* 5. Equipos y Rentabilidad */}
            <section id="equipos-rentabilidad" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    {t('posts.whatIsTimeboxing.section5.title')}
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    <Trans
                        ns="blog"
                        i18nKey="posts.whatIsTimeboxing.section5.p1"
                        components={{ strong: <strong /> }}
                    />
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-900/30 to-slate-900/50 flex flex-col items-center text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-400" />
                            {t('posts.whatIsTimeboxing.section5.cards.leaks.title')}
                        </h4>
                        <p className="text-sm text-indigo-200/85 leading-relaxed">
                            {t('posts.whatIsTimeboxing.section5.cards.leaks.p1')}
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-900/30 to-slate-900/50 flex flex-col items-center text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                            <Users className="h-5 w-5 text-indigo-400" />
                            {t('posts.whatIsTimeboxing.section5.cards.capacity.title')}
                        </h4>
                        <p className="text-sm text-indigo-200/85 leading-relaxed">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section5.cards.capacity.p1"
                                components={{ em: <em /> }}
                            />
                        </p>
                    </div>
                </div>

                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    <Trans
                        ns="blog"
                        i18nKey="posts.whatIsTimeboxing.section5.p2"
                        components={{
                            Link: (
                                <LocaleLink
                                    to="/blog/gestion-carga-trabajo-equipo-sin-burnout"
                                    className="text-indigo-300 hover:text-white underline underline-offset-2"
                                />
                            )
                        }}
                    />
                </p>

                {/* Cápsula Taimbox 3 */}
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">💰</span>
                            {t('posts.whatIsTimeboxing.section5.capsule.title')}
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            {t('posts.whatIsTimeboxing.section5.capsule.p1')}
                        </p>
                        <LocaleLink to="/integraciones" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                {t('posts.whatIsTimeboxing.section5.capsule.cta')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </LocaleLink>
                    </div>
                </div>
            </section>

            {/* 6. Reuniones */}
            <section id="timeboxing-reuniones" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    {t('posts.whatIsTimeboxing.section6.title')}
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    {t('posts.whatIsTimeboxing.section6.p1')}
                </p>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section6.list.item1"
                                components={{ strong: <strong className="text-white" /> }}
                            />
                        </p>
                    </li>
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section6.list.item2"
                                components={{ strong: <strong className="text-white" /> }}
                            />
                        </p>
                    </li>
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0">
                            <Trans
                                ns="blog"
                                i18nKey="posts.whatIsTimeboxing.section6.list.item3"
                                components={{ strong: <strong className="text-white" /> }}
                            />
                        </p>
                    </li>
                </ul>
            </section>

            {/* FAQ y Conclusión */}
            <section className="mb-12">
                <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 scroll-mt-24">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
                        {t('posts.whatIsTimeboxing.faq.title')}
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-white font-semibold mb-2">
                                {t('posts.whatIsTimeboxing.faq.q1.title')}
                            </h4>
                            <p className="text-sm text-indigo-200/90">
                                {t('posts.whatIsTimeboxing.faq.q1.p1')}
                            </p>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div>
                            <h4 className="text-white font-semibold mb-2">
                                {t('posts.whatIsTimeboxing.faq.q2.title')}
                            </h4>
                            <p className="text-sm text-indigo-200/90">
                                <Trans
                                    ns="blog"
                                    i18nKey="posts.whatIsTimeboxing.faq.q2.p1"
                                    components={{ em: <em /> }}
                                />
                            </p>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div>
                            <h4 className="text-white font-semibold mb-2">
                                {t('posts.whatIsTimeboxing.faq.q3.title')}
                            </h4>
                            <p className="text-sm text-indigo-200/90">
                                {t('posts.whatIsTimeboxing.faq.q3.p1')}
                            </p>
                        </div>
                    </div>
                </div>

                {relatedPost != null && (
                    <div className="mb-10">
                        <BlogRelatedPost title={relatedPost.title} description={relatedPost.description} href={relatedPost.href} />
                    </div>
                )}
                <div id="cta-rentabilidad" className="text-center mt-12 mb-8 scroll-mt-24">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
                        {t('posts.whatIsTimeboxing.cta.title')}
                    </h2>
                    <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
                        {t('posts.whatIsTimeboxing.cta.p1')}
                    </p>
                    <LocaleLink to="/">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-indigo-500/20 rounded-xl"
                        >
                            {t('posts.whatIsTimeboxing.cta.button')}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </LocaleLink>
                    <p className="text-indigo-300 text-sm mt-6 italic">
                        {t('posts.whatIsTimeboxing.cta.note')}
                    </p>
                </div>
            </section>
        </article>
    );
}
