# 卫星坐标系统修复说明

## 问题描述
卫星的3D场景位置与面板显示的经纬度不匹配。

## 根本原因
**双重旋转问题**：
1. 卫星组件在地球的旋转 `<group>` 内部（见 `Earth.tsx` 第112-145行）
2. 地球 group 每帧都在旋转：`groupRef.current.rotation.y = u * 2 * Math.PI - Math.PI`
3. 原代码在 `latLonAltToScenePosition` 函数中又应用了一次地球旋转
4. 结果：卫星位置被旋转了两次，导致位置错误

## 解决方案

### 1. 修改坐标转换函数
文件：`src/utils/coordinateUtils.ts`

**之前**：
```typescript
export function latLonAltToScenePosition(
  lat: number, lon: number, altitudeKm: number, earthRotationY: number
): THREE.Vector3 {
  // ... 计算坐标 ...
  position.applyAxisAngle(new THREE.Vector3(0, 1, 0), earthRotationY) // ❌ 错误
  return position
}
```

**修复后**：
```typescript
export function latLonAltToScenePosition(
  lat: number, lon: number, altitudeKm: number  // 移除 earthRotationY 参数
): THREE.Vector3 {
  // ... 计算坐标 ...
  return new THREE.Vector3(x, y, z)  // ✅ 直接返回相对于地球表面的固定位置
}
```

### 2. 坐标系统说明

**场景层级结构**：
```
Scene (根场景)
  └─ Earth Group (旋转 - 模拟地球自转)
      ├─ Earth Mesh (地球球体)
      ├─ Clouds Mesh (云层)
      ├─ Satellite56309 (主卫星) ✅ 在旋转 group 内
      ├─ SatelliteOrbit56309 (轨道) ✅ 在旋转 group 内
      └─ FamousSatellites (其他卫星+轨道) ✅ 在旋转 group 内
```

**混合坐标系统（最终方案）**：
1. **卫星位置**：ECI → 实时GMST → 经纬度 → 场景坐标
   - 每帧使用实时的GMST转换
   - 与面板显示的经纬度完全匹配 ✅
   
2. **轨道绘制**：ECI → **固定GMST** → 经纬度 → 场景坐标（巧妙！）
   - 用ECI在不同时间计算轨道点（保持椭圆形状）✅
   - 用**同一个GMST**（当前时刻）转换所有点（固定在地球表面）✅
   - 结果：光滑的椭圆轨道 + 固定在地球表面 ✅

**核心技巧**：
```javascript
// 轨道生成的关键代码
const currentGmst = satelliteJS.gstime(currentTime)  // 当前时刻的GMST

for (let i = 0; i < orbitPointCount; i++) {
  const time = currentTime + timeOffset  // 未来的时间点
  const eciPosition = propagate(satrec, time)  // ECI轨道（光滑椭圆）
  
  // 用当前时刻的GMST转换（不是time的GMST！）
  const geodetic = eciToGeodetic(eciPosition, currentGmst)  // 固定在地表
  
  // 转换为场景坐标
  const scenePos = latLonAltToScenePosition(lat, lon, alt)
}
```

**为什么这样做？**
- ✅ 保持ECI轨道的光滑椭圆形状（物理正确）
- ✅ 轨道固定在地球表面（视觉直观）
- ✅ 卫星始终在轨道上（坐标系统一致）
- ✅ 位置与面板经纬度匹配（显示准确）

**完美平衡**：既有惯性轨道的美观，又有地面参考的直观性！

### 3. 数据流

**卫星位置**（实时GMST）：
```
当前时间 → SGP4算法 → ECI坐标
  ↓
实时GMST(当前时间) → eciToGeodetic
  ↓
经纬度 + 高度 ← 与面板显示完全一致
  ↓
场景3D坐标
  ↓
卫星实时位置 ✅
```

**轨道绘制**（固定GMST）：
```
未来时间序列 → SGP4算法 → ECI坐标序列（光滑椭圆）
  ↓
固定GMST(当前时间) → eciToGeodetic（所有点用同一个GMST！）
  ↓
经纬度序列 + 高度 ← 轨道"快照"固定在地表
  ↓
场景3D坐标序列
  ↓
光滑的轨道椭圆 ✅（固定在地球表面）
```

**关键创新**：
- 🎯 卫星：用**实时GMST**（每帧更新）
- 🎯 轨道：用**固定GMST**（同一个快照时间）
- ✅ 结果：卫星在轨道上 + 轨道光滑 + 位置准确

## 修改的文件

1. ✅ `src/utils/coordinateUtils.ts` - 移除双重旋转逻辑
2. ✅ `src/components/Satellite56309.tsx` - 更新函数调用
3. ✅ `src/components/FamousSatellites.tsx` - 更新函数调用
4. ✅ `src/components/SatelliteOrbit56309.tsx` - 更新轨道绘制

## 验证方法

### 控制台日志
在浏览器控制台查看：
```
🛰️ Satellite56309 Position: {
  lat: "45.23",      // 面板显示的纬度
  lon: "123.45",     // 面板显示的经度
  alt: "420.56",     // 高度 (km)
  scenePos: { x: "...", y: "...", z: "..." }  // 3D场景坐标
}
```

### 视觉验证
1. 打开卫星信息面板
2. 选择一个卫星（如 ISS）
3. 查看面板显示的经纬度
4. 观察3D场景中卫星是否在对应的地球位置上方

**例如**：
- 面板显示：北纬40°，东经116°（北京）
- 3D场景：卫星应该在北京上方
- 绿色"Lon 0°"标记指向本初子午线

## 技术细节

### 球面坐标到笛卡尔坐标转换
```typescript
const phi = (90 - lat) * (Math.PI / 180)      // 极角（从北极开始）
const theta = (lon + 180) * (Math.PI / 180)   // 方位角（从本初子午线+180°开始）

const x = -(radius * Math.sin(phi) * Math.cos(theta))
const y = radius * Math.cos(phi)
const z = radius * Math.sin(phi) * Math.sin(theta)
```

### Three.js 坐标系
- **X轴**：左右（负X为东，正X为西）
- **Y轴**：上下（正Y向上）
- **Z轴**：前后（正Z向前）

## 预期结果
✅ 卫星3D位置与面板经纬度完全匹配  
✅ 卫星随地球自转正确移动  
✅ 轨道显示正确  
✅ 多个卫星位置都正确

## 日期
2025-10-16

