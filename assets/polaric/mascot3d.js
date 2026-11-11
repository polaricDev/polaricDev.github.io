// Polaric's mascot in real 3D: the cat-hooded astronaut (hood with ears, black visor with ^^ eyes, purple
// scarf with a star, puffer jacket, starry cape, paw that waves, a glass phone, star sneakers) on a ring of light.
// It bounces with squash and stretch, waves, blinks, the cape flows, turns to the pointer, jumps and spins
// when clicked. Draws only while on screen; one still frame under reduced motion. If WebGL or this module
// can't load, the SVG avatar stays.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const C = { fabric: 0xeee8ff, sheen: 0xc9b8ff, lilac: 0xb79cff, purple: 0x7a4dff, deep: 0x2a1a63, ink: 0x05030f, gold: 0xffd66b, pink: 0xff9cc0 };

const fabric = (color = C.fabric) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(C.sheen), emissive: 0x3b2490, emissiveIntensity: 0.18 });
const soft = (color, emissive = 0x000000, ei = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive, emissiveIntensity: ei });
const lit = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });

function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function extrude(shape, depth, bevel, seg = 6) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 24 });
  g.center();
  return g;
}
function starShape(r, inner = 0.42, points = 4) {
  const s = new THREE.Shape(), n = points * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2, d = i % 2 ? r * inner : r;
    i ? s.lineTo(Math.cos(a) * d, Math.sin(a) * d) : s.moveTo(Math.cos(a) * d, Math.sin(a) * d);
  }
  return s;
}
const star = (r, color, points = 4, inner = 0.4) => new THREE.Mesh(extrude(starShape(r, inner, points), r * 0.18, r * 0.12, 3), soft(color, color, 0.35));

