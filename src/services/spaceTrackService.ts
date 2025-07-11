/**
 * Space Track ISS TLE数据获取服务
 * 使用Space Track API获取国际空间站的TLE数据
 */

// 环境变量配置
const SPACETRACK_USERNAME = import.meta.env.VITE_SPACETRACK_USERNAME || '';
const SPACETRACK_PASSWORD = import.meta.env.VITE_SPACETRACK_PASSWORD || '';

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

/**
 * 解析TLE数据
 */
function parseTLEData(name: string, line1: string, line2: string): TLEData {
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
 * 登录Space Track
 */
async function loginToSpaceTrack(): Promise<string> {
  if (!SPACETRACK_USERNAME || !SPACETRACK_PASSWORD) {
    throw new Error('Space Track credentials not configured');
  }

  const formData = new URLSearchParams({
    identity: SPACETRACK_USERNAME,
    password: SPACETRACK_PASSWORD
  });

  const response = await fetch('https://www.space-track.org/ajaxauth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('Login failed: No cookies returned');
  }

  return cookies;
}

/**
 * 获取ISS的TLE数据
 */
export async function getISSTLEData(): Promise<TLEData | null> {
  try {
    console.log('Logging in to Space Track...');
    const cookie = await loginToSpaceTrack();
    console.log('Login successful');

    console.log('Fetching ISS TLE data...');
    const response = await fetch('https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/format/tle', {
      headers: {
        'Cookie': cookie
      }
    });

    if (!response.ok) {
      throw new Error(`TLE fetch failed: ${response.status}`);
    }

    const data = await response.text();
    if (!data || !data.trim()) {
      throw new Error('TLE data is empty');
    }

    const lines = data.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid TLE format: insufficient lines');
    }

    const tleData = parseTLEData('ISS (ZARYA)', lines[0], lines[1]);
    console.log('Successfully retrieved ISS TLE data');
    return tleData;
  } catch (error) {
    console.error('Error getting ISS TLE data:', error);
    return null;
  }
}

/**
 * 获取ISS的TLE原始字符串
 */
export async function getISSTLERaw(): Promise<string | null> {
  try {
    console.log('Logging in to Space Track...');
    const cookie = await loginToSpaceTrack();
    console.log('Login successful');

    console.log('Fetching ISS TLE raw data...');
    const response = await fetch('https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/format/tle', {
      headers: {
        'Cookie': cookie
      }
    });

    if (!response.ok) {
      throw new Error(`TLE fetch failed: ${response.status}`);
    }

    const data = await response.text();
    console.log('Successfully retrieved ISS TLE raw data');
    return data.trim();
  } catch (error) {
    console.error('Error getting ISS TLE raw data:', error);
    return null;
  }
}

// 导出常量
export const ISS_NORAD_ID = '25544';
export const ISS_NAME = 'ISS (ZARYA)';

// 默认导出
export default {
  getISSTLEData,
  getISSTLERaw
}; 