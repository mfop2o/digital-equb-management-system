import { useCallback } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '@/i18n';

export function useTranslation(ns?: string) {
    const { t, i18n } = useI18nextTranslation(ns);

    const rawLocale = (
        i18n.resolvedLanguage ||
        i18n.language ||
        DEFAULT_LOCALE
    ).slice(0, 2) as LocaleCode;
    const locale: LocaleCode =
        rawLocale in LOCALES ? rawLocale : DEFAULT_LOCALE;

    const setLocale = useCallback(
        (newLocale: LocaleCode) => {
            void i18n.changeLanguage(newLocale);
        },
        [i18n],
    );

    return {
        t,
        i18n,
        locale,
        setLocale,
        currentConfig: LOCALES[locale] || LOCALES[DEFAULT_LOCALE],
        availableLocales: Object.values(LOCALES),
    };
}
