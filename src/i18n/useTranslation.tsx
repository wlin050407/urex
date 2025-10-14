import React, { createContext, useContext, useState } from 'react'
import { translations, Translations } from './translations'

interface TranslationContextType {
  t: Translations
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'zh' | 'en'>('en')

  const value = {
    t: translations[language],
    language,
    setLanguage,
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
} 