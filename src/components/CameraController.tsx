import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppStore } from '../store/appStore'
import { getFamousSatellitesTLE, getTargetSatelliteTLE } from '../services/celestrakService'
import { createSatrecFromTLE } from '../services/sgp4Service'
import * as satellite from 'satellite.js'
import { latLonAltToScenePosition, getEarthRotationY } from '../utils/coordinateUtils'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'

interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsType>
}

/**
 * 相机控制器组件
 * 监听 focusedSatellite 状态，自动移动相机到指定卫星
 */
const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const { camera } = useThree()
  const { focusedSatellite, getCurrentEffectiveTime } = useAppStore()
  const satrecsCache = useRef<Record<string, any>>({})
  const isAnimating = useRef(false)

  // 预加载所有卫星的 TLE 数据
  useEffect(() => {
    console.log('🚀 CameraController mounted')
    console.log('📷 Initial camera position:', camera.position)
    console.log('🎮 Has controls ref:', !!controlsRef.current)
    
    const loadTLEs = async () => {
      try {
        // 加载著名卫星
        const famousTLEs = await getFamousSatellitesTLE()
        for (const [name, tle] of Object.entries(famousTLEs)) {
          if (tle) {
            satrecsCache.current[name] = createSatrecFromTLE(tle)
          }
        }

        // 加载主卫星 (56309)
        const mainTLE = await getTargetSatelliteTLE()
        if (mainTLE) {
          satrecsCache.current['SATELLITE_56309'] = createSatrecFromTLE(mainTLE)
          satrecsCache.current['LUMELITE4'] = createSatrecFromTLE(mainTLE) // 别名
        }

        console.log('✅ Camera Controller: TLE data loaded for', Object.keys(satrecsCache.current).length, 'satellites')
        console.log('📋 Available satellites:', Object.keys(satrecsCache.current))
      } catch (error) {
        console.error('❌ Camera Controller: Failed to load TLE data:', error)
      }
    }

    loadTLEs()
  }, [])

  // 监听 focusedSatellite 变化
  useEffect(() => {
    console.log('👀 Focus effect triggered:', {
      focusedSatellite,
      isAnimating: isAnimating.current,
      hasControls: !!controlsRef.current
    })
    
    if (!focusedSatellite || isAnimating.current) {
      console.log('⏭️ Skipping focus')
      return
    }
    
    if (!controlsRef.current) {
      console.error('❌ controlsRef.current is null!')
      return
    }

    const focusOnSatellite = async () => {
      try {
        isAnimating.current = true
        console.log('🎯 Focusing on satellite:', focusedSatellite)
        console.log('📷 Camera position before:', camera.position)
        console.log('🎮 Controls target before:', controlsRef.current!.target)

        // 获取卫星的 satrec
        let satrec = satrecsCache.current[focusedSatellite]

        // 如果缓存中没有，尝试根据 NORAD ID 加载
        if (!satrec) {
          console.warn('⚠️ Satrec not found in cache for:', focusedSatellite)
          
          // 检查是否是主卫星
          if (focusedSatellite === 'SATELLITE_56309' || focusedSatellite === '56309') {
            const tle = await getTargetSatelliteTLE()
            if (tle) {
              satrec = createSatrecFromTLE(tle)
              satrecsCache.current[focusedSatellite] = satrec
            }
          }
        }

        if (!satrec) {
          console.error('❌ Cannot find satrec for:', focusedSatellite)
          isAnimating.current = false
          return
        }

        // 获取当前时间和卫星位置
        const currentTime = getCurrentEffectiveTime()
        const pv = satellite.propagate(satrec, currentTime)

        if (!pv || !pv.position || typeof pv.position === 'boolean') {
          console.error('❌ Invalid satellite position')
          isAnimating.current = false
          return
        }

        // 转换为地理坐标
        const positionEci = pv.position
        const gmst = satellite.gstime(currentTime)
        const positionGd = satellite.eciToGeodetic(positionEci, gmst)

        const latDeg = positionGd.latitude * (180 / Math.PI)
        const lonDeg = positionGd.longitude * (180 / Math.PI)
        const altKm = positionGd.height

        // 转换为场景局部坐标（相对于地球组）
        const scenePos = latLonAltToScenePosition(latDeg, lonDeg, altKm)
        // 将局部坐标转为世界坐标（因为相机在世界坐标系下）
        const earthRotY = getEarthRotationY(currentTime)
        const worldPos = scenePos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), earthRotY)

        console.log('📍 Satellite position (world):', {
          lat: latDeg.toFixed(2),
          lon: lonDeg.toFixed(2),
          alt: altKm.toFixed(2),
          worldPos: { x: worldPos.x.toFixed(2), y: worldPos.y.toFixed(2), z: worldPos.z.toFixed(2) }
        })

        // 计算相机位置：在从地球中心到卫星的延长线上，距离卫星一定距离
        // 这样相机会正对着卫星，并让卫星位于画面中心
        const satellitePos = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)

        // 依据当前相机位置来选择更稳定的入场方向（避免突然翻转）
        const currentDir = camera.position.clone().sub(controlsRef.current!.target).normalize()

        // 从地球中心指向卫星的方向
        const directionFromCenter = satellitePos.clone().normalize()

        // 方向插值，避免大幅度方向跳变造成的绕地球滑动感
        const blendedDir = new THREE.Vector3().lerpVectors(currentDir, directionFromCenter, 0.65).normalize()

        // 相机距离卫星的距离（可调整）
        const cameraDistance = 3.2

        // 相机位置 = 卫星位置 + (混合方向 * 距离)
        const cameraPosition = satellitePos.clone().add(blendedDir.multiplyScalar(cameraDistance))

        console.log('🎯 Target positions:', {
          satellitePos: { x: satellitePos.x.toFixed(2), y: satellitePos.y.toFixed(2), z: satellitePos.z.toFixed(2) },
          cameraPosition: { x: cameraPosition.x.toFixed(2), y: cameraPosition.y.toFixed(2), z: cameraPosition.z.toFixed(2) },
          distance: cameraDistance
        })

        // 平滑动画到目标位置
        // 相机位置移动到 cameraPosition，同时看向卫星 (satellitePos)
        console.log('🚀 Starting camera animation...')
        animateCameraToPosition(camera, controlsRef.current!, cameraPosition, satellitePos, 1500) // 1.5秒动画

      } catch (error) {
        console.error('❌ Error focusing on satellite:', error)
      } finally {
        setTimeout(() => {
          isAnimating.current = false
        }, 1600)
      }
    }

    focusOnSatellite()
  }, [focusedSatellite, camera, controlsRef, getCurrentEffectiveTime])

  return null
}

