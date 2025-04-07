import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { translate } from '@/lib/i18n';

type LanguageContextType = {
  language: 'en' | 'ar';
  isRtl: boolean;
  toggleLanguage: () => void;
  t: (key: string, options?: Record<string, any>) => string;
};

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isRtl: false,
  toggleLanguage: () => {},
  t: (key) => key,
});

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    const savedLanguage = localStorage.getItem('appLanguage') as 'en' | 'ar';
    return savedLanguage || 'en';
  });
  
  const isRtl = language === 'ar';

  // Function to translate a key
  const t = (key: string, options?: Record<string, any>) => {
    return translate(key, options, language);
  };
  
  // Function to change language
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('appLanguage', newLanguage);
  };
  
  // Update the document language and direction when language changes
  useEffect(() => {
    console.log("Language changed to:", language);
    const htmlElement = document.documentElement;
    htmlElement.lang = language;
    htmlElement.dir = isRtl ? 'rtl' : 'ltr';
    
    // Store the language preference
    localStorage.setItem('appLanguage', language);
    
    // Update body font - Use Tajawal for Arabic, Roboto for English
    if (isRtl) {
      document.body.classList.add('font-sans', 'rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('font-sans', 'ltr');
      document.body.classList.remove('rtl');
    }
    
    // Force translation refresh
    document.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
  }, [language, isRtl]);
  
  return (
    <LanguageContext.Provider value={{ language, isRtl, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);