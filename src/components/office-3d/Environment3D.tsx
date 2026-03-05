import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { ThemeMode } from "@/gateway/types";

const LIGHT_PARAMS = {
  ambient: { intensity: 0.8, color: new THREE.Color("#ffffff") },
  main: { intensity: 1.0, color: new THREE.Color("#ffffff") },
  fill: { intensity: 0.5, color: new THREE.Color("#e0e7ff") },
  hemi: { intensity: 0.5 },
} as const;

const DARK_PARAMS = {
  ambient: { intensity: 0.8, color: new THREE.Color("#ffffff") },
  main: { intensity: 1.0, color: new THREE.Color("#ffffff") },
  fill: { intensity: 0.5, color: new THREE.Color("#e0e7ff") },
  hemi: { intensity: 0.5 },
} as const;

const LERP_SPEED = 4;

function ThemeLighting({ theme }: { theme: ThemeMode }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const mainRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const target = theme === "light" ? LIGHT_PARAMS : DARK_PARAMS;

  useFrame((_, delta) => {
    const t = Math.min(delta * LERP_SPEED, 1);
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        target.ambient.intensity,
        t,
      );
      ambientRef.current.color.lerp(target.ambient.color, t);
    }
    if (mainRef.current) {
      mainRef.current.intensity = THREE.MathUtils.lerp(
        mainRef.current.intensity,
        target.main.intensity,
        t,
      );
      mainRef.current.color.lerp(target.main.color, t);
    }
    if (fillRef.current) {
      fillRef.current.intensity = THREE.MathUtils.lerp(
        fillRef.current.intensity,
        target.fill.intensity,
        t,
      );
      fillRef.current.color.lerp(target.fill.color, t);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(
        hemiRef.current.intensity,
        target.hemi.intensity,
        t,
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.8} color="#ffffff" />
      <directionalLight
        ref={mainRef}
        position={[12, 18, 10]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.001}
        color="#ffffff"
      />
      <directionalLight ref={fillRef} position={[-8, 10, -5]} intensity={0.5} color="#e0e7ff" />
      <hemisphereLight ref={hemiRef} args={["#ffffff", "#e0e7ff", 0.5]} />
      {false && (
        <>
          <pointLight
            position={[3, 1.2, 2]}
            intensity={0.6}
            color="#ffd599"
            distance={5}
            decay={2}
          />
          <pointLight
            position={[12, 1.2, 4]}
            intensity={0.6}
            color="#ffd599"
            distance={5}
            decay={2}
          />
          <pointLight
            position={[6, 1.2, 10]}
            intensity={0.4}
            color="#ffd599"
            distance={4}
            decay={2}
          />
        </>
      )}
    </>
  );
}

