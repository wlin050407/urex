/**
 * TLE轨道传播器服务
 * 使用SGP4/SDP4模型计算卫星位置
 * 适配项目原有的地球模型和ECI坐标系
 * 支持ECI、ECF坐标转换和地理坐标计算
 */

import { TLEData } from './celestrakService';

// 地球物理常数
const EARTH_RADIUS = 6378.137; // 地球平均半径 (km)
const EARTH_FLATTENING = 1 / 298.257223563; // 地球扁率
const EARTH_GM = 398600.4418; // 地球引力常数 (km³/s²)
const EARTH_OMEGA = 7.2921151467e-5; // 地球自转角速度 (rad/s)

// 项目坐标系常量
const PROJECTION_SCALE = 5.0 / EARTH_RADIUS; // 项目地球半径5单位对应真实地球半径
// const PROJECTION_ECI_X = [1, 0, 0]; // 项目ECI X轴方向（太阳方向）
// const PROJECTION_ECI_Y = [0, 0, 1]; // 项目ECI Y轴方向（注意：与标准ECI不同）
// const PROJECTION_ECI_Z = [0, 1, 0]; // 项目ECI Z轴方向（注意：与标准ECI不同）

// 轨道类型判断阈值
const DEEP_SPACE_THRESHOLD = 0.99; // 深空轨道阈值

/**
 * 卫星位置和速度向量
 */
export interface SatelliteState {
  position: [number, number, number]; // ECI坐标 (km)
  velocity: [number, number, number]; // ECI速度 (km/s)
  timestamp: Date; // 计算时间
}

/**
 * 项目坐标系中的卫星状态
 */
export interface ProjectSatelliteState {
  position: [number, number, number]; // 项目坐标系位置（单位：项目单位）
  velocity: [number, number, number]; // 项目坐标系速度
  timestamp: Date; // 计算时间
  eciPosition: [number, number, number]; // 标准ECI位置（km）
  geographicPosition: GeographicCoordinates; // 地理坐标
}

/**
 * 地理坐标
 */
export interface GeographicCoordinates {
  latitude: number;   // 纬度 (度)
  longitude: number;  // 经度 (度)
  altitude: number;   // 高度 (km)
  timestamp: Date;    // 时间
}

/**
 * 轨道传播器类
 */
export class TLEPropagator {
  private tleData: TLEData;
  private isDeepSpace: boolean;

  constructor(tleData: TLEData) {
    this.tleData = tleData;
    this.isDeepSpace = this.checkIfDeepSpace();
  }

  /**
   * 判断是否为深空轨道
   */
  private checkIfDeepSpace(): boolean {
    const meanMotion = this.tleData.meanMotion;
    const period = 24 * 60 * 60 / meanMotion; // 轨道周期 (秒)
    return period > DEEP_SPACE_THRESHOLD * 24 * 60 * 60; // 大于0.99天
  }

  /**
   * 计算指定时间的卫星状态
   */
  propagateToTime(targetTime: Date): SatelliteState {
    const timeSinceEpoch = this.calculateTimeSinceEpoch(targetTime);
    
    if (this.isDeepSpace) {
      return this.propagateSDP4(timeSinceEpoch);
    } else {
      return this.propagateSGP4(timeSinceEpoch);
    }
  }

  /**
   * 计算指定时间的卫星状态（项目坐标系）
   */
  propagateToProjectTime(targetTime: Date): ProjectSatelliteState {
    const eciState = this.propagateToTime(targetTime);
    const ecfState = this.eciToEcf(eciState);
    const geoCoords = this.ecfToGeographic(ecfState);
    
    // 转换为项目坐标系
    const projectPosition = this.convertToProjectCoordinates(eciState.position);
    const projectVelocity = this.convertToProjectCoordinates(eciState.velocity);
    
    return {
      position: projectPosition,
      velocity: projectVelocity,
      timestamp: eciState.timestamp,
      eciPosition: eciState.position,
      geographicPosition: geoCoords
    };
  }

