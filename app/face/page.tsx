import FaceAnalyzer from "../../components/face/face-analyzer";

export const metadata = {
  title: "Face Analysis | Orbit Studio",
  description:
    "Explore facial geometry and relative proportions using computer vision.",
};

export default function FacePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_6%_15%,#fffefa_0%,#fbfcff_38%,#f0f6ff_100%)] text-[#080e2b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <a
          href="/studio"
          className="text-sm text-[#7c96cc] transition hover:text-[#4574ec]"
        >
          &larr; orbit studio
        </a>

        <div className="mt-6 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#4773ec]">
            Facial Geometry
          </p>

          <h1 className="mt-3 text-[clamp(36px,5vw,60px)] font-medium leading-[1.05] tracking-[-0.05em]">
            Understand your face.
            <br />
            <span className="text-[#4a72e7]">
              Down to the proportions.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#7a87aa]">
            Upload a clear, front-facing photo to detect facial landmarks
            and explore relative measurements such as face ratio, eye
            spacing, nose width, mouth width, and geometric symmetry.
          </p>
        </div>

        <div className="mt-12">
          <FaceAnalyzer />
        </div>

        <div className="mt-10 rounded-2xl border border-[#dce5fa] bg-white/60 px-5 py-4 text-sm leading-6 text-[#7a87aa]">
          <strong className="font-medium text-[#4d5a83]">
            About these measurements:
          </strong>{" "}
          Results are based on facial landmarks detected from the uploaded
          image. Values represent relative geometry and proportions, not
          physical measurements or medical assessments.
        </div>
      </div>
    </main>
  );
}