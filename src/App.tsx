import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Earth from './components/Earth'
import ECIAxes from './components/ECIAxes'
import TimeControlPanel from './components/TimeControlPanel'
import { TranslationProvider } from './i18n/useTranslation'
import { SunDirectionTest } from './components/SunDirectionTest'

function App() {
  return (
    <TranslationProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* 时间控制面板 */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
          <TimeControlPanel />
        </div>
        
        {/* 太阳方向测试面板 */}
        <SunDirectionTest />
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
          {/* 环境光 */}
          <ambientLight intensity={0.6} />
          
          {/* 太阳光 */}
          <directionalLight
            position={[50, 50, 50]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          {/* 地球组件 */}
          <Earth />

          {/* ECI三轴 */}
          <ECIAxes length={8} />

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
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={100}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
    </TranslationProvider>
  )
}

export default App 