export interface Translations {
  // 面板标题
  timeAndDisplayControl: string
  satelliteInfo: string
  groundStationControl: string
  
  // 通用操作
  expand: string
  collapse: string
  selectSatellite: string
  pleaseSelectSatellite: string
  selectGroundStation: string
  pleaseSelectGroundStation: string
  
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
  
  // 卫星信息
  status: string
  altitude: string
  inclination: string
  description: string
  
  // 地面站
  groundStationStatus: string
  positionInfo: string
  stationLongitude: string
  stationLatitude: string
  stationAltitude: string
  nextPass: string
  passTime: string
  duration: string
  maxElevation: string
  telemetryData: string
  parameter: string
  value: string
  powerVoltage: string
  temperature: string
  signalStrength: string
  dataRate: string
  sendCommand: string
  enterCommand: string
  commandSent: string
  
  // 地面站位置
  singaporeStation: string
  kennedyStation: string
  beijingStation: string
  
  // 状态
  active: string
  inactive: string
  normal: string
  good: string
  
  // 单位
  degrees: string
  minutes: string
  
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
  
  // 卫星信息面板 - 新增
  searchSatellites: string
  searchPlaceholder: string
  favorites: string
  favorite: string
  quickSelect: string
  noFavorites: string
  satelliteDetails: string
  noSatelliteSelected: string
  modelPreview: string
  noModel: string
  orbitalParameters: string
  realTimeData: string
  altitudeKm: string
  inclinationDeg: string
  eccentricityValue: string
  orbitPeriodMin: string
  meanMotionRevDay: string
  velocityKmSec: string
  latitude: string
  longitude: string
  quickActions: string
  focus: string
  follow: string
  toggleOrbit: string
  addToFavorites: string
  removeFromFavorites: string
  online: string
  offline: string
  loading: string
  searchResults: string
  noResults: string
  satelliteName: string
  
  // 控制按钮
  hideOtherSatellites: string
  showOtherSatellites: string
  hideMoon: string
  showMoon: string
  hideMoonInfo: string
  showMoonInfo: string
  hideSatelliteInfo: string
  showSatelliteInfo: string
}

