import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('instaco_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'hi' : 'en';
    setLanguage(nextLang);
    localStorage.setItem('instaco_lang', nextLang);
  };

  const setSpecificLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('instaco_lang', lang);
  };

  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setSpecificLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
