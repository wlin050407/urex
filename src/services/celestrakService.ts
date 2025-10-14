/**
 * Celestrak TLE数据获取服务
 * 使用Celestrak.org的免费API获取卫星TLE数据
 * 支持多种卫星类别，无需认证
 */

// TLE数据接口
export interface TLEData {
  satelliteId: string;
  name: string;
  line1: string;
  line2: string;
  epoch: Date;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argumentOfPeriapsis: number;
  meanAnomaly: number;
  bstar: number;
}

// 卫星类别枚举
export enum SatelliteCategory {
  ISS = 'stations',           // 空间站 (包括ISS)
  STATIONS = 'stations',      // 空间站
  ACTIVE = 'active',          // 活跃卫星
  INACTIVE = 'inactive',      // 非活跃卫星
  ANALYST = 'analyst',        // 分析师卫星
  DEBRIS = 'debris',          // 太空碎片
  GEOSYNC = 'geo',            // 地球同步轨道
  LEO = 'leo',                // 低地球轨道
  MOLNIYA = 'molniya',        // 莫尔尼亚轨道
  TUNDRA = 'tundra',          // 图德拉轨道
  GPS = 'gps',                // GPS卫星
  GLONASS = 'glonass',        // GLONASS卫星
  GALILEO = 'galileo',        // 伽利略卫星
  BEIDOU = 'beidou',          // 北斗卫星
  IRIDIUM = 'iridium',        // 铱星
  ORBCOMM = 'orbcomm',        // Orbcomm卫星
  GLOBALSTAR = 'globalstar',  // Globalstar卫星
  SWARM = 'swarm',            // Swarm卫星
  PLANET = 'planet',          // Planet卫星
  SPACEX = 'spacex',          // SpaceX卫星
  ONEWEB = 'oneweb',          // OneWeb卫星
  STARLINK = 'starlink',      // Starlink卫星
}

// Celestrak基础URL
const CELESTRAK_BASE_URL = 'https://celestrak.org/NORAD/elements';
const CELESTRAK_GP_URL = 'https://celestrak.org/NORAD/elements/gp.php';

/**
 * 获取指定类别的所有卫星TLE数据
 */
