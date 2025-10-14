import React from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import TimeControlPanel from './TimeControlPanel'

const ControlPanel: React.FC = () => {
  const { t } = useTranslation()
  const { 
    showOrbits, 
    setShowOrbits, 
    showLabels, 
    setShowLabels,
    followEarthRotation,
    setFollowEarthRotation,
    useRealScale,
    setUseRealScale
  } = useAppStore()

  const handleResetScene = () => {
    // 保持语言设置不变
    window.location.reload()
  }

  return (
    <>
      {/* 时间控制面板 - 使用新的可折叠组件 */}
      <TimeControlPanel />

      <div className="control-group">
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '6px' 
        }}>
          <input
            type="checkbox"
            checked={showOrbits}
            onChange={(e) => setShowOrbits(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          {t.showOrbits}
        </label>
      </div>

      <div className="control-group">
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '6px' 
        }}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          {t.showLabels}
        </label>
      </div>

      <div className="control-group">
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '6px' 
        }}>
          <input
            type="checkbox"
            checked={useRealScale}
            onChange={(e) => setUseRealScale(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          {t.realScaleOrbits}
        </label>
        <small style={{ display: 'block', marginTop: '4px', color: '#aaa' }}>
          {useRealScale ? t.realScaleDescription : t.beautifulScaleDescription}
        </small>
      </div>

      <div className="control-group">
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '6px' 
        }}>
          <input
            type="checkbox"
            checked={followEarthRotation}
            onChange={(e) => setFollowEarthRotation(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          {t.followEarthRotation}
        </label>
        <small style={{ display: 'block', marginTop: '4px', color: '#aaa' }}>
          {followEarthRotation ? t.earthFixedView : t.inertialSpaceView}
        </small>
      </div>

      <div className="control-group">
        <button
          onClick={handleResetScene}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 12,
            background: 'rgba(239,68,68,0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {t.resetScene}
        </button>
      </div>
    </>
  )
}

export default ControlPanel
