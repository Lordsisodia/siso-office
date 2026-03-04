import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ThemeMode } from "@/gateway/types";

const WALL_HEIGHT = 2.8;
const WALL_THICKNESS = 0.12;

function getThemeColors(_theme: ThemeMode) {
  return {
    FLOOR_COLOR: "#ffffff",
    WALL_COLOR: "#ffffff",
    WALL_EDGE_COLOR: "#e5e7eb",
    WINDOW_COLOR: "#bfdbfe",
    WINDOW_EMISSIVE: "#93c5fd",
  };
}

function Wall({
  position,
  size,
  theme,
}: {
  position: [number, number, number];
  size: [number, number, number];
  theme?: ThemeMode;
}) {
  const colors = getThemeColors(theme ?? "dark");
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={colors.WALL_COLOR} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function WallWithWindows({
  start,
  end,
  windowCount,
  side,
  theme,
}: {
  start: [number, number, number];
  end: [number, number, number];
  windowCount?: number;
  side?: "front" | "back" | "left" | "right";
  theme?: ThemeMode;
}) {
  const colors = getThemeColors(theme ?? "dark");
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  const isXAxis = Math.abs(dx) > Math.abs(dz);
  const rotY = isXAxis ? 0 : Math.PI / 2;

  const wallThick = WALL_THICKNESS;
  const windowWidth = 1.8;
  const windowHeight = 2.2;
  const windowY = 1.2;
  const winCount = windowCount ?? 2;
  const winSide = side ?? "front";

  const windows = useMemo(() => {
    const wins: Array<{ pos: [number, number, number] }> = [];
    for (let i = 1; i <= winCount; i++) {
      const t = i / (winCount + 1);
      wins.push({
        pos: [start[0] + dx * t, windowY, start[2] + dz * t],
      });
    }
    return wins;
  }, [start, dx, dz, winCount, windowY]);

  const thickDir: [number, number, number] = isXAxis ? [0, 0, wallThick] : [wallThick, 0, 0];

  return (
    <group>
      <mesh
        position={[midX, WALL_HEIGHT / 2, midZ]}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[length, WALL_HEIGHT, wallThick]} />
        <meshStandardMaterial
          color={colors.WALL_COLOR}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wall top edge */}
      <mesh position={[midX, WALL_HEIGHT - 0.02, midZ]} rotation={[0, rotY, 0]}>
        <boxGeometry args={[length, 0.04, wallThick + 0.02]} />
        <meshStandardMaterial color={colors.WALL_EDGE_COLOR} roughness={0.5} />
      </mesh>

      {/* Windows */}
      {windows.map((w, i) => (
        <mesh
          key={`win-${winSide}-${i}`}
          position={[w.pos[0] + thickDir[0] * 0.5, w.pos[1], w.pos[2] + thickDir[2] * 0.5]}
          rotation={[0, rotY, 0]}
        >
          <planeGeometry args={[windowWidth, windowHeight]} />
          <meshStandardMaterial
            color={colors.WINDOW_COLOR}
            emissive={colors.WINDOW_EMISSIVE}
            emissiveIntensity={0.4}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Stairs({
  position,
  rotation = 0,
  steps = 6,
}: {
  position: [number, number, number];
  rotation?: number;
  steps?: number;
}) {
  const stepElements = useMemo(() => {
    const elems: Array<{ y: number; z: number }> = [];
    for (let i = 0; i < steps; i++) {
      elems.push({
        y: (i * WALL_HEIGHT * 0.4) / steps,
        z: (i * 1.5) / steps,
      });
    }
    return elems;
  }, [steps]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {stepElements.map((s, i) => (
        <mesh key={`step-${i}`} position={[0, s.y + 0.05, s.z]} castShadow>
          <boxGeometry args={[0.8, 0.1, 1.5 / steps + 0.02]} />
          <meshStandardMaterial color="#b0b8c4" roughness={0.6} />
        </mesh>
      ))}
      {/* Railing */}
      <mesh position={[0.45, WALL_HEIGHT * 0.25, 0.75]}>
        <boxGeometry args={[0.03, WALL_HEIGHT * 0.35, 1.6]} />
        <meshStandardMaterial color="#8898a8" roughness={0.4} metalness={0.4} />
      </mesh>
    </group>
  );
}

function ServerRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 1.8, 0.4]} />
        <meshStandardMaterial color="#5a6878" roughness={0.5} metalness={0.35} />
      </mesh>
      {[0.3, 0.6, 0.9, 1.2, 1.5].map((y) => (
        <mesh key={`led-${y}`} position={[0.26, y, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

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
  const colors = getThemeColors(theme);
  
  return (
    <group>
      <ThemeLighting theme={theme} />

      {/* === Ground / Base Platform === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.08, 6]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>

      {/* Platform edge (subtle 3D depth) */}
      <mesh position={[8, -0.04, 6]}>
        <boxGeometry args={[17, 0.08, 13]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
      </mesh>

      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.01, 6]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color={colors.FLOOR_COLOR} roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Floor grid lines (very subtle) */}
      <gridHelper args={[16, 16, "#e5e7eb", "#f3f4f6"]} position={[8, 0.02, 6]} />

      {/* === Walls === */}
      {/* Back wall (north) */}
      <WallWithWindows start={[0, 0, 0]} end={[16, 0, 0]} windowCount={4} side="back" theme={theme} />
      {/* Left wall (west) */}
      <WallWithWindows start={[0, 0, 0]} end={[0, 0, 12]} windowCount={3} side="left" theme={theme} />
      {/* Right wall (east) — with entrance opening in lounge zone */}
      <Wall position={[16, WALL_HEIGHT / 2, 2]} size={[WALL_THICKNESS, WALL_HEIGHT, 4]} theme={theme} />
      {/* Right wall lower section, split for entrance door at z≈11 */}
      <Wall position={[16, WALL_HEIGHT / 2, 8.2]} size={[WALL_THICKNESS, WALL_HEIGHT, 2.4]} theme={theme} />
      <Wall position={[16, WALL_HEIGHT / 2, 11.7]} size={[WALL_THICKNESS, WALL_HEIGHT, 0.6]} theme={theme} />
      {/* Door frame — entrance opening z=9.4 to z=11.4 */}
      <mesh position={[16, WALL_HEIGHT - 0.05, 10.4]}>
        <boxGeometry args={[WALL_THICKNESS + 0.04, 0.1, 2.1]} />
        <meshStandardMaterial color={colors.WALL_EDGE_COLOR} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Right wall windows */}
      <mesh position={[16.07, 1.3, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 2.2]} />
        <meshStandardMaterial
          color={colors.WINDOW_COLOR}
          emissive={colors.WINDOW_EMISSIVE}
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Welcome mat at entrance */}
      <mesh position={[16, 0.02, 10.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.5]} />
        <meshStandardMaterial color="#b0a090" roughness={0.95} />
      </mesh>

      {/* === Interior Dividers (glass-like, lower) === */}
      {/* Divider between desk zone and meeting zone */}
      <Wall position={[8, WALL_HEIGHT * 0.35, 3]} size={[WALL_THICKNESS, WALL_HEIGHT * 0.7, 5.5]} theme={theme} />
      {/* Top accent stripe on divider */}
      <mesh position={[8, WALL_HEIGHT * 0.7, 3]}>
        <boxGeometry args={[0.04, 0.03, 5.5]} />
        <meshStandardMaterial color={colors.WINDOW_COLOR} emissive={colors.WINDOW_EMISSIVE} emissiveIntensity={0.3} />
      </mesh>

      {/* Divider between work area and lounge */}
      <Wall
        position={[8, WALL_HEIGHT * 0.28, 9]}
        size={[WALL_THICKNESS, WALL_HEIGHT * 0.56, 5.5]}
        theme={theme}
      />

      {/* Horizontal divider separating top/bottom zones */}
      <Wall position={[4, WALL_HEIGHT * 0.3, 6]} size={[7.5, WALL_HEIGHT * 0.6, WALL_THICKNESS]} theme={theme} />

      {/* === Stairs === */}
      <Stairs position={[15, 0, 5.5]} rotation={Math.PI} steps={5} />

      {/* === Server Racks === */}
      <ServerRack position={[15.2, 0, 1]} />
      <ServerRack position={[15.2, 0, 1.7]} />
    </group>
  );
}
