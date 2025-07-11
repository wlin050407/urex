import React, { useState, useEffect } from 'react'
import { sunDirectionService } from '../utils/sunDirectionService'

/**
 * 太阳方向计算测试组件
 * 用于验证真实太阳方向计算的准确性
 */
export const SunDirectionTest: React.FC = () => {
  const [currentSunDirection, setCurrentSunDirection] = useState({ x: 0, y: 0, z: 0 })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [validation, setValidation] = useState<any>(null)

  useEffect(() => {
    const updateData = () => {
      const now = new Date()
      setCurrentTime(now)
      
      // 获取当前太阳方向
      const sunDir = sunDirectionService.getCurrentSunDirection()
      setCurrentSunDirection(sunDir)
      
      // 验证计算准确性
      const validationResult = sunDirectionService.validateCalculation(now)
      setValidation(validationResult)
    }

    updateData()
    const interval = setInterval(updateData, 1000)
    return () => clearInterval(interval)
  }, [])

  // 计算太阳方向的度数
  const calculateAngles = (x: number, y: number, z: number) => {
    const ra = Math.atan2(y, x) * 180 / Math.PI // 赤经（度）
    const dec = Math.asin(z) * 180 / Math.PI // 赤纬（度）
    return { ra: ra < 0 ? ra + 360 : ra, dec }
  }

  const angles = calculateAngles(currentSunDirection.x, currentSunDirection.y, currentSunDirection.z)

  // 太阳方向与地轴（ECI Z轴/Three.js Y轴）夹角
  const axisAngle = Math.acos(Math.abs(currentSunDirection.z)) * 180 / Math.PI;
  // 太阳方向与赤道平面夹角
  const equatorAngle = Math.asin(Math.abs(currentSunDirection.z)) * 180 / Math.PI;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px', // 改为右上角
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '350px',
      zIndex: 1002 // 提高zIndex，防止被其他UI遮挡
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>太阳方向验证</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>当前时间:</strong> {currentTime.toISOString()}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>太阳方向 (ECI):</strong>
        <div style={{ marginLeft: '10px' }}>
          X: {currentSunDirection.x.toFixed(6)}
        </div>
        <div style={{ marginLeft: '10px' }}>
          Y: {currentSunDirection.y.toFixed(6)}
        </div>
        <div style={{ marginLeft: '10px' }}>
          Z: {currentSunDirection.z.toFixed(6)}
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>赤经/赤纬:</strong>
        <div style={{ marginLeft: '10px' }}>
          赤经: {angles.ra.toFixed(2)}°
        </div>
        <div style={{ marginLeft: '10px' }}>
          赤纬: {angles.dec.toFixed(2)}°
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>夹角分析:</strong>
        <div style={{ marginLeft: '10px' }}>
          太阳方向与地轴夹角: {axisAngle.toFixed(2)}°
        </div>
        <div style={{ marginLeft: '10px' }}>
          太阳方向与赤道夹角: {equatorAngle.toFixed(2)}°
        </div>
      </div>
      
      {validation && (
        <div style={{ 
          marginBottom: '10px',
          color: validation.isVernalEquinox ? '#4ade80' : '#fbbf24'
        }}>
          <strong>验证结果:</strong>
          <div style={{ marginLeft: '10px' }}>
            {validation.isVernalEquinox ? '✓ 春分日附近' : '○ 非春分日'}
          </div>
          {validation.expectedDirection && (
            <div style={{ marginLeft: '10px', fontSize: '10px' }}>
              {validation.expectedDirection}
            </div>
          )}
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
        <div>• 春分日: 太阳应在ECI X轴方向 (1,0,0)</div>
        <div>• 夏至日: 太阳应在ECI Z轴方向 (0,0,1)</div>
        <div>• 秋分日: 太阳应在ECI -X轴方向 (-1,0,0)</div>
        <div>• 冬至日: 太阳应在ECI -Z轴方向 (0,0,-1)</div>
      </div>
    </div>
  )
} 