export const translations: Record<'zh' | 'en', Translations> = {
  zh: {
    // 面板标题
    timeAndDisplayControl: '时间与显示控制',
    satelliteInfo: '卫星信息',
    groundStationControl: '地面站TT&C控制',
    
    // 通用操作
    expand: '展开',
    collapse: '折叠',
    selectSatellite: '选择卫星',
    pleaseSelectSatellite: '请选择卫星',
    selectGroundStation: '选择地面站',
    pleaseSelectGroundStation: '请选择地面站',
    
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
    
    // 卫星信息
    status: '状态',
    altitude: '高度',
    inclination: '倾角',
    description: '描述',
    
    // 地面站
    groundStationStatus: '地面站状态',
    positionInfo: '位置信息',
    stationLongitude: '经度',
    stationLatitude: '纬度',
    stationAltitude: '高度',
    nextPass: '下次过境',
    passTime: '过境时间',
    duration: '持续时间',
    maxElevation: '最大仰角',
    telemetryData: '遥测数据',
    parameter: '参数',
    value: '数值',
    powerVoltage: '电源电压',
    temperature: '温度',
    signalStrength: '信号强度',
    dataRate: '数据率',
    sendCommand: '发送指令',
    enterCommand: '输入指令',
    commandSent: '指令已发送',
    
    // 地面站位置
    singaporeStation: '新加坡站',
    kennedyStation: '肯尼迪站',
    beijingStation: '北京站',
    
    // 状态
    active: '活跃',
    inactive: '非活跃',
    normal: '正常',
    good: '良好',
    
    // 单位
    degrees: '°',
    minutes: '分钟',
    
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
    
    // 卫星信息面板 - 新增
    searchSatellites: '搜索卫星',
    searchPlaceholder: '输入卫星名称、ID或代码...',
    favorites: '收藏夹',
    favorite: '收藏',
    quickSelect: '快速选择',
    noFavorites: '暂无收藏的卫星',
    satelliteDetails: '卫星详情',
    noSatelliteSelected: '请选择一个卫星',
    modelPreview: '模型预览',
    noModel: '暂无3D模型',
    orbitalParameters: '轨道参数',
    realTimeData: '实时数据',
    altitudeKm: '高度 (km)',
    inclinationDeg: '倾角 (°)',
    eccentricityValue: '离心率',
    orbitPeriodMin: '轨道周期 (分钟)',
    meanMotionRevDay: '平均运动 (圈/天)',
    velocityKmSec: '速度 (km/s)',
    latitude: '纬度 (°)',
    longitude: '经度 (°)',
    quickActions: '快速操作',
    focus: '聚焦',
    follow: '跟随',
    toggleOrbit: '显示/隐藏轨道',
    addToFavorites: '添加到收藏',
    removeFromFavorites: '取消收藏',
    online: '在线',
    offline: '离线',
    loading: '加载中...',
    searchResults: '搜索结果',
    noResults: '未找到匹配的卫星',
    satelliteName: '卫星名称',
    
    // 控制按钮
    hideOtherSatellites: '隐藏其他卫星',
    showOtherSatellites: '显示其他卫星',
    hideMoon: '隐藏月球',
    showMoon: '显示月球',
    hideMoonInfo: '隐藏月球信息',
    showMoonInfo: '显示月球信息',
    hideSatelliteInfo: '隐藏卫星信息',
    showSatelliteInfo: '显示卫星信息',
  },
  
  en: {
    // 面板标题
    timeAndDisplayControl: 'Time & Display Control',
    satelliteInfo: 'Satellite Information',
    groundStationControl: 'Ground Station TT&C Control',
    
    // 通用操作
    expand: 'Expand',
    collapse: 'Collapse',
    selectSatellite: 'Select Satellite',
    pleaseSelectSatellite: 'Please select satellite',
    selectGroundStation: 'Select Ground Station',
    pleaseSelectGroundStation: 'Please select ground station',
    
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
    
    // 卫星信息
    status: 'Status',
    altitude: 'Altitude',
    inclination: 'Inclination',
    description: 'Description',
    
    // 地面站
    groundStationStatus: 'Ground Station Status',
    positionInfo: 'Position Information',
    stationLongitude: 'Longitude',
    stationLatitude: 'Latitude',
    stationAltitude: 'Altitude',
    nextPass: 'Next Pass',
    passTime: 'Pass Time',
    duration: 'Duration',
    maxElevation: 'Max Elevation',
    telemetryData: 'Telemetry Data',
    parameter: 'Parameter',
    value: 'Value',
    powerVoltage: 'Power Voltage',
    temperature: 'Temperature',
    signalStrength: 'Signal Strength',
    dataRate: 'Data Rate',
    sendCommand: 'Send Command',
    enterCommand: 'Enter command',
    commandSent: 'Command sent',
    
    // 地面站位置
    singaporeStation: 'Singapore Station',
    kennedyStation: 'Kennedy Station',
    beijingStation: 'Beijing Station',
    
    // 状态
    active: 'Active',
    inactive: 'Inactive',
    normal: 'Normal',
    good: 'Good',
    
    // 单位
    degrees: '°',
    minutes: 'min',
    
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
    
    // 卫星信息面板 - 新增
    searchSatellites: 'Search Satellites',
    searchPlaceholder: 'Enter satellite name, ID or code...',
    favorites: 'Favorites',
    favorite: 'Favorite',
    quickSelect: 'Quick Select',
    noFavorites: 'No favorited satellites',
    satelliteDetails: 'Satellite Details',
    noSatelliteSelected: 'Please select a satellite',
    modelPreview: 'Model Preview',
    noModel: 'No 3D model available',
    orbitalParameters: 'Orbital Parameters',
    realTimeData: 'Real-time Data',
    altitudeKm: 'Altitude (km)',
    inclinationDeg: 'Inclination (°)',
    eccentricityValue: 'Eccentricity',
    orbitPeriodMin: 'Orbit Period (min)',
    meanMotionRevDay: 'Mean Motion (rev/day)',
    velocityKmSec: 'Velocity (km/s)',
    latitude: 'Latitude (°)',
    longitude: 'Longitude (°)',
    quickActions: 'Quick Actions',
    focus: 'Focus',
    follow: 'Follow',
    toggleOrbit: 'Toggle Orbit',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    online: 'Online',
    offline: 'Offline',
    loading: 'Loading...',
    searchResults: 'Search Results',
    noResults: 'No matching satellites found',
    satelliteName: 'Satellite Name',
    
    // 控制按钮
    hideOtherSatellites: 'Hide Other Satellites',
    showOtherSatellites: 'Show Other Satellites',
    hideMoon: 'Hide Moon',
    showMoon: 'Show Moon',
    hideMoonInfo: 'Hide Moon Info',
    showMoonInfo: 'Show Moon Info',
    hideSatelliteInfo: 'Hide Satellite Info',
    showSatelliteInfo: 'Show Satellite Info',
  },
} 