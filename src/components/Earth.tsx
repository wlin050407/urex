import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getERA } from '../utils/eraService'
import { useAppStore } from '../store/appStore'
import { Line, Text } from '@react-three/drei'
import { sunDirectionService } from '../utils/sunDirectionService'

// NASA Blue Marble 贴图
const DAY_TEXTURE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
const NIGHT_TEXTURE = '/Earth/night.jpg'
const CLOUD_TEXTURE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float dotSun = dot(normalize(vNormalW), normalize(sunDirection));
    float mixAmount = smoothstep(-0.18, 0.18, dotSun);
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    nightColor = pow(nightColor, vec3(0.6));
    nightColor *= 1.2;
    nightColor = clamp(nightColor, 0.0, 1.0);
    // 只暗化夜晚贴图的暗部，不影响亮部
    vec3 nightDark = mix(nightColor, nightColor * 0.5, 1.0 - pow(nightColor, vec3(2.0)));
    vec3 color = mix(nightDark, dayColor, mixAmount);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null)
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const { getCurrentEffectiveTime } = useAppStore()

  // 贴图加载
  const [dayMap, nightMap, cloudMap] = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return [
      loader.load(DAY_TEXTURE),
      loader.load(NIGHT_TEXTURE),
      loader.load(CLOUD_TEXTURE)
    ]
  }, [])

  // Shader材质
  const shaderMaterial = useMemo(() =>
    new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader,
      fragmentShader
    }),
    [dayMap, nightMap]
  )

  // 云层材质
  const cloudMaterial = useMemo(() =>
    new THREE.MeshLambertMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.2
    }),
    [cloudMap]
  )

  useFrame(() => {
    if (groupRef.current) {
      const currentTime = getCurrentEffectiveTime()
      const era = getERA(currentTime)
      groupRef.current.rotation.y = era
      
      // 关键：使用真实的太阳方向（考虑地球公转）
      if (shaderMaterial && shaderMaterial.uniforms && shaderMaterial.uniforms.sunDirection) {
        const sunDirection = sunDirectionService.getSunDirection(currentTime)
        // 坐标轴映射：ECI(x, y, z) -> Three.js(x, z, y)
        shaderMaterial.uniforms.sunDirection.value.set(sunDirection.x, sunDirection.z, sunDirection.y)
      }
    }
    // 云层独立缓慢旋转（可选）
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0008
    }
  })

  return (
    <group ref={groupRef}>
      {/* 地球主体（昼夜混合Shader） */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>
      {/* 本初子午线参考轴 */}
      <Line points={[[0, 0, 0], [5.8, 0, 0]]} color="#00ff00" lineWidth={3} />
      <Text position={[6.2, 0, 0]} fontSize={0.5} color="#00ff00" anchorX="center" anchorY="middle">
        Lon 0°
      </Text>
      {/* 云层 */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[5.02, 64, 64]} />
        <primitive object={cloudMaterial} />
      </mesh>
      {/* 大气层光晕 */}
      <mesh>
        <sphereGeometry args={[5.3, 32, 32]} />
        <meshBasicMaterial 
          color="#60a5fa" 
          transparent 
          opacity={0.1} 
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

export default Earth 
