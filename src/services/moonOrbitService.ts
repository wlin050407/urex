/**
 * 月球轨道计算服务
 * 基于真实月球轨道参数实现开普勒椭圆轨道
 * 考虑轨道偏心率、倾角等真实参数
 */

// 月球轨道参数（基于真实数据）
export const MOON_ORBITAL_PARAMS = {
  // 轨道半长轴 (km) - 平均距离
  SEMI_MAJOR_AXIS: 384400, // 约38.44万公里
  
  // 轨道偏心率
  ECCENTRICITY: 0.0549, // 真实月球轨道偏心率
  
  // 轨道倾角 (度) - 相对于地球赤道面
  INCLINATION: 23.5, // 约23.5度（相对于地球赤道面，实际在18-28度之间变化）
  
  // 升交点赤经 (度) - 会随时间变化
  LONGITUDE_OF_ASCENDING_NODE: 125.08, // 当前值，会进动
  
  // 近地点幅角 (度) - 会随时间变化
  ARGUMENT_OF_PERIGEE: 318.15, // 当前值，会进动
  
  // 平均近点角 (度) - 初始值
  MEAN_ANOMALY: 0, // 从近地点开始
  
  // 轨道周期 (天)
  ORBITAL_PERIOD: 27.3217, // 恒星月周期
  
  // 月球半径 (km)
  MOON_RADIUS: 1737.4, // 约1737公里
  
  // 地球半径 (km) - 用于比例计算
  EARTH_RADIUS: 6378.137,
  
  // 项目中的地球半径 (单位)
  PROJECT_EARTH_RADIUS: 5.0,
  
  // 月球质量 (kg)
  MOON_MASS: 7.342e22,
  
  // 地球质量 (kg)
  EARTH_MASS: 5.972e24,
  
  // 引力常数 (m³/kg·s²)
  G: 6.67430e-11,
  
  // 月球轨道进动率 (度/年)
  NODE_PRECESSION_RATE: -0.05295, // 升交点进动
  PERIGEE_PRECESSION_RATE: 0.11140, // 近地点进动
} as const;

export interface MoonPosition {
  position: [number, number, number]; // ECI坐标 (km)
  velocity: [number, number, number]; // ECI速度 (km/s)
  distance: number; // 距离地球中心距离 (km)
  trueAnomaly: number; // 真近点角 (弧度)
  eccentricAnomaly: number; // 偏近点角 (弧度)
  meanAnomaly: number; // 平近点角 (弧度)
  timestamp: Date;
}

export interface MoonOrbitState {
  position: [number, number, number]; // 项目坐标系位置
  distance: number; // 距离地球中心距离 (项目单位)
  phase: number; // 月相 (0-1, 0=新月, 0.5=满月)
  illumination: number; // 光照比例 (0-1)
  trueAnomaly: number; // 真近点角 (弧度)
  isVisible: boolean; // 是否可见
}

/**
 * 月球轨道计算器类
 */
export class MoonOrbitCalculator {
  private epoch: Date;
  
  constructor(epoch: Date = new Date()) {
    this.epoch = epoch;
  }
  
  /**
   * 计算指定时间的月球位置
   */
  calculatePosition(targetTime: Date): MoonPosition {
    const timeSinceEpoch = (targetTime.getTime() - this.epoch.getTime()) / (1000 * 60 * 60 * 24); // 天数
    
    // 计算当前轨道参数（考虑进动）
    const currentRAAN = this.calculateCurrentRAAN(timeSinceEpoch);
    const currentArgPer = this.calculateCurrentArgumentOfPerigee(timeSinceEpoch);
    const currentMeanAnomaly = this.calculateCurrentMeanAnomaly(timeSinceEpoch);
    
    // 求解开普勒方程得到偏近点角
    const eccentricAnomaly = this.solveKeplerEquation(currentMeanAnomaly, MOON_ORBITAL_PARAMS.ECCENTRICITY);
    
    // 计算真近点角
    const trueAnomaly = this.calculateTrueAnomaly(eccentricAnomaly, MOON_ORBITAL_PARAMS.ECCENTRICITY);
    
    // 计算轨道半径
    const distance = this.calculateOrbitalRadius(eccentricAnomaly, MOON_ORBITAL_PARAMS.SEMI_MAJOR_AXIS, MOON_ORBITAL_PARAMS.ECCENTRICITY);
    
    // 计算ECI位置
    const position = this.calculateECIPosition(
      distance,
      trueAnomaly,
      currentRAAN,
      currentArgPer,
      MOON_ORBITAL_PARAMS.INCLINATION
    );
    
    // 计算速度（简化）
    const velocity = this.calculateVelocity(position, distance, trueAnomaly);
    
    return {
      position,
      velocity,
      distance,
      trueAnomaly,
      eccentricAnomaly,
      meanAnomaly: currentMeanAnomaly,
      timestamp: targetTime
    };
  }
  
