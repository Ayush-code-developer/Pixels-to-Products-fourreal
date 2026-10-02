"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type FaceId = "front" | "back" | "left" | "right" | "top" | "bottom";
export type Dims = { w: number; h: number; d: number };
export type Faces = Partial<Record<FaceId, HTMLCanvasElement>>;

// BoxGeometry material order: +x, -x, +y, -y, +z, -z
const ORDER: FaceId[] = ["right", "left", "top", "bottom", "front", "back"];

type View = { rx: number; ry: number; dragging: boolean };

type SceneProps = {
  faces: Faces;
  dims: Dims;
  fallback: string;
  view: { current: View };
  exportRef: { current: THREE.Object3D | null };
};

function BoxScene({ faces, dims, fallback, view, exportRef }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);

  // One material per face; faces without a photo get the fallback color
  const materials = useMemo(
    () =>
      ORDER.map((id) => {
        const canvas = faces[id];
        if (!canvas) {
          return new THREE.MeshStandardMaterial({ color: fallback, roughness: 0.7 });
        }
        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        map.needsUpdate = true;
        return new THREE.MeshStandardMaterial({ map, roughness: 0.6 });
      }),
    [faces, fallback]
  );

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  const size = useMemo<[number, number, number]>(() => {
    const m = Math.max(dims.w, dims.h, dims.d, 1);
    return [(dims.w / m) * 2.4, (dims.h / m) * 2.4, (dims.d / m) * 2.4];
  }, [dims]);

  useEffect(() => {
    exportRef.current = mesh.current;
    return () => {
      exportRef.current = null;
    };
  }, [exportRef, size]);

  useFrame((_, delta) => {
    const v = view.current;
    if (!v.dragging) {
      v.ry += 0.45 * delta; // idle spin
      v.rx += (-0.25 - v.rx) * (1 - Math.exp(-3 * delta)); // settle the tilt
    }
    if (group.current) {
      group.current.rotation.x = v.rx;
      group.current.rotation.y = v.ry;
    }
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#b8ccff" />

      <group ref={group}>
        <mesh ref={mesh} material={materials}>
          <boxGeometry args={size} />
        </mesh>
      </group>
    </>
  );
}

type Props = {
  faces: Faces;
  dims: Dims;
  fallback: string;
  exportRef: { current: THREE.Object3D | null };
};

export default function BoxViewer({ faces, dims, fallback, exportRef }: Props) {
  const view = useRef<View>({ rx: -0.25, ry: 0.6, dragging: false });
  const last = useRef({ x: 0, y: 0 });

  return (
    <div
      className="relative aspect-square w-full cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        view.current.dragging = true;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!view.current.dragging) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };

        view.current.ry += dx * 0.01;
        view.current.rx = Math.max(-1.3, Math.min(1.3, view.current.rx + dy * 0.01));
      }}
      onPointerUp={() => (view.current.dragging = false)}
      onPointerCancel={() => (view.current.dragging = false)}
    >
      {/* Soft floor shadow */}
      <div className="pointer-events-none absolute bottom-[12%] left-1/2 h-[7%] w-[50%] -translate-x-1/2 rounded-full bg-[#183c73]/25 blur-2xl" />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <BoxScene
          faces={faces}
          dims={dims}
          fallback={fallback}
          view={view}
          exportRef={exportRef}
        />
      </Canvas>
    </div>
  );
}