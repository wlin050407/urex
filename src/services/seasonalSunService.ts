/**
 * 季节太阳光照服务
 * 计算基于日期的太阳赤纬角和位置，实现地球季节变化效果
 */

/**
 * 计算太阳的赤纬角（declination）
 * @param date 日期对象
 * @returns 赤纬角（弧度）
 */
export function calculateSunDeclination(date: Date): number {
  // 计算一年中的天数（1-365）
  const year = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const daysSinceStart = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  
  // 太阳赤纬角公式：δ = 23.44° * sin(360° * (284 + n) / 365)
  // 其中 n 是一年中的天数
  const declinationDegrees = 23.44 * Math.sin((360 * (284 + daysSinceStart) / 365) * Math.PI / 180);
  return declinationDegrees * Math.PI / 180; // 转换为弧度
}

/**
 * 计算太阳在ECI坐标系中的位置
 * @param date 日期对象
 * @returns 太阳位置向量（归一化）
 */
export function calculateSunPosition(date: Date): { x: number; y: number; z: number } {
  // 计算太阳赤纬角
  const declination = calculateSunDeclination(date);
  
  // 在ECI坐标系中，太阳位置：
  // x: 地球到太阳的方向（主要分量）
  // y: 赤纬角对应的南北偏移
  // z: 0（简化处理，不考虑黄道面倾斜的复杂性）
  
  return {
    x: Math.cos(declination), // 主要方向
    y: Math.sin(declination), // 季节变化（南北移动）
    z: 0
  };
}

/**
 * 获取季节信息
 * @param date 日期对象
 * @returns 季节信息对象
 */
export function getSeasonInfo(date: Date): {
  season: string;
  declination: number;
  declinationDegrees: number;
  month: number;
} {
  const declination = calculateSunDeclination(date);
  const declinationDegrees = declination * 180 / Math.PI;
  const month = date.getUTCMonth() + 1;
  
  let season: string;
  if (month >= 3 && month <= 5) {
    season = 'spring';
  } else if (month >= 6 && month <= 8) {
    season = 'summer';
  } else if (month >= 9 && month <= 11) {
    season = 'autumn';
  } else {
    season = 'winter';
  }
  
  return {
    season,
    declination,
    declinationDegrees,
    month
  };
}

/**
 * 计算晨昏线倾斜角度
 * @param date 日期对象
 * @returns 倾斜角度（度）
 */
export function calculateTerminatorTilt(date: Date): number {
  const declination = calculateSunDeclination(date);
  // 晨昏线倾斜角度等于太阳赤纬角
  return declination * 180 / Math.PI;
}

/**
 * 获取季节变化的描述文本
 * @param date 日期对象
 * @returns 季节描述
 */
export function getSeasonDescription(date: Date): string {
  const info = getSeasonInfo(date);
  const tilt = calculateTerminatorTilt(date);
  
  return `${info.season} (Month ${info.month}) - Sun Declination: ${info.declinationDegrees.toFixed(1)}°, Terminator Tilt: ${tilt.toFixed(1)}°`;
}
