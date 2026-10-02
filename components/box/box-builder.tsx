"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { warpQuad, type Pt } from "../../lib/warp";
import CornerPicker, { defaultQuad } from "./corner-picker";
import BoxViewer, { type Dims, type FaceId, type Faces } from "./box-viewer";

type Slot = {
  url: string;
  img: HTMLImageElement;
  quad: Pt[];
  canvas?: HTMLCanvasElement;
};

const FACES: { id: FaceId; label: string; hint: string }[] = [
  { id: "front", label: "Front", hint: "Tap the four corners of the front face." },
  { id: "back", label: "Back", hint: "Tap the four corners of the back face." },
  { id: "left", label: "Left", hint: "The side on your left when you face the front." },
  { id: "right", label: "Right", hint: "The side on your right when you face the front." },
  {
    id: "top",
    label: "Top",
    hint: "The bottom edge of the corners should be the edge nearest the front.",
  },
  {
    id: "bottom",
    label: "Bottom",
    hint: "The top edge of the corners should be the edge nearest the front.",
  },
];

/** Output texture size for a face, matching the real box proportions. */
function faceSize(id: FaceId, d: Dims): [number, number] {
  const [a, b] =
    id === "front" || id === "back"
      ? [d.w, d.h]
      : id === "left" || id === "right"
        ? [d.d, d.h]
        : [d.w, d.d];

  const k = 768 / Math.max(a, b, 1);
  return [Math.max(16, Math.round(a * k)), Math.max(16, Math.round(b * k))];
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

export default function BoxBuilder() {
  const [dims, setDims] = useState<Dims>({ w: 10, h: 15, d: 6 });
  const [fallback, setFallback] = useState("#e9eefb");
  const [active, setActive] = useState<FaceId>("front");
  const [slots, setSlots] = useState<Partial<Record<FaceId, Slot>>>({});

  const fileInput = useRef<HTMLInputElement>(null);
  const exportRef = useRef<THREE.Object3D | null>(null);

  const slot = slots[active];

  // Re-flatten the active face shortly after its corners (or the box size) change
  useEffect(() => {
    if (!slot) return;
    const quad = slot.quad;

    const t = setTimeout(() => {
      const [cw, ch] = faceSize(active, dims);
      let canvas: HTMLCanvasElement;
      try {
        canvas = warpQuad(slot.img, quad, cw, ch);
      } catch {
        return; // corners collapsed into a line; keep the previous texture
      }

      setSlots((prev) => {
        const cur = prev[active];
        if (!cur || cur.quad !== quad) return prev;
        return { ...prev, [active]: { ...cur, canvas } };
      });
    }, 120);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, slot?.quad, slot?.img, dims.w, dims.h, dims.d]);

  const faces = useMemo<Faces>(() => {
    const out: Faces = {};
    for (const f of FACES) {
      const c = slots[f.id]?.canvas;
      if (c) out[f.id] = c;
    }
    return out;
  }, [slots]);

  const addFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);

    setSlots((prev) => {
      if (prev[active]) URL.revokeObjectURL(prev[active]!.url);
      return { ...prev, [active]: { url, img, quad: defaultQuad() } };
    });
  };

  const removeActive = () => {
    setSlots((prev) => {
      const next = { ...prev };
      if (next[active]) URL.revokeObjectURL(next[active]!.url);
      delete next[active];
      return next;
    });
  };

  const setDim = (key: keyof Dims, value: string) => {
    const n = Math.max(1, Math.min(500, Number(value) || 1));
    setDims((d) => ({ ...d, [key]: n }));
  };

  const downloadGlb = () => {
    const obj = exportRef.current;
    if (!obj) return;

    new GLTFExporter().parse(
      obj,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "box.glb";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      },
      (err) => console.error("GLB export failed", err),
      { binary: true }
    );
  };

  const activeInfo = FACES.find((f) => f.id === active)!;
  const filled = Object.keys(faces).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      {/* LEFT: inputs */}
      <div className="space-y-6">
        {/* Face tabs */}
        <div>
          <p className="mb-3 text-sm text-[#4d5a83]">1. Pick a face and add its photo</p>
          <div className="flex flex-wrap gap-2">
            {FACES.map((f) => {
              const done = Boolean(slots[f.id]);
              const on = f.id === active;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    on
                      ? "border-[#4773ec] bg-white text-[#080e2b] shadow-[0_8px_30px_#183c7318]"
                      : "border-[#dce5fa] bg-white/60 text-[#4d5a83] hover:bg-white"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${done ? "bg-[#4773ec]" : "border border-[#bccbee]"}`}
                  />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active face editor */}
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {!slot ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFile(e.dataTransfer.files?.[0]);
              }}
              className="flex h-44 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#bccbee] bg-white/70 text-center transition hover:bg-white"
            >
              <span className="font-medium">Add the {activeInfo.label.toLowerCase()} photo</span>
              <span className="mt-1 text-sm text-[#7a87aa]">Drop it here or tap to choose</span>
            </button>
          ) : (
            <div className="space-y-3">
              <CornerPicker
                src={slot.url}
                quad={slot.quad}
                onChange={(quad) =>
                  setSlots((prev) =>
                    prev[active] ? { ...prev, [active]: { ...prev[active]!, quad } } : prev
                  )
                }
              />
              <p className="text-sm text-[#7a87aa]">{activeInfo.hint}</p>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-full border border-[#dce5fa] bg-white px-4 py-2 text-[#4d5a83] hover:bg-[#f3f7ff]"
                >
                  Replace photo
                </button>
                <button
                  type="button"
                  onClick={removeActive}
                  className="rounded-full border border-[#dce5fa] bg-white px-4 py-2 text-[#4d5a83] hover:bg-[#f3f7ff]"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Size + color */}
        <div>
          <p className="mb-3 text-sm text-[#4d5a83]">2. Box size (any unit, only the ratio matters)</p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["w", "Width"],
                ["h", "Height"],
                ["d", "Depth"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-[#7a87aa]">
                {label}
                <input
                  type="number"
                  min={1}
                  value={dims[key]}
                  onChange={(e) => setDim(key, e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dce5fa] bg-white px-3 py-2 text-base text-[#080e2b] outline-none focus:border-[#4773ec]"
                />
              </label>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-[#7a87aa]">
            Color for faces without a photo
            <input
              type="color"
              value={fallback}
              onChange={(e) => setFallback(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-[#dce5fa] bg-white"
            />
          </label>
        </div>
      </div>

      {/* RIGHT: live preview */}
      <div>
        <div className="rounded-3xl border border-[#dce5fa] bg-white/70 p-4 shadow-[0_25px_80px_#183c7314]">
          <BoxViewer faces={faces} dims={dims} fallback={fallback} exportRef={exportRef} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[#a4b5d8]">
            {filled === 0 ? "Add a photo to see it on the box." : "Drag to rotate."}
          </p>
          <button
            type="button"
            onClick={downloadGlb}
            disabled={filled === 0}
            className="rounded-full bg-[#4773ec] px-6 py-3 text-sm text-white transition hover:bg-[#345fda] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download 3D file (.glb)
          </button>
        </div>
      </div>
    </div>
  );
}