export type Pt = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Solve A·h = b (n×n) with Gaussian elimination + partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    }
    [M[c], M[p]] = [M[p], M[c]];

    const d = M[c][c];
    if (Math.abs(d) < 1e-12) throw new Error("Degenerate corner selection");

    for (let k = c; k <= n; k++) M[c][k] /= d;

    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }

  return M.map((row) => row[n]);
}

/**
 * Cut a four-cornered area out of a photo and flatten it into a rectangle.
 *
 * quad: corners in NORMALIZED image coordinates (0..1), ordered
 *       top-left, top-right, bottom-right, bottom-left.
 */
export function warpQuad(
  img: HTMLImageElement,
  quad: Pt[],
  outW: number,
  outH: number
): HTMLCanvasElement {
  // Work on a capped-size copy so huge phone photos stay fast
  const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
  const sw = Math.max(1, Math.round(img.naturalWidth * scale));
  const sh = Math.max(1, Math.round(img.naturalHeight * scale));

  const src = document.createElement("canvas");
  src.width = sw;
  src.height = sh;
  const sctx = src.getContext("2d")!;
  sctx.drawImage(img, 0, 0, sw, sh);
  const sd = sctx.getImageData(0, 0, sw, sh).data;

  const q = quad.map((p) => ({ x: p.x * sw, y: p.y * sh }));
  const dst: Pt[] = [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH },
  ];

  // Homography mapping OUTPUT pixels -> SOURCE pixels
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = dst[i];
    const { x, y } = q[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }
  const h = solve(A, b);

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d")!;
  const od = octx.createImageData(outW, outH);
  const o = od.data;

  for (let j = 0; j < outH; j++) {
    for (let i = 0; i < outW; i++) {
      const u = i + 0.5;
      const v = j + 0.5;
      const w = h[6] * u + h[7] * v + 1;
      const x = (h[0] * u + h[1] * v + h[2]) / w - 0.5;
      const y = (h[3] * u + h[4] * v + h[5]) / w - 0.5;

      // Bilinear sample
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = x - x0;
      const fy = y - y0;

      const cx0 = clamp(x0, 0, sw - 1);
      const cx1 = clamp(x0 + 1, 0, sw - 1);
      const cy0 = clamp(y0, 0, sh - 1);
      const cy1 = clamp(y0 + 1, 0, sh - 1);

      const i00 = (cy0 * sw + cx0) * 4;
      const i10 = (cy0 * sw + cx1) * 4;
      const i01 = (cy1 * sw + cx0) * 4;
      const i11 = (cy1 * sw + cx1) * 4;

      const idx = (j * outW + i) * 4;
      for (let c = 0; c < 3; c++) {
        const top = sd[i00 + c] * (1 - fx) + sd[i10 + c] * fx;
        const bot = sd[i01 + c] * (1 - fx) + sd[i11 + c] * fx;
        o[idx + c] = top * (1 - fy) + bot * fy;
      }
      o[idx + 3] = 255;
    }
  }

  octx.putImageData(od, 0, 0);
  return out;
}