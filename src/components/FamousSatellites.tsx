import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { getFamousSatellitesTLE, FAMOUS_SATELLITES } from '../services/celestrakService'
import { createSatrecFromTLE } from '../services/sgp4Service'
import * as satelliteJS from 'satellite.js'
import { latLonAltToScenePosition } from '../utils/coordinateUtils'
import { BASE_URL } from '../config/baseUrl'

const SCENE_RADIUS = 5 // must match Earth sphere radius
// const ORBIT_POINTS = 256 // 增加轨道点数确保闭合

// 卫星模型路径配置（使用 BASE_URL 适配 GitHub Pages /urex/ 子路径）
const SATELLITE_MODELS = {
  ISS: `${BASE_URL}ISS_stationary.glb`,
  TIANGONG: `${BASE_URL}tiangong.glb`,
  HUBBLE: `${BASE_URL}hubble.glb`,
  STARLINK: `${BASE_URL}starlink.glb`,
  GPS: `${BASE_URL}gps_satellite.glb`,
} as const

// 弧线插值函数，用于拟合缺失的轨道点
function interpolateArcPoints(points: THREE.Vector3[], targetCount: number): THREE.Vector3[] {
  if (points.length < 2) return points
  
  const result: THREE.Vector3[] = []
  const step = (points.length - 1) / (targetCount - 1)
  
  for (let i = 0; i < targetCount; i++) {
    const index = i * step
    const lowerIndex = Math.floor(index)
    const upperIndex = Math.min(lowerIndex + 1, points.length - 1)
    const t = index - lowerIndex
    
    if (lowerIndex === upperIndex) {
      result.push(points[lowerIndex].clone())
    } else {
      // 使用球面线性插值（SLERP）保持弧线形状
      const point = new THREE.Vector3()
      point.lerpVectors(points[lowerIndex], points[upperIndex], t)
      result.push(point)
    }
  }
  
  return result
}

// 使用上一圈数据拟合缺失点的函数
function fillMissingPointsWithPreviousOrbit(
  currentPoints: THREE.Vector3[], 
  previousPoints: THREE.Vector3[], 
  targetCount: number
): THREE.Vector3[] {
  if (currentPoints.length >= targetCount * 0.8) {
    // 如果当前点足够多，直接插值
    return interpolateArcPoints(currentPoints, targetCount)
  }
  
  if (previousPoints.length === 0) {
    // 如果没有上一圈数据，返回当前点
    return currentPoints
  }
  
  // 将上一圈的数据按比例混合到当前轨道中
  const result: THREE.Vector3[] = []
  const currentRatio = currentPoints.length / targetCount
  // const previousRatio = 1 - currentRatio
  
  for (let i = 0; i < targetCount; i++) {
    const currentIndex = Math.floor((i / targetCount) * currentPoints.length)
    const previousIndex = Math.floor((i / targetCount) * previousPoints.length)
    
    if (currentIndex < currentPoints.length && previousIndex < previousPoints.length) {
      // 混合当前点和上一圈的点
      const point = new THREE.Vector3()
      point.lerpVectors(
        previousPoints[previousIndex], 
        currentPoints[currentIndex], 
        currentRatio
      )
      result.push(point)
    } else if (currentIndex < currentPoints.length) {
      result.push(currentPoints[currentIndex].clone())
    } else if (previousIndex < previousPoints.length) {
      result.push(previousPoints[previousIndex].clone())
    }
  }
  
  return result
}

// 曲线渲染组件，使用高密度点创建平滑曲线
const CurveLine: React.FC<{
  points: THREE.Vector3[]
  color: string
  lineWidth: number
  transparent: boolean
  opacity: number
}> = ({ points, color, lineWidth, transparent, opacity }) => {
  // const curveRef = useRef<THREE.Mesh>(null)
  
  const curveGeometry = useMemo(() => {
    if (points.length < 3) return null
    
    // 创建贝塞尔曲线并生成更多点
    const curve = new THREE.CatmullRomCurve3(points, true) // true表示闭合曲线
    const curvePoints = curve.getPoints(200) // 生成200个点，确保曲线平滑
    
    const geometry = new THREE.BufferGeometry()
    const positions = []
    
    for (const point of curvePoints) {
      positions.push(point.x, point.y, point.z)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [points])
  
  const curveMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: color,
      transparent: transparent,
      opacity: opacity,
      linewidth: 4 // 卫星轨道线宽
    })
  }, [color, transparent, opacity, lineWidth])
  
  if (!curveGeometry) return null
  
  return (
    <primitive object={new THREE.Line(curveGeometry, curveMaterial)} />
  )
}

