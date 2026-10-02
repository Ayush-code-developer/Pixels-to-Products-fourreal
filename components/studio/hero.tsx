"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const LOOKS = [
  {
    label: "Clean white",
    swatch: "#ffffff",
    angle: 0,
  },
  {
    label: "Soft shadow",
    swatch: "#cfd8ee",
    angle: 120,
  },
  {
    label: "Lifestyle scene",
    swatch: "#8fb0ff",
    angle: 240,
  },
];

const BASE_SPEED = 0.13;
const FAST_SPEED = 2.8;
const MAX_TILT = 38;
const FLAT = 0.02;
const PLANET_RADIUS = 1.15;
const RING_RX = 46;
const RING_RY = 17;

const STEPS = [
  {
    n: "1",
    title: "Upload",
    text: "Add one product photo from your phone.",
  },
  {
    n: "2",
    title: "Pick a look",
    text: "Clean white, soft shadow, or an AI-made scene.",
  },
  {
    n: "3",
    title: "Download",
    text: "Get square, portrait and story sizes in one go.",
  },
];

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export type HeroInput = {
  px: number;
  py: number;
  scroll: number;
  scrollVel: number;
  kick: number;
};

type Shared = {
  dragging: boolean;
  targetX: number;
  targetY: number;
  spin: number;
};

type SharedRef = {
  current: Shared;
};

type InputRef = {
  current: HeroInput;
};

const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

/* -------------------------------------------------------------------------- */
/*                               PLANET SCENE                                  */
/* -------------------------------------------------------------------------- */

