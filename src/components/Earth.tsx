import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import Satellite56309 from './Satellite56309'
import SatelliteOrbit56309 from './SatelliteOrbit56309'
import FamousSatellites from './FamousSatellites'
import { calculateSunPosition } from '../services/seasonalSunService'


// Textures
const DAY_TEXTURE   = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
const NIGHT_TEXTURE = import.meta.env.BASE_URL + 'Earth/night.jpg'
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
    vec3 nightDark = mix(nightColor, nightColor * 0.5, 1.0 - pow(nightColor, vec3(2.0)));
    vec3 color = mix(nightDark, dayColor, mixAmount);
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface EarthProps {
  showOtherSatellites: boolean
}

const Earth: React.FC<EarthProps> = ({ showOtherSatellites }) => {
  const groupRef   = useRef<THREE.Group>(null)
  const earthRef   = useRef<THREE.Mesh>(null)
  const cloudsRef  = useRef<THREE.Mesh>(null)
  const { getCurrentEffectiveTime } = useAppStore()

  // textures
  const [dayMap, nightMap, cloudMap] = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return [
      loader.load(DAY_TEXTURE),
      loader.load(NIGHT_TEXTURE),
      loader.load(CLOUD_TEXTURE)
    ]
  }, [])

  // day-night shader
  const shaderMaterial = useMemo(() =>
    new THREE.ShaderMaterial({
      uniforms: {
        dayTexture:   { value: dayMap },
        nightTexture: { value: nightMap },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) } // ECI->world mapping applied below
      },
      vertexShader,
      fragmentShader
    }),
    [dayMap, nightMap]
  )

  // clouds
  const cloudMaterial = useMemo(() =>
    new THREE.MeshLambertMaterial({ map: cloudMap, transparent: true, opacity: 0.2 }),
    [cloudMap]
  )

  useFrame(() => {
    if (!groupRef.current) return;

    const currentTime = getCurrentEffectiveTime();

    // 地球自转：由于卫星和轨道使用ECI坐标系（惯性），
    // 我们需要让地球在ECI坐标系中自转，这样轨道看起来就会在地球表面"滚动"
    const u = currentTime.getUTCHours() / 24 +
              currentTime.getUTCMinutes() / 1440 +
              currentTime.getUTCSeconds() / 86400 +
              currentTime.getUTCMilliseconds() / 86400000;
    groupRef.current.rotation.y = u * 2 * Math.PI - Math.PI;

    // Calculate seasonal sun position
    const sunPos = calculateSunPosition(currentTime);
    
    // Sun direction in Earth-fixed frame with seasonal variation
    // 太阳方向会根据季节变化，实现晨昏线的倾斜
    shaderMaterial.uniforms.sunDirection.value.set(sunPos.x, sunPos.y, sunPos.z);

    // (optional) slow cloud drift
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0008;
  })

  return (
    <group ref={groupRef}>
        {/* Globe with day/night shader */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[5, 64, 64]} />
          <primitive object={shaderMaterial} attach="material" />
        </mesh>

        {/* Prime meridian axis - 默认隐藏 */}
        {/* <Line points={[[0, 0, 0], [5.8, 0, 0]]} color="#00ff00" lineWidth={3} />
        <Text position={[6.2, 0, 0]} fontSize={0.5} color="#00ff00" anchorX="center" anchorY="middle">
          Lon 0°
        </Text> */}

        {/* Clouds */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[5.02, 64, 64]} />
          <primitive object={cloudMaterial} />
        </mesh>

        {/* Atmosphere glow */}
        <mesh>
          <sphereGeometry args={[5.3, 32, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>

        {/* Famous Satellites (ISS, Hubble, etc.) - 条件渲染 */}
        {showOtherSatellites && <FamousSatellites />}

        {/* Satellite 56309 orbit - 总是显示 */}
        <SatelliteOrbit56309 />

        {/* Satellite 56309 - 总是显示 */}
        <Satellite56309 />
      </group>
  )
}

export default Earth
