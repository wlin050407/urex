import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'

const TimeControlPanel: React.FC = () => {
  const { t, language } = useTranslation()
  const { 
    timeSpeed, 
    setTimeSpeed, 
    currentTime,
    isTimeCustom,
    isPaused,
    setCurrentTime,
    pauseTime,
    resumeTime,
    reverseTime,
    resetToRealTime,
    getCurrentEffectiveTime
  } = useAppStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [customTimeInput, setCustomTimeInput] = useState('')
  const [displayTime, setDisplayTime] = useState(new Date()) // 模拟时间
  const [realTime, setRealTime] = useState(new Date()) // 真实UTC

  // 更新显示时间 - 使用store中的getCurrentEffectiveTime方法
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime(getCurrentEffectiveTime())
      setRealTime(new Date())
    }, 100) // 100ms更新一次以显示时间变化
    return () => clearInterval(interval)
  }, [getCurrentEffectiveTime])

  // 拖动滑块等关键参数变化时，立即刷新模拟时间
  useEffect(() => {
    setDisplayTime(getCurrentEffectiveTime())
  }, [timeSpeed, isPaused, isTimeCustom, currentTime])

  // 对数滑块的值
  const [sliderValue, setSliderValue] = useState(0)

  // 滑块值和timeSpeed的双向映射
  useEffect(() => {
    if (timeSpeed === 0) {
      setSliderValue(0)
    } else {
      setSliderValue(Math.sign(timeSpeed) * Math.log10(Math.abs(timeSpeed)))
    }
  }, [timeSpeed])

  // 滑块变化时，映射到timeSpeed
  const handleSliderChange = (val: number) => {
    let speed = 0
    if (Math.abs(val) < 0.05) {
      speed = 0
    } else {
      speed = Math.sign(val) * Math.pow(10, Math.abs(val))
    }
    setTimeSpeed(speed)
  }

  // 处理自定义时间输入
  const handleCustomTimeSubmit = () => {
    try {
      const newTime = new Date(customTimeInput)
      if (!isNaN(newTime.getTime())) {
        setCurrentTime(newTime)
        setCustomTimeInput('')
      } else {
        alert(t.invalidTimeFormat)
      }
    } catch (error) {
      alert(t.timeFormatError)
    }
  }

  // 格式化GMT时间显示
  const formatGMTTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').replace('.000Z', ' GMT')
  }

  // 获取时间状态显示文本
  const getTimeStatusText = () => {
    if (isPaused) return t.paused
    if (timeSpeed < 0) return `${Math.abs(timeSpeed).toFixed(2)}x ${t.reversing}`
    if (timeSpeed > 0) return `${timeSpeed.toFixed(2)}x ${t.forwarding}`
    return t.paused
  }

  // 播放器形状的SVG图标组件
  const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )

  const PauseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  )

  const ReverseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 5v14L5 12z"/>
    </svg>
  )

  const ResetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>
  )

  // 用于避免 TypeScript 警告的工具函数
  const _unused = { currentTime, PlayIcon, PauseIcon, ReverseIcon, reverseTime }
  console.debug('TimeControlPanel variables:', _unused) // 开发环境下的调试信息

  return (
    <div className="control-group">
      {/* 可折叠标题栏 */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          marginBottom: isExpanded ? '12px' : '0',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }}
      >
        <div>
          <label style={{ cursor: 'pointer', fontWeight: '500', color: '#e2e8f0' }}>
            {t.timeControl} · {getTimeStatusText()}
          </label>
          <div style={{ 
            fontSize: '11px', 
            color: isTimeCustom ? '#fbbf24' : '#60a5fa',
            marginTop: '2px',
            fontFamily: 'monospace'
          }}>
            {formatGMTTime(displayTime)}
          </div>
        </div>
        <span style={{ 
          fontSize: '14px', 
          color: '#94a3b8',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </span>
      </div>

      {/* 可展开的控制面板 */}
      {isExpanded && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '16px',
          animation: 'slideDown 0.3s ease'
        }}>
          {/* 时间速度控制和播放按钮 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: '#94a3b8', fontWeight: '500', minWidth: 90, width: 90, letterSpacing: 1 }}>
              {t.timeSpeed}: {isPaused ? t.paused : `${timeSpeed.toFixed(2)}x`}
            </label>
            
            {/* 播放控制按钮 - 放在速度条上方 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '24px', 
              marginBottom: '16px',
              padding: '8px 0'
            }}>
              {/* 倒退按钮 - 双左箭头 */}
              <button 
                onClick={() => setTimeSpeed(timeSpeed === 0 ? -1 : timeSpeed / 10)}
                style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: timeSpeed < 0 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: timeSpeed < 0 
                    ? '2px solid rgba(59, 130, 246, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.background = timeSpeed < 0 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.borderColor = timeSpeed < 0 
                    ? 'rgba(59, 130, 246, 0.4)' 
                    : 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = timeSpeed < 0 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = timeSpeed < 0 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={timeSpeed < 0 ? '#3b82f6' : '#94a3b8'}>
                  <path d="M11 7l-7 5 7 5V7zm7 0l-7 5 7 5V7z"/>
                </svg>
              </button>

              {/* 暂停/播放按钮 - 中心按钮 */}
              <button 
                onClick={isPaused ? resumeTime : pauseTime}
                style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                {isPaused ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#e2e8f0">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                )}
              </button>

              {/* 快进按钮 - 双右箭头 */}
              <button 
                onClick={() => setTimeSpeed(timeSpeed === 0 ? 1 : timeSpeed * 10)}
                style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: timeSpeed > 0 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: timeSpeed > 0 
                    ? '2px solid rgba(59, 130, 246, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.background = timeSpeed > 0 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.borderColor = timeSpeed > 0 
                    ? 'rgba(59, 130, 246, 0.4)' 
                    : 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = timeSpeed > 0 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = timeSpeed > 0 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={timeSpeed > 0 ? '#3b82f6' : '#94a3b8'}>
                  <path d="M6 7l7 5-7 5V7zm7 0l7 5-7 5V7z"/>
                </svg>
              </button>
            </div>

            {/* 速度滑块 */}
            <input
              type="range"
              min={-4}
              max={4}
              step={0.01}
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '8px',
                accentColor: '#3b82f6',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <small style={{ display: 'block', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>
              {language === 'zh' ? '负值为倒退，正值为前进，0为暂停' : 'Negative: reverse, Positive: forward, 0: pause'}
            </small>
            
            {/* 重置按钮 - 移到底部 */}
            <button 
              onClick={resetToRealTime}
              style={{ 
                width: '100%',
                padding: '10px 16px', 
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
              }}
            >
              <ResetIcon /> {t.resetToRealTime}
            </button>
          </div>

          {/* 当前时间显示 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
              {isTimeCustom ? `${t.customTime} (GMT)` : `${t.realTime} (GMT)`}
            </label>
            <div style={{ 
              fontSize: '13px', 
              color: isTimeCustom ? '#fbbf24' : '#60a5fa',
              fontFamily: 'monospace',
              background: 'rgba(255,255,255,0.05)',
              padding: '10px 12px',
              borderRadius: '6px',
              border: `1px solid ${isTimeCustom ? 'rgba(251, 191, 36, 0.2)' : 'rgba(96, 165, 250, 0.2)'}`,
              fontWeight: '500'
            }}>
              {formatGMTTime(displayTime)}
            </div>
            {isTimeCustom && (
              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px' }}>
                {language === 'zh' ? '自定义时间模式 - 时间按设定速度运行' : 'Custom time mode - time runs at set speed'}
              </div>
            )}
          </div>
          
          {/* 自定义时间输入 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
              {t.setTime}
            </label>
            <input
              type="datetime-local"
              value={customTimeInput}
              onChange={(e) => setCustomTimeInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#e2e8f0',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
              placeholder={t.enterCustomTime}
            />
            <button
              onClick={handleCustomTimeSubmit}
              disabled={!customTimeInput}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                background: customTimeInput 
                  ? 'rgba(34, 197, 94, 0.15)' 
                  : 'rgba(255,255,255,0.05)',
                color: customTimeInput ? '#22c55e' : '#6b7280',
                border: customTimeInput 
                  ? '1px solid rgba(34, 197, 94, 0.3)' 
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: customTimeInput ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
            >
              {t.setTime}
            </button>
          </div>
        </div>
      )}

      {/* 真实UTC时间显示 */}
      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
          Real Time (GMT)
        </label>
        <div style={{ 
          fontSize: '13px', 
          color: '#60a5fa',
          fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.05)',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          fontWeight: '500'
        }}>
          {formatGMTTime(realTime)}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default TimeControlPanel 