// 卫星配置
const SATELLITE_CONFIGS = {
  ISS: { color: '#00ff00', name: 'ISS', size: 0.12, hasModel: true, modelPath: SATELLITE_MODELS.ISS }, // 绿色
  HUBBLE: { color: '#ff8800', name: 'HUBBLE', size: 0.10, hasModel: true, modelPath: SATELLITE_MODELS.HUBBLE }, // 橙色
  STARLINK: { color: '#0088ff', name: 'STARLINK', size: 0.06, hasModel: true, modelPath: SATELLITE_MODELS.STARLINK }, // 蓝色
  TIANGONG: { color: '#ff0088', name: 'TIANGONG', size: 0.11, hasModel: true, modelPath: SATELLITE_MODELS.TIANGONG }, // 粉色
  GPS: { color: '#00ffff', name: 'GPS', size: 0.09, hasModel: true, modelPath: SATELLITE_MODELS.GPS }, // 青色 - 使用模型
} as const;

type SatelliteName = keyof typeof SATELLITE_CONFIGS;

interface SatelliteData {
  name: SatelliteName;
  noradId: string;
  tle: any;
  satrec: any;
  config: typeof SATELLITE_CONFIGS[SatelliteName];
}

// GLB 模型加载组件
const SatelliteModel: React.FC<{
  modelPath: string;
  scale: number;
}> = ({ modelPath, scale }) => {
  const { scene } = useGLTF(modelPath)
  
  return (
    <group scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  )
}

import { isOccludedByEarth } from '../utils/occlusion'

const SingleSatellite: React.FC<{ 
  satellite: SatelliteData;
  orbitPoints: THREE.Vector3[];
}> = ({ satellite, orbitPoints }) => {
  const meshRef = useRef<THREE.Group>(null)
  const labelRef = useRef<any>(null)
  const { getCurrentEffectiveTime } = useAppStore()

  useFrame(({ camera }) => {
    if (!meshRef.current || !satellite.satrec) return
    
    const t = getCurrentEffectiveTime()

    try {
      const pv = satelliteJS.propagate(satellite.satrec, t)
      if (!pv || !pv.position || typeof pv.position === 'boolean') return

      // 使用经纬度定位方法：将ECI坐标转换为地理坐标，再转换为场景坐标
      const positionEci = pv.position
      const gmst = satelliteJS.gstime(t)
      const positionGd = satelliteJS.eciToGeodetic(positionEci, gmst)
      
      // 转换为度
      const latDeg = positionGd.latitude * (180 / Math.PI)
      const lonDeg = positionGd.longitude * (180 / Math.PI)
      const altKm = positionGd.height
      
      // 检查坐标是否有效
      if (isNaN(latDeg) || isNaN(lonDeg) || isNaN(altKm) || !isFinite(latDeg) || !isFinite(lonDeg) || !isFinite(altKm)) {
        console.warn(`Invalid geodetic position for ${satellite.name}:`, { latDeg, lonDeg, altKm })
        return
      }
      
      // 转换为场景坐标（相对于地球表面的固定位置）
      // 卫星在地球的旋转group内部，会自动随地球旋转
      const scenePos = latLonAltToScenePosition(latDeg, lonDeg, altKm)
      
      // 设置卫星位置
      meshRef.current.position.copy(scenePos)

      // 更新标签朝向摄像机，并处理遮挡可见性
      if (labelRef.current) {
        // 可见性：被地球遮挡则隐藏（朝向由 Billboard 保证）
        const cameraPos = new THREE.Vector3().copy(camera.position)
        const worldSatPos = new THREE.Vector3().copy(meshRef.current.getWorldPosition(new THREE.Vector3()))
        const occluded = isOccludedByEarth(cameraPos, worldSatPos, SCENE_RADIUS * 0.99)
        labelRef.current.visible = !occluded
      }
      
      // 调试信息：每5秒输出一次位置信息
      if (Math.floor(t.getTime() / 5000) % 2 === 0 && Math.floor(t.getTime() / 1000) % 5 === 0) {
        console.log(`🛰️ ${satellite.name} scene position:`, { x: scenePos.x.toFixed(3), y: scenePos.y.toFixed(3), z: scenePos.z.toFixed(3), time: t.toISOString() })
      }
    } catch (error) {
      console.error(`${satellite.name} position calculation error:`, error)
    }
  })

  if (!satellite.satrec) {
    return null
  }

  return (
    <group>
      {/* Satellite marker */}
      <group ref={meshRef}>
        {satellite.config.hasModel && satellite.config.modelPath ? (
          // 使用 GLB 模型替换小球
          <>
            {console.log(`🔍 ${satellite.name} hasModel:`, satellite.config.hasModel, 'modelPath:', satellite.config.modelPath)}
            <SatelliteModel 
              modelPath={satellite.config.modelPath}
              scale={satellite.config.size * (
                satellite.name === 'TIANGONG' ? 0.5 : 
                satellite.name === 'HUBBLE' ? 0.25 : 
                satellite.name === 'STARLINK' ? 0.2 :
                satellite.name === 'ISS' ? 0.025 :
                satellite.name === 'GPS' ? 0.0002 : 0.02
              )}
            />
          </>
        ) : (
          // 使用默认几何体（小球）
          <>
            {/* Main satellite body */}
            <mesh>
              <sphereGeometry args={[satellite.config.size * 0.8, 12, 12]} />
              <meshBasicMaterial color={satellite.config.color} />
            </mesh>
            
            {/* Glow effect */}
            <mesh>
              <sphereGeometry args={[satellite.config.size * 1.2, 8, 8]} />
              <meshBasicMaterial 
                color={satellite.config.color} 
                transparent 
                opacity={0.2}
              />
            </mesh>
            
            {/* Outer ring for visibility */}
            <mesh>
              <ringGeometry args={[satellite.config.size * 1.5, satellite.config.size * 1.8, 16]} />
              <meshBasicMaterial 
                color={satellite.config.color} 
                transparent 
                opacity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </>
        )}
        {/* Billboard label - 总是面向屏幕 */}
        <group ref={labelRef} position={[0.18, 0.22, 0]}>
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text
              fontSize={0.16}
              color={satellite.config.color}
              anchorX="left"
              anchorY="bottom"
              outlineWidth={0.012}
              outlineColor="#000000"
            >
              {satellite.name}
            </Text>
          </Billboard>
        </group>
      </group>

      {/* Orbit path - 使用曲线渲染 */}
      {orbitPoints.length > 0 && (
        <CurveLine
          points={orbitPoints}
          color={satellite.config.color}
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      )}
    </group>
  )
}

