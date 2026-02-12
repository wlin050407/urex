import { create } from 'zustand'

interface AppState {
  // 控制参数
  timeSpeed: number
  showOrbits: boolean
  showLabels: boolean
  
  // 选中的对象
  selectedSatellite: string | null
  selectedGroundStation: string | null
  
  // 卫星收藏
  favoriteSatellites: string[]
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
  toggleFavorite: (id: string) => void
  
  // 相机控制
  focusedSatellite: string | null
  followedSatellite: string | null
  setFocusedSatellite: (id: string | null) => void
  setFollowedSatellite: (id: string | null) => void
  
  // 轨道显示控制（针对单个卫星）
  visibleOrbits: string[]
  toggleOrbitVisibility: (id: string) => void
  setOrbitVisibility: (id: string, visible: boolean) => void
  
  // 时间控制功能
  currentTime: Date
  isTimeCustom: boolean
  isPaused: boolean
  timeBasePoint: number // 时间基准点（实际时间戳）
  
  // 操作函数
  setTimeSpeed: (speed: number) => void
  setShowOrbits: (show: boolean) => void
  setShowLabels: (show: boolean) => void
  setSelectedSatellite: (id: string | null) => void
  setSelectedGroundStation: (id: string | null) => void

  // 时间控制操作
  setCurrentTime: (time: Date) => void
  setIsTimeCustom: (custom: boolean) => void
  pauseTime: () => void
  resumeTime: () => void
  reverseTime: () => void
  resetToRealTime: () => void
  getCurrentEffectiveTime: () => Date

  // 地球自转跟随开关
  followEarthRotation: boolean
  setFollowEarthRotation: (follow: boolean) => void

  // 真实比例轨道开关
  useRealScale: boolean
  setUseRealScale: (useReal: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  timeSpeed: 1.0,
  showOrbits: true,
  showLabels: true,
  selectedSatellite: null,
  selectedGroundStation: null,
  
  // 卫星收藏初始状态
  favoriteSatellites: [],
  
  // 相机控制初始状态
  focusedSatellite: null,
  followedSatellite: null,
  
  // 轨道显示初始状态
  visibleOrbits: [],
  
  // 时间控制初始状态
  currentTime: new Date(),
  isTimeCustom: false,
  isPaused: false,
  timeBasePoint: Date.now(),
  
  // 基础操作函数
  setTimeSpeed: (speed) => {
    const state = get()
    const currentEffectiveTime = state.getCurrentEffectiveTime()
    set({ 
      currentTime: currentEffectiveTime, // 冻结当前模拟时间
      timeSpeed: speed, 
      isTimeCustom: true, // 只要变速就进入自定义模式
      timeBasePoint: Date.now(),
      isPaused: speed === 0
    })
  },
  
  setShowOrbits: (show) => set({ showOrbits: show }),
  setShowLabels: (show) => set({ showLabels: show }),
  setSelectedSatellite: (id) => set({ selectedSatellite: id }),
  setSelectedGroundStation: (id) => set({ selectedGroundStation: id }),
  
  // 收藏管理
  addFavorite: (id) => set((state) => ({
    favoriteSatellites: [...state.favoriteSatellites, id]
  })),
  
  removeFavorite: (id) => set((state) => ({
    favoriteSatellites: state.favoriteSatellites.filter(fav => fav !== id)
  })),
  
  toggleFavorite: (id) => set((state) => {
    const isFavorite = state.favoriteSatellites.includes(id)
    return {
      favoriteSatellites: isFavorite
        ? state.favoriteSatellites.filter(fav => fav !== id)
        : [...state.favoriteSatellites, id]
    }
  }),
  
  // 相机控制
  setFocusedSatellite: (id) => {
    console.log('🎯 setFocusedSatellite called with:', id)
    set({ focusedSatellite: id })
  },
  setFollowedSatellite: (id) => set({ followedSatellite: id }),
  
  // 轨道显示控制
  toggleOrbitVisibility: (id) => set((state) => {
    const isVisible = state.visibleOrbits.includes(id)
    return {
      visibleOrbits: isVisible
        ? state.visibleOrbits.filter(sat => sat !== id)
        : [...state.visibleOrbits, id]
    }
  }),
  
  setOrbitVisibility: (id, visible) => set((state) => {
    const isVisible = state.visibleOrbits.includes(id)
    if (visible && !isVisible) {
      return { visibleOrbits: [...state.visibleOrbits, id] }
    } else if (!visible && isVisible) {
      return { visibleOrbits: state.visibleOrbits.filter(sat => sat !== id) }
    }
    return state
  }),

  // 时间控制操作
  setCurrentTime: (time) => set({ 
    currentTime: time, 
    isTimeCustom: true, 
    timeBasePoint: Date.now() 
  }),
  
  setIsTimeCustom: (custom) => set({ isTimeCustom: custom }),
  
  pauseTime: () => {
    const state = get()
    if (state.isTimeCustom) {
      const currentEffectiveTime = state.getCurrentEffectiveTime()
      set({ 
        isPaused: true, 
        timeSpeed: 0,
        currentTime: currentEffectiveTime,
        timeBasePoint: Date.now()
      })
    } else {
      set({ isPaused: true, timeSpeed: 0 })
    }
  },
  
  resumeTime: () => {
    const prevSpeed = get().timeSpeed === 0 ? 1.0 : Math.abs(get().timeSpeed)
    set({ isPaused: false, timeSpeed: prevSpeed, timeBasePoint: Date.now() })
  },
  
  reverseTime: () => {
    const state = get()
    const currentSpeed = state.timeSpeed
    let newSpeed: number
    
    // 修复倒退逻辑
    if (currentSpeed === 0) {
      // 如果当前是暂停状态，开始倒退
      newSpeed = -1.0
    } else if (currentSpeed > 0) {
      // 如果当前是前进，切换到相同速度的倒退
      newSpeed = -currentSpeed
    } else {
      // 如果当前是倒退，切换到相同速度的前进
      newSpeed = Math.abs(currentSpeed)
    }
    
    if (state.isTimeCustom) {
      const currentEffectiveTime = state.getCurrentEffectiveTime()
      set({ 
        timeSpeed: newSpeed, 
        isPaused: false,
        currentTime: currentEffectiveTime,
        timeBasePoint: Date.now()
      })
    } else {
      set({ timeSpeed: newSpeed, isPaused: false })
    }
  },
  
  resetToRealTime: () => set({ 
    currentTime: new Date(), 
    isTimeCustom: false, 
    isPaused: false, 
    timeSpeed: 1.0,
    timeBasePoint: Date.now()
  }),

  // 获取当前有效时间（考虑自定义时间和速度）
  getCurrentEffectiveTime: () => {
    const state = get()
    if (state.isTimeCustom) {
      const elapsedRealTime = Date.now() - state.timeBasePoint
      const elapsedSimulatedTime = elapsedRealTime * state.timeSpeed
      return new Date(state.currentTime.getTime() + elapsedSimulatedTime)
    }
    return new Date()
  },

  // 地球自转跟随开关
  followEarthRotation: true,
  setFollowEarthRotation: (follow) => set({ followEarthRotation: follow }),

  // 真实比例轨道开关
  useRealScale: false,
  setUseRealScale: (useReal) => set({ useRealScale: useReal }),
})) 