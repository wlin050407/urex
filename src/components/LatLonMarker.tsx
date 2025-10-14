import React, { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  latitudeDeg: number
  longitudeDeg: number
  radius?: number // scene radius (default 5 matches Earth.tsx)
  color?: string
  size?: number
}

// Marker positioned on the rotating Earth surface (child of Earth group)
const LatLonMarker: React.FC<Props> = ({ latitudeDeg, longitudeDeg, radius = 5, color = '#ff3333', size = 0.08 }) => {
  const position = useMemo(() => {
    const lat = THREE.MathUtils.degToRad(latitudeDeg)
    const lon = THREE.MathUtils.degToRad(longitudeDeg)

    // ECF on sphere of given radius
    const ecfX = radius * Math.cos(lat) * Math.cos(lon)
    const ecfY = radius * Math.cos(lat) * Math.sin(lon)
    const ecfZ = radius * Math.sin(lat)

    // Scene mapping based on ECIAxes: ECI X→X, ECI Y→Z, ECI Z→Y
    // 注意：为匹配当前地球自转方向与经度朝向，这里对经度轴取反（Z 分量取反）
    // ECF ≈ ECI for surface points, so: (x, y, z) <- (ECF X, ECF Z, -ECF Y)
    return new THREE.Vector3(ecfX, ecfZ, -ecfY)
  }, [latitudeDeg, longitudeDeg, radius])

  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export default LatLonMarker


