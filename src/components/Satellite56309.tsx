import React, { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { getTargetSatelliteTLE } from '../services/celestrakService'
import { createSatrecFromTLE } from '../services/sgp4Service'
import * as satellite from 'satellite.js'
import { Text, Billboard } from '@react-three/drei'
import { isOccludedByEarth } from '../utils/occlusion'
import { latLonAltToScenePosition } from '../utils/coordinateUtils'

const SCENE_RADIUS = 5 // must match Earth sphere radius

const Satellite56309: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null)
  const { getCurrentEffectiveTime } = useAppStore()
  const labelRef = useRef<any>(null)

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

  useFrame(({ camera }) => {
    if (!meshRef.current || !satrec) return
    
    const t = getCurrentEffectiveTime()

    try {
      const pv = satellite.propagate(satrec, t)
      if (!pv || !pv.position || typeof pv.position === 'boolean') return

      // 使用经纬度定位方法：将ECI坐标转换为地理坐标，再转换为场景坐标
      const positionEci = pv.position
      const gmst = satellite.gstime(t)
      const positionGd = satellite.eciToGeodetic(positionEci, gmst)
      
      // 转换为度
      const latDeg = positionGd.latitude * (180 / Math.PI)
      const lonDeg = positionGd.longitude * (180 / Math.PI)
      const altKm = positionGd.height
      
      // 转换为场景坐标（相对于地球表面的固定位置）
      // 卫星在地球的旋转group内部，会自动随地球旋转
      const scenePos = latLonAltToScenePosition(latDeg, lonDeg, altKm)
      
      // 调试日志（每5秒输出一次）
      if (Math.random() < 0.01) {
        console.log('🛰️ Satellite56309 Position:', {
          lat: latDeg.toFixed(2),
          lon: lonDeg.toFixed(2),
          alt: altKm.toFixed(2),
          scenePos: {
            x: scenePos.x.toFixed(2),
            y: scenePos.y.toFixed(2),
            z: scenePos.z.toFixed(2)
          }
        })
      }
      
      // 设置卫星位置
      meshRef.current.position.copy(scenePos)
      
      // 标签朝向与可见性
      if (labelRef.current) {
        const cameraPos = new THREE.Vector3().copy(camera.position)
        const worldSatPos = new THREE.Vector3().copy(meshRef.current.getWorldPosition(new THREE.Vector3()))
        const occluded = isOccludedByEarth(cameraPos, worldSatPos, SCENE_RADIUS * 0.99)
        labelRef.current.visible = !occluded
      }
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

      {/* Label */}
      <group ref={labelRef} position={[0.16, 0.20, 0]}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text fontSize={0.14} color="#ffffff" anchorX="left" anchorY="bottom" outlineWidth={0.012} outlineColor="#000000">LUMELITE-4</Text>
        </Billboard>
      </group>
    </group>
  )
}

export default Satellite56309