  /**
   * 计算当前升交点赤经（考虑进动）
   */
  private calculateCurrentRAAN(timeSinceEpoch: number): number {
    const yearsSinceEpoch = timeSinceEpoch / 365.25;
    return MOON_ORBITAL_PARAMS.LONGITUDE_OF_ASCENDING_NODE + 
           MOON_ORBITAL_PARAMS.NODE_PRECESSION_RATE * yearsSinceEpoch;
  }
  
  /**
   * 计算当前近地点幅角（考虑进动）
   */
  private calculateCurrentArgumentOfPerigee(timeSinceEpoch: number): number {
    const yearsSinceEpoch = timeSinceEpoch / 365.25;
    return MOON_ORBITAL_PARAMS.ARGUMENT_OF_PERIGEE + 
           MOON_ORBITAL_PARAMS.PERIGEE_PRECESSION_RATE * yearsSinceEpoch;
  }
  
  /**
   * 计算当前平近点角
   */
  private calculateCurrentMeanAnomaly(timeSinceEpoch: number): number {
    const meanMotion = 360 / MOON_ORBITAL_PARAMS.ORBITAL_PERIOD; // 度/天
    return (MOON_ORBITAL_PARAMS.MEAN_ANOMALY + meanMotion * timeSinceEpoch) % 360;
  }
  
  /**
   * 求解开普勒方程 E = M + e*sin(E)
   * 使用牛顿-拉夫逊迭代法
   */
  private solveKeplerEquation(meanAnomaly: number, eccentricity: number): number {
    const M = meanAnomaly * Math.PI / 180; // 转换为弧度
    
    // 初始猜测 - 对于小偏心率，使用更好的初始值
    let E = M;
    if (eccentricity > 0.8) {
      E = Math.PI;
    } else if (eccentricity > 0.1) {
      E = M + eccentricity * Math.sin(M);
    }
    
    // 牛顿-拉夫逊迭代
    for (let i = 0; i < 20; i++) {
      const f = E - eccentricity * Math.sin(E) - M;
      const fPrime = 1 - eccentricity * Math.cos(E);
      
      if (Math.abs(f) < 1e-12) break;
      
      const deltaE = f / fPrime;
      E = E - deltaE;
      
      // 防止发散
      if (Math.abs(deltaE) > Math.PI) {
        E = M;
      }
    }
    
    return E;
  }
  
  /**
   * 计算真近点角
   */
  private calculateTrueAnomaly(eccentricAnomaly: number, eccentricity: number): number {
    const sinE = Math.sin(eccentricAnomaly);
    const cosE = Math.cos(eccentricAnomaly);
    
    const sinF = Math.sqrt(1 - eccentricity * eccentricity) * sinE / (1 - eccentricity * cosE);
    const cosF = (cosE - eccentricity) / (1 - eccentricity * cosE);
    
    return Math.atan2(sinF, cosF);
  }
  
  /**
   * 计算轨道半径
   */
  private calculateOrbitalRadius(eccentricAnomaly: number, semiMajorAxis: number, eccentricity: number): number {
    return semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
  }
  
  /**
   * 计算ECI位置
   */
  private calculateECIPosition(
    distance: number,
    trueAnomaly: number,
    raan: number,
    argPer: number,
    inclination: number
  ): [number, number, number] {
    const cosRAAN = Math.cos(raan * Math.PI / 180);
    const sinRAAN = Math.sin(raan * Math.PI / 180);
    const cosArgPer = Math.cos(argPer * Math.PI / 180);
    const sinArgPer = Math.sin(argPer * Math.PI / 180);
    const cosInc = Math.cos(inclination * Math.PI / 180);
    const sinInc = Math.sin(inclination * Math.PI / 180);
    const cosF = Math.cos(trueAnomaly);
    const sinF = Math.sin(trueAnomaly);
    
    // 计算位置向量
    const x = distance * (
      (cosRAAN * cosArgPer - sinRAAN * sinArgPer * cosInc) * cosF +
      (-cosRAAN * sinArgPer - sinRAAN * cosArgPer * cosInc) * sinF
    );
    
    const y = distance * (
      (sinRAAN * cosArgPer + cosRAAN * sinArgPer * cosInc) * cosF +
      (-sinRAAN * sinArgPer + cosRAAN * cosArgPer * cosInc) * sinF
    );
    
    const z = distance * (sinArgPer * sinInc * cosF + cosArgPer * sinInc * sinF);
    
    return [x, y, z];
  }
  
