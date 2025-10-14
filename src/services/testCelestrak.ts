/**
 * Celestrak服务测试文件
 * 用于验证TLE数据获取功能
 */

import { 
  getISSTLEData, 
  getSatellitesByCategory, 
  SatelliteCategory,
  getMultipleCategories 
} from './celestrakService';

/**
 * 测试ISS TLE数据获取
 */
export async function testISSTLE() {
  console.log('🧪 Testing ISS TLE data retrieval...');
  
  try {
    const issData = await getISSTLEData();
    
    if (issData) {
      console.log('✅ ISS TLE data retrieved successfully:');
      console.log('   Name:', issData.name);
      console.log('   Satellite ID:', issData.satelliteId);
      console.log('   Epoch:', issData.epoch.toISOString());
      console.log('   Inclination:', issData.inclination.toFixed(2) + '°');
      console.log('   Eccentricity:', issData.eccentricity.toFixed(6));
    } else {
      console.log('❌ Failed to retrieve ISS TLE data');
    }
  } catch (error) {
    console.error('❌ Error testing ISS TLE:', error);
  }
}

/**
 * 测试多个卫星类别数据获取
 */
export async function testMultipleCategories() {
  console.log('🧪 Testing multiple satellite categories...');
  
  try {
    const categories = [
      SatelliteCategory.STATIONS,
      SatelliteCategory.GPS,
      SatelliteCategory.STARLINK
    ];
    
    const results = await getMultipleCategories(categories);
    
    for (const [category, satellites] of results) {
      console.log(`✅ ${category}: ${satellites.length} satellites`);
      
      if (satellites.length > 0) {
        const firstSat = satellites[0];
        console.log(`   Example: ${firstSat.name} (ID: ${firstSat.satelliteId})`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing multiple categories:', error);
  }
}

/**
 * 测试特定类别数据获取
 */
export async function testSpecificCategory(category: SatelliteCategory) {
  console.log(`🧪 Testing ${category} category...`);
  
  try {
    const satellites = await getSatellitesByCategory(category);
    
    console.log(`✅ ${category}: ${satellites.length} satellites retrieved`);
    
    if (satellites.length > 0) {
      console.log('   First 3 satellites:');
      satellites.slice(0, 3).forEach((sat, index) => {
        console.log(`   ${index + 1}. ${sat.name} (ID: ${sat.satelliteId})`);
      });
    }
  } catch (error) {
    console.error(`❌ Error testing ${category}:`, error);
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🚀 Starting Celestrak service tests...\n');
  
  // 测试ISS数据
  await testISSTLE();
  console.log('');
  
  // 测试空间站类别
  await testSpecificCategory(SatelliteCategory.STATIONS);
  console.log('');
  
  // 测试GPS类别
  await testSpecificCategory(SatelliteCategory.GPS);
  console.log('');
  
  // 测试多个类别
  await testMultipleCategories();
  console.log('');
  
  console.log('🎉 All tests completed!');
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined') {
  // Node.js环境
  runAllTests().catch(console.error);
}
