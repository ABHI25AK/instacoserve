import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage}
      className="btn btn-secondary btn-sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
      title="Toggle English / Hindi Language"
    >
      <Globe size={16} color="#028090" />
      <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
    </button>
  );
}