  /**
   * 计算速度（简化计算）
   */
  private calculateVelocity(position: [number, number, number], distance: number, trueAnomaly: number): [number, number, number] {
    // 简化的速度计算
    const speed = Math.sqrt(MOON_ORBITAL_PARAMS.G * MOON_ORBITAL_PARAMS.EARTH_MASS / distance) / 1000; // km/s
    
    // 垂直于位置向量的速度方向
    const vx = -speed * Math.sin(trueAnomaly);
    const vy = speed * Math.cos(trueAnomaly);
    const vz = 0; // 简化，假设在轨道平面内
    
    return [vx, vy, vz];
  }
  
  /**
   * 计算月相
   * 使用项目坐标系计算，确保与太阳位置一致
   */
  calculateMoonPhase(projectPosition: [number, number, number], sunProjectPosition: [number, number, number] = [100, 0, 0]): number {
    // 计算月球相对于太阳的角度（在项目坐标系中）
    const moonAngle = Math.atan2(projectPosition[1], projectPosition[0]);
    const sunAngle = Math.atan2(sunProjectPosition[1], sunProjectPosition[0]);
    
    let phase = (moonAngle - sunAngle) / (2 * Math.PI);
    if (phase < 0) phase += 1;
    
    return phase;
  }
  
  /**
   * 计算光照比例
   * 月相定义：0=新月，0.25=上弦月，0.5=满月，0.75=下弦月
   */
  calculateIllumination(phase: number): number {
    // 基于月相计算光照比例
    // 使用更准确的光照公式
    return 0.5 * (1 + Math.cos(2 * Math.PI * phase));
  }
  
  /**
   * 转换为项目坐标系
   * 项目坐标系：X=太阳方向(ECI X), Y=向上(ECI Z), Z=向前(ECI Y)
   */
  toProjectCoordinates(moonPosition: MoonPosition): MoonOrbitState {
    const scale = MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS / MOON_ORBITAL_PARAMS.EARTH_RADIUS;
    
    // 月球距离缩放因子 - 再调远一倍
    const moonDistanceScale = 0.4; // 调整为原来的1/2.5（再远一倍）
    
    // 标准ECI到项目坐标系的转换
    // 项目X = ECI X (太阳方向)
    // 项目Y = ECI Z (向上，北极方向)  
    // 项目Z = ECI Y (向前)
    const position: [number, number, number] = [
      moonPosition.position[0] * scale * moonDistanceScale,  // X: ECI X (太阳方向)
      moonPosition.position[2] * scale * moonDistanceScale,  // Y: ECI Z (向上)
      moonPosition.position[1] * scale * moonDistanceScale   // Z: ECI Y (向前)
    ];
    
    const distance = moonPosition.distance * scale * moonDistanceScale;
    const phase = this.calculateMoonPhase(position);
    const illumination = this.calculateIllumination(phase);
    
    return {
      position,
      distance,
      phase,
      illumination,
      trueAnomaly: moonPosition.trueAnomaly,
      isVisible: true
    };
  }
  
  /**
   * 生成轨道路径点
   */
  generateOrbitPath(numPoints: number = 200): [number, number, number][] {
    const path: [number, number, number][] = [];
    const step = 360 / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const meanAnomaly = i * step;
      const eccentricAnomaly = this.solveKeplerEquation(meanAnomaly, MOON_ORBITAL_PARAMS.ECCENTRICITY);
      const trueAnomaly = this.calculateTrueAnomaly(eccentricAnomaly, MOON_ORBITAL_PARAMS.ECCENTRICITY);
      const distance = this.calculateOrbitalRadius(eccentricAnomaly, MOON_ORBITAL_PARAMS.SEMI_MAJOR_AXIS, MOON_ORBITAL_PARAMS.ECCENTRICITY);
      
      const position = this.calculateECIPosition(
        distance,
        trueAnomaly,
        MOON_ORBITAL_PARAMS.LONGITUDE_OF_ASCENDING_NODE,
        MOON_ORBITAL_PARAMS.ARGUMENT_OF_PERIGEE,
        MOON_ORBITAL_PARAMS.INCLINATION
      );
      
      const scale = MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS / MOON_ORBITAL_PARAMS.EARTH_RADIUS;
      const moonDistanceScale = 0.4; // 与toProjectCoordinates保持一致
      
      // 标准ECI到项目坐标系的转换，使用距离缩放
      path.push([
        position[0] * scale * moonDistanceScale,  // X: ECI X (太阳方向)
        position[2] * scale * moonDistanceScale,  // Y: ECI Z (向上)
        position[1] * scale * moonDistanceScale   // Z: ECI Y (向前)
      ]);
    }
    
    // 添加闭合点（与第一个点相同）
    if (path.length > 0) {
      path.push([...path[0]]);
    }
    
    return path;
  }
}

// 导出默认实例
export const moonOrbitCalculator = new MoonOrbitCalculator();
