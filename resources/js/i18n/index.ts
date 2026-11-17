import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { am } from './am';
import { en } from './en';
import { om } from './om';
import type { LocaleCode, LocaleConfig, TranslationDictionary } from './types';

export * from './types';
export { en, am, om };

export const LOCALES: Record<LocaleCode, LocaleConfig> = {
    en: {
        code: 'en',
        label: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        dir: 'ltr',
    },
    am: {
        code: 'am',
        label: 'Amharic',
        nativeName: 'አማርኛ',
        flag: '🇪🇹',
        dir: 'ltr',
    },
    om: {
        code: 'om',
        label: 'Afaan Oromoo',
        nativeName: 'Afaan Oromoo',
        flag: '🇪🇹',
        dir: 'ltr',
    },
};

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const dictionaries: Record<LocaleCode, TranslationDictionary> = {
    en,
    am,
    om,
};

export const defaultNS = 'translation';
export const resources = {
    en: { translation: en },
    am: { translation: am },
    om: { translation: om },
} as const;

if (!i18n.isInitialized) {
    void i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources,
            defaultNS,
            fallbackLng: 'en',
            supportedLngs: ['en', 'am', 'om'],
            detection: {
                order: ['localStorage', 'navigator'],
                lookupLocalStorage: 'equb_locale',
                caches: ['localStorage'],
            },
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        });
}

export function getTranslation(locale: LocaleCode): TranslationDictionary {
    return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

export default i18n;
