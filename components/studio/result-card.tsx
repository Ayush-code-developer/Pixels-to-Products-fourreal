"use client";
import { useEffect, useState } from "react";

// AI transforms render lazily on first request, so retry the image until it resolves.
export default function ResultCard({ src, downloadHref, label, note, ratio = "1 / 1" }: {
  src: string; downloadHref: string; label: string; note?: string; ratio?: string;
}) {
  const [tries, setTries] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setTries(0); setLoaded(false); setFailed(false); }, [src]);

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-[#dce5fa] bg-white" style={{ aspectRatio: ratio }}>
        {!loaded && !failed && (
          <div className="absolute inset-0 grid place-items-center text-xs text-[#8197c4]">
            <span className="mb-8 h-4 w-4 animate-spin rounded-full border border-[#d8e3ff] border-t-[#648cf0]" />
            <span className="absolute mt-8">Creating your image…</span>
          </div>
        )}
        {failed && <p className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-[#7a87aa]">This size isn't available for this photo. Try another look.</p>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={tries}
          src={tries ? `${src}${src.includes("?") ? "&" : "?"}_r=${tries}` : src}
          alt={label}
          className={`h-full w-full object-contain transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => (tries < 8 ? setTimeout(() => setTries((t) => t + 1), 2500) : setFailed(true))}
        />
      </div>
      <figcaption className="flex items-center justify-between gap-3 text-sm">
        <span><span className="font-medium">{label}</span>{note && <span className="block text-xs text-[#7a87aa]">{note}</span>}</span>
        {loaded && <a href={downloadHref} className="rounded-full border border-[#c9d7f7] px-4 py-2 text-[#4574ec] transition hover:bg-[#4773ec] hover:text-white">Download</a>}
      </figcaption>
    </figure>
  );
}