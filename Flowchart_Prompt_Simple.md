# 数据流图生成 Prompt（简洁版）

## 直接使用的 Prompt

请生成一个技术文档风格的流程图，展示卫星轨道可视化系统的完整数据流，包含两个主要流程：

### 流程1：数据输入与处理流程（左侧，垂直布局）

**数据源 → 服务层 → 传播层 → 坐标转换链 → 场景坐标**

1. **起始**: "TLE数据 (Celestrak.org)" - 外部数据源（浅蓝色矩形）
2. **数据获取**: "celestrakService.ts" - 包含 getTLEByNoradId(), getFamousSatellites(), 解析TLE格式（白色矩形，深色边框）
3. **数据接口**: "TLEData 接口" - 标准化数据结构（圆角矩形）
4. **分支传播**（两个并行路径）:
   - 路径A: "sgp4Service.ts" → "ECI坐标 (km)" → 进入坐标转换链
   - 路径B: "tlePropagator.ts (自定义传播器)" → "SatelliteState" → 合并到坐标转换链
5. **坐标转换链**（从ECI开始）:
   - "eciToEcf()" (黄色菱形) → "ECF坐标" (绿色椭圆)
   - "ecfToGeodetic()" (黄色菱形) → "地理坐标 (lat,lon,alt)" (绿色椭圆)
6. **场景转换**: "coordinateUtils.ts" - latLonAltToScenePos()（白色矩形）
7. **终点**: "场景坐标 (Three.js)" - 最终3D坐标（深蓝色矩形，加粗边框）

### 流程2：状态管理与渲染流程（右侧，垂直布局）

**UI交互 → 状态管理 → 渲染分支 → 3D组件 → GPU渲染**

1. **起始**: "UI组件 (TimeControlPanel, SatelliteInfoPanel)" - 用户交互触发（浅紫色矩形）
2. **状态管理**: "Zustand Store (appStore.ts)" - 包含 setTimeSpeed(), setSelectedSatellite, setFocusedSatellite, getCurrentEffectiveTime()（橙色矩形，居中）
3. **分支渲染**（两个并行路径）:
   - 路径C: "UI组件更新 (React状态)" - React响应式更新（浅紫色矩形）
   - 路径D: "3D渲染组件 (useFrame钩子)" - React Three Fiber渲染循环（浅灰色矩形）
4. **3D组件详细分支**（从路径D分出三个子组件）:
   - "Earth.tsx" - 自转、光照、Shader（浅灰色矩形，列出功能）
   - "Satellite56309.tsx" - 传播、坐标转换、遮挡检测（浅灰色矩形，列出功能）
   - "Orbit56309.tsx" - 轨道点、曲线、渲染（浅灰色矩形，列出功能）
5. **合并**: 三个组件节点合并
6. **终点**: "Three.js渲染管线 (GPU加速渲染)" - WebGL GPU渲染（深蓝色矩形，加粗边框）

## 样式规范

- **节点形状**: 数据源/服务=矩形，数据=椭圆，转换=菱形，合并=菱形
- **颜色**: 数据源=浅蓝，服务=白+深边框，数据=浅绿，转换=黄，UI=浅紫，状态=橙，3D组件=浅灰，终点=深蓝
- **箭头**: 实线箭头，从上到下为主方向，分支使用Y型连接
- **文字**: 中英文混合，代码用等宽字体，标题加粗
- **布局**: 两个流程并排，左侧数据输入，右侧状态渲染，整体宽度适中

## 输出要求

生成清晰的流程图（PNG/SVG，1920x1080+），或提供 Mermaid/Draw.io 可编辑源文件。


