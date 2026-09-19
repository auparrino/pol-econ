import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    // Spanish, not English. This is a dashboard about Argentine provincial
    // politics, its sources are INDEC and Mecon, and its own strings were
    // written in Argentine Spanish ("Hacé click"). A reader whose browser
    // language we cannot place is far likelier to want Spanish than English.
    // An English-language browser still gets English: detection wins over the
    // fallback, and this only decides what happens when detection finds nothing
    // either side recognises.
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      // ?lng=es ahead of the stored choice, so a link can carry its language.
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
      lookupLocalStorage: 'politicdash_lang',
    },
  });

export default i18n;
