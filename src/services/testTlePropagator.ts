/**
 * TLE传播器测试文件
 * 用于验证轨道计算和坐标转换功能
 */

import { TLEPropagator, calculateSatellitePosition, calculateSatelliteECI, calculateSatelliteECF } from './tlePropagator';
import { TLEData } from './celestrakService';

/**
 * 创建测试用的TLE数据
 */
function createTestTLEData(): TLEData {
  return {
    satelliteId: '25544',
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   24123.50000000  .00012268  00000+0  22944-3 0  9999',
    line2: '2 25544  51.6400 114.5000 0001266 126.4000 325.5000 15.50000000 12345',
    epoch: new Date('2024-05-02T12:00:00Z'),
    meanMotion: 15.5,
    eccentricity: 0.0001266,
    inclination: 51.64,
    raan: 114.5,
    argumentOfPeriapsis: 126.4,
    meanAnomaly: 325.5,
    bstar: 0.00022944
  };
}

/**
 * 测试TLE传播器基本功能
 */
export async function testBasicPropagation() {
  console.log('🧪 Testing basic TLE propagation...');
  
  try {
    const tleData = createTestTLEData();
    const propagator = new TLEPropagator(tleData);
    
    // 测试当前时间
    const now = new Date();
    const eciState = propagator.propagateToTime(now);
    
    console.log('✅ ECI state calculated:');
    console.log('   Position:', eciState.position.map(p => p.toFixed(2) + ' km'));
    console.log('   Velocity:', eciState.velocity.map(v => v.toFixed(2) + ' km/s'));
    console.log('   Timestamp:', eciState.timestamp.toISOString());
    
    return eciState;
  } catch (error) {
    console.error('❌ Error in basic propagation:', error);
    return null;
  }
}

/**
 * 测试坐标转换
 */
export async function testCoordinateTransformation() {
  console.log('🧪 Testing coordinate transformations...');
  
  try {
    const tleData = createTestTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const eciState = propagator.propagateToTime(now);
    
    // ECI -> ECF
    const ecfState = propagator.eciToEcf(eciState);
    console.log('✅ ECI -> ECF conversion:');
    console.log('   ECF Position:', ecfState.position.map(p => p.toFixed(2) + ' km'));
    console.log('   ECF Velocity:', ecfState.velocity.map(v => v.toFixed(2) + ' km/s'));
    
    // ECF -> Geographic
    const geoCoords = propagator.ecfToGeographic(ecfState);
    console.log('✅ ECF -> Geographic conversion:');
    console.log('   Latitude:', geoCoords.latitude.toFixed(4) + '°');
    console.log('   Longitude:', geoCoords.longitude.toFixed(4) + '°');
    console.log('   Altitude:', geoCoords.altitude.toFixed(2) + ' km');
    
    return { eciState, ecfState, geoCoords };
  } catch (error) {
    console.error('❌ Error in coordinate transformation:', error);
    return null;
  }
}

/**
 * 测试便捷函数
 */
export async function testConvenienceFunctions() {
  console.log('🧪 Testing convenience functions...');
  
  try {
    const tleData = createTestTLEData();
    const now = new Date();
    
    // 直接计算地理坐标
    const geoCoords = calculateSatellitePosition(tleData, now);
    console.log('✅ Direct geographic calculation:');
    console.log('   Lat:', geoCoords.latitude.toFixed(4) + '°, Lon:', geoCoords.longitude.toFixed(4) + '°');
    
    // 直接计算ECI
    const eciState = calculateSatelliteECI(tleData, now);
    console.log('✅ Direct ECI calculation:');
    console.log('   Position:', eciState.position.map(p => p.toFixed(2) + ' km'));
    
    // 直接计算ECF
    const ecfState = calculateSatelliteECF(tleData, now);
    console.log('✅ Direct ECF calculation:');
    console.log('   Position:', ecfState.position.map(p => p.toFixed(2) + ' km'));
    
    return { geoCoords, eciState, ecfState };
  } catch (error) {
    console.error('❌ Error in convenience functions:', error);
    return null;
  }
}

