import BoxBuilder from "../../components/box/box-builder";

export const metadata = {
  title: "Box to 3D | Orbit Studio",
};

export default function BoxPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_6%_15%,#fffefa_0%,#fbfcff_38%,#f0f6ff_100%)] text-[#080e2b]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <a href="/studio" className="text-sm text-[#7c96cc] hover:text-[#4574ec]">
          &larr; orbit studio
        </a>

        <h1 className="mt-6 text-[clamp(36px,5vw,60px)] font-medium leading-[1.05] tracking-[-0.05em]">
          Photograph your box.
          <br />
          <span className="text-[#4a72e7]">Get a spinning 3D product.</span>
        </h1>

        <p className="mt-4 max-w-xl text-lg text-[#7a87aa]">
          Add a photo of each side, tap the four corners, and watch the box come together.
        </p>

        <div className="mt-10">
          <BoxBuilder />
        </div>
      </div>
    </main>
  );
}