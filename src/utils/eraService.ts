/**
 * ERA（Earth Rotation Angle）自转角计算服务
 * 计算指定UTC时刻的地球自转角（弧度）
 * IAU 2000标准公式
 */
export function getERA(date: Date = new Date()): number {
  // 1. 计算指定UTC的儒略日
  // JD = (ms/86400000) + 2440587.5
  const ms = date.getTime();
  const JD = ms / 86400000 + 2440587.5;

  // 2. 计算自J2000.0以来的天数
  const d = JD - 2451545.0;

  // 3. ERA公式（IAU 2000）
  // ERA = 2π × (0.7790572732640 + 1.00273781191135448 × d)
  let era = 2 * Math.PI * (0.7790572732640 + 1.00273781191135448 * d);

  // 4. 归一化到[0, 2π)
  era = era % (2 * Math.PI);
  if (era < 0) era += 2 * Math.PI;

  return era;
} 