function PlanetScene({
  shared,
  input,
}: {
  shared: SharedRef;
  input: InputRef;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  const speed = useRef(BASE_SPEED);
  const tiltX = useRef(0);
  const tiltY = useRef(0);
  const depth = useRef(0);

  useFrame((_, delta) => {
    const s = shared.current;
    const inp = input.current;

    const k = (rate: number) => 1 - Math.exp(-rate * delta);

    /*
     * Orbit speed:
     * dragging, scrolling and clicking all increase the speed.
     */
    const reaction = Math.max(inp.scrollVel, inp.kick);

    const targetSpeed = s.dragging
      ? FAST_SPEED
      : BASE_SPEED +
        reaction * (FAST_SPEED - BASE_SPEED);

    speed.current = THREE.MathUtils.lerp(
      speed.current,
      targetSpeed,
      k(5)
    );

    s.spin =
      (s.spin + speed.current * delta) %
      (Math.PI * 2);

    /*
     * Drag tilt.
     */
    tiltX.current = THREE.MathUtils.lerp(
      tiltX.current,
      s.targetX,
      k(7)
    );

    tiltY.current = THREE.MathUtils.lerp(
      tiltY.current,
      s.targetY,
      k(7)
    );

    /*
     * 0 = pancake
     * 1 = sphere
     *
     * Dragging, scrolling and clicking can inflate the planet.
     */
    const dragDepth =
      Math.hypot(
        tiltX.current,
        tiltY.current
      ) / MAX_TILT;

    const targetDepth = THREE.MathUtils.clamp(
      Math.max(
        dragDepth,
        inp.scroll,
        inp.kick * 0.8
      ),
      0,
      1
    );

    depth.current = THREE.MathUtils.lerp(
      depth.current,
      targetDepth,
      k(8)
    );

    const eased = THREE.MathUtils.smoothstep(
      depth.current,
      0,
      1
    );

    if (mesh.current) {
      mesh.current.scale.set(
        1,
        1,
        THREE.MathUtils.lerp(
          FLAT,
          1,
          eased
        )
      );

      /*
       * The planet also leans toward the cursor,
       * but only once it becomes 3D.
       */
      mesh.current.rotation.x =
        THREE.MathUtils.degToRad(
          tiltX.current -
            inp.py * 10 * eased
        );

      mesh.current.rotation.y =
        THREE.MathUtils.degToRad(
          tiltY.current +
            inp.px * 10 * eased
        );
    }

    /*
     * Light follows the cursor across the whole page.
     */
    if (light.current) {
      light.current.position.x =
        3 +
        tiltY.current * 0.1 +
        inp.px * 1.5;

      light.current.position.y =
        3 -
        tiltX.current * 0.1 -
        inp.py * 1.5;
    }
  });

  return (
    <>
      <ambientLight intensity={1.15} />

      <pointLight
        ref={light}
        position={[3, 3, 5]}
        intensity={45}
        distance={10}
        decay={2}
        color="#dce6ff"
      />

      <pointLight
        position={[-4, -2, 3]}
        intensity={10}
        distance={8}
        decay={2}
        color="#4773ec"
      />

      <mesh
        ref={mesh}
        scale={[1, 1, FLAT]}
      >
        <sphereGeometry
          args={[PLANET_RADIUS, 96, 96]}
        />

        <meshStandardMaterial
          color="#5a82f0"
          roughness={0.32}
          metalness={0}
        />
      </mesh>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  ORBIT                                      */
/* -------------------------------------------------------------------------- */

function Orbit({
  shared,
}: {
  shared: SharedRef;
}) {
  const labelRefs =
    useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      LOOKS.forEach((look, i) => {
        const el = labelRefs.current[i];

        if (!el) {
          return;
        }

        const a =
          THREE.MathUtils.degToRad(
            look.angle
          ) + shared.current.spin;

        const front = Math.sin(a) > 0;

        el.style.left = `${
          50 + Math.cos(a) * RING_RX
        }%`;

        el.style.top = `${
          50 + Math.sin(a) * RING_RY
        }%`;

        el.style.zIndex = front ? "20" : "0";

        el.style.opacity = front
          ? "1"
          : "0.55";

        el.style.transform =
          `translate(-50%, -50%) scale(${
            front ? 1 : 0.9
          })`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [shared]);

  const ringProps = {
    fill: "none",
    stroke: "#bccbee",
    strokeWidth: 1,
    strokeDasharray: "4 5",
    vectorEffect:
      "non-scaling-stroke" as const,
  };

  const startX = 50 - RING_RX;
  const endX = 50 + RING_RX;

  return (
    <>
      {/* Back half of orbit */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d={`M ${startX} 50 A ${RING_RX} ${RING_RY} 0 0 1 ${endX} 50`}
          {...ringProps}
        />
      </svg>

      {/* Front half of orbit */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        aria-hidden="true"
      >
        <path
          d={`M ${startX} 50 A ${RING_RX} ${RING_RY} 0 0 0 ${endX} 50`}
          {...ringProps}
        />
      </svg>

      {LOOKS.map((look, i) => (
        <div
          key={look.label}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          className="pointer-events-none absolute"
          style={{
            left: "50%",
            top: "50%",
          }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#dce5fa] bg-white/90 px-4 py-2 text-sm text-[#080e2b] shadow-[0_8px_30px_#183c7318] backdrop-blur-sm">
            <span
              className="h-3 w-3 rounded-full border border-[#dce5fa]"
              style={{
                background: look.swatch,
              }}
            />

            {look.label}
          </div>
        </div>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PLANET WRAPPER                                */
/* -------------------------------------------------------------------------- */

function HeroPlanet({
  input,
}: {
  input: InputRef;
}) {
  const container =
    useRef<HTMLDivElement>(null);

  const shared = useRef<Shared>({
    dragging: false,
    targetX: 0,
    targetY: 0,
    spin: 0,
  });

  useEffect(() => {
    const el = container.current;

    if (!el) {
      return;
    }

    const updateTilt = (
      e: PointerEvent
    ) => {
      const rect =
        el.getBoundingClientRect();

      const nx =
        THREE.MathUtils.clamp(
          ((e.clientX - rect.left) /
            rect.width -
            0.5) *
            2,
          -1,
          1
        );

      const ny =
        THREE.MathUtils.clamp(
          ((e.clientY - rect.top) /
            rect.height -
            0.5) *
            2,
          -1,
          1
        );

      shared.current.targetX =
        -ny * MAX_TILT;

      shared.current.targetY =
        nx * MAX_TILT;
    };

    const onDown = (
      e: PointerEvent
    ) => {
      el.setPointerCapture(
        e.pointerId
      );

      shared.current.dragging = true;

      updateTilt(e);
    };

    const onMove = (
      e: PointerEvent
    ) => {
      if (
        shared.current.dragging
      ) {
        updateTilt(e);
      }
    };

    const release = (
      e: PointerEvent
    ) => {
      if (
        el.hasPointerCapture(
          e.pointerId
        )
      ) {
        el.releasePointerCapture(
          e.pointerId
        );
      }

      shared.current.dragging =
        false;

      shared.current.targetX = 0;
      shared.current.targetY = 0;
    };

    el.addEventListener(
      "pointerdown",
      onDown
    );

    el.addEventListener(
      "pointermove",
      onMove
    );

    el.addEventListener(
      "pointerup",
      release
    );

    el.addEventListener(
      "pointercancel",
      release
    );

    return () => {
      el.removeEventListener(
        "pointerdown",
        onDown
      );

      el.removeEventListener(
        "pointermove",
        onMove
      );

      el.removeEventListener(
        "pointerup",
        release
      );

      el.removeEventListener(
        "pointercancel",
        release
      );
    };
  }, []);

  return (
    <div
      ref={container}
      aria-label="Drag to tilt the planet"
      className="relative aspect-square w-full cursor-grab select-none active:cursor-grabbing"
      style={{
        touchAction: "none",
      }}
    >
      <div className="pointer-events-none absolute inset-[27%] translate-y-[8%] rounded-full bg-[#4773ec]/25 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 z-10">
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: [0, 0, 7],
            fov: 35,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference:
              "high-performance",
          }}
        >
          <PlanetScene
            shared={shared}
            input={input}
          />
        </Canvas>
      </div>

      <Orbit shared={shared} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    STEP                                    */
/* -------------------------------------------------------------------------- */

function Step({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref =
    useRef<HTMLLIElement>(null);

  const [seen, setSeen] =
    useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const io =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting
          ) {
            setSeen(true);
            io.disconnect();
          }
        },
        {
          threshold: 0.4,
        }
      );

    io.observe(el);

    return () => {
      io.disconnect();
    };
  }, []);

  return (
    <li
      ref={ref}
      style={{
        transitionDelay: seen
          ? `${index * 40}ms`
          : "0ms",
      }}
      className={`group -m-4 flex gap-4 rounded-2xl p-4 transition-all duration-700 hover:bg-white/80 hover:shadow-[0_12px_40px_#183c7318] ${
        seen
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0"
      }`}
    >
      <span className="font-[family-name:var(--font-serif)] text-3xl text-[#4a72e7] transition-transform duration-300 group-hover:scale-125">
        {step.n}
      </span>

      <span>
        <span className="block font-medium">
          {step.title}
        </span>

        <span className="text-[#7a87aa]">
          {step.text}
        </span>
      </span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    HERO                                    */
/* -------------------------------------------------------------------------- */

export default function Hero() {
  const root =
    useRef<HTMLDivElement>(null);

  const nextId = useRef(0);

  const [ripples, setRipples] =
    useState<Ripple[]>([]);

  /*
   * Shared with the planet.
   *
   * This is mutated every frame and does not
   * cause React renders.
   */
  const input =
    useRef<HeroInput>({
      px: 0,
      py: 0,
      scroll: 0,
      scrollVel: 0,
      kick: 0,
    });

  useEffect(() => {
    const el = root.current;

    if (!el) {
      return;
    }

    const s = input.current;

    let targetX =
      window.innerWidth / 2;

    let targetY =
      window.innerHeight / 2;

    let mx = targetX;
    let my = targetY;

    let lastScrollY =
      window.scrollY;

    let impulse = 0;
    let raf = 0;

    const onMove = (
      e: PointerEvent
    ) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const onScroll = () => {
      const y = window.scrollY;

      impulse += Math.abs(
        y - lastScrollY
      );

      lastScrollY = y;
    };

    /*
     * Any click anywhere:
     * ripple + kick the planet.
     */
    const onDown = (
      e: PointerEvent
    ) => {
      s.kick = 1;

      const id =
        nextId.current++;

      setRipples((r) => [
        ...r.slice(-5),
        {
          id,
          x: e.clientX,
          y: e.clientY,
        },
      ]);

      window.setTimeout(() => {
        setRipples((r) =>
          r.filter(
            (x) => x.id !== id
          )
        );
      }, 1000);
    };

    const tick = () => {
      const vw =
        window.innerWidth;

      const vh =
        window.innerHeight;

      /*
       * Smooth cursor.
       */
      mx +=
        (targetX - mx) * 0.12;

      my +=
        (targetY - my) * 0.12;

      s.px =
        (mx / vw - 0.5) * 2;

      s.py =
        (my / vh - 0.5) * 2;

      /*
       * Scroll position + scroll speed.
       */
      s.scroll = clamp(
        window.scrollY /
          (vh * 0.7),
        0,
        1
      );

      const v = Math.min(
        impulse / 50,
        1
      );

      impulse = 0;

      s.scrollVel +=
        (v - s.scrollVel) *
        0.1;

      /*
       * Click kick fades out.
       */
      s.kick *= 0.95;

      if (s.kick < 0.001) {
        s.kick = 0;
      }

      /*
       * Full-page scroll progress.
       */
      const maxScroll =
        document.documentElement
          .scrollHeight - vh;

      const page =
        maxScroll > 0
          ? window.scrollY /
            maxScroll
          : 0;

      el.style.setProperty(
        "--mx",
        `${mx}px`
      );

      el.style.setProperty(
        "--my",
        `${my}px`
      );

      el.style.setProperty(
        "--px",
        s.px.toFixed(4)
      );

      el.style.setProperty(
        "--py",
        s.py.toFixed(4)
      );

      el.style.setProperty(
        "--sc",
        s.scroll.toFixed(4)
      );

      el.style.setProperty(
        "--pg",
        clamp(
          page,
          0,
          1
        ).toFixed(4)
      );

      raf =
        requestAnimationFrame(
          tick
        );
    };

    window.addEventListener(
      "pointermove",
      onMove
    );

    window.addEventListener(
      "pointerdown",
      onDown
    );

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    raf =
      requestAnimationFrame(
        tick
      );

    return () => {
      cancelAnimationFrame(
        raf
      );

      window.removeEventListener(
        "pointermove",
        onMove
      );

      window.removeEventListener(
        "pointerdown",
        onDown
      );

      window.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, []);

  return (
    <div
      ref={root}
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_6%_15%,#fffefa_0%,#fbfcff_38%,#f0f6ff_100%)] text-[#080e2b]"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Click ripple animation                                           */}
      {/* ---------------------------------------------------------------- */}

      <style>{`
        @keyframes hero-ripple {
          from {
            transform: translate(-50%, -50%) scale(0);
            opacity: .6;
          }

          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        .hero-ripple {
          width: 280px;
          height: 280px;
          animation: hero-ripple .9s cubic-bezier(.2,.7,.2,1) forwards;
        }

        @keyframes hero-cue {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-ripple,
          .hero-cue {
            animation: none;
            display: none;
          }
        }
      `}</style>

      {/* ---------------------------------------------------------------- */}
      {/* Scroll progress bar                                               */}
      {/* ---------------------------------------------------------------- */}

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-[#4773ec]"
        style={{
          transform:
            "scaleX(var(--pg, 0))",
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Cursor spotlight                                                  */}
      {/* ---------------------------------------------------------------- */}

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(71,115,236,0.13), transparent 65%)",
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Background blobs                                                  */}
      {/* ---------------------------------------------------------------- */}

      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 z-0 h-96 w-96 rounded-full bg-[#9db8ff]/30 blur-3xl"
        style={{
          transform:
            "translate3d(calc(var(--px, 0) * 30px), calc(var(--py, 0) * 30px + var(--sc, 0) * -120px), 0)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-64 z-0 h-[28rem] w-[28rem] rounded-full bg-[#c4d4ff]/40 blur-3xl"
        style={{
          transform:
            "translate3d(calc(var(--px, 0) * -50px), calc(var(--py, 0) * -50px + var(--sc, 0) * 160px), 0)",
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Click ripples                                                     */}
      {/* ---------------------------------------------------------------- */}

      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="hero-ripple pointer-events-none fixed z-50 rounded-full border-2 border-[#4773ec]"
          style={{
            left: r.x,
            top: r.y,
          }}
        />
      ))}

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}

      <header className="relative z-10 mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <a
          href="/"
          className="flex items-center gap-3 text-[28px] font-semibold tracking-tight"
          aria-label="Orbit Studio home"
        >
          <svg
            viewBox="0 0 38 38"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <circle
              cx="23"
              cy="15"
              r="14"
              fill="#5a82f0"
            />

            <circle
              cx="10"
              cy="27"
              r="8"
              fill="#6389f0"
            />

            <circle
              cx="15"
              cy="8"
              r="3.5"
              fill="#b2c7ff"
              opacity=".45"
            />
          </svg>

          orbit

          <span className="mt-2 text-[11px] font-medium tracking-wide text-[#7c96cc]">
            studio
          </span>
        </a>

        <nav className="flex items-center gap-8 text-sm text-[#4d5a83]">
          <a
            href="#how"
            className="hidden hover:text-[#4574ec] sm:block"
          >
            How it works
          </a>

          <a
            href="/studio"
            className="rounded-full bg-[#4673eb] px-6 py-3 text-white transition hover:bg-[#345fda]"
          >
            Open the studio
          </a>
        </nav>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero section                                                      */}
      {/* ---------------------------------------------------------------- */}

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-12 px-6 pb-20 pt-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: headline */}
        <div
          style={{
            transform:
              "translate3d(0, calc(var(--sc, 0) * -50px), 0)",
            opacity:
              "calc(1 - var(--sc, 0) * 0.55)",
          }}
        >
          <p className="mb-5 text-sm text-[#7a94df]">
            For small sellers and creators
          </p>

          <h1 className="text-[clamp(52px,7vw,96px)] font-medium leading-[1.03] tracking-[-0.06em]">
            Product photos.
            <br />
            Made ready
            <br />

            <em className="font-[family-name:var(--font-serif)] font-normal tracking-[-0.03em] text-[#4a72e7]">
              in seconds.
            </em>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#7a87aa]">
            One phone photo in. A full set of clean, listing-ready images out.
          </p>

          <a
            href="/studio"
            className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[#4773ec] px-9 text-base text-white shadow-[inset_0_1px_0_#ffffff30] transition hover:-translate-y-0.5 hover:bg-[#345fda] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4776ee]"
          >
            Open the studio
          </a>
        </div>

        {/* Right: interactive planet */}
        <div
          style={{
            transform:
              "translate3d(calc(var(--px, 0) * -14px), calc(var(--py, 0) * -14px + var(--sc, 0) * 40px), 0) scale(calc(1 + var(--sc, 0) * 0.1))",
          }}
        >
          <HeroPlanet input={input} />

          <p className="mt-4 text-center text-sm text-[#a4b5d8]">
            Drag to tilt. Click anywhere. Scroll to inflate.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Scroll cue                                                        */}
      {/* ---------------------------------------------------------------- */}

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 text-xs tracking-widest text-[#a4b5d8]"
        style={{
          opacity:
            "calc(1 - var(--sc, 0) * 4)",
        }}
      >
        SCROLL

        <span className="hero-cue block h-6 w-3.5 rounded-full border border-[#bccbee] p-[3px]">
          <span
            className="hero-cue block h-1.5 w-full rounded-full bg-[#4773ec]"
            style={{
              animation:
                "hero-cue 1.4s ease-in-out infinite",
            }}
          />
        </span>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* How it works                                                      */}
      {/* ---------------------------------------------------------------- */}

      <section
        id="how"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-12"
      >
        <h2 className="mb-8 text-3xl font-medium tracking-[-0.04em]">
          How it works
        </h2>

        <ol className="grid gap-12 border-t border-[#dce5fa] pt-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, i) => (
            <Step
              key={step.n}
              step={step}
              index={i}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}