  /**
   * 计算从历元开始的时间差（分钟）
   */
  private calculateTimeSinceEpoch(targetTime: Date): number {
    const epochTime = this.tleData.epoch.getTime();
    const targetTimeMs = targetTime.getTime();
    return (targetTimeMs - epochTime) / (1000 * 60); // 转换为分钟
  }

  /**
   * SGP4轨道传播（近地轨道）
   */
  private propagateSGP4(timeSinceEpoch: number): SatelliteState {
    // 简化的SGP4实现
    const { meanMotion, eccentricity, inclination, raan, argumentOfPeriapsis, meanAnomaly } = this.tleData;
    
    // 计算平均角速度 (rad/min)
    const n = meanMotion * 2 * Math.PI / (24 * 60);
    
    // 计算当前平近点角
    const M = meanAnomaly + n * timeSinceEpoch;
    
    // 简化的开普勒方程求解（迭代法）
    let E = M; // 初始猜测
    for (let i = 0; i < 5; i++) {
      E = M + eccentricity * Math.sin(E);
    }
    
    // 计算真近点角
    const f = 2 * Math.atan(Math.sqrt((1 + eccentricity) / (1 - eccentricity)) * Math.tan(E / 2));
    
    // 计算轨道半长轴
    const a = Math.pow(EARTH_GM / (n * n), 1/3);
    
    // 计算当前轨道半径
    const r = a * (1 - eccentricity * Math.cos(E));
    
    // 计算ECI位置
    const cosRAAN = Math.cos(raan);
    const sinRAAN = Math.sin(raan);
    const cosArgPer = Math.cos(argumentOfPeriapsis);
    const sinArgPer = Math.sin(argumentOfPeriapsis);
    const cosInc = Math.cos(inclination);
    const sinInc = Math.sin(inclination);
    const cosF = Math.cos(f);
    const sinF = Math.sin(f);
    
    const x = r * (cosRAAN * cosArgPer - sinRAAN * sinArgPer * cosInc) * cosF +
              r * (-cosRAAN * sinArgPer - sinRAAN * cosArgPer * cosInc) * sinF;
    
    const y = r * (sinRAAN * cosArgPer + cosRAAN * sinArgPer * cosInc) * cosF +
              r * (-sinRAAN * sinArgPer + cosRAAN * cosArgPer * cosInc) * sinF;
    
    const z = r * sinArgPer * sinInc * cosF + r * cosArgPer * sinInc * sinF;
    
    // 简化的速度计算
    const velocity = this.calculateVelocity([x, y, z], n, eccentricity, f);
    
    return {
      position: [x, y, z],
      velocity: velocity,
      timestamp: new Date(this.tleData.epoch.getTime() + timeSinceEpoch * 60 * 1000)
    };
  }

  /**
   * SDP4轨道传播（深空轨道）
   */
  private propagateSDP4(timeSinceEpoch: number): SatelliteState {
    // 深空轨道的简化实现
    // 对于深空轨道，需要考虑月球和太阳的引力影响
    // 这里提供基础实现，实际应用中可能需要更复杂的模型
    
    const state = this.propagateSGP4(timeSinceEpoch);
    
    // 深空轨道的修正（简化）
    const correction = this.calculateDeepSpaceCorrection(timeSinceEpoch);
    
    return {
      position: [
        state.position[0] + correction[0],
        state.position[1] + correction[1],
        state.position[2] + correction[2]
      ],
      velocity: state.velocity,
      timestamp: state.timestamp
    };
  }

  /**
   * 计算深空轨道修正
   */
  private calculateDeepSpaceCorrection(timeSinceEpoch: number): [number, number, number] {
    // 简化的深空修正，实际应用中需要更复杂的计算
    const factor = timeSinceEpoch / (24 * 60); // 天数
    const correction = factor * 0.001; // 简化的修正因子
    
    return [correction, correction, correction];
  }