/**
 * 平滑动画相机到目标位置
 * @param camera - 相机对象
 * @param controls - OrbitControls 控制器
 * @param targetPosition - 相机的目标位置（相机会移动到这里）
 * @param lookAtPosition - 相机观察的目标点（controls.target，相机会看向这里）
 * @param duration - 动画持续时间（毫秒）
 */
function animateCameraToPosition(
  camera: THREE.Camera,
  controls: OrbitControlsType,
  targetPosition: THREE.Vector3,
  lookAtPosition: THREE.Vector3,
  duration: number
) {
  const startPosition = camera.position.clone()
  const startTarget = controls.target.clone()
  const startTime = Date.now()

  console.log('🎬 Animation started:', {
    startPos: startPosition,
    targetPos: targetPosition,
    startTarget: startTarget,
    lookAt: lookAtPosition,
    message: 'Camera will move to targetPos and look at lookAt'
  })

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用 easeInOutCubic 缓动函数
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    // 插值相机位置
    camera.position.lerpVectors(startPosition, targetPosition, eased)

    // 插值控制器目标
    controls.target.lerpVectors(startTarget, lookAtPosition, eased)
    controls.update()

    // 每10帧打印一次进度
    if (Math.floor(progress * 100) % 10 === 0) {
      console.log(`📹 Animation progress: ${(progress * 100).toFixed(0)}%`, {
        cameraPos: camera.position,
        controlsTarget: controls.target
      })
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      console.log('✅ Camera animation complete!', {
        finalCameraPos: camera.position,
        finalTarget: controls.target
      })
      // 最终确保精确到位
      controls.target.copy(lookAtPosition)
      camera.position.copy(targetPosition)
      controls.update()
      console.log('🔓 Controls are now free - you can move the camera!')
    }
  }

  animate()
}

export default CameraController

