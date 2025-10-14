import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { moonOrbitCalculator, MoonOrbitState, MOON_ORBITAL_PARAMS } from '../services/moonOrbitService';

interface MoonInfoPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const MoonInfoPanel: React.FC<MoonInfoPanelProps> = ({ isVisible, onClose }) => {
  const { getCurrentEffectiveTime } = useAppStore();
  const [moonState, setMoonState] = useState<MoonOrbitState | null>(null);
  const [orbitData, setOrbitData] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    const updateMoonData = () => {
      const currentTime = getCurrentEffectiveTime();
      const moonPosition = moonOrbitCalculator.calculatePosition(currentTime);
      const projectState = moonOrbitCalculator.toProjectCoordinates(moonPosition);
      
      setMoonState(projectState);
      setOrbitData(moonPosition);
    };

    updateMoonData();
    const interval = setInterval(updateMoonData, 1000); // 每秒更新

    return () => clearInterval(interval);
  }, [isVisible, getCurrentEffectiveTime]);

  if (!isVisible) return null;

  const formatDistance = (distance: number) => {
    const realDistance = distance / MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS * MOON_ORBITAL_PARAMS.EARTH_RADIUS;
    return `${(realDistance / 1000).toFixed(0)}k km`;
  };

  const formatPhase = (phase: number) => {
    if (phase < 0.125) return '新月';
    if (phase < 0.375) return '上弦月';
    if (phase < 0.625) return '满月';
    if (phase < 0.875) return '下弦月';
    return '新月';
  };

  const getPhaseEmoji = (phase: number) => {
    if (phase < 0.125) return '🌑';
    if (phase < 0.375) return '🌓';
    if (phase < 0.625) return '🌕';
    if (phase < 0.875) return '🌗';
    return '🌑';
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '300px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      border: '1px solid #333'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>🌙 月球轨道信息</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {moonState && orbitData && (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          {/* 月相信息 */}
          <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>
              {getPhaseEmoji(moonState.phase)} {formatPhase(moonState.phase)}
            </div>
            <div>光照比例: {(moonState.illumination * 100).toFixed(1)}%</div>
          </div>

          {/* 位置信息 */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>位置信息</h4>
            <div>距离地球: {formatDistance(moonState.distance)}</div>
            <div>X坐标: {moonState.position[0].toFixed(2)}</div>
            <div>Y坐标: {moonState.position[1].toFixed(2)}</div>
            <div>Z坐标: {moonState.position[2].toFixed(2)}</div>
          </div>

          {/* 轨道参数 */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>轨道参数</h4>
            <div>偏心率: {MOON_ORBITAL_PARAMS.ECCENTRICITY}</div>
            <div>轨道倾角: {MOON_ORBITAL_PARAMS.INCLINATION}°</div>
            <div>轨道周期: {MOON_ORBITAL_PARAMS.ORBITAL_PERIOD} 天</div>
            <div>半长轴: {(MOON_ORBITAL_PARAMS.SEMI_MAJOR_AXIS / 1000).toFixed(0)}k km</div>
          </div>

          {/* 物理参数 */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>物理参数</h4>
            <div>月球半径: {(MOON_ORBITAL_PARAMS.MOON_RADIUS / 1000).toFixed(0)}k km</div>
            <div>真近点角: {(moonState.trueAnomaly * 180 / Math.PI).toFixed(1)}°</div>
            <div>轨道速度: {orbitData.velocity ? 
              `${Math.sqrt(
                orbitData.velocity[0]**2 + 
                orbitData.velocity[1]**2 + 
                orbitData.velocity[2]**2
              ).toFixed(2)} km/s` : '计算中...'}</div>
          </div>

          {/* 轨道特征 */}
          <div style={{ 
            padding: '10px', 
            background: 'rgba(76, 175, 80, 0.2)', 
            borderRadius: '5px',
            border: '1px solid #4CAF50'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>轨道特征</h4>
            <div>• 椭圆轨道，偏心率 {MOON_ORBITAL_PARAMS.ECCENTRICITY}</div>
            <div>• 轨道倾角 {MOON_ORBITAL_PARAMS.INCLINATION}°</div>
            <div>• 平均距离 {formatDistance(moonState.distance)}</div>
            <div>• 轨道进动: 升交点 {MOON_ORBITAL_PARAMS.NODE_PRECESSION_RATE}°/年</div>
            <div>• 近地点进动: {MOON_ORBITAL_PARAMS.PERIGEE_PRECESSION_RATE}°/年</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoonInfoPanel;
