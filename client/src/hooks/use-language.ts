import { useState, useEffect, useCallback } from 'react';
import { translate } from '@/lib/i18n';

export function useLanguage() {
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    const savedLanguage = localStorage.getItem('appLanguage') as 'en' | 'ar';
    return savedLanguage || 'en';
  });
  
  const isRtl = language === 'ar';

  // Function to translate a key
  const t = useCallback((key: string, options?: Record<string, any>) => {
    return translate(key, options, language);
  }, [language]);
  
  // Function to change language
  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('appLanguage', newLanguage);
  }, [language]);
  
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
    
    // Force translation refresh on language change
    document.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
  }, [language, isRtl]);
  
  return {
    language,
    setLanguage,
    toggleLanguage,
    isRtl,
    t
  };
}
