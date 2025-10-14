import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import { useAppStore } from '../store/appStore';
import { moonOrbitCalculator, MoonOrbitState, MOON_ORBITAL_PARAMS } from '../services/moonOrbitService';

interface MoonProps {
  showOrbit?: boolean;
  showLabels?: boolean;
  showMoonPhase?: boolean;
}

const Moon: React.FC<MoonProps> = ({ 
  showOrbit = true, 
  showLabels = true,
  showMoonPhase = true 
}) => {
  const moonRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const { getCurrentEffectiveTime } = useAppStore();
  
  const [moonState, setMoonState] = useState<MoonOrbitState | null>(null);
  const [orbitPath, setOrbitPath] = useState<[number, number, number][]>([]);
  const [isSelected, setIsSelected] = useState(false);

  // 月球材质 - 基于月相的光照
  const moonMaterial = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: '#c0c0c0', // 月球灰色
      emissive: '#202020', // 微弱自发光
      roughness: 0.9,
      metalness: 0.1
    });
  }, []);

  // 月球几何体
  const moonGeometry = useMemo(() => {
    const radius = (MOON_ORBITAL_PARAMS.MOON_RADIUS / MOON_ORBITAL_PARAMS.EARTH_RADIUS) * MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS;
    return new THREE.SphereGeometry(radius, 32, 32);
  }, []);

  // 生成轨道路径
  useEffect(() => {
    const path = moonOrbitCalculator.generateOrbitPath(200);
    setOrbitPath(path);
  }, []);

  // 更新月球位置和状态
  useFrame(() => {
    const currentTime = getCurrentEffectiveTime();
    const moonPosition = moonOrbitCalculator.calculatePosition(currentTime);
    const projectState = moonOrbitCalculator.toProjectCoordinates(moonPosition);
    
    setMoonState(projectState);

    // 更新月球位置
    if (moonRef.current && projectState) {
      moonRef.current.position.set(
        projectState.position[0],
        projectState.position[1],
        projectState.position[2]
      );

      // 更新月球材质基于月相
      if (showMoonPhase) {
        const illumination = projectState.illumination;
        moonMaterial.color.setRGB(
          0.75 + 0.25 * illumination, // 红色分量
          0.75 + 0.25 * illumination, // 绿色分量
          0.75 + 0.25 * illumination  // 蓝色分量
        );
        moonMaterial.emissive.setRGB(
          0.1 * illumination,
          0.1 * illumination,
          0.1 * illumination
        );
      }
    }
  });

  // 月球点击处理
  const handleMoonClick = (e: any) => {
    e.stopPropagation();
    setIsSelected(!isSelected);
  };

  // 月球悬停处理
  const handleMoonPointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handleMoonPointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
  };

  return (
    <group>
      {/* 月球轨道线 */}
      {showOrbit && orbitPath.length > 0 && (
        <group ref={orbitRef}>
          <Line
            points={orbitPath}
            color="#888888"
            lineWidth={2}
            transparent
            opacity={0.6}
          />
          
          {/* 轨道标签 - 已移除 */}
        </group>
      )}

      {/* 月球本体 */}
      {moonState && (
        <group
          ref={moonRef}
          onClick={handleMoonClick}
          onPointerOver={handleMoonPointerOver}
          onPointerOut={handleMoonPointerOut}
        >
          <mesh>
            <primitive object={moonGeometry} />
            <primitive object={moonMaterial} attach="material" />
          </mesh>

          {/* 选中状态特效 */}
          {isSelected && (
            <>
              {/* 选中光环 */}
              <mesh>
                <ringGeometry args={[
                  (MOON_ORBITAL_PARAMS.MOON_RADIUS / MOON_ORBITAL_PARAMS.EARTH_RADIUS) * MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS + 0.1,
                  (MOON_ORBITAL_PARAMS.MOON_RADIUS / MOON_ORBITAL_PARAMS.EARTH_RADIUS) * MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS + 0.2,
                  32
                ]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
              </mesh>
              
              {/* 信息标签 */}
              <Text
                position={[0, 1, 0]}
                fontSize={0.4}
                color="#00ff00"
                anchorX="center"
                anchorY="middle"
              >
                月球
              </Text>
            </>
          )}

          {/* 月相指示器 */}
          {showMoonPhase && moonState && (
            <group>
              {/* 月相文字 */}
              <Text
                position={[0, -1, 0]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {moonState.phase < 0.125 ? '新月' :
                 moonState.phase < 0.375 ? '上弦月' :
                 moonState.phase < 0.625 ? '满月' :
                 moonState.phase < 0.875 ? '下弦月' : '新月'}
              </Text>
              
              {/* 光照比例条 */}
              <mesh position={[0, -1.5, 0]}>
                <planeGeometry args={[2, 0.1]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.5} />
              </mesh>
              <mesh position={[-1 + moonState.illumination, -1.5, 0.01]}>
                <planeGeometry args={[moonState.illumination * 2, 0.08]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
            </group>
          )}

          {/* 距离标签 */}
          {showLabels && (
            <Text
              position={[0, 2, 0]}
              fontSize={0.25}
              color="#cccccc"
              anchorX="center"
              anchorY="middle"
            >
              {`距离: ${(moonState.distance / MOON_ORBITAL_PARAMS.PROJECT_EARTH_RADIUS * MOON_ORBITAL_PARAMS.EARTH_RADIUS / 1000).toFixed(0)}k km`}
            </Text>
          )}
        </group>
      )}

      {/* 轨道参数显示 */}
      {isSelected && (
        <group position={[0, 0, 0]}>
          <Text
            position={[0, 3, 0]}
            fontSize={0.2}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
          >
            偏心率: {MOON_ORBITAL_PARAMS.ECCENTRICITY}
          </Text>
          <Text
            position={[0, 3.3, 0]}
            fontSize={0.2}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
          >
            倾角: {MOON_ORBITAL_PARAMS.INCLINATION}°
          </Text>
          <Text
            position={[0, 3.6, 0]}
            fontSize={0.2}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
          >
            周期: {MOON_ORBITAL_PARAMS.ORBITAL_PERIOD} 天
          </Text>
        </group>
      )}
    </group>
  );
};

export default Moon;
