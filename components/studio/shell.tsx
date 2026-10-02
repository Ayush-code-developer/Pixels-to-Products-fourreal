import Link from "next/link";

// Shared frame for every page after the hero: same palette, wordmark and background.
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_6%_15%,#fffefa_0%,#fbfcff_38%,#f0f6ff_100%)] text-[#080e2b]">
      <header className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 text-[28px] font-semibold tracking-tight" aria-label="Orbit home">
          <svg viewBox="0 0 38 38" className="h-8 w-8" aria-hidden="true">
            <circle cx="23" cy="15" r="14" fill="#5a82f0" />
            <circle cx="10" cy="27" r="8" fill="#6389f0" />
            <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".45" />
          </svg>
          orbit<span className="mt-2 text-[11px] font-medium tracking-wide text-[#7c96cc]">studio</span>
        </Link>
        <Link href="/" className="text-sm text-[#4d5a83] hover:text-[#4574ec]">Back to home</Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24">{children}</main>
    </div>
  );
}