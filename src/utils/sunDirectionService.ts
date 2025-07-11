import * as THREE from 'three';

/**
 * 太阳方向计算服务
 * 基于天文公式计算太阳在ECI坐标系中的真实方向
 * 参考：IAU 2006标准，J2000坐标系
 */

export interface SunPosition {
  x: number;  // ECI X方向（单位向量）
  y: number;  // ECI Y方向（单位向量）
  z: number;  // ECI Z方向（单位向量）
}

export class SunDirectionService {
  private static instance: SunDirectionService;

  public static getInstance(): SunDirectionService {
    if (!SunDirectionService.instance) {
      SunDirectionService.instance = new SunDirectionService();
    }
    return SunDirectionService.instance;
  }

  /**
   * 计算指定时刻太阳在ECI坐标系中的方向（标准天文算法）
   * @param date UTC时间
   * @returns 太阳方向单位向量
   */
  public getSunDirection(date: Date = new Date()): SunPosition {
    // 1. 计算从J2000到指定时刻的儒略世纪数
    const j2000 = new Date('2000-01-01T12:00:00Z');
    const t = (date.getTime() - j2000.getTime()) / (365.25 * 24 * 60 * 60 * 1000) / 100;

    // 2. 计算太阳的平黄经（Mean Longitude）
    const L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    // 3. 计算太阳的平近点角（Mean Anomaly）
    const M = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
    // 4. 计算太阳中心差（Equation of Center）
    const C = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M * Math.PI / 180) +
              (0.019993 - 0.000101 * t) * Math.sin(2 * M * Math.PI / 180) +
              0.000290 * Math.sin(3 * M * Math.PI / 180);
    // 5. 太阳真黄经（True Longitude）
    const L = L0 + C;
    // 6. 黄赤交角（Obliquity of Ecliptic）
    const epsilon = 23.43928 * Math.PI / 180; // 单位：弧度
    // 7. 太阳真黄经（单位：弧度）
    const lambda = L * Math.PI / 180;
    // 8. 太阳在ECI下的方向（单位向量）
    const x = Math.cos(lambda);
    const y = Math.cos(epsilon) * Math.sin(lambda);
    const z = Math.sin(epsilon) * Math.sin(lambda);
    // 归一化
    const mag = Math.sqrt(x * x + y * y + z * z);
    return {
      x: x / mag,
      y: y / mag,
      z: z / mag
    };
  }

  public getCurrentSunDirection(): SunPosition {
    return this.getSunDirection(new Date());
  }

  public getSunDirectionVector(date: Date = new Date()): THREE.Vector3 {
    const sunPos = this.getSunDirection(date);
    return new THREE.Vector3(sunPos.x, sunPos.y, sunPos.z);
  }

  public validateCalculation(date: Date = new Date()): {
    sunDirection: SunPosition;
    isVernalEquinox: boolean;
    expectedDirection: string;
  } {
    const sunPos = this.getSunDirection(date);
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    // 春分日大约在3月20-21日
    const isVernalEquinox = (month === 3 && day >= 19 && day <= 22);
    let expectedDirection = '';
    if (isVernalEquinox) {
      expectedDirection = '应该接近 (1, 0, 0)';
    } else if (month === 6 && day >= 20 && day <= 22) {
      expectedDirection = '夏至，应该接近 (0, 0, 1)';
    } else if (month === 9 && day >= 22 && day <= 24) {
      expectedDirection = '秋分，应该接近 (-1, 0, 0)';
    } else if (month === 12 && day >= 21 && day <= 23) {
      expectedDirection = '冬至，应该接近 (0, 0, -1)';
    }
    return {
      sunDirection: sunPos,
      isVernalEquinox,
      expectedDirection
    };
  }
}

export const sunDirectionService = SunDirectionService.getInstance(); 