function crescent(R, d = 0.34 * R) {
  // The outer circle minus the same circle moved right by d: horns point right.
  const h = Math.sqrt(R * R - (d * d) / 4), t = Math.atan2(h, d / 2), s = new THREE.Shape(), N = 48;
  for (let i = 0; i <= N; i++) { const a = t + ((2 * Math.PI - 2 * t) * i) / N; const p = [Math.cos(a) * R, Math.sin(a) * R]; i ? s.lineTo(...p) : s.moveTo(...p); }
  for (let i = 0; i <= N; i++) { const a = Math.PI + t - (2 * t * i) / N; s.lineTo(d + Math.cos(a) * R, Math.sin(a) * R); }
  return s;
}
function texture(draw, w = 256, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = (a, b) => texture((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, a); g.addColorStop(0.45, b); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 128, 128);

function build() {
  const root = new THREE.Group();

  // The moon it sits on: purple, cratered, lit from the edge
  const moonTex = texture((x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#9b7cff'); g.addColorStop(0.5, '#5f37d6'); g.addColorStop(1, '#25126e');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) {
      const cx = rnd() * w, cy = rnd() * h, r = 2 + rnd() * rnd() * 20;
      const cg = x.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      cg.addColorStop(0, 'rgba(40,20,110,.55)'); cg.addColorStop(0.8, 'rgba(60,35,150,.25)'); cg.addColorStop(1, 'rgba(220,200,255,.35)');
      x.fillStyle = cg; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    }
  }, 512, 256);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(4.2, 96, 64), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95, emissive: 0x2a1478, emissiveIntensity: 0.3 }));
  planet.position.set(0.9, -3.55, -0.6);
  root.add(planet);
  const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(170,120,255,.0)', 'rgba(150,100,255,.35)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  atmo.scale.set(10.5, 10.5, 1); atmo.position.copy(planet.position);
  root.add(atmo);

  // The orbit ring around it, pink into violet, glowing
  const orbitGeo = new THREE.TorusGeometry(3.05, 0.06, 12, 180);
  { const q = orbitGeo.attributes.position, col = [], a1 = new THREE.Color(0xf0a8ff), b1 = new THREE.Color(0x6a4dff), c1 = new THREE.Color();
    for (let i = 0; i < q.count; i++) { c1.copy(a1).lerp(b1, (Math.cos(Math.atan2(q.getY(i), q.getX(i))) + 1) / 2); col.push(c1.r, c1.g, c1.b); }
    orbitGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
  const orbit = new THREE.Mesh(orbitGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
  const orbitHalo = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.2, 8, 180), new THREE.MeshBasicMaterial({ color: 0x9a6bff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
  const orbitTilt = new THREE.Group();
  orbitTilt.add(orbit, orbitHalo);
  orbitTilt.position.set(0.1, 1.95, 0);
  orbitTilt.rotation.set(-1.25, 0.15, 0.38);
  root.add(orbitTilt);

  // Glow behind
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(150,110,255,.55)', 'rgba(90,60,220,.18)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.scale.set(6.5, 6.5, 1); aura.position.set(0, 2.4, -1.6);
  root.add(aura);

  const body = new THREE.Group();        // everything that bounces
  root.add(body);

  // Sneakers
  for (const s of [-1, 1]) {
    const shoe = new THREE.Group();
    const sole = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 20), fabric(0xf5f2ff));
    sole.scale.set(1, 0.42, 1.35); sole.position.y = 0.13;
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), soft(C.deep, C.purple, 0.15));
    upper.scale.set(1, 0.75, 1.2); upper.position.set(0, 0.3, -0.02);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 14, 32), fabric(0xf5f2ff));
    cuff.rotation.x = Math.PI / 2; cuff.position.y = 0.48;
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), fabric(0xf5f2ff));
    toe.scale.set(1.1, 0.7, 1); toe.position.set(0, 0.2, 0.3);
    const st = star(0.09, C.gold, 5, 0.45); st.position.set(0.3 * s, 0.32, 0.05); st.rotation.y = s * Math.PI / 2;
    shoe.add(sole, upper, cuff, toe, st);
    // sitting on the moon: one leg reaches forward, the other tucks in
    shoe.position.set(0.42 * s, s > 0 ? 0.32 : 0.12, s > 0 ? 0.95 : 0.75);
    shoe.rotation.set(s > 0 ? -0.5 : -0.2, s * 0.25, 0);
    body.add(shoe);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.25, 6, 16), soft(C.deep));
    leg.position.set(0.38 * s, s > 0 ? 0.62 : 0.55, 0.45); leg.rotation.x = s > 0 ? -1.1 : -1.35;
    body.add(leg);
  }

  // Puffer jacket
  const pts = [];
  [[0.02, 0.8], [0.62, 0.82], [0.78, 0.95], [0.8, 1.25], [0.74, 1.6], [0.6, 1.92], [0.3, 2.05], [0.02, 2.08]].forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  const jacket = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(40), 48), fabric());
  jacket.scale.z = 0.82;
  body.add(jacket);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.1, 14, 48), fabric());
  hem.rotation.x = Math.PI / 2; hem.scale.y = 0.82; hem.position.y = 0.86;
  body.add(hem);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.04), soft(C.deep));
  zip.position.set(0, 1.35, 0.64); zip.rotation.x = -0.12;
  body.add(zip);
  for (const s of [-1, 1]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), fabric());
    cord.position.set(0.17 * s, 1.68, 0.66);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), fabric());
    bead.position.set(0.17 * s, 1.45, 0.68);
    const patch = new THREE.Mesh(extrude(starShape(0.2, 0.86, 5), 0.03, 0.03), soft(C.purple, C.purple, 0.25));
    patch.position.set(0.42 * s, 1.15, 0.6); patch.rotation.y = s * 0.45;
    const ps = star(0.1, C.gold, 5, 0.45); ps.position.set(0.44 * s, 1.15, 0.64); ps.rotation.y = s * 0.45;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.04), soft(C.deep, C.purple, 0.2));
    strap.position.set(0.6 * s, 1.55, 0.36); strap.rotation.set(-0.3, s * 0.85, s * 0.12);
    body.add(cord, bead, patch, ps);
  }

  // Cape (flows), purple with stars
  const capeTex = texture((x, w, h) => {
    // a cape with a soft wavy hem; the rest of the canvas stays clear
    x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h * 0.86);
    for (let i = 0; i <= 4; i++) x.quadraticCurveTo(w - (i + 0.5) * (w / 4), h * (i % 2 ? 0.86 : 1.0), w - (i + 1) * (w / 4), h * 0.9);
    x.closePath(); x.clip();
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7a4dff'); g.addColorStop(1, '#c6a0ff');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.5})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6 + 0.6, 0, 7); x.fill(); }
    x.fillStyle = '#ffe08a';
    for (const [cx, cy, r] of [[60, 180, 15], [150, 110, 10], [110, 210, 8], [200, 190, 9]]) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); } x.fill(); }
  });
  const capeGeo = new THREE.PlaneGeometry(1.9, 1.5, 28, 20);
  {
    // narrow at the shoulders, wide at the hem, wrapped around the back
    const q = capeGeo.attributes.position;
    for (let i = 0; i < q.count; i++) {
      const x = q.getX(i), y = q.getY(i), k = 0.45 + 0.55 * ((0.75 - y) / 1.5);
      const nx = x * k;
      q.setXYZ(i, nx, y, -0.35 * nx * nx);
    }
  }
  const capeBase = capeGeo.attributes.position.array.slice();
  const cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({ map: capeTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x6a3cff, emissiveIntensity: 0.3 }));
  cape.position.set(-0.55, 1.2, -0.45);
  cape.rotation.set(0.12, 0.85, 0.12);
  body.add(cape);

  // Scarf with a star
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 18, 48), soft(C.purple, 0x5a2fe0, 0.3));
  scarf.rotation.x = Math.PI / 2 - 0.15; scarf.scale.set(1.05, 1, 0.9); scarf.position.y = 2.02;
  body.add(scarf);
  const brooch = star(0.2, C.gold, 5, 0.5);
  brooch.position.set(0.12, 1.98, 0.62);
  body.add(brooch);

  // Head: hood with cat ears, black visor, ^^ eyes, star on top
  const head = new THREE.Group();
  head.position.y = 2.95;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), fabric());
  hood.scale.set(1.22, 1.02, 1.0);
  head.add(hood);
  const opening = new THREE.Mesh(extrude(roundRect(1.82, 1.1, 0.52), 0.12, 0.12), fabric(0xf7f3ff));
  opening.position.set(0, -0.1, 0.86);
  head.add(opening);
  const visor = new THREE.Mesh(extrude(roundRect(1.56, 0.86, 0.42), 0.16, 0.1), new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x1a0f40, emissiveIntensity: 0.4 }));
  visor.position.set(0, -0.1, 0.98);
  head.add(visor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 80), lit(0x9fb6ff, 0.85));
  rim.scale.set(0.83, 0.47, 1); rim.position.set(0, -0.1, 1.2);
  const gleam = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 40, 0.7), lit(0xffffff, 0.28));
  gleam.position.set(0.05, -0.14, 1.21); gleam.rotation.z = 2.05; gleam.scale.y = 0.62;
  const eyes = new THREE.Group();
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.06, 12, 32, Math.PI), lit(0xffffff));
    e.position.set(0.34 * s, -0.16, 1.22);
    eyes.add(e);
  }
  head.add(eyes);
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 16, Math.PI), lit(0xffffff)); w.rotation.z = Math.PI; w.position.set(0.05 * sx, -0.4, 1.22); head.add(w); }
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.62, 24), fabric());
    outer.scale.z = 0.55;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 24), soft(C.purple, C.purple, 0.25));
    inner.scale.z = 0.3; inner.position.set(0, -0.04, 0.13);
    ear.add(outer, inner);
    ear.position.set(0.68 * s, 0.82, 0.05); ear.rotation.z = -s * 0.42;
    head.add(ear);
  }
  const crown = star(0.3, C.gold, 5, 0.5);
  crown.position.set(0, 0.86, 0.6); crown.rotation.x = -0.6;
  head.add(crown);
  const moon = new THREE.Mesh(extrude(crescent(0.78), 0.12, 0.06), soft(0xa47cff, 0x7a4dff, 0.7));
  moon.position.set(1.12, 0.62, -0.5); moon.rotation.z = Math.PI + 0.35;
  body.add(head);

  // Waving arm with the paw (the character's right, our left)
  const wave = new THREE.Group();
  wave.position.set(-0.7, 1.8, 0.25);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 8, 18), fabric());
  upper.position.set(-0.38, 0.3, 0); upper.rotation.z = 1.0;
  const cuffW = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.07, 12, 28), soft(C.deep));
  cuffW.position.set(-0.72, 0.58, 0.02); cuffW.rotation.set(Math.PI / 2, 0, 0.75);
  const paw = new THREE.Group();
  paw.position.set(-0.86, 0.86, 0.1);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), fabric(0xffffff));
  palm.scale.set(1, 1.1, 0.75);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), lit(C.pink));
  pad.scale.set(1.25, 1, 1); pad.position.set(0, -0.06, 0.23);
  paw.add(palm, pad);
  for (const [x, y] of [[-0.15, 0.1], [-0.05, 0.17], [0.05, 0.17], [0.15, 0.1]]) { const t = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), lit(C.pink)); t.position.set(x, y, 0.215); paw.add(t); }
  const pings = new THREE.Group();
  [[-0.45, 0.35, 0.5], [-0.25, 0.55, 0.15], [0.02, 0.6, -0.2]].forEach(([x, y, r]) => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), lit(C.gold)); l.position.set(x, y, 0); l.rotation.z = r; pings.add(l); });
  paw.add(pings);
  wave.add(upper, paw);
  body.add(wave);

  // Other arm holding the glass phone
  const hold = new THREE.Group();
  hold.position.set(0.68, 1.72, 0.05);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.45, 8, 18), fabric());
  fore.position.set(0.22, -0.28, 0.2); fore.rotation.set(0.9, 0, 0.35);
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), fabric(0xffffff));
  fist.position.set(0.35, -0.45, 0.55);
  const phone = new THREE.Group();
  const glass = new THREE.Mesh(extrude(roundRect(0.6, 0.9, 0.09), 0.03, 0.02, 2), new THREE.MeshPhysicalMaterial({ color: 0x8f72ff, roughness: 0.1, transmission: 0.6, thickness: 0.2, transparent: true, opacity: 0.55, emissive: 0x6a4cff, emissiveIntensity: 0.6 }));
  const edge = new THREE.Mesh(extrude(roundRect(0.62, 0.92, 0.1), 0.01, 0.01, 2), lit(0xc4b0ff, 0.9));
  edge.position.z = -0.03;
  const ps = star(0.1, 0xffffff, 4, 0.35); ps.position.set(0.08, 0.05, 0.04);
  phone.add(edge, glass, ps);
  phone.position.set(0.42, -0.2, 0.72); phone.rotation.set(-0.15, -0.45, -0.2);
  hold.add(fore, fist, phone);
  body.add(hold);

  // Sparkles
  const stars = [[1.55, 4.45, -0.4, 0.22], [1.05, 4.0, -0.3, 0.13], [-1.7, 3.6, -0.6, 0.1], [1.9, 3.2, -0.7, 0.08]].map(([x, y, z, r], i) => {
    const m = star(r, i % 2 ? 0xd8c8ff : 0xece4ff, 4, 0.38); m.position.set(x, y, z); root.add(m); return m;
  });

  return { root, body, head, eyes, wave, paw, pings, hold, phone, cape, capeBase, orbit, orbitTilt, planet, atmo, aura, stars, moon };
}

