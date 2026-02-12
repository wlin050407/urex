# 相机聚焦功能说明

## 🎯 功能概述

当用户在卫星信息面板中选择一个卫星后，点击 **Focus** 按钮，相机会平滑地移动并聚焦到该卫星位置。

## 📋 功能特点

✅ **平滑动画**：使用 easeInOutCubic 缓动函数实现流畅的相机移动  
✅ **智能定位**：相机会移动到卫星附近，保持合适的观察距离  
✅ **实时跟踪**：相机目标点对准卫星的实时位置  
✅ **防重复触发**：动画过程中防止重复触发  
✅ **自动加载 TLE**：支持所有已注册的卫星

## 🎮 使用方法

### 1. 选择卫星
在右侧的 **Satellite Information** 面板中：
- 搜索或从列表中选择一个卫星
- 或者从收藏列表中选择

### 2. 点击 Focus
在卫星详情区域，找到 **Quick Actions** 部分：
```
┌─────────────────────┐
│  Quick Actions      │
│  ┌─────┐  ┌──────┐ │
│  │Focus│  │Orbit │ │
│  └─────┘  └──────┘ │
└─────────────────────┘
```

### 3. 观看动画
- 相机会用 **1.5秒** 平滑移动到卫星位置
- 移动过程中可以使用鼠标旋转视角
- 到达后，卫星会在视野中心附近

## 🔧 技术实现

### 文件结构
```
src/
  ├── components/
  │   ├── CameraController.tsx  ← 新增：相机控制器
  │   └── SatelliteInfoPanel.tsx ← 已有 Focus 按钮
  ├── store/
  │   └── appStore.ts            ← 已有 focusedSatellite 状态
  └── App.tsx                     ← 添加 CameraController
```

### 数据流
```
用户点击 Focus 按钮
  ↓
setFocusedSatellite(satelliteId)
  ↓
CameraController 监听到变化
  ↓
从缓存或网络获取卫星 TLE 数据
  ↓
使用 SGP4 计算卫星实时位置
  ↓
转换为场景 3D 坐标
  ↓
计算相机目标位置（距离卫星3个单位）
  ↓
平滑动画移动相机（1.5秒）
  ↓
完成聚焦 ✅
```

### 核心组件：CameraController

```typescript
// 监听 focusedSatellite 状态
useEffect(() => {
  if (!focusedSatellite) return
  
  // 获取卫星位置
  const scenePos = getSatellitePosition(focusedSatellite)
  
  // 动画移动相机
  animateCameraToPosition(camera, controls, targetPos, lookAtPos, 1500)
}, [focusedSatellite])
```

### 动画参数

| 参数 | 值 | 说明 |
|------|-----|------|
| **动画时长** | 1500ms | 相机移动时间 |
| **观察距离** | 3 units | 相机距离卫星的距离 |
| **缓动函数** | easeInOutCubic | 平滑加速减速 |
| **防抖时间** | 1600ms | 防止重复触发 |

## 🎨 视觉效果

### 动画过程
1. **开始**：相机在当前位置
2. **加速**：平滑加速（前25%）
3. **匀速**：中间部分匀速移动（中50%）
4. **减速**：平滑减速（后25%）
5. **完成**：相机对准卫星

### 缓动函数可视化
```
速度
  ^
  │    ╱‾‾‾‾‾╲
  │   ╱       ╲
  │  ╱         ╲
  │ ╱           ╲
  └─────────────────> 时间
  0%    50%    100%
```

## 🛰️ 支持的卫星

所有在 `FAMOUS_SATELLITES` 中注册的卫星：
- ✅ ISS (国际空间站)
- ✅ HUBBLE (哈勃太空望远镜)
- ✅ STARLINK (星链卫星)
- ✅ TIANGONG (天宫空间站)
- ✅ GPS (GPS卫星)
- ✅ LUMELITE-4 (主目标卫星 56309)

## 🐛 调试

### 控制台日志

成功聚焦时：
```
🎯 Focus button clicked for: ISS
🎯 Focusing on satellite: ISS
✅ Camera Controller: TLE data loaded for 6 satellites
📍 Satellite position: { lat: 45.23, lon: 123.45, alt: 420.56, scenePos: {...} }
✅ Camera animation complete
```

失败时：
```
⚠️ Satrec not found in cache for: UNKNOWN_SAT
❌ Cannot find satrec for: UNKNOWN_SAT
```

## 📝 注意事项

1. **首次使用**：第一次点击 Focus 时，需要加载 TLE 数据，可能有短暂延迟
2. **网络连接**：如果无法获取 TLE 数据，会使用备用数据
3. **动画中断**：动画过程中再次点击 Focus 会被忽略，直到动画完成
4. **地球旋转**：卫星位置会随地球旋转，相机会跟随移动

## 🚀 未来改进

- [ ] 添加"跟随模式"：相机持续跟随卫星移动
- [ ] 自定义观察距离
- [ ] 支持多视角切换
- [ ] 添加聚焦动画选项（快速/慢速）
- [ ] 支持聚焦到地面站或其他对象

## 日期
2025-10-16


