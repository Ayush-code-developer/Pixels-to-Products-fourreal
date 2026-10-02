"use client";

import { useState } from "react";
import Shell from "@/components/studio/shell";
import BeforeAfter from "@/components/studio/before-after";
import ResultCard from "@/components/studio/result-card";
import {
  STYLES,
  SIZES,
  cdn,
  uploadImage,
  type StyleId,
} from "@/lib/cloudinary";

export default function Studio() {
  const [id, setId] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleId>("white");
  const [prompt, setPrompt] = useState(
    "marble countertop, soft morning light"
  );
  const [applied, setApplied] = useState(prompt);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return setErr("Choose a JPG, PNG or WebP image.");
    }

    setErr("");
    setBusy(true);

    try {
      setId(await uploadImage(file));
    } catch {
      setErr(
        "Upload failed. Check your cloud name and unsigned upload preset in .env.local."
      );
    }

    setBusy(false);
  }

  const active = STYLES.find((s) => s.id === style)!;
  const chain = active.chain(applied);

  return (
    <Shell>
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="max-w-2xl text-5xl font-medium leading-[1.05] tracking-[-0.05em] sm:text-6xl">
            One photo in.{" "}
            <em className="font-[family-name:var(--font-serif)] font-normal text-[#4a72e7]">
              A full listing out.
            </em>
          </h1>

          <p className="mt-5 max-w-md text-[#7a87aa]">
            Upload a product photo from your phone, pick a look, and download
            ready-to-post images in every size.
          </p>
        </div>

        {/* Orbit Studio tools */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/face"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#dce5fa] bg-white px-5 py-3 text-sm font-medium text-[#080e2b] shadow-[0_8px_30px_#183c7310] transition hover:-translate-y-0.5 hover:border-[#4773ec] hover:text-[#4773ec] hover:shadow-[0_12px_35px_#4773ec18]"
          >
            <span>Face Analysis</span>
            <span className="ml-2 text-[#4773ec]">→</span>
          </a>

          <a
            href="/box"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#dce5fa] bg-white px-5 py-3 text-sm font-medium text-[#080e2b] shadow-[0_8px_30px_#183c7310] transition hover:-translate-y-0.5 hover:border-[#4773ec] hover:text-[#4773ec] hover:shadow-[0_12px_35px_#4773ec18]"
          >
            <span>Box to 3D</span>
            <span className="ml-2 text-[#4773ec]">→</span>
          </a>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col gap-8">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFile(e.dataTransfer.files[0]);
            }}
            className={`grid cursor-pointer place-items-center rounded-3xl border border-dashed px-6 py-10 text-center transition focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#4776ee] ${
              drag
                ? "border-[#4773ec] bg-[#eef3ff]"
                : "border-[#bccbee] bg-white/60 hover:bg-white"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />

            <span className="font-medium">
              {busy
                ? "Uploading…"
                : id
                  ? "Replace photo"
                  : "Add a product photo"}
            </span>

            <span className="mt-1 text-sm text-[#7a87aa]">
              Drop it here or tap to choose
            </span>
          </label>

          {err && (
            <p role="alert" className="text-sm text-[#c2410c]">
              {err}
            </p>
          )}

          <fieldset
            disabled={!id}
            className="flex flex-col gap-3 disabled:opacity-50"
          >
            <legend className="mb-1 text-sm font-medium">
              Choose a look
            </legend>

            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                aria-pressed={style === s.id}
                className={`rounded-2xl border px-5 py-4 text-left transition ${
                  style === s.id
                    ? "border-[#4773ec] bg-white shadow-[0_8px_30px_#4773ec1f]"
                    : "border-[#dce5fa] bg-white/60 hover:bg-white"
                }`}
              >
                <span className="block font-medium">{s.label}</span>
                <span className="text-sm text-[#7a87aa]">{s.hint}</span>
              </button>
            ))}

            {style === "scene" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="scene" className="text-sm text-[#4d5a83]">
                  Describe the scene
                </label>

                <input
                  id="scene"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="rounded-xl border border-[#dce5fa] bg-white px-4 py-3 text-sm outline-none focus:border-[#4773ec]"
                />

                <button
                  onClick={() => setApplied(prompt)}
                  className="self-start rounded-full bg-[#4773ec] px-5 py-2.5 text-sm text-white hover:bg-[#345fda]"
                >
                  Generate scene
                </button>
              </div>
            )}
          </fieldset>
        </section>

        <section>
          {id ? (
            <BeforeAfter
              key={cdn.styled(id, chain)}
              before={cdn.original(id)}
              after={cdn.styled(id, chain)}
            />
          ) : (
            <div className="grid aspect-square place-items-center rounded-3xl border border-[#dce5fa] bg-white/50 p-8 text-center text-[#7a87aa]">
              Your edited photo appears here, with a slider to compare it to
              the original.
            </div>
          )}
        </section>
      </div>

      {id && (
        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-medium tracking-[-0.04em]">
              Every size you need
            </h2>

            <a
              href={cdn.styled(id, chain, true)}
              className="rounded-full bg-[#4773ec] px-6 py-3 text-sm text-white hover:bg-[#345fda]"
            >
              Download {active.label.toLowerCase()} image
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {SIZES.map((s) => (
              <ResultCard
                key={s.id}
                src={cdn.sized(id, s.w, s.h)}
                downloadHref={cdn.sized(id, s.w, s.h, true)}
                label={s.label}
                note={s.note}
                ratio={`${s.w} / ${s.h}`}
              />
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}