export function Environment3D({ theme = "dark" as ThemeMode }: { theme?: ThemeMode }) {
  return (
    <group>
      <ThemeLighting theme={theme} />

      <Skylines />

      {/* Platform base - cylinder */}
      <mesh position={[8, 2, 6]} castShadow receiveShadow>
        <cylinderGeometry args={[12, 14, 4, 32]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.9} />
      </mesh>

      {/* Office floor on top of platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 4.05, 6]} receiveShadow>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
      </mesh>
      
      <mesh position={[8, 4.1, 6]}>
        <boxGeometry args={[18, 0.1, 14]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.9} />
      </mesh>


    </group>
  );
}

function Skylines() {
  return (
    <group>
      <Ocean />
      <Island />
      <DistantIslands />
      <Clouds />
    </group>
  );
}

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = -0.5 + Math.sin(t * 0.5) * 0.1;
    }
    if (meshRef.current) {
      meshRef.current.position.y = -0.4 + Math.sin(t * 0.7 + 1) * 0.08;
    }
  });
  
  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -60]} receiveShadow>
        <planeGeometry args={[500, 400]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.15} metalness={0.1} />
      </mesh>
      <mesh ref={meshRef2} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -60]}>
        <planeGeometry args={[500, 400]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Island() {
  return (
    <group position={[30, -2, -20]}>
      {/* Base sand layer */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[45, 40, 2, 64]} />
        <meshStandardMaterial color="#eab308" roughness={0.95} />
      </mesh>
      
      {/* Grass/terrain with height variation */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[38, 35, 3, 64]} />
        <meshStandardMaterial color="#65a30d" roughness={0.9} />
      </mesh>
      
      {/* Higher terrain - back area */}
      <mesh position={[-8, 3.5, -8]}>
        <cylinderGeometry args={[22, 18, 4, 48]} />
        <meshStandardMaterial color="#84cc16" roughness={0.85} />
      </mesh>
      
      {/* Tiny hill */}
      <mesh position={[12, 3, 8]}>
        <cylinderGeometry args={[12, 8, 4, 32]} />
        <meshStandardMaterial color="#65a30d" roughness={0.9} />
      </mesh>
      
      {/* Another hill */}
      <mesh position={[-15, 2.5, 5]}>
        <cylinderGeometry args={[10, 6, 3, 24]} />
        <meshStandardMaterial color="#84cc16" roughness={0.88} />
      </mesh>
      
      {/* Rocky outcrop */}
      <mesh position={[18, 2.5, -12]}>
        <dodecahedronGeometry args={[7, 0]} />
        <meshStandardMaterial color="#78716c" roughness={0.95} />
      </mesh>

      {/* Palm trees */}
      <PalmTree position={[-15, 4, -8]} />
      <PalmTree position={[8, 4, 12]} />
      <PalmTree position={[-12, 5, 8]} />
      <PalmTree position={[22, 4.5, -5]} />
      <PalmTree position={[-22, 4.5, 3]} />
      <PalmTree position={[5, 4, -15]} />
      <PalmTree position={[-8, 3, 15]} />
      
      {/* Beach ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[35, 48, 64]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 8, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {[0, 10, 120, 180, 240, 300].map((angle, i) => (
        <mesh key={i} position={[
          Math.sin(angle * Math.PI / 180) * 2,
          6.5,
          Math.cos(angle * Math.PI / 180) * 2
        ]} rotation={[0.5, angle * Math.PI / 180, 0.3]}>
          <boxGeometry args={[0.3, 4, 0.05]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 7, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.7} />
      </mesh>
    </group>
  );
}

function DistantIslands() {
  return (
    <group>
      {[
        { x: -25, z: -50, s: 0.5 },
        { x: 40, z: -55, s: 0.6 },
        { x: -50, z: -60, s: 0.4 },
        { x: 55, z: -45, s: 0.45 },
        { x: -60, z: -40, s: 0.35 },
        { x: 25, z: -65, s: 0.55 },
      ].map((island, i) => (
        <group key={i} position={[island.x, -3, island.z]} scale={island.s}>
          <mesh>
            <coneGeometry args={[15, 10, 16]} />
            <meshStandardMaterial color="#65a30d" roughness={0.9} />
          </mesh>
          <mesh position={[0, -4, 0]}>
            <cylinderGeometry args={[12, 15, 3, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Clouds() {
  return (
    <group>
      {[
        { x: -15, z: -15, s: 3 },
        { x: 5, z: -20, s: 4 },
        { x: 20, z: -12, s: 2.5 },
        { x: -5, z: -25, s: 3.5 },
        { x: 12, z: -18, s: 2 },
        { x: -25, z: -20, s: 2.8 },
      ].map((c, i) => (
        <group key={i} position={[c.x, 25, c.z]} scale={c.s}>
          <mesh><sphereGeometry args={[1.5, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[1.2, 0.2, 0]}><sphereGeometry args={[1.2, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[-1, 0.1, 0]}><sphereGeometry args={[1, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
        </group>
      ))}
    </group>
  );
}

function GlassWall({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const midX = (start[0] + end[0]) / 2;
  const midY = start[1] + 0.6;
  const midZ = (start[2] + end[2]) / 2;
  const rotY = Math.abs(dx) > Math.abs(dz) ? 0 : Math.PI / 2;

  return (
    <mesh position={[midX, midY, midZ]} rotation={[0, rotY, 0]}>
      <boxGeometry args={[length, 1.2, 0.02]} />
      <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}
