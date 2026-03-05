import { OrbitControls, Html, useGLTF, Preload } from "@react-three/drei";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef, useEffect, Suspense, useState } from "react";
import * as THREE from "three";
import { ZONES } from "@/lib/constants";
import { position2dTo3d } from "@/lib/position-allocator";
import { detectMeetingGroups } from "@/store/meeting-manager";
import { useOfficeStore } from "@/store/office-store";
import { AgentCharacter } from "./AgentCharacter";
import { Environment3D } from "./Environment3D";
import { OfficeLayout3D } from "./OfficeLayout3D";
import { ParentChildLine } from "./ParentChildLine";

function IsometricOffice({ onDeskPositionsFound }: { onDeskPositionsFound?: (positions: THREE.Vector3[]) => void }) {
  const { scene } = useGLTF("/isometric_office.glb");
  
  useEffect(() => {
    const officePos = new THREE.Vector3(15, 0.5, -17);
    const officeRot = new THREE.Euler(0, Math.PI, 0);
    const deskPositions: THREE.Vector3[] = [];
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        let matName = '';
        
        if (Array.isArray(child.material)) {
          matName = child.material.map(m => m.name).join(' ');
        } else if (child.material instanceof THREE.MeshStandardMaterial) {
          matName = child.material.name;
        }
        
        const searchTerms = ['Pam_desk', 'desk', 'wood', 'Chair', 'chair', 'OfficeChair', 'Monitor'];
        const matches = searchTerms.some(term => matName.includes(term));
        
        if (matches) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          worldPos.applyEuler(officeRot).add(officePos);
          worldPos.y = 1.5;
          
          if (!deskPositions.some(p => p.distanceTo(worldPos) < 1.5)) {
            deskPositions.push(worldPos);
          }
        }
      }
    });
    
    console.log('Auto-detected positions:', deskPositions.length, deskPositions.map(p => ({ x: p.x.toFixed(1), y: p.y.toFixed(1), z: p.z.toFixed(1) })));
    
    if (deskPositions.length > 0 && onDeskPositionsFound) {
      console.log('Calling callback with', deskPositions.length, 'positions');
      onDeskPositionsFound(deskPositions);
    }
  }, [scene, onDeskPositionsFound]);
  
  return <primitive object={scene} scale={1} position={[15, 0.5, -17]} rotation={[0, Math.PI, 0]} />;
}

function WaterPlane() {
  const { scene } = useGLTF("/plane_water_low.glb");
  return <primitive object={scene} scale={1.5} position={[10, -0.5, 6]} />;
}

function SunsetIsland() {
  const { scene } = useGLTF("/sunset_island.glb");
  return <primitive object={scene} scale={12} position={[0, 0, 0]} />;
}

function OfficePlatform() {
  return (
    <group position={[15, -2, -17]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[8, 10, 1, 32]} />
        <meshStandardMaterial color="#c4a882" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7, 8, 0.2, 32]} />
        <meshStandardMaterial color="#8b7355" roughness={0.7} />
      </mesh>
    </group>
  );
}