export function mount(host, fallback) {
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return false; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(-0.6, 2.4, 12.5);
  camera.lookAt(0.2, 1.75, 0);
  scene.add(new THREE.HemisphereLight(0xd9ccff, 0x2a1670, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-3, 5, 6); scene.add(key);
  // Purple and pink light from behind: the neon edge around the figure
  const rimA = new THREE.DirectionalLight(0x9a6bff, 3.2); rimA.position.set(-4, 3, -5); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xff8ad8, 2.2); rimB.position.set(4, 2, -4); scene.add(rimB);
  const fill = new THREE.PointLight(0x7aa8ff, 10, 12); fill.position.set(3, 1.5, 3); scene.add(fill);

  const m = build();
  scene.add(m.root);

  const size = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // a tall frame steps the camera back so the whole figure and the moon fit
    camera.position.z = 12.5 * Math.max(1, 1.08 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  size();
  new ResizeObserver(size).observe(host);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    look.tx = (e.clientX / innerWidth - 0.5) * 2;
    look.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  let hop = -1;
  host.addEventListener('click', () => { if (!reduce.matches && hop < 0) hop = performance.now(); });

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const cp = m.cape.geometry.attributes.position;
  const pose = now => {
    const t = now / 1000;
    // bounce: squash on landing, stretch on the way up
    const p = (t % 2.2) / 2.2, up = Math.max(0, Math.sin(p * Math.PI * 2));
    let y = up * 0.1, sy = 1 + Math.sin(p * Math.PI * 2 - 0.6) * 0.03;
    // click: a happy jump and a full turn
    let spin = 0;
    if (hop >= 0) {
      const k = (now - hop) / 1100;
      if (k >= 1) hop = -1;
      else { y += Math.sin(Math.min(1, k * 1.25) * Math.PI) * 0.9; spin = easeOut(k) * Math.PI * 2; sy += k < 0.12 ? -0.08 * Math.sin((k / 0.12) * Math.PI) : 0; }
    }
    m.body.position.y = y;
    m.body.scale.set(1 + (1 - sy) * 0.6, sy, 1 + (1 - sy) * 0.6);
    m.orbit.rotation.z = t * 0.35;
    m.orbitTilt.rotation.y = 0.15 + Math.sin(t * 0.6) * 0.05;
    m.planet.rotation.y = t * 0.04;
    // wave: the paw swings for 2.6 s, rests for 1.8 s
    const w = t % 4.4;
    const swing = w < 2.6 ? Math.sin(w * 7) * 0.32 * Math.min(1, w * 3, (2.6 - w) * 3) : 0;
    m.wave.rotation.z = -0.05 + swing;
    m.paw.rotation.z = swing * 0.6;
    m.pings.visible = w < 2.6;
    m.pings.children.forEach((l, i) => { const k = 0.6 + 0.5 * Math.abs(Math.sin(t * 9 + i)); l.scale.set(1, k, 1); });
    // blink: the ^^ eyes squeeze
    const b = t % 3.4;
    m.eyes.scale.y = b < 0.16 ? 0.35 + Math.abs(b - 0.08) / 0.08 * 0.65 : 1;
    // head, phone, moon, sparkles
    m.head.rotation.z = Math.sin(t * 1.4) * 0.05;
    m.head.rotation.y = Math.sin(t * 0.7) * 0.06;
    m.phone.position.y = -0.2 + Math.sin(t * 2.2) * 0.03;
    
    m.aura.material.opacity = 0.8 + Math.sin(t * 1.8) * 0.2;
    m.stars.forEach((s, i) => { s.scale.setScalar(0.7 + 0.4 * Math.sin(t * 3 + i * 1.9)); s.rotation.z = t * 0.6 + i; });
    // the cape flows: more at the free edge and the bottom
    for (let i = 0; i < cp.count; i++) {
      const bx = m.capeBase[i * 3], by = m.capeBase[i * 3 + 1];
      const free = Math.abs(bx) * 0.4 + (0.75 - by) / 1.5;
      cp.setZ(i, m.capeBase[i * 3 + 2] + Math.sin(t * 2.4 + bx * 2.2 + by * 1.6) * 0.1 * free);
    }
    cp.needsUpdate = true;
    // turn toward the pointer, smoothed, with a slow idle sway
    look.x += (look.tx - look.x) * 0.05; look.y += (look.ty - look.y) * 0.05;
    m.root.rotation.y = look.x * 0.5 + Math.sin(t * 0.45) * 0.14 + spin;
    m.head.rotation.x = look.y * 0.12;
  };

  let on = false, raf = 0, visible = true;
  const frame = now => { pose(now); renderer.render(scene, camera); raf = on ? requestAnimationFrame(frame) : 0; };
  const run = () => {
    on = visible && !reduce.matches && !document.hidden;
    if (on && !raf) raf = requestAnimationFrame(frame);
    if (!on) { pose(900); renderer.render(scene, camera); }
  };
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); run(); }).observe(host);
  document.addEventListener('visibilitychange', run);
  reduce.addEventListener?.('change', run);
  run();

  host.classList.add('is-3d');
  if (fallback) fallback.hidden = true;
  return true;
}
