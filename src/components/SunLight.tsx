import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useAppStore } from "../store/appStore";
import { calculateSunPosition } from "../services/seasonalSunService";

// Sun direction with seasonal variation based on Earth's axial tilt
export default function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const sunRef = useRef<THREE.Mesh>(null!);
  const { getCurrentEffectiveTime } = useAppStore();

  // Replace the invalid sun texture URL with a placeholder texture
  const sunTexture = useLoader(TextureLoader, 'https://th.bing.com/th/id/R.0aab68e70b03507fa14fb97427a5ada8?rik=hx%2fA1ywpBWITxA&riu=http%3a%2f%2fsolarviews.com%2fraw%2fsun%2fsuncyl1.jpg&ehk=PJmLhiUKcWOIAGoFiQe6FpRZ%2bR4HuN0nD9%2fE%2blzcKcY%3d&risl=&pid=ImgRaw&r=0');

  useFrame(() => {
    const currentTime = getCurrentEffectiveTime();
    const sunPos = calculateSunPosition(currentTime);
    
    // 基础距离
    const baseDistance = 1600;
    const sunVisualDistance = 400;
    
    if (lightRef.current) {
      lightRef.current.position.set(
        baseDistance * sunPos.x, // X轴：主要方向
        baseDistance * sunPos.y, // Y轴：季节变化（南北移动）
        0                        // Z轴：保持为0
      );
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
    }

    if (sunRef.current) {
      sunRef.current.position.set(
        sunVisualDistance * sunPos.x, // 太阳视觉位置跟随光照方向
        sunVisualDistance * sunPos.y, // 季节变化
        0
      );
      sunRef.current.scale.set(0.8, 0.8, 0.8);
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        name="sun"
        intensity={1.5} // Increase light intensity for better aesthetics
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[5, 64, 64]} /> {/* Higher segments for smoother appearance */}
        <meshBasicMaterial map={sunTexture} />
      </mesh>
    </>
  );
}
