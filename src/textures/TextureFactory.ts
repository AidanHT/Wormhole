/**
 * All textures are generated on canvas at load — the game ships zero image assets.
 * Generators are seeded so every run produces identical surfaces.
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 2D lattice hash → [0,1). */
function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647 ^ 0x5bf03635);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t: number): number { return t * t * (3 - 2 * t); }

export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = smoothstep(xf), v = smoothstep(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= 0.5; freq *= 2.1;
  }
  return sum / norm;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function finalize(canvas: HTMLCanvasElement, repeat = true): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  if (repeat) { tex.wrapS = RepeatWrapping; tex.wrapT = RepeatWrapping; }
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Per-pixel luminance modulation of a flat base color via fBm + speckle. */
function shadeNoise(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  base: [number, number, number], fbmAmp: number, speckleAmp: number, seed: number, fbmScale = 0.008,
): void {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const rng = mulberry32(seed);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = (fbm(x * fbmScale, y * fbmScale, seed) - 0.5) * 2 * fbmAmp;
      const s = (rng() - 0.5) * 2 * speckleAmp;
      const i = (y * w + x) * 4;
      data[i] = Math.max(0, Math.min(255, base[0] + n + s));
      data[i + 1] = Math.max(0, Math.min(255, base[1] + n + s));
      data[i + 2] = Math.max(0, Math.min(255, base[2] + n + s));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function stains(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number, count: number, color: string, maxAlpha: number): void {
  for (let i = 0; i < count; i++) {
    const x = rng() * w, y = rng() * h, r = 20 + rng() * 90;
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const a = maxAlpha * (0.4 + rng() * 0.6);
    g.addColorStop(0, color.replace('A', a.toFixed(3)));
    g.addColorStop(1, color.replace('A', '0'));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ---------------------------------------------------------------- generators

export function concreteTexture(seed: number, base: [number, number, number] = [98, 102, 106]): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, base, 16, 7, seed);
  const rng = mulberry32(seed + 7);
  stains(ctx, W, W, rng, 10, 'rgba(20,22,20,A)', 0.16);
  stains(ctx, W, W, rng, 4, 'rgba(60,48,30,A)', 0.10);
  // seams
  ctx.strokeStyle = 'rgba(10,12,14,0.5)';
  ctx.lineWidth = 2;
  for (let p = 0; p <= W; p += 256) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let p = 2; p <= W; p += 256) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  return finalize(canvas);
}

/** The portal-receptive white panel — clean, with a grime dial for later chambers. */
export function panelTexture(seed: number, grime = 0.25): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, [178, 181, 175], 7, 3, seed, 0.012);
  const rng = mulberry32(seed + 13);
  // tile bevels (2x2 tiles)
  for (let p = 0; p <= W; p += 256) {
    ctx.fillStyle = 'rgba(30,32,34,0.55)';
    ctx.fillRect(p - 2, 0, 3, W);
    ctx.fillRect(0, p - 2, W, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(p + 1, 0, 1, W);
    ctx.fillRect(0, p + 1, W, 1);
  }
  if (grime > 0) {
    stains(ctx, W, W, rng, Math.round(6 + grime * 14), 'rgba(28,26,22,A)', 0.14 * grime + 0.02);
    // edge streaks running down from tile seams
    const streaks = Math.round(grime * 22);
    for (let i = 0; i < streaks; i++) {
      const x = rng() * W, y0 = Math.floor(rng() * 2) * 256, len = 30 + rng() * 140 * grime;
      const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
      g.addColorStop(0, `rgba(25,24,20,${0.18 * grime})`);
      g.addColorStop(1, 'rgba(25,24,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y0, 1.5 + rng() * 2.5, len);
    }
  }
  return finalize(canvas);
}

export function metalTexture(seed: number, base: [number, number, number] = [112, 117, 122]): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, base, 8, 3, seed, 0.02);
  const rng = mulberry32(seed + 3);
  // brushed streaks
  for (let i = 0; i < 240; i++) {
    const y = rng() * W;
    ctx.fillStyle = `rgba(${rng() > 0.5 ? '255,255,255' : '10,12,14'},${0.02 + rng() * 0.05})`;
    ctx.fillRect(0, y, W, 1);
  }
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(220,225,228,${0.04 + rng() * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = rng() * W, y = rng() * W;
    ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 160, y + (rng() - 0.5) * 60);
    ctx.stroke();
  }
  return finalize(canvas);
}

/** Dark structural metal — visually "not portalable". */
export function metalDarkTexture(seed: number): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, [46, 50, 55], 10, 4, seed, 0.015);
  const rng = mulberry32(seed + 11);
  // vertical ribs
  for (let x = 0; x <= W; x += 128) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x - 3, 0, 4, W);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 1, 0, 2, W);
  }
  // rivets
  for (let x = 64; x < W; x += 128) {
    for (let y = 32; y < W; y += 96) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(x + (rng() - 0.5) * 4, y, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(190,195,200,0.25)';
      ctx.beginPath(); ctx.arc(x + (rng() - 0.5) * 4 - 1, y - 1, 2, 0, 7); ctx.fill();
    }
  }
  stains(ctx, W, W, rng, 9, 'rgba(95,55,25,A)', 0.22); // rust
  stains(ctx, W, W, rng, 6, 'rgba(10,10,12,A)', 0.25);
  return finalize(canvas);
}

export function floorTexture(seed: number): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, [74, 78, 82], 14, 6, seed);
  const rng = mulberry32(seed + 5);
  stains(ctx, W, W, rng, 14, 'rgba(14,15,16,A)', 0.2);
  stains(ctx, W, W, rng, 5, 'rgba(70,55,30,A)', 0.12);
  ctx.strokeStyle = 'rgba(8,9,10,0.55)';
  ctx.lineWidth = 2;
  for (let p = 0; p <= W; p += 128) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  return finalize(canvas);
}

