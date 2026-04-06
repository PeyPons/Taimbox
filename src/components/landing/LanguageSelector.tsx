import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { pathEsToEn, pathEnToEs } from "@/i18n/publicPaths";
import { Globe, ChevronDown, Check } from "lucide-react";

export function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const currentLang = i18n.language.startsWith("en") ? "en" : "es";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageChange = (code: string) => {
        if (code === currentLang) {
            setIsOpen(false);
            return;
        }

        i18n.changeLanguage(code);

        let newHref = window.location.pathname;
        if (code === "en") {
            newHref = pathEsToEn(window.location.pathname);
        } else {
            newHref = pathEnToEs(window.location.pathname);
        }

        window.location.href = `${newHref}${window.location.search}${window.location.hash}`;
    };

    const languages = [
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "en", label: "English", flag: "🇺🇸" }, // Using US flag for English as it's often preferred in B2B if not specifically UK
    ];

    const currentLanguage = languages.find(l => l.code === currentLang);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                    isOpen
                        ? "bg-white/15 border-white/30 text-white"
                        : "bg-white/[0.05] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                )}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wider">{currentLang}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1.5">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200",
                                    currentLang === lang.code
                                        ? "bg-white/10 text-white font-semibold"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </div>
                                {currentLang === lang.code && <Check className="h-4 w-4 text-indigo-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
