import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useState, useRef } from 'react'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import Earth from './components/Earth'
import ECIAxes from './components/ECIAxes'
import TimeControlPanel from './components/TimeControlPanel'
import { TranslationProvider } from './i18n/useTranslation'
import SunLight from './components/SunLight'
import Moon from './components/Moon'
import MoonInfoPanel from './components/MoonInfoPanel'
import SatelliteInfoPanel from './components/SatelliteInfoPanel'
// import LanguageToggle from './components/LanguageToggle'
import FloatingQuickActions from './components/FloatingQuickActions'
import CameraController from './components/CameraController'



// import { SunDirectionTest } from './components/SunDirectionTest'

const AppContent = () => {
  // 临时控制其他卫星显示的按钮 - 默认显示所有卫星
  const [showOtherSatellites] = useState(true)
  // 控制月球显示的按钮
  const [showMoon] = useState(true)
  // 控制月球信息面板显示
  const [showMoonInfo, setShowMoonInfo] = useState(false)
  // 控制卫星信息面板显示
  const [showSatelliteInfo] = useState(true)
  // OrbitControls 引用
  const controlsRef = useRef<OrbitControlsType>(null)
  // 显示/隐藏 ECI 轴 - 默认隐藏
  const [showECIAxes, setShowECIAxes] = useState(false)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 时间控制面板 */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <TimeControlPanel />
      </div>

      {/* 顶部语言切换已移除，改为右下角快捷按钮 */}

      {/* 控制按钮 - 已隐藏调试面板 */}
      {/* <div style={{
        position: 'absolute',
        top: '20px',
        right: '400px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={() => setShowOtherSatellites(!showOtherSatellites)}
          style={{
            background: showOtherSatellites ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showOtherSatellites ? t.hideOtherSatellites : t.showOtherSatellites}
        </button>
        <button
          onClick={() => setShowMoon(!showMoon)}
          style={{
            background: showMoon ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showMoon ? t.hideMoon : t.showMoon}
        </button>
        <button
          onClick={() => setShowMoonInfo(!showMoonInfo)}
          style={{
            background: showMoonInfo ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showMoonInfo ? t.hideMoonInfo : t.showMoonInfo}
        </button>
        <button
          onClick={() => setShowSatelliteInfo(!showSatelliteInfo)}
          style={{
            background: showSatelliteInfo ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showSatelliteInfo ? t.hideSatelliteInfo : t.showSatelliteInfo}
        </button>
      </div> */}
        
        {/* 太阳方向测试面板 */}
        {/* <SunDirectionTest /> */}
        <Canvas
          camera={{ position: [20, 10, 20], fov: 60 }}
          style={{ background: '#000011' }}
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000011')
          }}
        >
          {/* Increase ambient light intensity for better visibility */}
          <ambientLight intensity={1.0} />
          
          {/* 太阳光 */}

          <SunLight /> 

          {/* 地球组件 */}
          <Earth showOtherSatellites={showOtherSatellites} />

          {/* 月球组件 */}
          {showMoon && <Moon showOrbit={true} showLabels={true} showMoonPhase={true} />}

          {/* ECI三轴 */}
          {showECIAxes && <ECIAxes length={8} />}

          {/* 星空背景 */}
          <Stars 
            radius={300} 
            depth={100} 
            count={8000} 
            factor={3} 
            saturation={0} 
            fade 
            speed={0.5} 
          />

          {/* 相机控制 */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={100}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />

          {/* 相机聚焦控制器 */}
          <CameraController controlsRef={controlsRef} />
        </Canvas>

        {/* 月球信息面板 */}
        <MoonInfoPanel 
          isVisible={showMoonInfo} 
          onClose={() => setShowMoonInfo(false)} 
        />

      {/* 卫星信息面板 */}
      {showSatelliteInfo && <SatelliteInfoPanel />}

      {/* 右下角快捷功能区 */}
      <FloatingQuickActions 
        onToggleAxes={() => setShowECIAxes(!showECIAxes)} 
        axesVisible={showECIAxes}
      />
    </div>
  )
}

function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  )
}

export default App