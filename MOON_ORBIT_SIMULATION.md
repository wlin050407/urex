# 月球轨道模拟系统

## 概述

本项目实现了一个基于真实月球轨道参数的3D月球轨道模拟系统，使用开普勒椭圆轨道模型，考虑了真实的轨道偏心率、倾角等参数。

## 主要特性

### 🌙 真实轨道参数
- **轨道偏心率**: 0.0549（真实月球轨道偏心率）
- **轨道倾角**: 5.145°（相对于黄道面）
- **半长轴**: 384,400 km（平均距离）
- **轨道周期**: 27.3217 天（恒星月）
- **轨道进动**: 考虑升交点和近地点的进动

### 🚀 技术实现
- **开普勒方程求解**: 使用牛顿-拉夫逊迭代法精确求解
- **椭圆轨道计算**: 基于真实轨道参数计算位置和速度
- **ECI坐标系**: 使用地心惯性坐标系进行精确计算
- **实时更新**: 支持时间加速和实时轨道更新

### 🎮 交互功能
- **3D可视化**: 月球模型和轨道线实时渲染
- **月相显示**: 基于太阳位置的月相计算和显示
- **信息面板**: 详细的轨道参数和位置信息
- **控制选项**: 可切换月球显示、轨道线、标签等

## 文件结构

```
src/
├── services/
│   └── moonOrbitService.ts      # 月球轨道计算服务
├── components/
│   ├── Moon.tsx                 # 月球3D组件
│   └── MoonInfoPanel.tsx        # 月球信息面板
└── App.tsx                      # 主应用（集成月球组件）
```

## 核心算法

### 1. 开普勒方程求解
```typescript
// 牛顿-拉夫逊迭代法求解 E = M + e*sin(E)
private solveKeplerEquation(meanAnomaly: number, eccentricity: number): number {
  const M = meanAnomaly * Math.PI / 180;
  let E = M + eccentricity * Math.sin(M); // 改进的初始猜测
  
  for (let i = 0; i < 20; i++) {
    const f = E - eccentricity * Math.sin(E) - M;
    const fPrime = 1 - eccentricity * Math.cos(E);
    
    if (Math.abs(f) < 1e-12) break;
    E = E - f / fPrime;
  }
  return E;
}
```

### 2. 椭圆轨道位置计算
```typescript
// 基于轨道要素计算ECI位置
private calculateECIPosition(distance, trueAnomaly, raan, argPer, inclination) {
  // 使用标准轨道要素转换公式
  // 考虑升交点赤经、近地点幅角、轨道倾角
}
```

### 3. 月相计算
```typescript
// 基于月球和太阳相对位置计算月相
calculateMoonPhase(position: [number, number, number], sunPosition: [number, number, number]) {
  const moonAngle = Math.atan2(position[1], position[0]);
  const sunAngle = Math.atan2(sunPosition[1], sunPosition[0]);
  return (moonAngle - sunAngle) / (2 * Math.PI);
}
```

## 使用方法

### 1. 启动应用
```bash
npm run dev
```

### 2. 控制选项
- **显示/隐藏月球**: 右上角"显示月球"按钮
- **显示/隐藏月球信息**: 右上角"显示月球信息"按钮
- **时间控制**: 左上角时间控制面板

### 3. 交互操作
- **点击月球**: 选中月球，显示详细信息
- **鼠标悬停**: 显示月球标签
- **相机控制**: 使用鼠标进行缩放、旋转、平移

## 轨道参数说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 半长轴 | 384,400 km | 轨道椭圆的长半轴 |
| 偏心率 | 0.0549 | 轨道椭圆程度（0=圆，1=抛物线） |
| 倾角 | 5.145° | 轨道面与黄道面夹角 |
| 升交点赤经 | 125.08° | 升交点方向（会进动） |
| 近地点幅角 | 318.15° | 近地点方向（会进动） |
| 轨道周期 | 27.3217 天 | 恒星月周期 |

## 物理意义

### 椭圆轨道特征
- **近地点**: 距离地球最近点（约363,300 km）
- **远地点**: 距离地球最远点（约405,500 km）
- **轨道速度**: 近地点最快，远地点最慢

### 轨道进动
- **升交点进动**: -0.05295°/年
- **近地点进动**: +0.11140°/年
- **轨道面倾斜**: 相对于黄道面5.145°

## 技术特点

1. **高精度计算**: 使用双精度浮点数，迭代精度达到1e-12
2. **实时性能**: 60fps渲染，支持时间加速
3. **模块化设计**: 服务层与组件层分离，易于维护
4. **类型安全**: 使用TypeScript确保类型安全

## 扩展功能

### 可添加的功能
- 月球表面纹理映射
- 月球阴影投影到地球
- 日食和月食模拟
- 月球潮汐效应可视化
- 多个月球轨道参数对比

### 性能优化
- 轨道线LOD（细节层次）
- 月球模型LOD
- 视锥体剔除
- 时间插值优化

## 参考资料

- [NASA月球轨道数据](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)
- [开普勒轨道力学](https://en.wikipedia.org/wiki/Kepler_orbit)
- [月球轨道参数](https://en.wikipedia.org/wiki/Orbit_of_the_Moon)
- [ECI坐标系](https://en.wikipedia.org/wiki/Earth-centered_inertial)

## 许可证

本项目遵循MIT许可证。