  /**
   * 计算卫星速度
   */
  private calculateVelocity(position: [number, number, number], n: number, eccentricity: number, f: number): [number, number, number] {
    // 简化的速度计算
    const r = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
    const velocity = n * r * Math.sqrt(1 + 2 * eccentricity * Math.cos(f) + eccentricity * eccentricity);
    
    // 方向与位置向量垂直
    return [
      -position[1] * velocity / r,
      position[0] * velocity / r,
      0
    ];
  }

  /**
   * 将标准ECI坐标转换为项目坐标系
   */
  private convertToProjectCoordinates(eciPosition: [number, number, number]): [number, number, number] {
    const [x, y, z] = eciPosition;
    
    // 项目坐标系转换：
    // X轴：标准ECI X轴（太阳方向）
    // Y轴：标准ECI Z轴（注意：与标准ECI不同）
    // Z轴：标准ECI Y轴（注意：与标准ECI不同）
    
    return [
      x * PROJECTION_SCALE,           // X轴：太阳方向
      z * PROJECTION_SCALE,           // Y轴：标准ECI的Z轴
      y * PROJECTION_SCALE            // Z轴：标准ECI的Y轴
    ];
  }

  /**
   * 将项目坐标系转换为标准ECI坐标
   */
  /*
  private convertFromProjectCoordinates(projectPosition: [number, number, number]): [number, number, number] {
    const [x, y, z] = projectPosition;
    
    // 反向转换
    return [
      x / PROJECTION_SCALE,           // 标准ECI X轴
      z / PROJECTION_SCALE,           // 标准ECI Y轴
      y / PROJECTION_SCALE            // 标准ECI Z轴
    ];
  }
  */

  /**
   * 将ECI坐标转换为ECF坐标
   */
  eciToEcf(eciState: SatelliteState): SatelliteState {
    const { position, velocity, timestamp } = eciState;
    const [x, y, z] = position;
    const [vx, vy, vz] = velocity;
    
    // 计算格林威治恒星时
    const gmst = this.calculateGMST(timestamp);
    
    // 旋转矩阵（绕Z轴）
    const cosGMST = Math.cos(gmst);
    const sinGMST = Math.sin(gmst);
    
    // 位置转换
    const ecfX = x * cosGMST + y * sinGMST;
    const ecfY = -x * sinGMST + y * cosGMST;
    const ecfZ = z;
    
    // 速度转换（考虑地球自转）
    const ecfVx = vx * cosGMST + vy * sinGMST + EARTH_OMEGA * ecfY;
    const ecfVy = -vx * sinGMST + vy * cosGMST - EARTH_OMEGA * ecfX;
    const ecfVz = vz;
    
    return {
      position: [ecfX, ecfY, ecfZ],
      velocity: [ecfVx, ecfVy, ecfVz],
      timestamp
    };
  }

  /**
   * 将ECF坐标转换为地理坐标
   */
  ecfToGeographic(ecfState: SatelliteState): GeographicCoordinates {
    const [x, y, z] = ecfState.position;
    
    // 计算经度
    const longitude = Math.atan2(y, x) * 180 / Math.PI;
    
    // 计算纬度（迭代法）
    const p = Math.sqrt(x * x + y * y);
    let latitude = Math.atan2(z, p);
    
    // 考虑地球扁率的迭代修正
    for (let i = 0; i < 3; i++) {
      const sinLat = Math.sin(latitude);
      const N = EARTH_RADIUS / Math.sqrt(1 - EARTH_FLATTENING * (2 - EARTH_FLATTENING) * sinLat * sinLat);
      const h = p / Math.cos(latitude) - N;
      const newLat = Math.atan2(z, p * (1 - EARTH_FLATTENING * N / (N + h)));
      
      if (Math.abs(newLat - latitude) < 1e-10) {
        latitude = newLat;
        break;
      }
      latitude = newLat;
    }
    
    // 转换为度
    latitude = latitude * 180 / Math.PI;
    
    // 计算高度
    const sinLat = Math.sin(latitude * Math.PI / 180);
    const N = EARTH_RADIUS / Math.sqrt(1 - EARTH_FLATTENING * (2 - EARTH_FLATTENING) * sinLat * sinLat);
    const altitude = p / Math.cos(latitude * Math.PI / 180) - N;
    
    return {
      latitude,
      longitude,
      altitude,
      timestamp: ecfState.timestamp
    };
  }

