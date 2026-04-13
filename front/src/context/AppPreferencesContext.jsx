import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_LOCALES, TRANSLATIONS } from '../utils/appTranslations';

const STORAGE_KEY = 'app_preferences_v1';
const DEFAULT_LANGUAGE = 'en';
const AppPreferencesContext = createContext(null);

function readStoredPreferences() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
}

function getNestedTranslation(source, key) {
  return String(key || '')
    .split('.')
    .reduce((currentValue, part) => (currentValue && currentValue[part] !== undefined ? currentValue[part] : undefined), source);
}

export function AppPreferencesProvider({ children }) {
  const storedPreferences = readStoredPreferences();
  const [language, setLanguageState] = useState(storedPreferences.language || DEFAULT_LANGUAGE);
  const [adminPhotoUrl, setAdminPhotoUrlState] = useState(storedPreferences.adminPhotoUrl || '');
  const [adminDisplayName, setAdminDisplayNameState] = useState(storedPreferences.adminDisplayName || '');

  useEffect(() => {
    const nextPreferences = {
      language,
      adminPhotoUrl,
      adminDisplayName,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  }, [adminDisplayName, adminPhotoUrl, language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => {
    const locale = LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES[DEFAULT_LANGUAGE];
    const translations = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];

    function t(key, fallback = '') {
      return getNestedTranslation(translations, key)
        || getNestedTranslation(TRANSLATIONS[DEFAULT_LANGUAGE], key)
        || fallback
        || key;
    }

    return {
      language,
      locale,
      isRTL: language === 'ar',
      adminPhotoUrl,
      adminDisplayName,
      setLanguage: setLanguageState,
      setAdminPhotoUrl: setAdminPhotoUrlState,
      setAdminDisplayName: setAdminDisplayNameState,
      t,
      languageOptions: ['en', 'fr', 'ar'].map((code) => ({
        value: code,
        label: t(`languageNames.${code}`),
      })),
    };
  }, [adminDisplayName, adminPhotoUrl, language]);

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used within an AppPreferencesProvider');
  }

  return context;
}
