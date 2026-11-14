import { ContactShadows, Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

function usePoleTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fbf5e9";
    context.fillRect(0, 0, 512, 512);

    context.save();
    context.translate(256, 256);
    context.rotate(-Math.PI / 4);
    for (let x = -1100; x < 1100; x += 192) {
      context.fillStyle = "#d63b2a";
      context.fillRect(x, -1100, 64, 2200);
      context.fillStyle = "#2447c9";
      context.fillRect(x + 64, -1100, 64, 2200);
    }
    context.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function ChromeMaterial() {
  return <meshStandardMaterial color="#d8d2c4" metalness={1} roughness={0.16} />;
}

function BarberPole() {
  const texture = usePoleTexture();
  const pole = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (pole.current) pole.current.rotation.y += delta * 0.55;
  });

  return (
    <group ref={pole} rotation={[0.06, 0, 0.05]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.6, 0.6, 2.65, 64, 1, false]} />
        <meshPhysicalMaterial
          map={texture}
          clearcoat={1}
          clearcoatRoughness={0.12}
          roughness={0.24}
          metalness={0.08}
        />
      </mesh>

      {[1.4, -1.4].map(y => (
        <group key={y} position={[0, y, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.7, 0.14, 48]} />
            <ChromeMaterial />
          </mesh>
          <mesh position={[0, y > 0 ? 0.16 : -0.16, 0]} castShadow>
            <sphereGeometry args={[0.2, 32, 32]} />
            <ChromeMaterial />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[0, -1.72, 0]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <ChromeMaterial />
      </mesh>
    </group>
  );
}

function Scissors() {
  const blade = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.5, 0.2, 0.98, 0.44, 1.28);
    shape.bezierCurveTo(0.32, 0.72, 0.18, 0.26, 0.1, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      steps: 1,
    });
  }, []);

  return (
    <group>
      <mesh geometry={blade} rotation={[0, 0, 0.2]} castShadow>
        <meshStandardMaterial color="#e6e0d3" metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh geometry={blade} rotation={[0, 0, -0.2]} position={[0, 0, 0.055]} castShadow>
        <meshStandardMaterial color="#e6e0d3" metalness={0.95} roughness={0.18} />
      </mesh>

      <mesh position={[-0.22, -0.3, 0.03]} rotation={[0, 0, 0.2]} castShadow>
        <torusGeometry args={[0.17, 0.04, 16, 36]} />
        <meshStandardMaterial color="#d63b2a" metalness={0.35} roughness={0.24} />
      </mesh>
      <mesh position={[0.22, -0.3, 0.03]} rotation={[0, 0, -0.2]} castShadow>
        <torusGeometry args={[0.17, 0.04, 16, 36]} />
        <meshStandardMaterial color="#d63b2a" metalness={0.35} roughness={0.24} />
      </mesh>

      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.14, 24]} />
        <ChromeMaterial />
      </mesh>
    </group>
  );
}

function Razor() {
  return (
    <group>
      <mesh position={[0, -0.34, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.5, 8, 20]} />
        <meshPhysicalMaterial color="#2447c9" roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, 0.4, 0.01]} rotation={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[0.48, 0.86, 0.035]} />
        <meshStandardMaterial color="#e9e3d6" metalness={0.95} roughness={0.14} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 20]} />
        <ChromeMaterial />
      </mesh>
    </group>
  );
}

function Comb() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.25, 0.18, 0.1]} />
        <meshPhysicalMaterial color="#2447c9" roughness={0.3} clearcoat={0.6} />
      </mesh>
      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} position={[-0.55 + index * 0.11, -0.12, 0]} castShadow>
          <boxGeometry args={[0.055, 0.5, 0.075]} />
          <meshPhysicalMaterial color="#2447c9" roughness={0.3} clearcoat={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Spark({ position, color, scale = 0.08 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <Float speed={2.2} rotationIntensity={1.4} floatIntensity={1.6}>
      <mesh position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
    </Float>
  );
}

function SceneContent() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll.current = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const ease = 1 - Math.exp(-3.2 * delta);
    const targetY = pointer.current.x * 0.32 + scroll.current * 0.55;
    const targetX = -pointer.current.y * 0.14 + scroll.current * 0.16;
    group.current.rotation.y += (targetY - group.current.rotation.y) * ease;
    group.current.rotation.x += (targetX - group.current.rotation.x) * ease;
    group.current.position.y += (-scroll.current * 0.55 - group.current.position.y) * ease;
  });

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <pointLight position={[-4, 1.5, 4]} intensity={22} distance={12} color="#ff6a52" />
      <pointLight position={[4, -1.5, 3]} intensity={18} distance={12} color="#4b6dff" />
      <spotLight position={[0, 5, 3]} angle={0.7} penumbra={0.9} intensity={1.4} color="#fff5e0" />

      <group ref={group} position={[0, 0, 0]}>
        <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.45}>
          <BarberPole />
        </Float>

        <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.1}>
          <group position={[-2.25, 1.05, 0.45]} rotation={[0.15, -0.4, 0.32]} scale={0.78}>
            <Scissors />
          </group>
        </Float>

        <Float speed={1.4} rotationIntensity={0.45} floatIntensity={1} >
          <group position={[2.25, 1.15, 0.2]} rotation={[0.1, 0.35, -0.35]} scale={0.85}>
            <Razor />
          </group>
        </Float>

        <Float speed={1.8} rotationIntensity={0.4} floatIntensity={1.2}>
          <group position={[1.95, -1.55, 0.35]} rotation={[0.12, 0.45, 0.45]} scale={0.8}>
            <Comb />
          </group>
        </Float>

        <Spark position={[-2.9, -0.9, 0.1]} color="#d63b2a" scale={0.07} />
        <Spark position={[2.85, -0.2, 0.2]} color="#2447c9" scale={0.06} />
        <Spark position={[-1.65, 2.15, -0.3]} color="#e6a23c" scale={0.055} />
        <Spark position={[1.35, 2.35, -0.2]} color="#d63b2a" scale={0.045} />
      </group>

      <ContactShadows position={[0, -2.15, 0]} opacity={0.18} scale={9} blur={2.8} far={5} color="#3a2e20" />
    </>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? true), {
      rootMargin: "120px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className={cn("h-full w-full", className)} aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 7], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
