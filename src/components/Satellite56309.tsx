import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { getTargetSatelliteTLE } from '../services/celestrakService'
import { createSatrecFromTLE } from '../services/sgp4Service'
import * as satellite from 'satellite.js'

const EARTH_RADIUS_KM = 6378.137
const SCENE_RADIUS = 5 // must match Earth sphere radius

const Satellite56309: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null)
  const { getCurrentEffectiveTime } = useAppStore()
  const scaleKmToScene = useMemo(() => SCENE_RADIUS / EARTH_RADIUS_KM, [])

  const [satrec, setSatrec] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const tle = await getTargetSatelliteTLE()
        if (!mounted || !tle) return
        
        const rec = createSatrecFromTLE(tle)
        setSatrec(rec)
      } catch (error) {
        console.error('Satellite56309: TLE loading failed:', error)
      }
    })()
    return () => { mounted = false }
  }, [])

  useFrame(() => {
    if (!meshRef.current || !satrec) return
    
    const t = getCurrentEffectiveTime()

    try {
      const pv = satellite.propagate(satrec, t)
      if (!pv || !pv.position) return

      // 关键修改：卫星位置也使用ECI坐标，与轨道计算保持一致
      // 这样卫星位置和轨道都在同一个坐标系中
      const x = pv.position.x * scaleKmToScene
      const y = pv.position.z * scaleKmToScene  // ECI Z → Scene Y
      const z = -pv.position.y * scaleKmToScene // ECI Y → -Scene Z

      // 直接设置位置，不使用插值，确保与轨道计算完全同步
      meshRef.current.position.set(x, y, z)
    } catch (error) {
      console.error('Satellite position calculation error:', error)
    }
  })

  if (!satrec) {
    return null
  }

  return (
    <group ref={meshRef}>
      {/* Small dot marker */}
      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Tiny outer glow */}
      <mesh>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

export default Satellite56309