const FamousSatellites: React.FC = () => {
  const [satellites, setSatellites] = useState<SatelliteData[]>([])
  const [orbitData, setOrbitData] = useState<Map<string, THREE.Vector3[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const { getCurrentEffectiveTime } = useAppStore()
  const lastOrbitUpdate = useRef<number>(0)
  const lastTimeSpeed = useRef<number>(1)
  const orbitCache = useRef<Map<string, { time: number, points: THREE.Vector3[] }>>(new Map())
  const previousOrbitCache = useRef<Map<string, THREE.Vector3[]>>(new Map()) // 存储上一圈的轨道数据

  useEffect(() => {
    let mounted = true
    
    const loadSatellites = async () => {
      try {
        console.log('🚀 FamousSatellites: Starting to load famous satellites TLE data...')
        console.log('📋 FamousSatellites: Available satellites:', Object.keys(FAMOUS_SATELLITES))
        const tleData = await getFamousSatellitesTLE()
        
        if (!mounted) return
        
        console.log('📡 FamousSatellites: TLE data received:', Object.keys(tleData))
        console.log('📊 FamousSatellites: TLE data details:', tleData)
        const loadedSatellites: SatelliteData[] = []
        
        for (const [name, tle] of Object.entries(tleData)) {
          // 排除 LUMELITE4，因为它已经在 Earth.tsx 中单独渲染
          if (name === 'LUMELITE4') {
            console.log(`⚠️ Skipping LUMELITE4: already rendered separately via Satellite56309`)
            continue
          }
          
          console.log(`🔍 Processing ${name}:`, tle ? 'TLE exists' : 'No TLE')
          console.log(`🔍 Available configs:`, Object.keys(SATELLITE_CONFIGS))
          console.log(`🔍 Is ${name} in configs?`, name in SATELLITE_CONFIGS)
          if (tle && name in SATELLITE_CONFIGS) {
            try {
              const satrec = createSatrecFromTLE(tle)
              loadedSatellites.push({
                name: name as SatelliteName,
                noradId: FAMOUS_SATELLITES[name as keyof typeof FAMOUS_SATELLITES],
                tle,
                satrec,
                config: SATELLITE_CONFIGS[name as SatelliteName]
              })
              console.log(`✅ ${name} satellite loaded successfully`)
            } catch (error) {
              console.error(`❌ Failed to create satrec for ${name}:`, error)
            }
          } else {
            console.log(`⚠️ Skipping ${name}:`, tle ? 'No config' : 'No TLE data')
          }
        }
        
        console.log(`✅ Successfully loaded ${loadedSatellites.length} satellites:`, loadedSatellites.map(s => s.name))
        setSatellites(loadedSatellites)
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Failed to load satellites:', error)
        setIsLoading(false)
      }
    }
    
    loadSatellites()
    return () => { mounted = false }
  }, [])

  // Generate orbit points for each satellite with high-frequency updates
  useFrame(() => {
    if (satellites.length === 0) return
    
    const now = Date.now()
    const timeSpeed = useAppStore.getState().timeSpeed
    
    // 高频轨道更新策略：
    // 1. 时间速度变化时立即更新
    // 2. 正常情况下每100ms更新一次
    // 3. 暂停时延长更新间隔
    // 4. 高时间速度时更频繁更新以显示动态效果
    const updateInterval = timeSpeed === 0 ? 2000 : (Math.abs(timeSpeed) > 10 ? 50 : 100)
    const shouldUpdate = (now - lastOrbitUpdate.current > updateInterval) || 
                        (timeSpeed !== lastTimeSpeed.current)
    
    if (!shouldUpdate) return
    
    lastOrbitUpdate.current = now
    lastTimeSpeed.current = timeSpeed
    const currentTime = getCurrentEffectiveTime()
    const newOrbitData = new Map<string, THREE.Vector3[]>()
    
    satellites.forEach(satellite => {
      if (!satellite.satrec) return
      
      // 检查缓存是否有效（轨道形状不会快速变化）
      const cachedData = orbitCache.current.get(satellite.name)
      const cacheValid = cachedData && 
                        Math.abs(currentTime.getTime() - cachedData.time) < 30000 // 30秒内有效
      
      if (cacheValid && cachedData) {
        newOrbitData.set(satellite.name, cachedData.points)
        return
      }
      
      try {
        // const points: THREE.Vector3[] = []
        
        // 使用开普勒轨道力学正确计算轨道
        // 计算轨道周期（分钟）
        // TLE中的meanMotion单位是：圈/分钟，所以轨道周期 = 2π / meanMotion (分钟)
        const orbitalPeriodMinutes = (2 * Math.PI) / satellite.satrec.no
        let orbitalPeriodSeconds = orbitalPeriodMinutes * 60 // 转换为秒
        
        // 对于GPS等中轨道卫星，如果计算出的周期异常，使用正确的轨道周期
        // GPS卫星的实际周期应该是12小时（43200秒）
        if (satellite.name === 'GPS') {
          if (orbitalPeriodSeconds < 3600 || orbitalPeriodSeconds > 86400 * 30) {
            console.log(`GPS satellite: correcting orbital period from ${orbitalPeriodSeconds}s to 43200s (12 hours)`)
            orbitalPeriodSeconds = 43200 // 12小时
          }
        }
        
        // 检查轨道周期是否合理
        if (orbitalPeriodSeconds <= 0 || !isFinite(orbitalPeriodSeconds) || orbitalPeriodSeconds > 86400 * 30) {
          console.warn(`Invalid orbital period for ${satellite.name}: ${orbitalPeriodSeconds} seconds, skipping orbit calculation`)
          newOrbitData.set(satellite.name, [])
          return
        }
        
        // 计算轨道上的点：用ECI生成光滑椭圆，然后用当前时刻的GMST统一转换
        const orbitPointCount = 80 // 恢复原来的点数，因为ECI轨道本身就很平滑
        const rawPoints: THREE.Vector3[] = []
        
        // 关键：使用当前时刻的GMST对所有轨道点进行转换
        // 这样保持了ECI轨道的光滑形状，同时固定在地球表面
        const currentGmst = satelliteJS.gstime(currentTime)
        
        for (let i = 0; i < orbitPointCount; i++) {
          const fraction = i / orbitPointCount
          const timeOffsetMs = fraction * orbitalPeriodSeconds * 1000
          const time = new Date(currentTime.getTime() + timeOffsetMs)
          
          // 检查时间是否有效
          if (isNaN(time.getTime())) {
            console.warn(`Invalid time calculated for ${satellite.name} at fraction ${fraction}:`, { timeOffsetMs, orbitalPeriodSeconds })
            continue
          }
          
          const pv = satelliteJS.propagate(satellite.satrec, time)
          if (!pv || !pv.position || typeof pv.position === 'boolean') continue

          // 用ECI生成轨道（保持光滑椭圆形状）
          const positionEci = pv.position
          
          // 用当前时刻的GMST转换为geodetic（所有点用同一个GMST）
          // 这样保持了轨道的形状，同时固定在地球表面
          const positionGd = satelliteJS.eciToGeodetic(positionEci, currentGmst)
          
          const latDeg = positionGd.latitude * (180 / Math.PI)
          const lonDeg = positionGd.longitude * (180 / Math.PI)
          const altKm = positionGd.height

          // 检查坐标是否为有效数字
          if (isNaN(latDeg) || isNaN(lonDeg) || isNaN(altKm) || !isFinite(latDeg) || !isFinite(lonDeg) || !isFinite(altKm)) {
            console.warn(`Invalid geodetic coordinates for ${satellite.name} at time ${time.toISOString()}:`, { latDeg, lonDeg, altKm })
            continue
          }
          
          // 转换为场景坐标
          const scenePos = latLonAltToScenePosition(latDeg, lonDeg, altKm)
          
          // 检查坐标是否在合理范围内
          if (Math.abs(scenePos.x) > 50 || Math.abs(scenePos.y) > 50 || Math.abs(scenePos.z) > 50) {
            console.warn(`Coordinates out of range for ${satellite.name}:`, { x: scenePos.x, y: scenePos.y, z: scenePos.z })
            continue
          }

          rawPoints.push(scenePos)
        }
        
        // 使用上一圈的数据拟合缺失的点，确保轨道是平滑的弧线
        const previousPoints = previousOrbitCache.current.get(satellite.name) || []
        const filledPoints = fillMissingPointsWithPreviousOrbit(rawPoints, previousPoints, orbitPointCount)
        
        // 添加闭合点，确保轨道线闭合
        if (filledPoints.length > 0) {
          filledPoints.push(filledPoints[0].clone())
        }
        
        // 保存当前轨道数据作为下一圈的参考
        previousOrbitCache.current.set(satellite.name, filledPoints.slice())
        
        // 缓存计算结果
        orbitCache.current.set(satellite.name, {
          time: currentTime.getTime(),
          points: filledPoints
        })
        
        newOrbitData.set(satellite.name, filledPoints)
        
        // 调试信息：轨道更新时输出
        if (satellite.name === 'ISS') { // 只输出ISS的调试信息避免过多日志
          console.log(`🛸 ${satellite.name} orbit updated:`, { 
            points: filledPoints.length, 
            time: currentTime.toISOString(),
            orbitalPeriod: orbitalPeriodSeconds.toFixed(0) + 's'
          })
        }
      } catch (error) {
        console.error(`Failed to calculate orbit for ${satellite.name}:`, error)
      }
    })
    
    setOrbitData(newOrbitData)
  })

  if (isLoading) {
    console.log('🔄 Loading satellites...')
    return null
  }

  if (satellites.length === 0) {
    console.log('🔍 No satellites loaded yet')
    return null
  }

  console.log(`🎯 Rendering ${satellites.length} satellites:`, satellites.map(s => s.name))

  return (
    <group>
      {satellites.map(satellite => (
        <SingleSatellite
          key={satellite.name}
          satellite={satellite}
          orbitPoints={orbitData.get(satellite.name) || []}
        />
      ))}
    </group>
  )
}

export default FamousSatellites
// 预加载所有卫星 GLB 模型（路径已含 base，适配 GitHub Pages）
useGLTF.preload(SATELLITE_MODELS.ISS)
useGLTF.preload(SATELLITE_MODELS.TIANGONG)
useGLTF.preload(SATELLITE_MODELS.HUBBLE)
useGLTF.preload(SATELLITE_MODELS.STARLINK)
useGLTF.preload(SATELLITE_MODELS.GPS)
