"use client";

import { useRef, useState } from "react";
import type { Pt } from "../../lib/warp";

export const defaultQuad = (): Pt[] => [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.85 },
  { x: 0.15, y: 0.85 },
];

const LABELS = ["TL", "TR", "BR", "BL"];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Props = {
  src: string;
  quad: Pt[];
  onChange: (quad: Pt[]) => void;
};

export default function CornerPicker({ src, quad, onChange }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  const [ratio, setRatio] = useState(1);

  const move = (e: React.PointerEvent) => {
    const i = dragging.current;
    const el = box.current;
    if (i === null || !el) return;

    const r = el.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const y = clamp01((e.clientY - r.top) / r.height);

    onChange(quad.map((p, k) => (k === i ? { x, y } : p)));
  };

  const points = quad.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");

  return (
    <div
      ref={box}
      className="relative mx-auto max-h-[420px] w-full select-none overflow-hidden rounded-2xl border border-[#dce5fa] bg-[#eef3fc]"
      style={{ aspectRatio: ratio, touchAction: "none" }}
      onPointerMove={move}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Box photo"
        draggable={false}
        className="absolute inset-0 h-full w-full"
        onLoad={(e) =>
          setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
        }
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <polygon
          points={points}
          fill="rgba(71,115,236,0.14)"
          stroke="#4773ec"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {quad.map((p, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Corner ${LABELS[i]}`}
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#4773ec] text-[9px] font-semibold text-white shadow-lg active:cursor-grabbing"
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, touchAction: "none" }}
          onPointerDown={(e) => {
            dragging.current = i;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
        >
          {LABELS[i]}
        </button>
      ))}
    </div>
  );
}