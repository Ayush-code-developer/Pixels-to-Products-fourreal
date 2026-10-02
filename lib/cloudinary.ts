// URL-based Cloudinary helpers. No SDK needed: every effect is a transformation string.
// NOTE: verify transformation names against the Cloudinary docs / MCP tools in your IDE.
export const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!; // unsigned preset
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

export type StyleId = "white" | "shadow" | "scene";

export const STYLES: { id: StyleId; label: string; hint: string; chain: (prompt: string) => string[] }[] = [
  { id: "white", label: "Clean white", hint: "Marketplace-ready cutout", chain: () => ["e_background_removal", "c_pad,w_1200,h_1200,b_white"] },
  { id: "shadow", label: "Soft shadow", hint: "White with a grounded shadow", chain: () => ["e_background_removal", "e_dropshadow:azimuth_215;elevation_45", "c_pad,w_1200,h_1200,b_white"] },
  { id: "scene", label: "Lifestyle scene", hint: "AI-generated backdrop", chain: (p) => [`e_gen_background_replace:prompt_${encodeURIComponent(p.replace(/,/g, " "))}`, "c_fit,w_1200,h_1200"] },
];

export const SIZES = [
  { id: "square", label: "Square", note: "1:1 · feed & marketplaces", w: 1080, h: 1080 },
  { id: "portrait", label: "Portrait", note: "4:5 · Instagram", w: 1080, h: 1350 },
  { id: "story", label: "Story", note: "9:16 · Stories & Reels", w: 1080, h: 1920 },
];

const finish = (dl: boolean) => `f_auto,q_auto${dl ? ",fl_attachment" : ""}`;

export const cdn = {
  original: (id: string) => `${BASE}/c_fit,w_1000,h_1000/${finish(false)}/${id}`,
  styled: (id: string, chain: string[], dl = false) => `${BASE}/${chain.join("/")}/${finish(dl)}/${id}`,
  sized: (id: string, w: number, h: number, dl = false) => `${BASE}/c_pad,w_${w},h_${h},b_gen_fill/${finish(dl)}/${id}`,
};

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("upload failed");
  return (await res.json()).public_id as string;
}