  /**
   * 计算格林威治恒星时
   */
  private calculateGMST(date: Date): number {
    // 简化的GMST计算
    const jd = this.dateToJulianDay(date);
    const t = (jd - 2451545.0) / 36525.0;
    
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000;
    
    // 归一化到[0, 360)
    gmst = ((gmst % 360) + 360) % 360;
    
    return gmst * Math.PI / 180; // 转换为弧度
  }

  /**
   * 将日期转换为儒略日
   */
  private dateToJulianDay(date: Date): number {
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    if (month <= 2) {
      month += 12;
      year -= 1;
    }
    
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    
    const jd = Math.floor(365.25 * (year + 4716)) + 
               Math.floor(30.6001 * (month + 1)) + 
               day + b - 1524.5 +
               hour / 24 + minute / 1440 + second / 86400;
    
    return jd;
  }

  /**
   * 计算卫星在地面的投影点
   */
  calculateGroundTrack(ecfState: SatelliteState): GeographicCoordinates {
    const [x, y, z] = ecfState.position;
    
    // 地面投影（高度为0）
    const p = Math.sqrt(x * x + y * y);
    const longitude = Math.atan2(y, x) * 180 / Math.PI;
    const latitude = Math.atan2(z, p) * 180 / Math.PI;
    
    return {
      latitude,
      longitude,
      altitude: 0,
      timestamp: ecfState.timestamp
    };
  }

  /**
   * 计算卫星可见性（简化版）
   */
  calculateVisibility(geographicCoords: GeographicCoordinates, observerLat: number, observerLon: number, _observerAlt: number = 0): boolean {
    // 简化的可见性计算
    const lat1 = observerLat * Math.PI / 180;
    const lon1 = observerLon * Math.PI / 180;
    const lat2 = geographicCoords.latitude * Math.PI / 180;
    const lon2 = geographicCoords.longitude * Math.PI / 180;
    
    // 计算大圆距离
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + 
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2) * Math.sin(dlon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = EARTH_RADIUS * c;
    
    // 考虑地球曲率和高度
    const maxDistance = Math.sqrt(2 * EARTH_RADIUS * geographicCoords.altitude + geographicCoords.altitude * geographicCoords.altitude);
    
    return distance <= maxDistance;
  }
}

/**
 * 便捷函数：直接计算卫星的地理坐标
 */
export function calculateSatellitePosition(tleData: TLEData, targetTime: Date): GeographicCoordinates {
  const propagator = new TLEPropagator(tleData);
  const eciState = propagator.propagateToTime(targetTime);
  const ecfState = propagator.eciToEcf(eciState);
  return propagator.ecfToGeographic(ecfState);
}

/**
 * 便捷函数：计算卫星的ECI状态
 */
export function calculateSatelliteECI(tleData: TLEData, targetTime: Date): SatelliteState {
  const propagator = new TLEPropagator(tleData);
  return propagator.propagateToTime(targetTime);
}

/**
 * 便捷函数：计算卫星的ECF状态
 */
export function calculateSatelliteECF(tleData: TLEData, targetTime: Date): SatelliteState {
  const propagator = new TLEPropagator(tleData);
  const eciState = propagator.propagateToTime(targetTime);
  return propagator.eciToEcf(eciState);
}

/**
 * 便捷函数：计算卫星在项目坐标系中的状态
 */
export function calculateSatelliteProjectPosition(tleData: TLEData, targetTime: Date): ProjectSatelliteState {
  const propagator = new TLEPropagator(tleData);
  return propagator.propagateToProjectTime(targetTime);
}

/**
 * 便捷函数：计算卫星在项目坐标系中的位置（仅位置）
 */
export function calculateSatelliteProjectCoordinates(tleData: TLEData, targetTime: Date): [number, number, number] {
  const projectState = calculateSatelliteProjectPosition(tleData, targetTime);
  return projectState.position;
}

// 默认导出
export default TLEPropagator;
