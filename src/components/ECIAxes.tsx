import React from 'react'
import { Line, Text } from '@react-three/drei'

interface ECIAxesProps {
  length?: number
}

const ECIAxes: React.FC<ECIAxesProps> = ({ length = 8 }) => {
  const origin: [number, number, number] = [0, 0, 0]
  const x: [number, number, number] = [length, 0, 0] // 红色 X轴
  const y: [number, number, number] = [0, 0, length] // 绿色 Y轴  
  const z: [number, number, number] = [0, length, 0] // 蓝色 Z轴

  return (
    <group>
      {/* X轴 - 红色 */}
      <Line points={[origin, x]} color="#ff0000" lineWidth={3} />
      <Text 
        position={x} 
        fontSize={0.7} 
        color="#ff0000" 
        anchorX="center" 
        anchorY="middle"
      >
        ECI X
      </Text>

      {/* Y轴 - 绿色 */}
      <Line points={[origin, y]} color="#00ff00" lineWidth={3} />
      <Text 
        position={y} 
        fontSize={0.7} 
        color="#00ff00" 
        anchorX="center" 
        anchorY="middle"
      >
        ECI Y
      </Text>

      {/* Z轴 - 蓝色 */}
      <Line points={[origin, z]} color="#0000ff" lineWidth={3} />
      <Text 
        position={z} 
        fontSize={0.7} 
        color="#0000ff" 
        anchorX="center" 
        anchorY="middle"
      >
        ECI Z
      </Text>
    </group>
  )
}

export default ECIAxes 