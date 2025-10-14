import React from 'react'
import { useTranslation } from '../i18n/useTranslation'

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation()

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    setLanguage(newLanguage)
  }

  return (
    <div className="language-toggle">
      <button
        onClick={() => handleLanguageChange('zh')}
        className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
        title="中文"
      >
        中文
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        title="English"
      >
        EN
      </button>
    </div>
  )
}

export default LanguageToggle
