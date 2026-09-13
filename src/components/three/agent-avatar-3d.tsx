"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { agentPalette, seededRandom } from "@/lib/agent-seed";

const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

function AvatarScene({
  seed,
  status,
  reduced,
  hovered,
}: {
  seed: string;
  status?: string;
  reduced: boolean;
  hovered: boolean;
}) {
  const palette = useMemo(() => agentPalette(seed, status), [seed, status]);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);
  const shockMat = useRef<THREE.MeshBasicMaterial>(null);
  const shellA = useRef<THREE.Points>(null);
  const shellB = useRef<THREE.Points>(null);
  const phase = useRef(0);

  const primary = useMemo(() => new THREE.Color(palette.primary), [palette.primary]);
  const secondary = useMemo(() => new THREE.Color(palette.secondary), [palette.secondary]);
  const glow = useMemo(() => new THREE.Color(palette.glow), [palette.glow]);

  const shells = useMemo(() => {
    const rand = seededRandom(seed || "ansem-avatar");
    const makeShell = (count: number, min: number, max: number) => {
      const array = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const radius = min + rand() * (max - min);
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        array[i * 3 + 2] = radius * Math.cos(phi);
      }
      return array;
    };
    return {
      a: makeShell(240, 1.85, 2.35),
      b: makeShell(150, 2.4, 2.95),
    };
  }, [seed]);

  useFrame((state, delta) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const boost = hovered ? 1.85 : 1;

    if (outer.current) {
      outer.current.rotation.y = THREE.MathUtils.lerp(
        outer.current.rotation.y,
        state.pointer.x * 0.55,
        0.05,
      );
      outer.current.rotation.x = THREE.MathUtils.lerp(
        outer.current.rotation.x,
        state.pointer.y * 0.34,
        0.05,
      );
    }
    if (inner.current) {
      inner.current.rotation.y += delta * 0.16 * palette.speed * boost;
      inner.current.rotation.x += delta * 0.05 * palette.speed;
    }
    if (core.current) {
      core.current.rotation.y += delta * 0.42 * boost;
      core.current.rotation.x += delta * 0.16;
      core.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04);
    }
    if (wire.current) {
      wire.current.rotation.y -= delta * 0.5 * boost;
      wire.current.rotation.z += delta * 0.22;
    }
    if (rings.current) {
      rings.current.rotation.z += delta * 0.2;
    }
    if (shock.current && shockMat.current) {
      phase.current += delta * 0.5 * palette.speed;
      const p = phase.current % 1;
      shock.current.scale.setScalar(1 + p * 1.4);
      shockMat.current.opacity = 0.34 * (1 - p) * (hovered ? 1.6 : 1);
    }
    if (shellA.current) shellA.current.rotation.y += delta * 0.07;
    if (shellB.current) shellB.current.rotation.y -= delta * 0.045;
  });

  return (
    <group ref={outer}>
      <group ref={inner} rotation={[0, 0.45, 0]}>
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

        <mesh>
          <icosahedronGeometry args={[1.02, 1]} />
          <shaderMaterial
            vertexShader={RIM_VERTEX}
            fragmentShader={RIM_FRAGMENT}
            uniforms-uColor-value={glow}
            uniforms-uIntensity-value={0.85}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
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

        <mesh ref={shock} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4, 0.012, 8, 96]} />
          <meshBasicMaterial
            ref={shockMat}
            color={glow}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        <points ref={shellA}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[shells.a, 3]} />
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
        <points ref={shellB}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[shells.b, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.022}
            color={glow}
            transparent
            opacity={0.5}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
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
  const [hovered, setHovered] = useState(false);
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={reduced ? "demand" : "always"}
        camera={{ position: [0, 0, 5.4], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x050507, 0)}
      >
        <AvatarScene seed={seed} status={status} reduced={reduced} hovered={hovered} />
      </Canvas>
    </div>
  );
}
