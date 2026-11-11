/*
  Polaric's notch for the web: the same shape (NotchShape), the same light (NotchGlow) and the same
  sizes per mode (NotchModel.layout) as the app, so what visitors try here is what they get.

  NotchShape: a top edge that flares outward into the menu bar, straight sides, a rounded foot.
  NotchGlow: on a canvas `reach` larger than the notch (sides and below), a blurred stroke along the
  outline coloured by a conic gradient turning 30°/s, plus six soft blobs wandering along the foot,
  screen-blended; the whole light masked to the notch shape grown by `reach`, softened.
*/

export const GLOWS = {
  prism: ['#3D8BFF', '#22D3EE', '#34D399', '#FFD25A', '#FF8A4C', '#FF5F7E'],
  rainbow: ['#FF4D4D', '#FFA63D', '#FFE14D', '#4DE38A', '#3DB8FF', '#8F5CFF'],
  aurora: ['#2DE1C2', '#4DA3FF', '#9B6BFF', '#5CFFB0'],
  sunset: ['#FF5E62', '#FF9966', '#FFC371', '#D65DB1'],
  tropical: ['#00F5D4', '#FEE440', '#F15BB5', '#00BBF9'],
  polaric: ['#22D3EE', '#3A90F6', '#4F8BFF', '#1E5BD8'],
  pinkBlue: ['#FF5FA2', '#4F8BFF'],
  purpleOrange: ['#9B5CFF', '#FF9F43'],
  cyanMagenta: ['#22E4FF', '#FF3DCB'],
  tealLime: ['#14D9C5', '#B6F23C'],
  redGold: ['#FF4D5E', '#FFC94D'],
  blueViolet: ['#3D7BFF', '#A35CFF'],
  mintPeach: ['#6EF0C2', '#FFB38A'],
  white: ['#F5F7FF'],
  blue: ['#3D8BFF'],
  purple: ['#9B5CFF'],
  pink: ['#FF5FA2'],
  red: ['#FF4D4D'],
  gold: ['#FFC94D'],
  green: ['#3DE37F'],
};

export const GLOW_NAMES = {
  prism: 'Prism', rainbow: 'Rainbow', aurora: 'Aurora', sunset: 'Sunset', tropical: 'Tropical', polaric: 'Polaric blue',
  pinkBlue: 'Pink and blue', purpleOrange: 'Purple and orange', cyanMagenta: 'Cyan and magenta', tealLime: 'Teal and lime',
  redGold: 'Red and gold', blueViolet: 'Blue and violet', mintPeach: 'Mint and peach', white: 'White', blue: 'Blue',
  purple: 'Purple', pink: 'Pink', red: 'Red', gold: 'Gold', green: 'Green',
};

/** The notch's sizes per mode, in points, from NotchModel.layout (nw 185, nh 32: a 14" MacBook Pro). */
export const NW = 185, NH = 32;
export const LAYOUT = {
  closed: { w: NW + 12, h: NH, flare: 6, r: 12 },
  resting: { w: NW + 12 + 80, h: NH, flare: 6, r: 12 },
  wings: { w: NW + 12 + 84, h: NH, flare: 6, r: 12 },
  timer: { w: NW + 12 + 128, h: NH, flare: 6, r: 12 },
  meetingLine: { w: NW + 12 + 150, h: NH, flare: 6, r: 12 },
  toast: { w: 380, h: NH + 28, flare: 8, r: 18 },
  level: { w: NW + 150, h: NH + 40, flare: 10, r: 22 },
  alert: { w: 470, h: NH + 96, flare: 12, r: 28 },
  ai: { w: 520, h: NH + 128, flare: 12, r: 28 },
  aiWorking: { w: 430, h: NH, flare: 6, r: 12 },
  open: { w: 560, h: NH + 172, flare: 14, r: 32 },
  prompter: { w: 470, h: NH + 112, flare: 14, r: 28 },
};

