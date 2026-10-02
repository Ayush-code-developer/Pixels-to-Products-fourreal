"use client";
import { useState } from "react";

export default function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [loaded, setLoaded] = useState(false);
  const [tries, setTries] = useState(0);
  const afterSrc = tries ? `${after}${after.includes("?") ? "&" : "?"}_r=${tries}` : after;

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-3xl border border-[#dce5fa] bg-white shadow-[0_25px_80px_#183c7314]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={tries} src={afterSrc} alt="Edited" className="absolute inset-0 h-full w-full object-contain" onLoad={() => setLoaded(true)} onError={() => tries < 8 && setTimeout(() => setTries((t) => t + 1), 2500)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="Original" className="absolute inset-0 h-full w-full bg-[#eef3fc] object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white shadow" style={{ left: `${pos}%` }} />
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Compare original and edited" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs text-[#4d5a83]">Original</span>
      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs text-[#4d5a83]">{loaded ? "Edited" : "Creating…"}</span>
    </div>
  );
}