export function hazardTexture(seed: number): CanvasTexture {
  const W = 256;
  const [canvas, ctx] = makeCanvas(W, W);
  ctx.fillStyle = '#1a1611';
  ctx.fillRect(0, 0, W, W);
  ctx.fillStyle = '#a87b28';
  const stripe = 32;
  for (let i = -W; i < W * 2; i += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i + stripe, 0);
    ctx.lineTo(i + stripe - W, W); ctx.lineTo(i - W, W);
    ctx.closePath(); ctx.fill();
  }
  // wear
  const rng = mulberry32(seed);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(12,11,9,${0.1 + rng() * 0.3})`;
    ctx.fillRect(rng() * W, rng() * W, 1 + rng() * 3, 1 + rng() * 2);
  }
  return finalize(canvas);
}

/** Transparent blood smear decal. */
export function bloodTexture(seed: number): CanvasTexture {
  const W = 256;
  const [canvas, ctx] = makeCanvas(W, W);
  const rng = mulberry32(seed);
  const cx = W / 2 + (rng() - 0.5) * 30, cy = W / 2 + (rng() - 0.5) * 30;
  for (let i = 0; i < 9; i++) {
    const x = cx + (rng() - 0.5) * 80, y = cy + (rng() - 0.5) * 80;
    const r = 14 + rng() * 46;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(58,8,8,${0.5 + rng() * 0.4})`);
    g.addColorStop(0.7, `rgba(44,6,6,${0.3 + rng() * 0.3})`);
    g.addColorStop(1, 'rgba(40,5,5,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // drips
  for (let i = 0; i < 6; i++) {
    const x = cx + (rng() - 0.5) * 90;
    const y = cy + rng() * 20;
    const len = 30 + rng() * 90;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(50,7,7,0.65)');
    g.addColorStop(1, 'rgba(50,7,7,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 2 + rng() * 3, len);
  }
  // spatter
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(58,9,9,${0.3 + rng() * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx + (rng() - 0.5) * 200, cy + (rng() - 0.5) * 200, 0.5 + rng() * 2.5, 0, 7);
    ctx.fill();
  }
  const tex = finalize(canvas, false);
  return tex;
}

/** Claw scratch decal — three to four parallel gouges. */
export function scratchesTexture(seed: number): CanvasTexture {
  const W = 256;
  const [canvas, ctx] = makeCanvas(W, W);
  const rng = mulberry32(seed);
  for (let group = 0; group < 2; group++) {
    const x0 = 30 + rng() * 120, y0 = 20 + rng() * 80;
    const ang = -0.5 + rng() * 1.2;
    const len = 110 + rng() * 110;
    const n = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const off = i * (7 + rng() * 5);
      ctx.strokeStyle = `rgba(12,10,9,${0.55 + rng() * 0.3})`;
      ctx.lineWidth = 1.5 + rng() * 2;
      ctx.beginPath();
      const sx = x0 + Math.cos(ang + 1.57) * off;
      const sy = y0 + Math.sin(ang + 1.57) * off;
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + Math.cos(ang) * len * 0.5 + (rng() - 0.5) * 14,
        sy + Math.sin(ang) * len * 0.5 + (rng() - 0.5) * 14,
        sx + Math.cos(ang) * len,
        sy + Math.sin(ang) * len,
      );
      ctx.stroke();
    }
  }
  return finalize(canvas, false);
}

/** Wall signage plate, e.g. "MERIDIAN-9 / SECTOR 04". */
export function signTexture(text: string, sub = '', accent = '#c9a35a'): CanvasTexture {
  const W = 512, H = 256;
  const [canvas, ctx] = makeCanvas(W, H);
  ctx.fillStyle = '#16181b';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(160,160,150,0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = `bold ${sub ? 72 : 84}px Consolas, monospace`;
  ctx.fillText(text, W / 2, sub ? 118 : 148, W - 60);
  if (sub) {
    ctx.fillStyle = 'rgba(200,196,186,0.75)';
    ctx.font = 'bold 40px Consolas, monospace';
    ctx.fillText(sub, W / 2, 190, W - 80);
  }
  // wear
  const rng = mulberry32(text.length * 31 + 7);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 350; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rng() * 0.5})`;
    ctx.fillRect(rng() * W, rng() * H, 1 + rng() * 4, 1 + rng() * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  return finalize(canvas, false);
}

export function toxicTexture(seed: number): CanvasTexture {
  const W = 256;
  const [canvas, ctx] = makeCanvas(W, W);
  const img = ctx.createImageData(W, W);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.02, y * 0.02, seed, 5);
      const swirl = fbm(x * 0.05 + n * 3, y * 0.05 + n * 3, seed + 50, 3);
      const i = (y * W + x) * 4;
      img.data[i] = 14 + swirl * 26;
      img.data[i + 1] = 46 + swirl * 72;
      img.data[i + 2] = 18 + swirl * 30;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(canvas);
}

/** Ceiling: dark panel grid. */
export function ceilingTexture(seed: number): CanvasTexture {
  const W = 512;
  const [canvas, ctx] = makeCanvas(W, W);
  shadeNoise(ctx, W, W, [40, 43, 47], 8, 3, seed, 0.01);
  ctx.strokeStyle = 'rgba(5,6,7,0.7)';
  ctx.lineWidth = 3;
  for (let p = 0; p <= W; p += 128) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  const rng = mulberry32(seed + 2);
  stains(ctx, W, W, rng, 8, 'rgba(8,9,10,A)', 0.3);
  return finalize(canvas);
}