/** NotchShape.path(in:) into a Path2D at (x, y). flare 0: a floating island, round on all corners. */
export function notchPath(x, y, w, h, flare, radius) {
  const p = new Path2D();
  if (flare <= 0) {
    p.roundRect(x, y, w, h, Math.max(0, Math.min(radius, h / 2, w / 2)));
    return p;
  }
  const e = Math.min(flare, w / 4);
  const r = Math.max(0, Math.min(radius, h / 2, (w - 2 * e) / 2));
  p.moveTo(x, y);
  p.quadraticCurveTo(x + e, y, x + e, y + e);
  p.lineTo(x + e, y + h - r);
  p.quadraticCurveTo(x + e, y + h, x + e + r, y + h);
  p.lineTo(x + w - e - r, y + h);
  p.quadraticCurveTo(x + w - e, y + h, x + w - e, y + h - r);
  p.lineTo(x + w - e, y + e);
  p.quadraticCurveTo(x + w - e, y, x + w, y);
  p.closePath();
  return p;
}

/** The same outline as an SVG/CSS path string (for clip-path on the black notch). */
export function notchD(w, h, flare, radius) {
  const f = n => Math.round(n * 100) / 100;
  if (flare <= 0) {
    const r = Math.max(0, Math.min(radius, h / 2, w / 2));
    return `M${f(r)} 0H${f(w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(w)} ${f(r)}V${f(h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)}H${f(r)}A${f(r)} ${f(r)} 0 0 1 0 ${f(h - r)}V${f(r)}A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0Z`;
  }
  const e = Math.min(flare, w / 4);
  const r = Math.max(0, Math.min(radius, h / 2, (w - 2 * e) / 2));
  return `M0 0Q${f(e)} 0 ${f(e)} ${f(e)}L${f(e)} ${f(h - r)}Q${f(e)} ${f(h)} ${f(e + r)} ${f(h)}L${f(w - e - r)} ${f(h)}Q${f(w - e)} ${f(h)} ${f(w - e)} ${f(h - r)}L${f(w - e)} ${f(e)}Q${f(w - e)} 0 ${f(w)} 0Z`;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const canFilter = (() => { try { const c = document.createElement('canvas').getContext('2d'); return c && 'filter' in c; } catch { return false; } })();

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

/** A spring like the app's (response ~0.42 s, damping ~0.86), one per number. */
class Spring {
  constructor(v) { this.v = v; this.to = v; this.vel = 0; }
  set(to, now = false) { this.to = to; if (now) { this.v = to; this.vel = 0; } }
  step(dt) {
    const k = 210, c = 25;
    const a = -k * (this.v - this.to) - c * this.vel;
    this.vel += a * dt;
    this.v += this.vel * dt;
    if (Math.abs(this.v - this.to) < 0.05 && Math.abs(this.vel) < 0.05) { this.v = this.to; this.vel = 0; }
    return this.v;
  }
  get moving() { return this.v !== this.to || this.vel !== 0; }
}

/**
  A notch inside `host` (positioned): the glow canvas, the black shape and its content.
  opts: scale (points → CSS px), palette (GLOWS key), speed (0.25–2), amount (0.3–2), floating (Windows island).
*/
export class Notch {
  constructor(host, opts = {}) {
    this.host = host;
    this.scale = opts.scale || 1;
    this.palette = opts.palette || 'prism';
    this.speed = opts.speed ?? 1;
    this.amount = opts.amount ?? 1;
    this.floating = !!opts.floating;
    this.top = opts.top ?? 0;
    this.glowOn = opts.glow !== false;
    this.paused = false;
    const l = this.shapeFor(opts.mode || 'closed');
    this.sw = new Spring(l.w); this.sh = new Spring(l.h); this.sf = new Spring(l.flare); this.sr = new Spring(l.r);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pn-glow';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.el = document.createElement('div');
    this.el.className = 'pn-notch';
    this.content = document.createElement('div');
    this.content.className = 'pn-notch__content';
    this.el.append(this.content);
    host.append(this.canvas, this.el);
    this.ctx = this.canvas.getContext('2d');
    this.stroke = document.createElement('canvas');
    this.mask = document.createElement('canvas');
    this.small = document.createElement('canvas');
    this.maskKey = '';
    this.visible = true;
    this.t0 = performance.now();
    this.last = this.t0;
    this.mode = opts.mode || 'closed';
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { this.visible = es.some(e => e.isIntersecting); if (this.visible) this.kick(); }, { rootMargin: '120px' }).observe(host);
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => this.kick()).observe(host);
    this.frame = this.frame.bind(this);
    this.kick();
  }

  shapeFor(mode) {
    const l = { ...(LAYOUT[mode] || LAYOUT.closed) };
    if (this.floating) {
      // NotchModel.floated: no outward curve, fully round while small.
      l.w = l.w - 2 * l.flare + 8;
      l.r = l.h <= 72 ? l.h / 2 : l.r;
      l.flare = 0;
    }
    return l;
  }

  /** Changes the notch to a mode (and its content), springing to the new size. */
  show(mode, html, { size } = {}) {
    this.mode = mode;
    const l = { ...this.shapeFor(mode), ...(size || {}) };
    this.sw.set(l.w); this.sh.set(l.h); this.sf.set(l.flare); this.sr.set(l.r);
    if (reducedMotion()) [this.sw, this.sh, this.sf, this.sr].forEach(s => s.set(s.to, true));
    this.setContent(html ?? '');
    this.el.dataset.mode = mode;
    this.kick();
  }

  setContent(html) {
    if (this.content.dataset.html === html) return;
    this.content.dataset.html = html;
    const next = document.createElement('div');
    next.className = 'pn-notch__content';
    next.innerHTML = html;
    const old = this.content;
    this.el.append(next);
    this.content = next;
    if (reducedMotion()) { old.remove(); return; }
    next.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'scale(.96)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }],
      { duration: 360, delay: 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    old.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(4px)' }], { duration: 160, easing: 'ease-out', fill: 'forwards' }).finished
      .then(() => old.remove()).catch(() => old.remove());
  }

  setGlow({ palette, speed, amount, glow, floating } = {}) {
    if (palette) this.palette = palette;
    if (speed != null) this.speed = speed;
    if (amount != null) this.amount = amount;
    if (glow != null) this.glowOn = glow;
    if (floating != null && floating !== this.floating) { this.floating = floating; this.show(this.mode, this.content.dataset.html); }
    this.maskKey = '';
    this.kick();
  }

  setPaused(p) { this.paused = p; this.kick(); }

  kick() { if (!this.raf) this.raf = requestAnimationFrame(this.frame); }

  frame(now) {
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const w = this.sw.step(dt), h = this.sh.step(dt), flare = this.sf.step(dt), r = this.sr.step(dt);
    const springing = this.sw.moving || this.sh.moving || this.sf.moving || this.sr.moving;
    this.layout(w, h, flare, r);
    const still = reducedMotion() || this.paused;
    // The glow is timed from load, so a canvas that skipped frames off screen shows no restart.
    const t = still ? 2.4 : ((now - this.t0) / 1000) * this.speed + 3;
    if (this.visible) this.paint(t, w, h, flare, r);
    if (springing || (!still && this.visible && this.glowOn)) this.kick();
  }

  layout(w, h, flare, r) {
    const s = this.scale;
    const W = w * s, H = h * s;
    const hw = this.host.clientWidth;
    const left = (hw - W) / 2;
    const st = this.el.style;
    st.width = W + 'px';
    st.height = H + 'px';
    st.left = left + 'px';
    st.top = this.top + 'px';
    st.clipPath = `path('${notchD(W, H, flare * s, r * s)}')`;
    this.el.style.setProperty('--pn-s', s);
    this.geo = { left, W, H, flare: flare * s, r: r * s };
  }

  paint(time, w, h, flare, r) {
    const s = this.scale;
    const { left, W, H } = this.geo;
    const amount = this.amount;
    const pad = (22 + 14 * amount) * s;
    const CW = Math.ceil(W + 2 * pad), CH = Math.ceil(H + pad);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = this.canvas, ctx = this.ctx;
    if (c.width !== Math.round(CW * dpr) || c.height !== Math.round(CH * dpr)) {
      c.width = Math.round(CW * dpr); c.height = Math.round(CH * dpr);
    }
    c.style.width = CW + 'px'; c.style.height = CH + 'px';
    c.style.left = (left - pad) + 'px'; c.style.top = this.top + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CW, CH);
    if (!this.glowOn) return;
    const colors = GLOWS[this.palette] || GLOWS.prism;
    const fl = flare * s, rr = r * s;

    // 1. The light along the outline: a conic gradient turning 30°/s, stroked, blurred.
    const sc = this.stroke;
    if (sc.width !== c.width || sc.height !== c.height) { sc.width = c.width; sc.height = c.height; }
    const sx = sc.getContext('2d');
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.clearRect(0, 0, CW, CH);
    const cx = pad + W / 2, cy = H / 2;
    let fill;
    if (sx.createConicGradient) {
      fill = sx.createConicGradient((time * 30 * Math.PI) / 180, cx, cy);
      const all = colors.length > 1 ? [...colors, colors[0]] : [colors[0], colors[0]];
      all.forEach((col, i) => fill.addColorStop(i / (all.length - 1), col));
    } else {
      fill = colors[0];
    }
    sx.strokeStyle = fill;
    sx.lineWidth = (10 + 8 * amount) * s;
    sx.stroke(notchPath(pad, 0, W, H, fl, rr));
    const blur = (10 + 6 * amount) * s;
    ctx.globalAlpha = Math.min(1, 0.45 * amount);
    this.blurred(ctx, sc, blur, CW, CH);
    ctx.globalAlpha = 1;

    // 2. Six soft lights wandering along the foot, breathing, screen-blended.
    ctx.globalCompositeOperation = 'screen';
    const width = Math.min(Math.max(120 * s, W * 0.42), W * 0.8) * (0.85 + 0.15 * amount);
    const span = Math.max(0, (W - width) / 2 - rr * 0.5);
    for (let i = 0; i < 6; i++) {
      const seed = i * 1.9;
      const swell = 0.8 + 0.2 * Math.sin(time * (0.7 + 0.11 * i) + seed * 2);
      const strength = Math.min(1, 0.6 * swell * amount);
      const ew = width * swell, eh = 46 * s * swell * (0.6 + 0.4 * amount);
      const bx = pad + W / 2 + span * Math.sin(time * (0.22 + 0.05 * i) + seed);
      const by = H - 2 * s;
      const col = colors[i % colors.length];
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(ew / 2, eh / 2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, hexA(col, strength));
      g.addColorStop(0.45, hexA(col, strength * 0.45));
      g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }

    // 3. Masked to the notch grown by the reach, softened, so the light keeps the notch's round
    // corners and never spills out as a box.
    const key = [CW, CH, fl, rr, pad, dpr].map(n => Math.round(n)).join();
    if (key !== this.maskKey) {
      this.maskKey = key;
      const m = this.mask;
      m.width = c.width; m.height = c.height;
      const mx = m.getContext('2d');
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const grown = document.createElement('canvas');
      grown.width = m.width; grown.height = m.height;
      const gx = grown.getContext('2d');
      gx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gx.fillStyle = '#fff';
      gx.fill(notchPath(0, 0, CW, CH, fl, rr + pad * 0.8));
      this.blurred(mx, grown, pad * 0.3, CW, CH);
    }
    ctx.globalCompositeOperation = 'destination-in';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Draws `src` blurred by `radius` CSS px: the canvas filter where there is one, else by scaling down and up. */
  blurred(ctx, src, radius, CW, CH) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (canFilter) {
      const dpr = src.width / CW;
      ctx.filter = `blur(${radius * dpr}px)`;
      ctx.drawImage(src, 0, 0);
      ctx.filter = 'none';
    } else {
      const k = Math.max(2, radius / 2.2);
      const sm = this.small;
      sm.width = Math.max(1, Math.round(src.width / k)); sm.height = Math.max(1, Math.round(src.height / k));
      const smx = sm.getContext('2d');
      smx.imageSmoothingQuality = 'high';
      smx.clearRect(0, 0, sm.width, sm.height);
      smx.drawImage(src, 0, 0, sm.width, sm.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sm, 0, 0, src.width, src.height);
    }
    ctx.restore();
  }
}
