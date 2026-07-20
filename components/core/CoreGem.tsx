"use client";

/**
 * The Conductor's Gem — MAESTRO's real-3D core.
 *
 * A living icosahedral gem: organic surface distortion (breathing, thinking),
 * a slowly counter-rotating wireframe lattice (the score it conducts from),
 * and an orbiting particle field. The material continuously lerps toward the
 * ACTIVE AGENT's color, so selecting an agent re-lights the whole gem in one
 * smooth breath — same motion language as the page's `--agent` theme engine.
 *
 * Performance & respect:
 * - DPR capped at 2, single canvas, transform-only motion (GPU).
 * - `reduced` freezes distortion/rotation/sparkles but keeps the lit gem.
 * - No network assets (no HDR environment) — lights only, loads instantly.
 */

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/** The gem canvas is a fixed square (see OrchestratorCore) — px, not fluid. */
export const GEM_CANVAS_PX = 250;

/**
 * Deterministic sizing: the canvas mounts inside a dynamic-import boundary
 * where the resize-observer measurement can miss the initial layout entirely
 * (observed live: canvas stuck at the 300×150 default). The container is a
 * fixed square by design, so we set the renderer size explicitly — correct in
 * every environment, observer or not.
 */
function FixedSize() {
  const setSize = useThree((s) => s.setSize);
  useEffect(() => {
    setSize(GEM_CANVAS_PX, GEM_CANVAS_PX);
  }, [setSize]);
  return null;
}

interface GemProps {
  colorHex: string;
  deepHex: string;
  reduced: boolean;
}

function Gem({ colorHex, deepHex, reduced }: GemProps) {
  const group = useRef<THREE.Group>(null);
  const lattice = useRef<THREE.Mesh>(null);
  // drei's distort material type isn't exported cleanly — we only touch .color/.emissive.
  const mat = useRef<any>(null);
  const light = useRef<THREE.PointLight>(null);
  const targetColor = useRef(new THREE.Color(colorHex));
  const targetDeep = useRef(new THREE.Color(deepHex));
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetColor.current.set(colorHex);
    targetDeep.current.set(deepHex);
  }, [colorHex, deepHex]);

  // Page-wide cursor parallax (the canvas itself is pointer-events: none).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    // Frame-rate independent smoothing.
    const t = 1 - Math.pow(0.0001, delta);
    if (mat.current) {
      mat.current.color.lerp(targetColor.current, t * 0.6);
      mat.current.emissive.lerp(targetDeep.current, t * 0.6);
    }
    if (light.current) light.current.color.lerp(targetColor.current, t * 0.6);
    if (reduced) return;
    if (group.current) {
      group.current.rotation.y +=
        (pointer.current.x * 0.45 - group.current.rotation.y) * t;
      group.current.rotation.x +=
        (pointer.current.y * 0.28 - group.current.rotation.x) * t;
    }
    if (lattice.current) {
      lattice.current.rotation.y -= delta * 0.1;
      lattice.current.rotation.z += delta * 0.04;
    }
  });

  return (
    <group ref={group}>
      {/* Ivory-room lighting: soft key, cool fill, agent-colored heart. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#c7d2fe" />
      <pointLight ref={light} position={[0, 0.4, 1.6]} intensity={2.2} distance={6} color={colorHex} />

      <Float
        speed={reduced ? 0 : 1.3}
        rotationIntensity={reduced ? 0 : 0.4}
        floatIntensity={reduced ? 0 : 0.45}
      >
        {/* The gem — organic distortion = "thinking". */}
        <mesh>
          <icosahedronGeometry args={[1.32, 4]} />
          <MeshDistortMaterial
            ref={mat}
            color={colorHex}
            emissive={deepHex}
            emissiveIntensity={0.28}
            roughness={0.14}
            metalness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.18}
            distort={reduced ? 0 : 0.34}
            speed={reduced ? 0 : 1.5}
          />
        </mesh>

        {/* The lattice — the score it conducts from. */}
        <mesh ref={lattice} scale={1.5}>
          <icosahedronGeometry args={[1.32, 1]} />
          <meshBasicMaterial wireframe color={colorHex} transparent opacity={0.16} />
        </mesh>
      </Float>

      {/* Orbiting thought-particles. */}
      <Sparkles
        count={reduced ? 0 : 42}
        scale={5}
        size={2.6}
        speed={reduced ? 0 : 0.32}
        color={colorHex}
        opacity={0.55}
      />
    </group>
  );
}

export function CoreGem(props: GemProps) {
  // R3F sizes the drawing buffer from a ResizeObserver on its container. In
  // some embedded/webview browsers that observer doesn't fire its initial
  // callback, leaving the canvas stuck at the 300×150 default. react-use-measure
  // also recomputes on window "resize", so we nudge it a few times right after
  // mount — cheap, idempotent, and invisible when the observer already worked.
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [60, 200, 600].map((ms) => setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        // Keeps the rendered frame readable after compositing — lets the gem be
        // screenshotted/recorded (portfolio) at negligible cost for one canvas.
        preserveDrawingBuffer: true,
      }}
      // Zero-debounce measure: the canvas mounts inside a dynamic-import
      // boundary and the default debounced measurement can miss the initial
      // layout, leaving the canvas at its 300×150 default.
      resize={{ scroll: false, debounce: 0 }}
      style={{ width: "100%", height: "100%", display: "block" }}
      onCreated={(state) => {
        // Verification hook (harmless in prod): lets an automated check force a
        // single manual render in environments where the tab is backgrounded
        // and requestAnimationFrame is frozen.
        if (typeof window !== "undefined") {
          (window as any).__gemRender = () =>
            state.gl.render(state.scene, state.camera);
        }
      }}
      aria-hidden
    >
      <FixedSize />
      <Gem {...props} />
    </Canvas>
  );
}

export default CoreGem;
