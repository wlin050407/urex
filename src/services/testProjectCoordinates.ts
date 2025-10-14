/**
 * 项目坐标系测试文件
 * 验证TLE传播器与项目原有坐标系的匹配性
 */

import { 
  TLEPropagator, 
  calculateSatelliteProjectPosition,
  calculateSatelliteProjectCoordinates,
  ProjectSatelliteState 
} from './tlePropagator';
import { TLEData } from './celestrakService';

/**
 * 创建测试用的TLE数据（ISS）
 */
function createTestISSTLEData(): TLEData {
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
 * 测试项目坐标系转换
 */
export async function testProjectCoordinateConversion() {
  console.log('🧪 Testing project coordinate conversion...');
  
  try {
    const tleData = createTestISSTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const projectState = propagator.propagateToProjectTime(now);
    
    console.log('✅ Project coordinates calculated:');
    console.log('   Project Position:', projectState.position.map(p => p.toFixed(4) + ' units'));
    console.log('   ECI Position:', projectState.eciPosition.map(p => p.toFixed(2) + ' km'));
    console.log('   Geographic:', projectState.geographicPosition.latitude.toFixed(4) + '°,', 
                projectState.geographicPosition.longitude.toFixed(4) + '°');
    console.log('   Altitude:', projectState.geographicPosition.altitude.toFixed(2) + ' km');
    
    // 验证坐标范围
    const [x, y, z] = projectState.position;
    console.log('   Coordinate validation:');
    console.log('     X (Sun direction):', x > 0 ? '✅ Positive' : '❌ Negative');
    console.log('     Y (ECI Z):', Math.abs(y) < 10 ? '✅ Reasonable' : '❌ Out of range');
    console.log('     Z (ECI Y):', Math.abs(z) < 10 ? '✅ Reasonable' : '❌ Out of range');
    
    return projectState;
  } catch (error) {
    console.error('❌ Error in project coordinate conversion:', error);
    return null;
  }
}

/**
 * 测试便捷函数
 */
export async function testConvenienceFunctions() {
  console.log('🧪 Testing convenience functions...');
  
  try {
    const tleData = createTestISSTLEData();
    const now = new Date();
    
    // 测试项目位置计算
    const projectCoords = calculateSatelliteProjectCoordinates(tleData, now);
    console.log('✅ Direct project coordinates:', projectCoords.map(p => p.toFixed(4) + ' units'));
    
    // 测试完整项目状态
    const projectState = calculateSatelliteProjectPosition(tleData, now);
    console.log('✅ Complete project state retrieved');
    console.log('   Position matches:', 
      projectState.position.every((p, i) => Math.abs(p - projectCoords[i]) < 1e-10) ? '✅ Yes' : '❌ No');
    
    return { projectCoords, projectState };
  } catch (error) {
    console.error('❌ Error in convenience functions:', error);
    return null;
  }
}

/**
 * 测试与地球模型的匹配性
 */
export async function testEarthModelCompatibility() {
  console.log('🧪 Testing Earth model compatibility...');
  
  try {
    const tleData = createTestISSTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const projectState = propagator.propagateToProjectTime(now);
    
    // 地球模型参数
    const EARTH_RADIUS_PROJECT = 5.0; // 项目中的地球半径
    const [x, y, z] = projectState.position;
    const distance = Math.sqrt(x*x + y*y + z*z);
    
    console.log('✅ Earth model compatibility:');
    console.log('   Project Earth radius:', EARTH_RADIUS_PROJECT + ' units');
    console.log('   Satellite distance from center:', distance.toFixed(4) + ' units');
    console.log('   Is above Earth surface:', distance > EARTH_RADIUS_PROJECT ? '✅ Yes' : '❌ No');
    console.log('   Distance ratio (satellite/Earth):', (distance / EARTH_RADIUS_PROJECT).toFixed(2));
    
    // 验证卫星在合理范围内
    const isReasonable = distance > EARTH_RADIUS_PROJECT && distance < EARTH_RADIUS_PROJECT * 2;
    console.log('   Position reasonable:', isReasonable ? '✅ Yes' : '❌ No');
    
    return { distance, isReasonable };
  } catch (error) {
    console.error('❌ Error in Earth model compatibility:', error);
    return null;
  }
}

/**
 * 测试时间序列的项目坐标
 */
export async function testProjectTimeSeries() {
  console.log('🧪 Testing project time series...');
  
  try {
    const tleData = createTestISSTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const baseTime = new Date('2024-05-02T12:00:00Z');
    const positions: Array<{ time: Date; projectPos: [number, number, number]; geoPos: [number, number] }> = [];
    
    // 计算未来12小时，每小时一个点
    for (let hour = 0; hour < 12; hour++) {
      const time = new Date(baseTime.getTime() + hour * 60 * 60 * 1000);
      const projectState = propagator.propagateToProjectTime(time);
      
      positions.push({
        time,
        projectPos: projectState.position,
        geoPos: [projectState.geographicPosition.latitude, projectState.geographicPosition.longitude]
      });
    }
    
    console.log('✅ Project time series calculated (12 hours):');
    console.log('   First position:', positions[0].projectPos.map(p => p.toFixed(4) + ' units'));
    console.log('   Last position:', positions[11].projectPos.map(p => p.toFixed(4) + ' units'));
    console.log('   Geographic range:', 
      'Lat:', Math.min(...positions.map(p => p.geoPos[0])).toFixed(2) + '° to',
      Math.max(...positions.map(p => p.geoPos[0])).toFixed(2) + '°');
    console.log('   Total positions:', positions.length);
    
    return positions;
  } catch (error) {
    console.error('❌ Error in project time series:', error);
    return null;
  }
}

/**
 * 测试与ECI轴的匹配性
 */
export async function testECIAxesCompatibility() {
  console.log('🧪 Testing ECI axes compatibility...');
  
  try {
    const tleData = createTestISSTLEData();
    const propagator = new TLEPropagator(tleData);
    
    const now = new Date();
    const projectState = propagator.propagateToProjectTime(now);
    
    const [x, y, z] = projectState.position;
    
    console.log('✅ ECI axes compatibility:');
    console.log('   Project X-axis (Sun direction):', x > 0 ? '✅ Positive' : '❌ Negative');
    console.log('   Project Y-axis (ECI Z):', Math.abs(y) < 10 ? '✅ Reasonable' : '❌ Out of range');
    console.log('   Project Z-axis (ECI Y):', Math.abs(z) < 10 ? '✅ Reasonable' : '❌ Out of range');
    
    // 验证坐标轴方向
    const xDirection = x > 0 ? 'toward Sun' : 'away from Sun';
    const yDirection = y > 0 ? 'positive ECI Z' : 'negative ECI Z';
    const zDirection = z > 0 ? 'positive ECI Y' : 'negative ECI Y';
    
    console.log('   Direction analysis:');
    console.log('     X:', xDirection);
    console.log('     Y:', yDirection);
    console.log('     Z:', zDirection);
    
    return { xDirection, yDirection, zDirection };
  } catch (error) {
    console.error('❌ Error in ECI axes compatibility:', error);
    return null;
  }
}

/**
 * 运行所有项目坐标系测试
 */
export async function runAllProjectCoordinateTests() {
  console.log('🚀 Starting Project Coordinate tests...\n');
  
  // 项目坐标系转换测试
  await testProjectCoordinateConversion();
  console.log('');
  
  // 便捷函数测试
  await testConvenienceFunctions();
  console.log('');
  
  // 地球模型兼容性测试
  await testEarthModelCompatibility();
  console.log('');
  
  // 时间序列测试
  await testProjectTimeSeries();
  console.log('');
  
  // ECI轴兼容性测试
  await testECIAxesCompatibility();
  console.log('');
  
  console.log('🎉 All Project Coordinate tests completed!');
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined') {
  // Node.js环境
  runAllProjectCoordinateTests().catch(console.error);
}