/**
 * 测试地面轨迹计算
 */
export async function testGroundTrack() {
  console.log('🧪 Testing ground track calculation...');
  
  try {
    const tleData = createTestTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const eciState = propagator.propagateToTime(now);
    const ecfState = propagator.eciToEcf(eciState);
    
    // 计算地面轨迹
    const groundTrack = propagator.calculateGroundTrack(ecfState);
    console.log('✅ Ground track calculated:');
    console.log('   Latitude:', groundTrack.latitude.toFixed(4) + '°');
    console.log('   Longitude:', groundTrack.longitude.toFixed(4) + '°');
    console.log('   Altitude:', groundTrack.altitude + ' km (should be 0)');
    
    return groundTrack;
  } catch (error) {
    console.error('❌ Error in ground track calculation:', error);
    return null;
  }
}

/**
 * 测试可见性计算
 */
export async function testVisibilityCalculation() {
  console.log('🧪 Testing visibility calculation...');
  
  try {
    const tleData = createTestTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const geoCoords = calculateSatellitePosition(tleData, now);
    
    // 测试从北京观察的可见性
    const beijingLat = 39.9042;
    const beijingLon = 116.4074;
    
    const isVisible = propagator.calculateVisibility(geoCoords, beijingLat, beijingLon);
    console.log('✅ Visibility from Beijing calculated:');
    console.log('   Satellite position:', geoCoords.latitude.toFixed(4) + '°,', geoCoords.longitude.toFixed(4) + '°');
    console.log('   Observer position:', beijingLat + '°,', beijingLon + '°');
    console.log('   Is visible:', isVisible ? 'Yes' : 'No');
    
    return isVisible;
  } catch (error) {
    console.error('❌ Error in visibility calculation:', error);
    return null;
  }
}

/**
 * 测试时间序列计算
 */
export async function testTimeSeries() {
  console.log('🧪 Testing time series calculation...');
  
  try {
    const tleData = createTestTLEData();
    // const propagator = new TLEPropagator(tleData);
    
    const baseTime = new Date('2024-05-02T12:00:00Z');
    const positions: Array<{ time: Date; lat: number; lon: number }> = [];
    
    // 计算未来24小时，每小时一个点
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(baseTime.getTime() + hour * 60 * 60 * 1000);
      const geoCoords = calculateSatellitePosition(tleData, time);
      
      positions.push({
        time,
        lat: geoCoords.latitude,
        lon: geoCoords.longitude
      });
    }
    
    console.log('✅ Time series calculated (24 hours):');
    console.log('   First position:', positions[0].lat.toFixed(4) + '°,', positions[0].lon.toFixed(4) + '°');
    console.log('   Last position:', positions[23].lat.toFixed(4) + '°,', positions[23].lon.toFixed(4) + '°');
    console.log('   Total positions:', positions.length);
    
    return positions;
  } catch (error) {
    console.error('❌ Error in time series calculation:', error);
    return null;
  }
}

/**
 * 运行所有测试
 */
export async function runAllTLEPropagatorTests() {
  console.log('🚀 Starting TLE Propagator tests...\n');
  
  // 基本传播测试
  await testBasicPropagation();
  console.log('');
  
  // 坐标转换测试
  await testCoordinateTransformation();
  console.log('');
  
  // 便捷函数测试
  await testConvenienceFunctions();
  console.log('');
  
  // 地面轨迹测试
  await testGroundTrack();
  console.log('');
  
  // 可见性测试
  await testVisibilityCalculation();
  console.log('');
  
  // 时间序列测试
  await testTimeSeries();
  console.log('');
  
  console.log('🎉 All TLE Propagator tests completed!');
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined') {
  // Node.js环境
  runAllTLEPropagatorTests().catch(console.error);
}
