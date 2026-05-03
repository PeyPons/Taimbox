import { Link, type LinkProps } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pathEsToEn } from '@/i18n/publicPaths';

/**
 * Drop-in replacement for <Link> that automatically converts Spanish paths
 * to English paths when the current language is English.
 *
 * Usage: <LocaleLink to="/blog/que-es-timeboxing" className="...">text</LocaleLink>
 */
export function LocaleLink({ to, children, ...rest }: LinkProps) {
    const { i18n } = useTranslation();
    const isEn = i18n.language.startsWith('en');

    const resolvedTo = typeof to === 'string' && isEn ? pathEsToEn(to) : to;

    return (
        <Link to={resolvedTo} {...rest}>
            {children}
        </Link>
    );
}