function ZoneMarkers() {
  const zoneMarkers = [
    { key: "desk", label: "Desk Zone", color: "#3b82f6" },
    { key: "meeting", label: "Meeting", color: "#8b5cf6" },
    { key: "hotDesk", label: "Hot Desk", color: "#10b981" },
    { key: "lounge", label: "Lounge", color: "#f59e0b" },
  ];

  return (
    <>
      {zoneMarkers.map((zone) => {
        const z = ZONES[zone.key as keyof typeof ZONES];
        const centerX = z.x + z.width / 2;
        const centerY = z.y + z.height / 2;
        const [x, , zPos] = position2dTo3d({ x: centerX, y: centerY });

        return (
          <group key={zone.key}>
            <mesh position={[x, 0.1, zPos]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={0.5} />
            </mesh>
            <Html position={[x, 3, zPos]} center transform={false}>
              <div
                style={{
                  backgroundColor: zone.color,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                color: "white",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                opacity: 0.8,
              }}
            >
              {zone.label}
            </div>
          </Html>
          </group>
        );
      })}
    </>
  );
}

const SCENE_CENTER: [number, number, number] = [15, 4, -17];
const BG_LIGHT = new THREE.Color("#e8ecf2");
const BG_DARK = new THREE.Color("#0f1729");

function DeskDebugMarkers({ detectedDesks }: { detectedDesks?: THREE.Vector3[] }) {
  const deskPositions2D = [
    { x: 80, y: 80 }, { x: 180, y: 80 }, { x: 280, y: 80 }, { x: 380, y: 80 },
    { x: 80, y: 180 }, { x: 180, y: 180 }, { x: 280, y: 180 }, { x: 380, y: 180 },
    { x: 80, y: 280 }, { x: 180, y: 280 }, { x: 280, y: 280 }, { x: 380, y: 280 },
  ];
  const hotDeskPositions2D = [
    { x: 580, y: 380 }, { x: 680, y: 380 }, { x: 780, y: 380 },
    { x: 580, y: 480 }, { x: 680, y: 480 }, { x: 780, y: 480 },
  ];
  const loungePositions2D = [
    { x: 580, y: 80 }, { x: 680, y: 80 }, { x: 780, y: 80 },
    { x: 580, y: 180 }, { x: 680, y: 180 }, { x: 780, y: 180 },
  ];
  const meetingPositions2D = [
    { x: 580, y: 480 }, { x: 680, y: 480 }, { x: 780, y: 480 },
    { x: 580, y: 580 }, { x: 680, y: 580 }, { x: 780, y: 580 },
  ];

  return (
    <>
      {deskPositions2D.map((pos, i) => {
        const [x, , z] = position2dTo3d(pos);
        return (
          <mesh key={`desk-${i}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.4, 0.8, 0.3]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      {hotDeskPositions2D.map((pos, i) => {
        const [x, , z] = position2dTo3d(pos);
        return (
          <mesh key={`hotdesk-${i}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.4, 0.8, 0.3]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      {loungePositions2D.map((pos, i) => {
        const [x, , z] = position2dTo3d(pos);
        return (
          <mesh key={`lounge-${i}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.4, 0.8, 0.3]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      {meetingPositions2D.map((pos, i) => {
        const [x, , z] = position2dTo3d(pos);
        return (
          <mesh key={`meeting-${i}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.4, 0.8, 0.3]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      {detectedDesks && detectedDesks.length > 0 ? (
        detectedDesks.map((pos, i) => (
          <mesh key={`detected-${i}`} position={[pos.x, pos.y, pos.z]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
          </mesh>
        ))
      ) : (
        <mesh position={[15, 3, -17]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={1} />
        </mesh>
      )}
    </>
  );
}

const MEETING_TABLE_CENTERS_2D = [
  { x: ZONES.meeting.x + ZONES.meeting.width / 2, y: ZONES.meeting.y + ZONES.meeting.height / 2 },
  {
    x: ZONES.meeting.x + ZONES.meeting.width * 0.25,
    y: ZONES.meeting.y + ZONES.meeting.height * 0.3,
  },
  {
    x: ZONES.meeting.x + ZONES.meeting.width * 0.75,
    y: ZONES.meeting.y + ZONES.meeting.height * 0.7,
  },
];

function MeetingLabels() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);

  const groups = useMemo(() => detectMeetingGroups(links, agents), [links, agents]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      {groups.map((group, i) => {
        const center = MEETING_TABLE_CENTERS_2D[i % MEETING_TABLE_CENTERS_2D.length];
        const [cx, , cz] = position2dTo3d(center);
        const names = group.agentIds.map((id) => agents.get(id)?.name ?? id.slice(0, 6)).join(", ");

        return (
          <Html
            key={group.sessionKey}
            position={[cx, 2, cz]}
            center
            transform={false}
            style={{ pointerEvents: "none" }}
          >
            <div className="pointer-events-none rounded bg-blue-600/80 px-2 py-1 text-[10px] text-white shadow whitespace-nowrap">
              {names}
            </div>
          </Html>
        );
      })}
    </>
  );
}

function BackgroundSync() {
  const theme = useOfficeStore((s) => s.theme);
  const { gl } = useThree();
  const colorRef = useRef(new THREE.Color(theme === "light" ? BG_LIGHT : BG_DARK));

  useEffect(() => {
    gl.setClearColor(colorRef.current);
  }, [gl]);

  useFrame(() => {
    const target = theme === "light" ? BG_LIGHT : BG_DARK;
    colorRef.current.lerp(target, 0.05);
    gl.setClearColor(colorRef.current);
  });

  return null;
}

function SceneContent() {
  const agents = useOfficeStore((s) => s.agents);
  const theme = useOfficeStore((s) => s.theme);
  const bloomEnabled = useOfficeStore((s) => s.bloomEnabled);
  const agentList = Array.from(agents.values());
  const [deskPositions, setDeskPositions] = useState<THREE.Vector3[]>([]);

  return (
    <>
      <BackgroundSync />
      <OrbitControls
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        minPolarAngle={Math.PI / 12}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={120}
        target={SCENE_CENTER}
        enableDamping
        dampingFactor={0.08}
      />
      <Environment3D theme={theme} />
      <group position={[0, 4, 0]}>
          <Suspense fallback={null}>
          <SunsetIsland />
          <OfficePlatform />
          <IsometricOffice onDeskPositionsFound={setDeskPositions} />
          <ZoneMarkers />
          <DeskDebugMarkers detectedDesks={deskPositions} />
          <Preload all />
        </Suspense>
        {/* Old office hidden - using isometric model instead */}
        {/* <OfficeLayout3D /> */}
        {agentList.map((agent) => (
          <AgentCharacter key={agent.id} agent={agent} />
        ))}
        {agentList
          .filter((a) => a.isSubAgent && a.parentAgentId)
          .map((child) => {
            const parent = agents.get(child.parentAgentId!);
            if (!parent) {
              return null;
            }
            return <ParentChildLine key={`line-${child.id}`} parent={parent} child={child} />;
          })}
        <MeetingLabels />
      </group>
      {bloomEnabled && (
        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.6} luminanceSmoothing={0.4} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

export default function Scene3D() {
  return (
    <div className="h-full w-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        shadows
        camera={{
          fov: 42,
          position: [22, 10, 22],
          near: 0.1,
          far: 200,
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
