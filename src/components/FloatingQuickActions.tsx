import React from 'react'
import { useTranslation } from '../i18n/useTranslation'

const FloatingQuickActions: React.FC<{ onToggleAxes?: () => void; axesVisible?: boolean }> = ({ onToggleAxes, axesVisible }) => {
  const { language, setLanguage } = useTranslation()

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const handleRefresh = () => {
    // 简单自动刷新；后续可扩展为只刷新TLE/数据源
    window.location.reload()
  }

  return (
    <div className="floating-qa">
      <button
        className="fab-btn fab-lang"
        onClick={toggleLanguage}
        title={language === 'zh' ? '切换到 English' : 'Switch to 中文'}
      >
        {language === 'zh' ? '中' : 'EN'}
      </button>

      <button
        className="fab-btn fab-refresh"
        onClick={handleRefresh}
        title={language === 'zh' ? '自动刷新' : 'Auto Refresh'}
      >
        
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
          <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
        </svg>
      </button>

      <button
        className="fab-btn"
        onClick={onToggleAxes}
        title={language === 'zh' ? (axesVisible ? '隐藏ECI三轴' : '显示ECI三轴') : (axesVisible ? 'Hide ECI Axes' : 'Show ECI Axes')}
      >
        {language === 'zh' ? '轴' : 'AX'}
      </button>
    </div>
  )
}

export default FloatingQuickActions


