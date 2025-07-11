export interface Translations {
  // 面板标题
  timeAndDisplayControl: string
  satelliteInfo: string
  groundStationControl: string
  
  // 时间控制
  timeControl: string
  timeSpeed: string
  pause: string
  play: string
  reverse: string
  forward: string
  resetToRealTime: string
  customTime: string
  realTime: string
  enterCustomTime: string
  setTime: string
  invalidTimeFormat: string
  timeFormatError: string
  
  // 显示控制
  showOrbits: string
  showLabels: string
  realScaleOrbits: string
  followEarthRotation: string
  resetScene: string
  
  // 状态描述
  paused: string
  reversing: string
  forwarding: string
  realScaleDescription: string
  beautifulScaleDescription: string
  earthFixedView: string
  inertialSpaceView: string
  
  // 轨道数据
  orbitDataStatus: string
  tleDataLoading: string
  waitForRealOrbit: string
  realOrbitLabel: string
  simulatedOrbitLabel: string
  
  // 当前设置
  currentSettings: string
  orbits: string
  labels: string
  scale: string
  speed: string
  time: string
  show: string
  hide: string
  real: string
  beautiful: string
  custom: string
  
  // 轨道对比
  orbitScaleComparison: string
  realMode: string
  beautifulMode: string
  unit: string
  veryFar: string
}

export const translations: Record<'zh' | 'en', Translations> = {
  zh: {
    // 面板标题
    timeAndDisplayControl: '时间与显示控制',
    satelliteInfo: '卫星信息',
    groundStationControl: '地面站TT&C控制',
    
    // 时间控制
    timeControl: '时间控制',
    timeSpeed: '时间速度',
    pause: '暂停',
    play: '播放',
    reverse: '倒退',
    forward: '前进',
    resetToRealTime: '重置到实时',
    customTime: '自定义时间',
    realTime: '实时',
    enterCustomTime: '输入自定义时间',
    setTime: '设置时间',
    invalidTimeFormat: '请输入有效的时间格式',
    timeFormatError: '时间格式错误',
    
    // 显示控制
    showOrbits: '显示轨道',
    showLabels: '显示标签',
    realScaleOrbits: '真实比例轨道',
    followEarthRotation: '跟随地球自转',
    resetScene: '重置场景',
    
    // 状态描述
    paused: '暂停',
    reversing: '倒退',
    forwarding: '前进',
    realScaleDescription: '显示真实轨道尺寸',
    beautifulScaleDescription: '美观优化轨道',
    earthFixedView: '地球固定视角',
    inertialSpaceView: '惯性空间视角',
    
    // 轨道数据
    orbitDataStatus: '轨道数据状态',
    tleDataLoading: 'TLE数据加载中...',
    waitForRealOrbit: '请等待真实轨道生效',
    realOrbitLabel: '✓ 标签显示 (TLE) 表示真实轨道',
    simulatedOrbitLabel: '标签显示 (SIM) 表示简化轨道',
    
    // 当前设置
    currentSettings: '当前设置',
    orbits: '轨道',
    labels: '标签',
    scale: '比例',
    speed: '速度',
    time: '时间',
    show: '显示',
    hide: '隐藏',
    real: '真实',
    beautiful: '美观',
    custom: '自定义',
    
    // 轨道对比
    orbitScaleComparison: '轨道缩放对比',
    realMode: '真实模式',
    beautifulMode: '美观模式',
    unit: '单位',
    veryFar: '←极远!',
  },
  
  en: {
    // 面板标题
    timeAndDisplayControl: 'Time & Display Control',
    satelliteInfo: 'Satellite Information',
    groundStationControl: 'Ground Station TT&C Control',
    
    // 时间控制
    timeControl: 'Time Control',
    timeSpeed: 'Time Speed',
    pause: 'Pause',
    play: 'Play',
    reverse: 'Reverse',
    forward: 'Forward',
    resetToRealTime: 'Reset to Real Time',
    customTime: 'Custom Time',
    realTime: 'Real Time',
    enterCustomTime: 'Enter Custom Time',
    setTime: 'Set Time',
    invalidTimeFormat: 'Please enter a valid time format',
    timeFormatError: 'Time format error',
    
    // 显示控制
    showOrbits: 'Show Orbits',
    showLabels: 'Show Labels',
    realScaleOrbits: 'Real Scale Orbits',
    followEarthRotation: 'Follow Earth Rotation',
    resetScene: 'Reset Scene',
    
    // 状态描述
    paused: 'Paused',
    reversing: 'Reversing',
    forwarding: 'Forwarding',
    realScaleDescription: 'Show real orbit dimensions',
    beautifulScaleDescription: 'Optimized beautiful orbits',
    earthFixedView: 'Earth-fixed perspective',
    inertialSpaceView: 'Inertial space perspective',
    
    // 轨道数据
    orbitDataStatus: 'Orbit Data Status',
    tleDataLoading: 'TLE data loading...',
    waitForRealOrbit: 'Wait for real orbits to take effect',
    realOrbitLabel: '✓ Label shows (TLE) indicates real orbit',
    simulatedOrbitLabel: 'Label shows (SIM) indicates simplified orbit',
    
    // 当前设置
    currentSettings: 'Current Settings',
    orbits: 'Orbits',
    labels: 'Labels',
    scale: 'Scale',
    speed: 'Speed',
    time: 'Time',
    show: 'Show',
    hide: 'Hide',
    real: 'Real',
    beautiful: 'Beautiful',
    custom: 'Custom',
    
    // 轨道对比
    orbitScaleComparison: 'Orbit Scale Comparison',
    realMode: 'Real Mode',
    beautifulMode: 'Beautiful Mode',
    unit: 'units',
    veryFar: '←Very Far!',
  },
} 