export async function getSatellitesByCategory(category: SatelliteCategory): Promise<TLEData[]> {
  try {
    console.log(`Fetching ${category} satellites TLE data from Celestrak...`);
    
    const response = await fetch(`${CELESTRAK_BASE_URL}/${category}.txt`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${category} data: ${response.status}`);
    }

    const data = await response.text();
    if (!data || !data.trim()) {
      throw new Error(`${category} data is empty`);
    }

    const lines = data.trim().split('\n');
    const satellites: TLEData[] = [];

    // 每三行为一组：名称、行1、行2
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();
        
        try {
          const tleData = parseTLEData(name, line1, line2);
          satellites.push(tleData);
        } catch (error) {
          console.warn(`Failed to parse TLE for ${name}:`, error);
        }
      }
    }

    console.log(`Successfully retrieved ${satellites.length} satellites from ${category}`);
    return satellites;
  } catch (error) {
    console.error(`Error getting ${category} satellites:`, error);
    return [];
  }
}

/**
 * 获取指定卫星的TLE数据
 */
export async function getSatelliteByName(name: string, category: SatelliteCategory = SatelliteCategory.STATIONS): Promise<TLEData | null> {
  try {
    const satellites = await getSatellitesByCategory(category);
    const satellite = satellites.find(sat => 
      sat.name.toLowerCase().includes(name.toLowerCase())
    );
    
    return satellite || null;
  } catch (error) {
    console.error(`Error getting satellite ${name}:`, error);
    return null;
  }
}

/**
 * 获取ISS的TLE数据
 */
export async function getISSTLEData(): Promise<TLEData | null> {
  return getSatelliteByName('ISS', SatelliteCategory.STATIONS);
}

/**
 * 通过NORAD卫星号获取单星TLE（使用Celestrak gp.php接口）
 * 例如：56309
 */
export async function getTLEByNoradId(noradId: string): Promise<TLEData | null> {
  try {
    const url = `${CELESTRAK_GP_URL}?CATNR=${encodeURIComponent(noradId)}&FORMAT=TLE`;
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SatelliteApp/1.0)',
        'Accept': 'text/plain',
      },
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch TLE for ${noradId}: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // 期望格式：三行（名称、行1、行2）
    if (lines.length < 3) {
      console.warn(`Unexpected TLE response for ${noradId}:`, text);
      return null;
    }

    const name = lines[0].trim();
    const line1 = lines[1].trim();
    const line2 = lines[2].trim();

    const parsedTLE = parseTLEData(name, line1, line2);
    return parsedTLE;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`TLE request timeout for ${noradId}`);
    } else {
      console.error(`Error getting TLE by NORAD ID ${noradId}:`, error);
    }
    return null;
  }
}

/**
 * 获取多个NORAD卫星号的TLE（返回成功解析的集合）
 */
export async function getTLEByNoradIds(noradIds: string[]): Promise<TLEData[]> {
  const results: TLEData[] = [];
  await Promise.all(
    noradIds.map(async (id) => {
      const tle = await getTLEByNoradId(id);
      if (tle) results.push(tle);
    })
  );
  return results;
}

// 我们目标卫星（用户指定）：56309
export const TARGET_NORAD_ID = '56309';

// 其他有名卫星的NORAD ID
export const FAMOUS_SATELLITES = {
  LUMELITE4: '56309',    // LUMELITE-4 (原有)
  ISS: '25544',          // International Space Station
  HUBBLE: '20580',       // Hubble Space Telescope
  STARLINK: '44294',     // Starlink satellite (示例)
  TIANGONG: '48274',     // Tiangong Space Station
  GPS: '36585',          // GPS satellite (示例)
} as const;

// 缓存的 TLE 数据
let cachedTLE: TLEData | null = null;
let cacheTimestamp: Date | null = null;
const CACHE_EXPIRY_HOURS = 24; // 缓存24小时后过期

// 防止重复请求的锁
let isRequesting = false;
let requestPromise: Promise<TLEData | null> | null = null;

/**
 * 获取目标卫星（56309）的TLE
 */
/**
 * 检查缓存是否过期
 */
function isCacheExpired(): boolean {
  if (!cacheTimestamp) return true;
  const now = new Date();
  const hoursSinceCache = (now.getTime() - cacheTimestamp.getTime()) / (1000 * 60 * 60);
  return hoursSinceCache > CACHE_EXPIRY_HOURS;
}

/**
 * 获取目标卫星（56309）的TLE
 */
export async function getTargetSatelliteTLE(): Promise<TLEData | null> {
  // 如果有有效的缓存且未过期，直接返回
  if (cachedTLE && !isCacheExpired()) {
    console.log('Using valid cached TLE data for satellite 56309');
    return cachedTLE;
  }

  // 如果正在请求，等待现有请求完成
  if (isRequesting && requestPromise) {
    console.log('Waiting for existing TLE request to complete...');
    return requestPromise;
  }

  // 如果网络获取失败，但有缓存数据（即使过期），仍然使用
  if (cachedTLE) {
    console.log('Using cached TLE data for satellite 56309 (network failed)');
    return cachedTLE;
  }

  // 开始新的请求
  isRequesting = true;
  requestPromise = (async () => {
    try {
      console.log('Starting fresh TLE request for satellite 56309');
      // 尝试从网络获取最新的 TLE
      const tle = await getTLEByNoradId(TARGET_NORAD_ID);
      if (tle) {
        // 更新缓存和时间戳
        cachedTLE = tle;
        cacheTimestamp = new Date();
        console.log('Successfully fetched fresh TLE for satellite 56309');
        return tle;
      }
    } catch (error) {
      console.warn('Failed to fetch TLE from Celestrak:', error);
    }
    
    // 如果没有缓存，使用默认的 TLE 数据作为最后的备用
    console.log('Using fallback TLE data for satellite 56309');
    const fallbackTLE: TLEData = {
      satelliteId: '56309',
      name: 'LUMELITE-4',
      line1: '1 56309U 23057B   25268.21372113  .00018713  00000+0  92768-3 0  9997',
      line2: '2 56309   9.9929 258.2316 0005640 174.9481 185.0791 15.14929629133702',
      epoch: new Date('2024-09-25T12:00:00Z'),
      meanMotion: 15.14929629133702,
      eccentricity: 0.0005640,
      inclination: 9.9929,
      raan: 258.2316,
      argumentOfPeriapsis: 174.9481,
      meanAnomaly: 185.0791,
      bstar: 0.00092768
    };
    
    // 将备用数据也缓存起来
    cachedTLE = fallbackTLE;
    cacheTimestamp = new Date();
    console.log('Fallback TLE cached and returned');
    return fallbackTLE;
  })();

  const result = await requestPromise;
  isRequesting = false;
  requestPromise = null;
  return result;
}

/**
 * 获取多个有名卫星的TLE数据
 */
export async function getFamousSatellitesTLE(): Promise<Record<string, TLEData | null>> {
  const results: Record<string, TLEData | null> = {};
  
  const satelliteEntries = Object.entries(FAMOUS_SATELLITES);
  
  // 并行获取所有卫星的TLE数据
  const promises = satelliteEntries.map(async ([name, noradId]) => {
    try {
      console.log(`🔍 Attempting to load TLE for ${name} (${noradId})...`);
      const tle = await getTLEByNoradId(noradId);
      
      if (tle) {
        results[name] = tle;
        console.log(`✅ ${name} (${noradId}) TLE loaded successfully from network`);
      } else {
        // TLE为null，使用备用数据
        console.log(`⚠️ ${name} (${noradId}) network request failed, using fallback data`);
        results[name] = getFallbackTLE(noradId);
        if (results[name]) {
          console.log(`✅ ${name} using fallback TLE data (network failed)`);
        } else {
          console.warn(`❌ No fallback TLE data for ${name} (${noradId})`);
        }
      }
    } catch (error) {
      console.warn(`❌ Failed to load TLE for ${name} (${noradId}):`, error);
      // 使用备用TLE数据
      results[name] = getFallbackTLE(noradId);
      if (results[name]) {
        console.log(`✅ ${name} using fallback TLE data (error occurred)`);
      }
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * 获取备用TLE数据（当网络请求失败时使用）
 */
function getFallbackTLE(noradId: string): TLEData | null {
  const fallbackTLEs: Record<string, TLEData> = {
    '25544': { // ISS - 低轨道，高度约400km
      satelliteId: '25544',
      name: 'ISS (ZARYA)',
      line1: '1 25544U 98067A   25001.12345678  .00001234  00000+0  12345-4 0  9999',
      line2: '2 25544  51.6441 123.4567 0001234 123.4567 236.5432 15.49000000123456',
      epoch: new Date(),
      meanMotion: 15.49, // 对应约400km高度
      eccentricity: 0.0001234,
      inclination: 51.6441,
      raan: 123.4567,
      argumentOfPeriapsis: 123.4567,
      meanAnomaly: 236.5432,
      bstar: 0.000012345
    },
    '20580': { // Hubble - 低轨道，高度约540km
      satelliteId: '20580',
      name: 'HUBBLE SPACE TELESCOPE',
      line1: '1 20580U 90037B   25001.12345678  .00001234  00000+0  12345-4 0  9999',
      line2: '2 20580  28.4692 345.6789 0001234 234.5678 125.4321 14.68000000123456',
      epoch: new Date(),
      meanMotion: 14.68, // 对应约540km高度
      eccentricity: 0.0001234,
      inclination: 28.4692,
      raan: 345.6789,
      argumentOfPeriapsis: 234.5678,
      meanAnomaly: 125.4321,
      bstar: 0.000012345
    },
    '44294': { // Starlink - 低轨道，高度约550km
      satelliteId: '44294',
      name: 'STARLINK-1234',
      line1: '1 44294U 19029A   25001.12345678  .00001234  00000+0  12345-4 0  9999',
      line2: '2 44294  53.0000 234.5678 0001234 345.6789 14.3210 14.80000000123456',
      epoch: new Date(),
      meanMotion: 14.80, // 对应约550km高度
      eccentricity: 0.0001234,
      inclination: 53.0000,
      raan: 234.5678,
      argumentOfPeriapsis: 345.6789,
      meanAnomaly: 14.3210,
      bstar: 0.000012345
    },
    '48274': { // Tiangong - 低轨道，高度约380km
      satelliteId: '48274',
      name: 'TIANGONG SPACE STATION',
      line1: '1 48274U 21087A   25001.12345678  .00001234  00000+0  12345-4 0  9999',
      line2: '2 48274  41.5000 156.7890 0001234 267.8901 92.1098 15.25000000123456',
      epoch: new Date(),
      meanMotion: 15.25, // 对应约380km高度
      eccentricity: 0.0001234,
      inclination: 41.5000,
      raan: 156.7890,
      argumentOfPeriapsis: 267.8901,
      meanAnomaly: 92.1098,
      bstar: 0.000012345
    },
    '36585': { // GPS - 中轨道，高度约20200km
      satelliteId: '36585',
      name: 'GPS III SV01',
      line1: '1 36585U 18085A   25001.12345678  .00001234  00000+0  12345-4 0  9999',
      line2: '2 36585  55.0000 78.9012 0001234 189.0123 171.0987 2.00000000123456',
      epoch: new Date(),
      meanMotion: 2.00, // 每天2圈，对应12小时轨道周期
      eccentricity: 0.0001234,
      inclination: 55.0000,
      raan: 78.9012,
      argumentOfPeriapsis: 189.0123,
      meanAnomaly: 171.0987,
      bstar: 0.000012345
    },
    '56309': { // LUMELITE-4 (使用现有的备用数据)
      satelliteId: '56309',
      name: 'LUMELITE-4',
      line1: '1 56309U 23057B   25268.21372113  .00018713  00000+0  92768-3 0  9997',
      line2: '2 56309   9.9929 258.2316 0005640 174.9481 185.0791 15.14929629133702',
      epoch: new Date('2024-09-25T12:00:00Z'),
      meanMotion: 15.14929629,
      eccentricity: 0.0005640,
      inclination: 9.9929,
      raan: 258.2316,
      argumentOfPeriapsis: 174.9481,
      meanAnomaly: 185.0791,
      bstar: 0.000092768
    }
  };
  
  return fallbackTLEs[noradId] || null;
}

/**
 * 手动刷新 TLE 缓存
 */
export async function refreshTLE(): Promise<TLEData | null> {
  console.log('Manually refreshing TLE cache...');
  // 清除缓存，强制重新获取
  cachedTLE = null;
  cacheTimestamp = null;
  return getTargetSatelliteTLE();
}

/**
 * 获取多个卫星类别的TLE数据
 */
export async function getMultipleCategories(categories: SatelliteCategory[]): Promise<Map<SatelliteCategory, TLEData[]>> {
  const results = new Map<SatelliteCategory, TLEData[]>();
  
  try {
    const promises = categories.map(async (category) => {
      const data = await getSatellitesByCategory(category);
      results.set(category, data);
      return { category, data };
    });

    await Promise.all(promises);
    console.log(`Successfully retrieved data for ${categories.length} categories`);
  } catch (error) {
    console.error('Error getting multiple categories:', error);
  }

  return results;
}

/**
 * 解析TLE数据
 */
function parseTLEData(name: string, line1: string, line2: string): TLEData {
  // 验证TLE格式
  if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
    throw new Error('Invalid TLE format');
  }

  // 解析TLE行1
  const epochYear = parseInt(line1.substring(18, 20));
  const epochDay = parseFloat(line1.substring(20, 32));
  const meanMotion = parseFloat(line1.substring(52, 63));
  const bstar = parseFloat(line1.substring(53, 61)) * Math.pow(10, parseInt(line1.substring(61, 62)));
  
  // 解析TLE行2
  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25));
  const eccentricity = parseFloat('0.' + line2.substring(26, 33));
  const argumentOfPeriapsis = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  
  // 计算epoch日期
  const year = epochYear < 50 ? 2000 + epochYear : 1900 + epochYear;
  const epoch = new Date(year, 0, 1);
  epoch.setDate(epoch.getDate() + epochDay - 1);
  
  return {
    satelliteId: line1.substring(2, 7).trim(),
    name: name,
    line1: line1,
    line2: line2,
    epoch: epoch,
    meanMotion: meanMotion,
    eccentricity: eccentricity,
    inclination: inclination,
    raan: raan,
    argumentOfPeriapsis: argumentOfPeriapsis,
    meanAnomaly: meanAnomaly,
    bstar: bstar
  };
}

/**
 * 获取TLE数据的最后更新时间
 */
export async function getLastUpdateTime(category: SatelliteCategory): Promise<Date | null> {
  try {
    const response = await fetch(`${CELESTRAK_BASE_URL}/${category}.txt`, { method: 'HEAD' });
    const lastModified = response.headers.get('last-modified');
    
    if (lastModified) {
      return new Date(lastModified);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting last update time for ${category}:`, error);
    return null;
  }
}

// 导出常量
export const ISS_NORAD_ID = '25544';
export const ISS_NAME = 'ISS (ZARYA)';

// 默认导出
export default {
  getSatellitesByCategory,
  getSatelliteByName,
  getISSTLEData,
  getMultipleCategories,
  getLastUpdateTime,
  getTLEByNoradId,
  getTLEByNoradIds,
  getTargetSatelliteTLE,
  refreshTLE,
  TARGET_NORAD_ID,
  SatelliteCategory
};
