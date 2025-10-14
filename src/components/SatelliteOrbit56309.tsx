import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
// import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { getTargetSatelliteTLE } from '../services/celestrakService'
import { createSatrecFromTLE } from '../services/sgp4Service'
import * as satellite from 'satellite.js'

const EARTH_RADIUS_KM = 6378.137
const SCENE_RADIUS = 5 // must match Earth sphere radius
// const ORBIT_POINTS = 200 // more points for smoother gradient

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

const SatelliteOrbit56309: React.FC = () => {
  const { getCurrentEffectiveTime } = useAppStore()
  const scaleKmToScene = useMemo(() => SCENE_RADIUS / EARTH_RADIUS_KM, [])
  const [orbitPoints, setOrbitPoints] = useState<THREE.Vector3[]>([])
  const [satrec, setSatrec] = useState<any>(null)
  const [satellitePosition, setSatellitePosition] = useState<THREE.Vector3 | null>(null)
  const lastUpdateTime = useRef<number>(0)
  const lastTimeSpeed = useRef<number>(1)
  const orbitCache = useRef<{ time: number, points: THREE.Vector3[] } | null>(null)
  const previousOrbitCache = useRef<THREE.Vector3[]>([]) // 存储上一圈的轨道数据

  useEffect(() => {
    let mounted = true
    
    const loadTLE = async () => {
      try {
      const tle = await getTargetSatelliteTLE()
      if (!mounted || !tle) return
        
      const rec = createSatrecFromTLE(tle)
      setSatrec(rec)
      } catch (error) {
        console.error('SatelliteOrbit56309: TLE loading failed:', error)
      }
    }
    
    loadTLE()
    return () => { mounted = false }
  }, [])

  useFrame(() => {
    if (!satrec) return
    
    const currentTime = getCurrentEffectiveTime()
    
    try {
      // Calculate current satellite position
      const pv = satellite.propagate(satrec, currentTime)
      if (pv && pv.position) {
        const gmst = satellite.gstime(currentTime)
        const ecf = satellite.eciToEcf(pv.position, gmst)
        
        const x = ecf.x * scaleKmToScene
        const y = ecf.z * scaleKmToScene  // ECF Z -> Scene Y
        const z = -ecf.y * scaleKmToScene // ECF Y -> -Scene Z
        
        setSatellitePosition(new THREE.Vector3(x, y, z))
      }
      
      // 超高频轨道更新 - 每帧都更新，最大化丝滑度
      const timeSpeed = useAppStore.getState().timeSpeed
      
      // 检查是否需要重新计算轨道
      // 1. 时间速度变化时立即更新
      // 2. 正常情况下每50ms更新一次（非常频繁）
      // 3. 暂停时延长更新间隔
      const now = Date.now()
      const updateInterval = timeSpeed === 0 ? 2000 : 50 // 暂停时2秒，正常时50ms
      const shouldRecalculate = (now - lastUpdateTime.current > updateInterval) || 
                               (timeSpeed !== lastTimeSpeed.current) ||
                               !orbitCache.current
      
      if (shouldRecalculate) {
        lastUpdateTime.current = now
        lastTimeSpeed.current = timeSpeed
        
        // 计算轨道点 - 使用最少的点数，最大化更新频率
        const rawPoints: THREE.Vector3[] = []
        const orbitalPeriodMinutes = (2 * Math.PI) / satrec.no
        const orbitPointCount = 60 // 最少的点数，确保丝滑度
        const timeStep = (orbitalPeriodMinutes * 60 * 1000) / orbitPointCount
        
        for (let i = 0; i < orbitPointCount; i++) {
          const time = new Date(currentTime.getTime() + i * timeStep)
          
          try {
            const pv = satellite.propagate(satrec, time)
            if (pv && pv.position) {
              // 关键修改：使用ECI坐标而不是ECF坐标
              // ECI坐标是惯性坐标系，不会随地球自转而变化
              // 这样轨道就是真正的轨道，而不是相对于地球表面的固定路径
              const x = pv.position.x * scaleKmToScene
              const y = pv.position.z * scaleKmToScene  // ECI Z -> Scene Y
              const z = -pv.position.y * scaleKmToScene // ECI Y -> -Scene Z

              rawPoints.push(new THREE.Vector3(x, y, z))
            }
          } catch (error) {
            console.error('Orbit point calculation error:', error)
          }
        }
        
        // 使用上一圈的数据拟合缺失的点，确保轨道是平滑的弧线
        const filledPoints = fillMissingPointsWithPreviousOrbit(rawPoints, previousOrbitCache.current, orbitPointCount)
        
        // 添加闭合点
        if (filledPoints.length > 0) {
          filledPoints.push(filledPoints[0].clone())
        }
        
        // 保存当前轨道数据作为下一圈的参考
        previousOrbitCache.current = filledPoints.slice()
        
        // 缓存结果
        orbitCache.current = {
          time: currentTime.getTime(),
          points: filledPoints
        }
        
        setOrbitPoints(filledPoints)
      }
    } catch (error) {
      console.error('Orbit calculation failed:', error)
    }
  })

  // Calculate which part of the orbit the satellite has passed
  /*
  const findClosestPointIndex = () => {
    if (orbitPoints.length === 0 || !satellitePosition) return 0
    
    let closestIndex = 0
    let minDistance = Infinity
    
    for (let i = 0; i < orbitPoints.length; i++) {
      const distance = satellitePosition.distanceTo(orbitPoints[i])
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = i
      }
    }
    
    return closestIndex
  }
  */

  // const closestIndex = findClosestPointIndex()

  // Create geometries for past and future orbit segments
  /*
  const futureOrbitGeometry = useMemo(() => {
    if (orbitPoints.length === 0 || !satellitePosition || closestIndex >= orbitPoints.length - 1) return null
    
    const geometry = new THREE.BufferGeometry()
    const futurePoints = orbitPoints.slice(closestIndex)
    const positions = []
    
    for (const point of futurePoints) {
      positions.push(point.x, point.y, point.z)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [orbitPoints, closestIndex, satellitePosition])

  const pastOrbitGeometry = useMemo(() => {
    if (orbitPoints.length === 0 || !satellitePosition || closestIndex <= 0) return null
    
    const geometry = new THREE.BufferGeometry()
    const pastPoints = orbitPoints.slice(0, closestIndex + 1)
    const positions = []
    
    for (const point of pastPoints) {
      positions.push(point.x, point.y, point.z)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [orbitPoints, closestIndex, satellitePosition])
  */

  // Generate orbit points using actual satellite trajectory data
  const orbitLinePoints = useMemo(() => {
    if (orbitPoints.length === 0) return [];
    
    // Simply use the actual calculated orbit points without forcing closure
    // This preserves the true orbital trajectory
    return orbitPoints;
  }, [orbitPoints]);

  // Early return after all hooks
  if (orbitPoints.length === 0 || !satellitePosition) {
    return null
  }

  return (
    <group>
      {/* Orbit Path - using curve rendering for smooth arcs */}
      <CurveLine 
        points={orbitLinePoints}
        color="#00aaff"
        lineWidth={2}
        transparent
        opacity={0.8}
      />
    </group>
  )
}

export default SatelliteOrbit56309
