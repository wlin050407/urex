/**
 * 坐标转换工具函数
 * 将地理坐标（经纬度+高度）转换为3D场景坐标
 */

import * as THREE from 'three'

const EARTH_RADIUS_KM = 6378.137
const SCENE_EARTH_RADIUS = 5 // 场景中地球的半径

/**
 * 将经纬度和高度转换为3D场景坐标
 * 注意：此函数返回的是相对于地球表面的固定位置
 * 如果卫星在地球的旋转group内部，不需要额外应用地球旋转
 * 
 * @param lat 纬度（度）
 * @param lon 经度（度）
 * @param altitudeKm 海拔高度（公里）
 * @returns THREE.Vector3 场景坐标
 */
export function latLonAltToScenePosition(
  lat: number,
  lon: number,
  altitudeKm: number
): THREE.Vector3 {
  // 将经纬度转换为球面坐标
  const phi = (90 - lat) * (Math.PI / 180) // 从北极开始的角度
  const theta = (lon + 180) * (Math.PI / 180) // 从本初子午线开始的角度
  
  // 计算半径（地球半径 + 高度）
  const totalRadiusKm = EARTH_RADIUS_KM + altitudeKm
  const sceneRadius = (totalRadiusKm / EARTH_RADIUS_KM) * SCENE_EARTH_RADIUS
  
  // 球面坐标转笛卡尔坐标
  // Three.js 坐标系：Y轴向上，X轴向右，Z轴向前
  // 经度0度（本初子午线）对应 X轴正方向
  const x = -(sceneRadius * Math.sin(phi) * Math.cos(theta))
  const y = sceneRadius * Math.cos(phi)
  const z = sceneRadius * Math.sin(phi) * Math.sin(theta)
  
  return new THREE.Vector3(x, y, z)
}

/**
 * 计算地球当前的旋转角度（基于UTC时间）
 * @param time 当前时间
 * @returns Y轴旋转角度（弧度）
 */
export function getEarthRotationY(time: Date): number {
  const u = time.getUTCHours() / 24 +
            time.getUTCMinutes() / 1440 +
            time.getUTCSeconds() / 86400 +
            time.getUTCMilliseconds() / 86400000
  return u * 2 * Math.PI - Math.PI
}

/**
 * 将ECI坐标转换为场景坐标（备用方法）
 * @param eciX ECI X坐标（km）
 * @param eciY ECI Y坐标（km）
 * @param eciZ ECI Z坐标（km）
 * @returns THREE.Vector3 场景坐标
 */
export function eciToScenePosition(eciX: number, eciY: number, eciZ: number): THREE.Vector3 {
  const scaleKmToScene = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM
  
  // ECI坐标系到场景坐标系的映射
  const x = eciX * scaleKmToScene
  const y = eciZ * scaleKmToScene  // ECI Z → Scene Y
  const z = -eciY * scaleKmToScene // ECI Y → -Scene Z
  
  return new THREE.Vector3(x, y, z)
}

