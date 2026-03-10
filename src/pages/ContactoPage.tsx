import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, CheckCircle2, Phone, MapPin, Loader2 } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactoPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Construct mailto link
        // De momento solo a hola@taimbox.com
        const subject = encodeURIComponent(formData.subject || `Contacto desde web: ${formData.name}`);
        const body = encodeURIComponent(
            `Nombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`
        );

        // Simulate slight delay for UX
        setTimeout(() => {
            setIsSubmitting(false);
            window.location.href = `mailto:hola@taimbox.com?subject=${subject}&body=${body}`;
        }, 600);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-indigo-500/30">
            <Helmet>
                <title>Contacto | Taimbox</title>
                <meta name="description" content="Contacta con el equipo de Taimbox." />
            </Helmet>

            <LandingHeader />

            <main className="flex-1 relative pt-24 pb-16 sm:pt-32 sm:pb-24">
                {/* Background glows */}
                <div className="absolute top-1/4 -left-64 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 -right-64 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 mt-4">
                            ¿En qué podemos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ayudarte?</span>
                        </h1>
                        <p className="text-lg text-indigo-100/80">
                            Estamos aquí para resolver tus dudas, escuchar tus sugerencias o ayudarte a dar el salto al siguiente nivel con Taimbox.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

                        {/* Contact Info Sidebar */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                                <CardContent className="p-8 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Ponte en contacto</h3>
                                        <p className="text-slate-300 text-sm">
                                            Escríbenos directamente o utiliza el formulario. Te responderemos lo antes posible.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400 mb-1">Email directo</p>
                                                <a href="mailto:hola@taimbox.com" className="text-base font-semibold text-white hover:text-indigo-400 transition-colors">
                                                    hola@taimbox.com
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400 mb-1">Soporte Técnico</p>
                                                <p className="text-base text-white">
                                                    Si ya eres cliente, usa el panel de Soporte en tu área de Agencia con prioridad alta.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Form */}
                        <div className="lg:col-span-3">
                            <Card className="bg-slate-900 border-white/10 shadow-2xl overflow-hidden relative">
                                {/* Decorative top border */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

                                <CardContent className="p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium text-slate-300">Nombre completo</label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Tu nombre"
                                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium text-slate-300">Email de trabajo</label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="tu@empresa.com"
                                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-slate-300">Asunto</label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                placeholder="¿Sobre qué quieres hablarnos?"
                                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium text-slate-300">Mensaje</label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                placeholder="Escribe tu mensaje aquí..."
                                                className="min-h-[150px] bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 resize-y"
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
                                                    Preparando envío...
                                                </>
                                            ) : (
                                                <>
                                                    Abrir correo para enviar
                                                    <Send className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-center text-slate-500 mt-4">
                                            Al enviar, se abrirá tu cliente de correo (Gmail, Outlook, etc.) con el mensaje pre-rellenado hacia hola@taimbox.com
                                        </p>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
