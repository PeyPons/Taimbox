import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pathEsToEn } from '@/i18n/publicPaths';
import { SeoTags } from '@/seo/SeoTags';
import { Mail, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/notify';
import { INPUT_LIMITS } from '@/constants/inputLimits';

export default function ContactoPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const { t, i18n } = useTranslation('landing');
    const lang = i18n.language.startsWith('en') ? 'en' : 'es';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const cleanName = formData.name.trim();
        const cleanEmail = formData.email.trim();
        const cleanSubject = (formData.subject || '').trim();
        const cleanMessage = formData.message.trim();

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
        if (!cleanName || !emailOk || !cleanSubject || !cleanMessage) {
            setStatus('error');
            setStatusMessage(t('static.contact.status.validationError'));
            toast.error(t('static.contact.toasts.validationError'));
            return;
        }

        if (
            cleanName.length > INPUT_LIMITS.personName
            || cleanEmail.length > INPUT_LIMITS.email
            || cleanSubject.length > INPUT_LIMITS.contactSubject
            || cleanMessage.length > INPUT_LIMITS.contactMessage
        ) {
            setStatus('error');
            setStatusMessage(t('static.contact.status.fieldLengthError'));
            toast.error(t('static.contact.toasts.fieldLengthError'));
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');
        setStatusMessage('');

        try {
            const { error } = await supabase.functions.invoke('send-contact-email', {
                body: {
                    name: cleanName,
                    email: cleanEmail,
                    subject: cleanSubject,
                    message: cleanMessage,
                },
            });

            if (error) {
                throw error;
            }

            setStatus('sent');
            setStatusMessage(t('static.contact.status.sentSuccess'));
            toast.success(t('static.contact.toasts.sentSuccess'));
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err: unknown) {
            console.error('[ContactoPage] Error enviando contacto:', err);
            setStatus('error');
            setStatusMessage(t('static.contact.status.sendError'));
            toast.error(t('static.contact.toasts.sendError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SeoTags
                pathEs="/contacto"
                pathEn={pathEsToEn('/contacto')}
                title={t('static.contact.seoTitle')}
                description={t('static.contact.seoDescription')}
                lang={lang}
            />
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
            </div>
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                aria-hidden
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />

            <LandingHeader />

            <main className="relative z-10 flex-1 pt-24 pb-16 sm:pt-32 sm:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 mt-4">
                            {t('static.contact.heroBefore')}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                {t('static.contact.heroHighlight')}
                            </span>
                        </h1>
                        <p className="text-lg text-indigo-100/80">
                            {t('static.contact.heroSubtitle')}
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                                <CardContent className="p-8 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-2">{t('static.contact.sidebarTitle')}</h3>
                                        <p className="text-slate-300 text-sm">
                                            {t('static.contact.sidebarDesc')}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400 mb-1">{t('static.contact.directEmail')}</p>
                                                <a href="mailto:hello@taimbox.com" className="text-base font-semibold text-white hover:text-indigo-400 transition-colors">
                                                    hello@taimbox.com
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400 mb-1">{t('static.contact.supportTitle')}</p>
                                                <p className="text-base text-white">
                                                    {t('static.contact.supportDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-3">
                            <Card className="bg-white border-slate-200/80 shadow-xl shadow-black/10">
                                <CardContent className="p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium text-slate-700">{t('static.contact.form.nameLabel')}</label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    maxLength={INPUT_LIMITS.personName}
                                                    placeholder={t('static.contact.form.namePlaceholder')}
                                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium text-slate-700">{t('static.contact.form.emailLabel')}</label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    maxLength={INPUT_LIMITS.email}
                                                    placeholder={t('static.contact.form.emailPlaceholder')}
                                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-slate-700">{t('static.contact.form.subjectLabel')}</label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                maxLength={INPUT_LIMITS.contactSubject}
                                                placeholder={t('static.contact.form.subjectPlaceholder')}
                                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium text-slate-700">{t('static.contact.form.messageLabel')}</label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                maxLength={INPUT_LIMITS.contactMessage}
                                                placeholder={t('static.contact.form.messagePlaceholder')}
                                                className="min-h-[150px] bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 resize-y"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 h-12 text-base font-medium"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    {t('static.contact.form.submitting')}
                                                </>
                                            ) : (
                                                <>
                                                    {t('static.contact.form.submit')}
                                                    <Send className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>

                                        {status !== 'idle' && (
                                            <div
                                                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                                                    status === 'sent'
                                                        ? 'border-emerald-200 bg-emerald-50'
                                                        : 'border-rose-200 bg-rose-50'
                                                }`}
                                            >
                                                {status === 'sent' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                                )}
                                                <div className={`text-sm ${status === 'sent' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                    {statusMessage}
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
        </>
    );
}
