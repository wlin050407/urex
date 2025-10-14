import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'

// ---- NEW: UTC helpers ----
const isoUTCforInput = (d: Date) => d.toISOString().slice(0, 16)             // "YYYY-MM-DDTHH:MM"
const parseInputAsUTC = (s: string) => new Date(s.endsWith('Z') ? s : s + 'Z') // treat datetime-local as UTC

const TimeControlPanel: React.FC = () => {
  const { t, language } = useTranslation()
  const { 
    timeSpeed, setTimeSpeed,
    currentTime, isTimeCustom, isPaused,
    setCurrentTime, pauseTime, resumeTime, reverseTime,
    resetToRealTime, getCurrentEffectiveTime
  } = useAppStore()

  const [isExpanded, setIsExpanded] = useState(false)

  // show times
  const [displayTime, setDisplayTime] = useState(new Date()) // simulation time (UTC)
  const [realTime, setRealTime]       = useState(new Date()) // real UTC clock

  // ---- NEW: seed input from current simulation UTC ----
  const [customTimeInput, setCustomTimeInput] = useState(isoUTCforInput(getCurrentEffectiveTime()))

  // keep the panel ticking
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayTime(getCurrentEffectiveTime())
      setRealTime(new Date())
    }, 100)
    return () => clearInterval(id)
  }, [getCurrentEffectiveTime])

  // refresh display time immediately on key state changes
  useEffect(() => {
    setDisplayTime(getCurrentEffectiveTime())
  }, [timeSpeed, isPaused, isTimeCustom, currentTime])

  // optional: when the sim time source changes (e.g., reset), keep the input in sync
  useEffect(() => {
    setCustomTimeInput(isoUTCforInput(getCurrentEffectiveTime()))
  }, [isTimeCustom])

  // slider (log-scale)
  const [sliderValue, setSliderValue] = useState(0)
  useEffect(() => {
    if (timeSpeed === 0) setSliderValue(0)
    else setSliderValue(Math.sign(timeSpeed) * Math.log10(Math.abs(timeSpeed)))
  }, [timeSpeed])

  const handleSliderChange = (val: number) => {
    let speed = 0
    if (Math.abs(val) < 0.05) speed = 0
    else speed = Math.sign(val) * Math.pow(10, Math.abs(val))
    setTimeSpeed(speed)
  }

  // ---- NEW: parse input as UTC, not local ----
  const handleCustomTimeSubmit = () => {
    try {
      const newUTC = parseInputAsUTC(customTimeInput)   // <-- key fix
      if (!isNaN(newUTC.getTime())) {
        setCurrentTime(newUTC)
        setCustomTimeInput(isoUTCforInput(newUTC))      // keep input synced to applied UTC
      } else {
        alert(t.invalidTimeFormat)
      }
    } catch {
      alert(t.timeFormatError)
    }
  }

  const formatGMTTime = (date: Date) =>
    date.toISOString().replace('T', ' ').replace('.000Z', ' GMT')

  const getTimeStatusText = () => {
    if (isPaused) return t.paused
    if (timeSpeed < 0) return `${Math.abs(timeSpeed).toFixed(2)}x ${t.reversing}`
    if (timeSpeed > 0) return `${timeSpeed.toFixed(2)}x ${t.forwarding}`
    return t.paused
  }

  // icons (unchanged)
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

  // silence TS “unused” hints for a couple of locals
  const _unused = { currentTime, PlayIcon, PauseIcon, ReverseIcon, reverseTime }
  console.debug('TimeControlPanel variables:', _unused)

  return (
    <div className="control-group">
      {/* header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', marginBottom: isExpanded ? '12px' : '0',
          transition: 'all 0.3s ease', backdropFilter: 'blur(10px)'
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
          <div style={{ fontSize: '11px', color: isTimeCustom ? '#fbbf24' : '#60a5fa', marginTop: '2px', fontFamily: 'monospace' }}>
            {formatGMTTime(displayTime)}
          </div>
        </div>
        <span style={{ fontSize: '14px', color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          ▼
        </span>
      </div>

      {/* panel */}
      {isExpanded && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '16px', animation: 'slideDown 0.3s ease'
        }}>
          {/* speed + controls */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: '#94a3b8', fontWeight: '500', minWidth: 90, width: 90, letterSpacing: 1 }}>
              {t.timeSpeed}: {isPaused ? t.paused : `${timeSpeed.toFixed(2)}x`}
            </label>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px', padding: '8px 0' }}>
              {/* reverse */}
              <button
                onClick={() => setTimeSpeed(timeSpeed === 0 ? -1 : timeSpeed / 10)}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: timeSpeed < 0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.08)',
                  border: timeSpeed < 0 ? '2px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={timeSpeed < 0 ? '#3b82f6' : '#94a3b8'}>
                  <path d="M11 7l-7 5 7 5V7zm7 0l-7 5 7 5V7z"/>
                </svg>
              </button>

              {/* pause / play */}
              <button
                onClick={isPaused ? resumeTime : pauseTime}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                }}
              >
                {isPaused ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#e2e8f0"><path d="M8 5v14l11-7z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                )}
              </button>

              {/* forward */}
              <button
                onClick={() => setTimeSpeed(timeSpeed === 0 ? 1 : timeSpeed * 10)}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: timeSpeed > 0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.08)',
                  border: timeSpeed > 0 ? '2px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={timeSpeed > 0 ? '#3b82f6' : '#94a3b8'}>
                  <path d="M6 7l7 5-7 5V7zm7 0l7 5-7 5V7z"/>
                </svg>
              </button>
            </div>

            {/* speed slider */}
            <input
              type="range" min={-4} max={4} step={0.01}
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              style={{
                width: '100%', marginBottom: 8, accentColor: '#3b82f6',
                height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer'
              }}
            />
            <small style={{ display: 'block', color: '#64748b', fontSize: 11, textAlign: 'center' }}>
              {language === 'zh' ? '负值为倒退，正值为前进，0为暂停' : 'Negative: reverse, Positive: forward, 0: pause'}
            </small>

            {/* reset */}
            <button
              onClick={resetToRealTime}
              style={{
                width: '100%', padding: '10px 16px', fontSize: 12, fontWeight: 500,
                background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12
              }}
            >
              <ResetIcon /> {t.resetToRealTime}
            </button>
          </div>

          {/* current time (GMT) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              {isTimeCustom ? `${t.customTime} (GMT)` : `${t.realTime} (GMT)`}
            </label>
            <div style={{
              fontSize: 13, color: isTimeCustom ? '#fbbf24' : '#60a5fa', fontFamily: 'monospace',
              background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: 6,
              border: `1px solid ${isTimeCustom ? 'rgba(251,191,36,0.2)' : 'rgba(96,165,250,0.2)'}`, fontWeight: 500
            }}>
              {formatGMTTime(displayTime)}
            </div>
            {isTimeCustom && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                {language === 'zh' ? '自定义时间模式 - 时间按设定速度运行' : 'Custom time mode - time runs at set speed'}
              </div>
            )}
          </div>

          {/* set custom time (interpreted as UTC) */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              {t.setTime}
            </label>
            <input
              type="datetime-local"
              value={customTimeInput}
              onChange={(e) => setCustomTimeInput(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', fontSize: 12, marginBottom: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6, color: '#e2e8f0', outline: 'none'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              placeholder={t.enterCustomTime}
            />
            <button
              onClick={handleCustomTimeSubmit}
              disabled={!customTimeInput}
              style={{
                width: '100%', padding: '8px 12px', fontSize: 12,
                background: customTimeInput ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                color: customTimeInput ? '#22c55e' : '#6b7280',
                border: customTimeInput ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, cursor: customTimeInput ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', fontWeight: 500
              }}
            >
              {t.setTime}
            </button>
          </div>
        </div>
      )}

      {/* real UTC display */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
          Real Time (GMT)
        </label>
        <div style={{
          fontSize: 13, color: '#60a5fa', fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.05)', padding: '10px 12px',
          borderRadius: 6, border: '1px solid rgba(96,165,250,0.2)', fontWeight: 500
        }}>
          {formatGMTTime(realTime)}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default TimeControlPanel
