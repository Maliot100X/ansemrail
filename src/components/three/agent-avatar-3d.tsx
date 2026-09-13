"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { agentPalette, seededRandom } from "@/lib/agent-seed";

function AvatarScene({
  seed,
  status,
  reduced,
}: {
  seed: string;
  status?: string;
  reduced: boolean;
}) {
  const palette = useMemo(() => agentPalette(seed, status), [seed, status]);
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const rand = seededRandom(seed || "ansem-avatar");
    const count = 380;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 1.9 + rand() * 0.95;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      array[i * 3 + 2] = radius * Math.cos(phi);
    }
    return array;
  }, [seed]);

  const primary = useMemo(() => new THREE.Color(palette.primary), [palette.primary]);
  const secondary = useMemo(() => new THREE.Color(palette.secondary), [palette.secondary]);
  const glow = useMemo(() => new THREE.Color(palette.glow), [palette.glow]);

  useFrame((state, delta) => {
    if (reduced) return;
    const elapsed = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.14;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        state.pointer.y * 0.28,
        0.045,
      );
    }
    if (core.current) {
      core.current.rotation.y += delta * 0.42;
      core.current.rotation.x += delta * 0.16;
      core.current.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.04);
    }
    if (wire.current) {
      wire.current.rotation.y -= delta * 0.5;
      wire.current.rotation.z += delta * 0.22;
    }
    if (rings.current) {
      rings.current.rotation.z += delta * 0.2;
    }
    if (particles.current) {
      particles.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={group} rotation={[0, 0.45, 0]}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[0, 3, 3]} intensity={1.2} />
      <pointLight position={[3, 2, 4]} intensity={26} color={secondary} />
      <pointLight position={[-3, -1, 3]} intensity={18} color={glow} />

      <mesh ref={core}>
        <icosahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial
          color={primary}
          metalness={0.82}
          roughness={0.22}
          emissive={glow}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.08, 1]} />
        <meshBasicMaterial color={secondary} wireframe transparent opacity={0.26} />
      </mesh>

      <group ref={rings} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <mesh rotation={[0.4, 0, 0]}>
          <torusGeometry args={[1.5, 0.016, 8, 110]} />
          <meshBasicMaterial color={primary} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[-0.55, 0.5, 0.2]}>
          <torusGeometry args={[1.86, 0.011, 8, 110]} />
          <meshBasicMaterial color={secondary} transparent opacity={0.34} />
        </mesh>
      </group>

      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={secondary}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export function AgentAvatar3D({
  seed,
  status,
}: {
  seed: string;
  status?: string;
}) {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : "always"}
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x050507, 0)}
    >
      <AvatarScene seed={seed} status={status} reduced={reduced} />
    </Canvas>
  );
}
