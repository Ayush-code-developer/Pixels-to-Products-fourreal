"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { createClient } from "../../lib/supabase/client";

type Mode = "login" | "register" | "recovery";

const BLOBS = [
  { size: 260, left: 8, top: 12, delay: -4, duration: 22 },
  { size: 190, left: 76, top: 8, delay: -11, duration: 27 },
  { size: 320, left: 68, top: 62, delay: -17, duration: 24 },
  { size: 220, left: 16, top: 72, delay: -8, duration: 29 },
  { size: 170, left: 45, top: 20, delay: -14, duration: 20 },
  { size: 280, left: 42, top: 82, delay: -2, duration: 26 },
];

export default function NeuralAccess() {
  const supabase = useMemo(() => createClient(), []);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "recovery") {
      setMode("recovery");
      setRecoveryReady(true);
      setMessage(
        "PASSWORD RESET AUTHORIZED — ENTER YOUR NEW PASSWORD"
      );
    }

    if (params.get("verified") === "1") {
      setMessage("EMAIL VERIFIED — YOU CAN NOW SIGN IN");
    }

    if (params.get("error")) {
      setError("AUTHENTICATION CALLBACK FAILED");
    }
  }, []);

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const switchMode = (next: Mode) => {
    clearStatus();
    setMode(next);
    setRecoveryReady(false);
    setPassword("");
    setConfirmation("");
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;

    blobRefs.current.forEach((blob, index) => {
      if (!blob) return;

      const speed = (index + 1) * 8;

      blob.style.marginLeft = `${x * speed}px`;
      blob.style.marginTop = `${y * speed}px`;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearStatus();

    const settingNewPassword = mode === "recovery" && recoveryReady;

    if (!settingNewPassword && !email.trim()) {
      setError("EMAIL ADDRESS IS REQUIRED");
      return;
    }

    if (!password) {
      setError("PASSWORD IS REQUIRED");
      return;
    }

    if (
      (mode === "register" || settingNewPassword) &&
      password !== confirmation
    ) {
      setError("PASSWORDS DO NOT MATCH");
      return;
    }

    setLoading(true);

    try {
      if (mode === "recovery") {
        const { error: resetError } = await supabase.auth.updateUser({
          password,
        });

        if (resetError) {
          throw resetError;
        }

        window.location.assign("/studio");
        return;
      }

      if (mode === "register") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${
                window.location.origin
              }/auth/callback?next=${encodeURIComponent(
                "/login?verified=1"
              )}`,
            },
          });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          window.location.assign("/studio");
          return;
        }

        setMessage(
          "ACCOUNT CREATED — CHECK YOUR EMAIL TO VERIFY YOUR ACCOUNT"
        );
        return;
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        throw signInError;
      }

      window.location.assign("/studio");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message.toUpperCase()
          : "AUTHENTICATION FAILED"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendRecovery = async () => {
    clearStatus();

    if (!email.trim()) {
      setError("EMAIL ADDRESS IS REQUIRED");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${
              window.location.origin
            }/auth/callback?next=${encodeURIComponent(
              "/login?mode=recovery"
            )}`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "PASSWORD RESET EMAIL SENT — CHECK YOUR INBOX"
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message.toUpperCase()
          : "PASSWORD RESET REQUEST FAILED"
      );
    } finally {
      setLoading(false);
    }
  };

  const isRecovery = mode === "recovery";
  const isRegister = mode === "register";

  const title =
    mode === "login"
      ? "WELCOME\nBACK"
      : mode === "register"
        ? "CREATE\nACCOUNT"
        : "RESET\nPASSWORD";

  const action =
    mode === "login"
      ? "SIGN IN"
      : mode === "register"
        ? "CREATE ACCOUNT"
        : "UPDATE PASSWORD";

  return (
    <main
      className="neural-wrapper"
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .neural-wrapper {
          --bg: #050505;
          --mercury: #e0e0e0;
          --accent: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);

          position: relative;
          min-height: 100svh;
          width: 100vw;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          background: var(--bg);
          color: var(--accent);

          font-family: Inter, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .neural-wrapper *,
        .neural-wrapper *::before,
        .neural-wrapper *::after {
          box-sizing: border-box;
        }

        .neural-stage {
          position: absolute;
          inset: 0;
          z-index: 0;
          filter: url("#neural-gooey");
          opacity: .55;
        }

        .neural-blob {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0e0e0, #777);
          filter: blur(20px);

          animation: neural-float 20s infinite alternate ease-in-out;

          box-shadow:
            inset -10px -10px 20px rgba(0,0,0,.5),
            10px 10px 30px rgba(255,255,255,.2);

          transition: margin .12s ease-out;
        }

        @keyframes neural-float {
          0% {
            transform: translate(0,0) scale(1);
          }

          33% {
            transform: translate(10vw,20vh) scale(1.2);
          }

          66% {
            transform: translate(-5vw,10vh) scale(.8);
          }

          100% {
            transform: translate(5vw,-10vh) scale(1.1);
          }
        }

        .neural-auth {
          position: relative;
          z-index: 10;
          width: min(100%, 440px);
          padding: 40px;
        }

        .neural-header {
          margin-bottom: 60px;
        }

        .neural-brand {
          display: block;
          margin-bottom: 8px;
          color: var(--text-dim);

          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .neural-title {
          margin: 0 0 0 -4px;
          white-space: pre-line;

          font-size: clamp(2.6rem, 8vw, 3rem);
          font-weight: 800;
          line-height: .9;
          letter-spacing: -2px;
        }

        .neural-form-group {
          position: relative;
          margin-bottom: 30px;
          transition: transform .4s cubic-bezier(.2,1,.3,1);
        }

        .neural-form-group:focus-within {
          transform: translateX(10px);
        }

        .neural-label {
          display: block;
          margin-bottom: 12px;
          color: var(--text-dim);

          font-family: "Space Mono", monospace;
          font-size: 11px;
          text-transform: uppercase;
        }

        .neural-input {
          width: 100%;
          padding: 12px 0;

          border: none;
          border-bottom: 1px solid rgba(255,255,255,.1);
          outline: none;

          background: transparent;
          color: white;

          font-size: 18px;
        }

        .neural-input::placeholder {
          color: rgba(255,255,255,.2);
        }

        .neural-input:focus {
          border-bottom-color: rgba(255,255,255,.35);
        }

        .neural-input-glow {
          position: absolute;
          bottom: 0;
          left: 0;

          width: 0;
          height: 2px;

          background: var(--mercury);
          box-shadow: 0 0 15px var(--mercury);

          transition: width .6s cubic-bezier(.2,1,.3,1);
        }

        .neural-input:focus + .neural-input-glow {
          width: 100%;
        }

        .neural-submit {
          position: relative;
          margin-top: 50px;
        }

        .neural-button {
          position: relative;
          z-index: 2;

          width: 100%;
          padding: 20px 40px;

          border: none;
          background: white;
          color: black;

          cursor: pointer;

          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;

          transition: letter-spacing .3s, opacity .2s;
        }

        .neural-button:hover:not(:disabled) {
          letter-spacing: 4px;
        }

        .neural-button:disabled {
          cursor: wait;
          opacity: .55;
        }

        .neural-drop {
          position: absolute;
          z-index: 1;

          top: 50%;
          left: 50%;

          width: 100%;
          height: 100%;

          border-radius: 50px;
          background: var(--mercury);

          transform: translate(-50%,-50%);

          transition: all .5s cubic-bezier(.175,.885,.32,1.275);
        }

        .neural-submit:hover .neural-drop {
          transform: translate(-50%,-50%) scale(1.05,1.2);
          filter: brightness(1.2);
        }

        .neural-status {
          min-height: 20px;
          margin-top: 18px;

          font-family: "Space Mono", monospace;
          font-size: 10px;
          line-height: 1.5;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .neural-error {
          color: #ff6961;
        }

        .neural-success {
          color: #cfd8ee;
        }

        .neural-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;

          margin-top: 40px;

          font-family: "Space Mono", monospace;
          font-size: 10px;
        }

        .neural-footer button {
          padding: 0;
          border: none;
          background: transparent;

          color: var(--text-dim);
          cursor: pointer;

          font: inherit;
          text-align: left;
        }

        .neural-footer button:hover {
          color: white;
        }

        @media (max-width: 520px) {
          .neural-auth {
            padding: 28px;
          }

          .neural-header {
            margin-bottom: 48px;
          }

          .neural-footer {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neural-blob {
            animation: none;
          }

          .neural-form-group,
          .neural-input-glow,
          .neural-button,
          .neural-drop {
            transition: none;
          }
        }
      `}</style>

      <svg
        aria-hidden="true"
        className="absolute h-0 w-0"
      >
        <defs>
          <filter id="neural-gooey">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="12"
              result="blur"
            />

            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />

            <feComposite
              in="SourceGraphic"
              in2="goo"
              operator="atop"
            />
          </filter>
        </defs>
      </svg>

      <div className="neural-stage">
        {BLOBS.map((blob, index) => (
          <div
            key={index}
            ref={(element) => {
              blobRefs.current[index] = element;
            }}
            className="neural-blob"
            style={{
              width: blob.size,
              height: blob.size,
              left: `${blob.left}%`,
              top: `${blob.top}%`,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
          />
        ))}
      </div>

      <section className="neural-auth">
        <header className="neural-header">
          <span className="neural-brand">
            Orbit Studio
          </span>

          <h1 className="neural-title">
            {title}
          </h1>
        </header>

        <form
          onSubmit={(event) => {
            if (isRecovery && !recoveryReady) {
              event.preventDefault();
              void sendRecovery();
              return;
            }

            void handleSubmit(event);
          }}
        >
          {!(isRecovery && recoveryReady) && (
            <div className="neural-form-group">
              <label
                className="neural-label"
                htmlFor="email"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                className="neural-input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

              <div className="neural-input-glow" />
            </div>
          )}

          {(!isRecovery || recoveryReady) && (
            <div className="neural-form-group">
              <label
                className="neural-label"
                htmlFor="password"
              >
                {isRecovery ? "New Password" : "Password"}
              </label>

              <input
                id="password"
                type="password"
                autoComplete={
                  isRegister || isRecovery
                    ? "new-password"
                    : "current-password"
                }
                className="neural-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              <div className="neural-input-glow" />
            </div>
          )}

          {(isRegister || (isRecovery && recoveryReady)) && (
            <div className="neural-form-group">
              <label
                className="neural-label"
                htmlFor="confirmation"
              >
                Confirm Password
              </label>

              <input
                id="confirmation"
                type="password"
                autoComplete="new-password"
                className="neural-input"
                placeholder="••••••••••••"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(event.target.value)
                }
                required
              />

              <div className="neural-input-glow" />
            </div>
          )}

          {isRecovery && !recoveryReady ? (
            <div className="neural-submit">
              <div className="neural-drop" />

              <button
                type="submit"
                className="neural-button"
                disabled={loading}
              >
                {loading
                  ? "SENDING..."
                  : "SEND RESET EMAIL"}
              </button>
            </div>
          ) : (
            <div className="neural-submit">
              <div className="neural-drop" />

              <button
                type="submit"
                className="neural-button"
                disabled={loading}
              >
                {loading ? "PLEASE WAIT..." : action}
              </button>
            </div>
          )}

          <div className="neural-status">
            {error ? (
              <span className="neural-error">
                {error}
              </span>
            ) : null}

            {!error && message ? (
              <span className="neural-success">
                {message}
              </span>
            ) : null}
          </div>
        </form>

        <footer className="neural-footer">
          {mode === "login" ? (
            <>
              <button
                type="button"
                onClick={() => switchMode("recovery")}
              >
                FORGOT PASSWORD?
              </button>

              <button
                type="button"
                onClick={() => switchMode("register")}
              >
                CREATE ACCOUNT
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                BACK TO LOGIN
              </button>

              {mode !== "register" ? (
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  CREATE ACCOUNT
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode("recovery")}
                >
                  FORGOT PASSWORD?
                </button>
              )}
            </>
          )}
        </footer>
      </section>
    </main>
  );
}