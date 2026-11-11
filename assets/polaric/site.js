const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const VERSION = '1.4.2.1';
const REPO = 'polaricDev/polaricDev.github.io';
const isWindows = /Win/i.test(navigator.userAgentData?.platform || navigator.platform || '');
const isMac = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform || '') && !('ontouchend' in document && navigator.maxTouchPoints > 1);

/* ---------- Real recordings of Polaric (the app's own demo recorder, its windows only) ---------- */

let SEG = null;
const segments = () => SEG ??= fetch('assets/rec/segments.json').then(r => r.json()).catch(() => ({ mac: {}, windows: {} }));

/** Plays [start, end] of a video, then holds its last frame (or loops it). */
function segPlayer(video) {
  let end = null, from = 0, loop = false, token = 0;
  const tick = () => {
    if (end == null) return;
    if (video.currentTime >= end) {
      if (loop) { video.currentTime = from; } else { video.pause(); end = null; return; }
    }
    video.requestVideoFrameCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
  };
  return {
    async play([a, b], opts = {}) {
      const my = ++token;
      if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
      from = a; end = b; loop = !!opts.loop;
      const go = () => { if (my !== token) return; video.currentTime = a; video.play().then(tick).catch(() => {}); };
      if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true });
    },
    stop() { token++; end = null; video.pause(); },
  };
}

function hero() {
  const v = $('[data-rec="hero"]');
  if (!v) return;
  if (reduced()) { v.removeAttribute('autoplay'); v.pause(); }
  const btn = $('[data-pn-pause="hero"]');
  btn?.addEventListener('click', () => {
    const paused = !v.paused;
    if (paused) v.pause(); else v.play().catch(() => {});
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play the recording' : 'Pause the recording');
  });
}

/* ---------- The simulator: real recordings on a MacBook (notch) or Windows (island) ---------- */

function simulator() {
  const root = $('[data-pn="sim"]');
  if (!root) return;
  const vids = { mac: $('[data-rec="mac"]', root), windows: $('[data-rec="windows"]', root) };
  const players = { mac: segPlayer(vids.mac), windows: segPlayer(vids.windows) };
  let os = isWindows ? 'windows' : 'mac';
  const cover = $('.sim__privacy', root), card = $('.sim__shot', root), flash = $('.sim__flash', root);
  const field = $('.sim__type', root), win = $('.sim__win', root), memo = $('.sim__memo', root);
  const still = $('[data-still="prompter"]', root);
  const ocr = $('.sim__ocr', root), rec = $('.sim__rec', root), coverTxt = $('.sim__privacy-txt', root), unlock = $('.sim__unlock', root);
  let token = 0;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reset = () => {
    cover.hidden = true; card.hidden = true; win.classList.remove('is-typing', 'is-snapped', 'is-dragging');
    memo.classList.remove('is-open'); ocr.classList.remove('is-on'); rec.classList.remove('is-on'); root.classList.remove('is-locked');
    still.hidden = true; vids.mac.hidden = os !== 'mac';
  };
  // Moments that happen beside the notch (their own windows on the screen), played with the notch at rest.
  const extras = {
    privacy: async () => { coverTxt.innerHTML = 'Polaric <b>Privacy</b>'; unlock.textContent = 'Unlock with ⌥⇧U'; cover.hidden = false; cover.classList.remove('is-open'); await wait(30); cover.classList.add('is-open'); },
    applock: async () => { root.classList.add('is-locked'); coverTxt.innerHTML = 'Chrome <b>Locked</b>'; unlock.textContent = 'Unlock with Touch ID'; cover.hidden = false; cover.classList.remove('is-open'); await wait(30); cover.classList.add('is-open'); },
    memo: async () => { memo.classList.add('is-open'); },
    prompter: async () => { if (os !== 'mac') return; players.mac.stop(); vids.mac.hidden = true; still.hidden = false; },
    record: async my => { rec.classList.add('is-on'); await wait(5000); if (my === token) rec.classList.remove('is-on'); },
    autotext: async my => {
      win.classList.add('is-typing'); field.textContent = '';
      for (const ch of 'Send the package to .addr') { if (my !== token) return; field.textContent += ch; await wait(55); }
      await wait(350); if (my !== token) return;
      field.textContent = 'Send the package to Jl. Merdeka 1, Jakarta 10110';
    },
  };
  // Moments the notch shows alongside a window of its own.
  const alongside = {
    ocr: async my => { ocr.classList.add('is-on'); await wait(1400); if (my === token) ocr.classList.remove('is-on'); },
    shot: async my => { flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on'); await wait(200); if (my !== token) return; card.hidden = false; await wait(3200); if (my === token) card.hidden = true; },
    snap: async my => { win.classList.add('is-dragging'); await wait(4200); if (my !== token) return; win.classList.remove('is-dragging'); win.classList.add('is-snapped'); },
  };
  const tabs = $$('[data-play]', root);
  const show = osName => {
    os = osName;
    root.dataset.platform = os;
    vids.mac.hidden = os !== 'mac'; vids.windows.hidden = os !== 'windows';
    segments().then(seg => {
      // Only the moments this computer's recording has.
      tabs.forEach(t => { t.hidden = !(seg[os][t.dataset.play] || extras[t.dataset.play]); });
      players[os].play(seg[os].rest || [0, 0.1]);
    });
  };
  const play = async id => {
    const my = ++token;
    reset();
    tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.play === id)));
    window.gtag?.('event', 'notch_preview_select', { moment: id, platform: os });
    const seg = await segments();
    const s = seg[os][id];
    if (s) players[os].play(s); else players[os].play(seg[os].rest || [0, 0.1]);
    if (extras[id] && !s) extras[id](my);
    if (alongside[id]) alongside[id](my);
  };
  tabs.forEach(t => t.addEventListener('click', () => play(t.dataset.play)));
  unlock.addEventListener('click', () => { cover.classList.remove('is-open'); root.classList.remove('is-locked'); setTimeout(() => (cover.hidden = true), 380); });
    $$('[data-os]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-os]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    players[os].stop(); reset();
    show(b.dataset.os);
  }));
  $$('[data-os]', root).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.os === os)));
  // The recordings load when the simulator comes near.
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); show(os); } }, { rootMargin: '600px' });
  io.observe(root);
}

/* ---------- Customise: each glow and mascot, recorded on the real notch ---------- */

function customise() {
  const root = $('[data-pn="custom"]');
  if (!root) return;
  const v = $('[data-rec="custom"]', root);
  const p = segPlayer(v);
  const NAMES = { prism: 'Prism', rainbow: 'Rainbow', aurora: 'Aurora', sunset: 'Sunset', tropical: 'Tropical', pinkBlue: 'Pink and blue', purpleOrange: 'Purple and orange',
    cyanMagenta: 'Cyan and magenta', tealLime: 'Teal and lime', redGold: 'Red and gold', blueViolet: 'Blue and violet', mintPeach: 'Mint and peach', white: 'White',
    blue: 'Blue', purple: 'Purple', pink: 'Pink', red: 'Red', gold: 'Gold', green: 'Green' };
  const COLS = { prism: ['#3D8BFF', '#22D3EE', '#34D399', '#FFD25A', '#FF8A4C', '#FF5F7E'], rainbow: ['#FF4D4D', '#FFA63D', '#FFE14D', '#4DE38A', '#3DB8FF', '#8F5CFF'],
    aurora: ['#2DE1C2', '#4DA3FF', '#9B6BFF', '#5CFFB0'], sunset: ['#FF5E62', '#FF9966', '#FFC371', '#D65DB1'], tropical: ['#00F5D4', '#FEE440', '#F15BB5', '#00BBF9'],
    pinkBlue: ['#FF5FA2', '#4F8BFF'], purpleOrange: ['#9B5CFF', '#FF9F43'], cyanMagenta: ['#22E4FF', '#FF3DCB'], tealLime: ['#14D9C5', '#B6F23C'], redGold: ['#FF4D5E', '#FFC94D'],
    blueViolet: ['#3D7BFF', '#A35CFF'], mintPeach: ['#6EF0C2', '#FFB38A'], white: ['#F5F7FF'], blue: ['#3D8BFF'], purple: ['#9B5CFF'], pink: ['#FF5FA2'], red: ['#FF4D4D'], gold: ['#FFC94D'], green: ['#3DE37F'] };
  const grid = $('.cz__swatches', root);
  grid.innerHTML = Object.keys(COLS).map(k => {
    const c = COLS[k];
    const bg = c.length > 1 ? `conic-gradient(from 200deg, ${[...c, c[0]].join(',')})` : c[0];
    return `<button type="button" class="cz__sw" data-glow-pick="${k}" aria-pressed="${k === 'prism'}" aria-label="${NAMES[k]}" title="${NAMES[k]}" style="--sw:${bg}"></button>`;
  }).join('');
  const label = $('.cz__glowname', root);
  const go = key => segments().then(seg => { const s = seg.custom?.[key]; root.classList.toggle('is-mascot', key.startsWith('k:')); if (s) p.play(s, { loop: true }); });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-glow-pick]');
    if (!b) return;
    $$('[data-glow-pick]', grid).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    label.textContent = NAMES[b.dataset.glowPick];
    go('g:' + b.dataset.glowPick);
  });
  $$('[data-mascot]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-mascot]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    go('k:' + b.dataset.mascot);
  }));
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go('g:prism'); } }, { rootMargin: '500px' });
  io.observe(root);
}

/* ---------- Downloads: the right file for this computer, counted by platform and by country ---------- */

const COUNTRIES = 'ID MY SG TH PH VN IN JP KR CN TW HK AU NZ US CA MX BR AR CL CO PE GB IE FR DE NL BE ES PT IT CH AT SE NO DK FI PL CZ RO HU GR TR UA RU IL AE SA QA EG MA NG KE ZA PK BD LK NP'.split(' ');
const COUNTER = 'https://abacus.jasoncameron.dev';
const NS = 'polaric-site';

// Where this download comes from: country, city and position (from the visitor's IP, asked only on a download click).
async function geo() {
  try {
    const r = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.country_code) return { cc: String(j.country_code).toUpperCase(), city: j.city || '', lat: +j.latitude, lon: +j.longitude }; }
  } catch {}
  try {
    const r = await fetch('https://ipwho.is/?fields=country_code,city,latitude,longitude', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.country_code) return { cc: String(j.country_code).toUpperCase(), city: j.city || '', lat: +j.latitude, lon: +j.longitude }; }
  } catch {}
  return { cc: '' };
}

// Cities come from assets/polaric/cities/<CC>.json ([name, lat, lon], order frozen). A download is stored as one
// number: country letters * 100000 + the city's place in that list (0 = city unknown).
const citiesOf = cc => cached(`pn-cities-${cc}`, 864e5, () => fetch(`assets/polaric/cities/${cc}.json`).then(r => (r.ok ? r.json() : [])).catch(() => []));
const ccNum = cc => (cc.charCodeAt(0) - 65) * 26 + (cc.charCodeAt(1) - 65);
const ccOf = n => String.fromCharCode(65 + Math.floor(n / 26), 65 + (n % 26));
const plain = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function cityCode(g) {
  if (!/^[A-Z]{2}$/.test(g.cc)) return 0;
  const list = await citiesOf(g.cc);
  // "West Jakarta", "Kota Bandung", "Bekasi Regency" -> Jakarta, Bandung, Bekasi.
  const words = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(north|south|east|west|central|greater|city|of|kota|kabupaten|regency|district|province|utara|selatan|timur|barat|pusat)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const want = words(g.city || '');
  const far = ([, la, lo]) => (isFinite(g.lat) && isFinite(g.lon) ? (la - g.lat) ** 2 + ((lo - g.lon) * Math.cos(g.lat * Math.PI / 180)) ** 2 : 0);
  let hits = want ? list.map((c, k) => k).filter(k => words(list[k][0]) === want) : [];
  if (!hits.length && want) {
    // A known city named inside the visitor's (longest name wins).
    const len = k => { const w = words(list[k][0]); return w && ` ${want} `.includes(` ${w} `) ? w.length : 0; };
    const top = Math.max(0, ...list.map((c, k) => len(k)));
    if (top) hits = list.map((c, k) => k).filter(k => len(k) === top);
  }
  // Two cities with the same name: the one nearer the visitor.
  let i = hits.sort((x, y) => far(list[x]) - far(list[y]))[0] ?? -1;
  if (i < 0 && isFinite(g.lat) && isFinite(g.lon)) {
    // The nearest city within about 40 km, when the names are written differently.
    let best = 0.4 * 0.4;
    list.forEach(([, la, lo], k) => { const d = (la - g.lat) ** 2 + ((lo - g.lon) * Math.cos(g.lat * Math.PI / 180)) ** 2; if (d < best) { best = d; i = k; } });
  }
  return ccNum(g.cc) * 100000 + (i + 1);
}

function countDownload(platform) {
  window.gtag?.('event', platform === 'macos' ? 'download_macos' : 'download_windows', { platform, app_version: VERSION, transport_type: 'beacon' });
  const hit = key => fetch(`${COUNTER}/hit/${NS}/${key}`, { keepalive: true, cache: 'no-store' });
  geo().then(async g => {
    const key = COUNTRIES.includes(g.cc) ? `dl-${g.cc.toLowerCase()}` : 'dl-other';
    await Promise.all([hit(key), hit(`dl-${platform}-site`)]);
    // One numbered note per download, written once, holding its city.
    const code = await cityCode(g).catch(() => 0);
    if (!code) return;
    const n = (await hit('dl-seq').then(r => r.json())).value;
    if (n > 0) await fetch(`${COUNTER}/create/${NS}/dl-log-${n}?initializer=${code}`, { keepalive: true, cache: 'no-store' });
  }).then(() => { try { sessionStorage.removeItem('pn-countries'); sessionStorage.removeItem('pn-places'); } catch {} }).catch(() => {});
}

function downloads() {
  // "Download free" opens a choice: MacBook or Windows (this computer's comes first and is marked).
  const close = except => $$('[data-dl-toggle][aria-expanded="true"]').forEach(t => {
    if (t === except) return;
    t.setAttribute('aria-expanded', 'false');
    t.nextElementSibling.hidden = true;
  });
  $$('[data-dl-toggle]').forEach(t => {
    const menu = t.nextElementSibling;
    const mine = isMac ? 'macos' : isWindows ? 'windows' : '';
    const opt = mine && menu.querySelector(`[data-download="${mine}"]`);
    if (opt) { opt.classList.add('is-mine'); menu.prepend(opt); }
    t.addEventListener('click', e => {
      e.preventDefault();
      const open = t.getAttribute('aria-expanded') !== 'true';
      close(t);
      t.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      if (open) menu.querySelector('a')?.focus({ preventScroll: true });
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.pn-dl')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const t = $('[data-dl-toggle][aria-expanded="true"]'); close(); t?.focus(); } });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-download]');
    if (!a) return;
    const p = a.dataset.download;
    if (p === 'macos' || p === 'windows') countDownload(p);
    if (a.closest('.pn-dl')) setTimeout(() => close(), 150);
  });
}

const fmt = n => n.toLocaleString('en-US');
const esc = t => String(t).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

async function cached(key, ms, get) {
  try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < ms) return c.d; } catch {}
  const d = await get();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch {}
  return d;
}

async function platformCounts() {
  const base = await fetch('assets/downloads-base.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  let releases = null;
  try {
    releases = await cached('pn-releases', 5 * 60e3, async () => {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error(r.status);
      return (await r.json()).map(rel => ({ tag: rel.tag_name, assets: (rel.assets || []).map(a => ({ name: a.name, n: a.download_count })) }));
    });
  } catch {}
  const n = { macos: +base.macos || 0, windows: +base.windows || 0 };
  if (!releases && Array.isArray(base.releasesSnapshot)) releases = base.releasesSnapshot;
  const list = releases || [{ assets: [{ name: 'x.dmg', n: +(base.snapshot?.macos) || 0 }, { name: 'x.exe', n: +(base.snapshot?.windows) || 0 }] }];
  for (const rel of list) for (const a of rel.assets) {
    if (/\.dmg$/i.test(a.name)) n.macos += a.n;
    else if (/\.exe$/i.test(a.name)) n.windows += a.n;
  }
  n.total = n.macos + n.windows;
  // Per release, oldest first; the releases that were replaced count as one column.
  n.releases = (releases || []).map(rel => {
    const r = { tag: rel.tag.replace(/^v/, ''), macos: 0, windows: 0 };
    for (const a of rel.assets) { if (/\.dmg$/i.test(a.name)) r.macos += a.n; else if (/\.exe$/i.test(a.name)) r.windows += a.n; }
    return r;
  }).reverse();
  if (n.releases.length && (+base.macos || +base.windows)) n.releases.unshift({ tag: '1.1.1', macos: +base.macos || 0, windows: +base.windows || 0 });
  return n;
}

async function countryCounts() {
  return cached('pn-countries', 10 * 60e3, async () => {
    const keys = [...COUNTRIES.map(c => c.toLowerCase()), 'other'];
    const out = {};
    // A few at a time, so the counter service is never flooded.
    for (let i = 0; i < keys.length; i += 8) {
      await Promise.all(keys.slice(i, i + 8).map(async k => {
        try {
          const r = await fetch(`${COUNTER}/get/${NS}/dl-${k}`, { cache: 'no-store' });
          if (!r.ok) return;
          const j = await r.json();
          if (j.value > 0) out[k] = j.value;
        } catch {}
      }));
    }
    return out;
  });
}

// Every download's city, from its numbered note: { 'ID:12': n, ... } (index into that country's list).
async function placeCounts() {
  return cached('pn-places', 10 * 60e3, async () => {
    const out = {};
    const r = await fetch(`${COUNTER}/get/${NS}/dl-seq`, { cache: 'no-store' }).catch(() => null);
    const n = r?.ok ? (await r.json()).value : 0;
    for (let i = 1; i <= n; i += 8) {
      await Promise.all(Array.from({ length: Math.min(8, n - i + 1) }, async (_, k) => {
        try {
          const q = await fetch(`${COUNTER}/get/${NS}/dl-log-${i + k}`, { cache: 'no-store' });
          if (!q.ok) return;
          const v = (await q.json()).value;
          const cc = ccOf(Math.floor(v / 100000)), idx = (v % 100000) - 1;
          if (!/^[A-Z]{2}$/.test(cc) || idx < 0) return;
          out[`${cc}:${idx}`] = (out[`${cc}:${idx}`] || 0) + 1;
        } catch {}
      }));
    }
    return out;
  });
}

function flag(cc) {
  if (cc.length !== 2 || isWindows) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function stats() {
  const root = $('[data-pn="stats"]');
  if (!root) return;
  platformCounts().then(n => {
    if (!n.total) return;
    for (const k of ['total', 'macos', 'windows']) $$(`[data-count="${k}"]`).forEach(el => (el.textContent = fmt(n[k])));
    const mac = Math.round((n.macos / n.total) * 100);
    root.style.setProperty('--mac', mac + '%');
    $$('[data-share="macos"]').forEach(el => (el.textContent = mac + '%'));
    $$('[data-share="windows"]').forEach(el => (el.textContent = 100 - mac + '%'));
    const chart = $('.st__releases', root);
    if (chart && n.releases?.length) {
      const max = Math.max(...n.releases.map(r => r.macos + r.windows), 1);
      chart.innerHTML = n.releases.map(r => {
        const t = r.macos + r.windows;
        return `<div class="st__rel" title="${r.tag}: ${fmt(r.macos)} Mac, ${fmt(r.windows)} Windows"><span class="st__reln">${fmt(t)}</span><span class="st__col" style="--h:${Math.max(3, Math.round((t / max) * 100))}%"><i style="--m:${t ? Math.round((r.macos / t) * 100) : 0}%"></i></span><span class="st__tag">${r.tag}</span></div>`;
      }).join('');
      chart.setAttribute('role', 'img');
      chart.setAttribute('aria-label', 'Downloads by release: ' + n.releases.map(r => `${r.tag}, ${r.macos} Mac and ${r.windows} Windows`).join('; '));
    }
  }).catch(() => {});

}

/* ---------- Where Polaric is downloaded: a dot on each country, the legend beside the map ---------- */

// Each country's centre (lat, lon), for its dot on the map.
const CENTRE = { ID: [-2.5, 118], MY: [3.8, 102], SG: [1.35, 103.8], TH: [15.5, 101], PH: [12.5, 122], VN: [16, 107], IN: [22, 79], JP: [36.5, 138.5],
  KR: [36.3, 127.8], CN: [35, 104], TW: [23.7, 121], HK: [22.3, 114.2], AU: [-25, 134], NZ: [-41.5, 172.5], US: [39.5, -98.5], CA: [57, -101],
  MX: [23.5, -102], BR: [-10, -52], AR: [-35, -65], CL: [-33, -71], CO: [4, -73], PE: [-9.5, -75], GB: [53.5, -2], IE: [53.3, -8], FR: [46.6, 2.4],
  DE: [51.2, 10.4], NL: [52.2, 5.5], BE: [50.6, 4.6], ES: [40.2, -3.7], PT: [39.6, -8], IT: [42.8, 12.6], CH: [46.8, 8.2], AT: [47.6, 14.1], SE: [62.5, 16],
  NO: [61, 9], DK: [56, 10], FI: [64, 26], PL: [52, 19.4], CZ: [49.8, 15.5], RO: [45.9, 25], HU: [47.2, 19.4], GR: [39.2, 22], TR: [39, 35], UA: [49, 31.5],
  RU: [58, 60], IL: [31.4, 35], AE: [24.2, 54.3], SA: [24, 45], QA: [25.3, 51.2], EG: [26.8, 30.8], MA: [31.8, -7.1], NG: [9.1, 8.7], KE: [0.2, 37.9],
  ZA: [-29, 24.7], PK: [30, 69.3], BD: [23.7, 90.3], LK: [7.9, 80.7], NP: [28.4, 84.1] };

function world() {
  const root = $('[data-pn="world"]');
  if (!root) return;
  const pins = $('.pn-map__pins', root);
  const list = $('.st__countries', root);
  const names = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
  const load = async () => {
    const map = await fetch('assets/polaric/worldmap.json').then(r => r.json()).catch(() => null);
    if (map) $('.pn-map__land', root).setAttribute('d', map.d);
    const W = map?.w || 1000, H = map?.h || 480, T = map?.top ?? 84, B = map?.bottom ?? -60;
    const xy = ([lat, lon]) => [((lon + 180) / 360) * W, ((T - lat) / (T - B)) * H];
    const [c, places] = await Promise.all([countryCounts().catch(() => ({})), placeCounts().catch(() => ({}))]);
    // Cities first (from the notes); whatever a country counted beyond its known cities stays on the country.
    const rows = [], perCc = {};
    for (const [k, v] of Object.entries(places)) {
      const [cc, idx] = k.split(':');
      const city = (await citiesOf(cc))[+idx];
      if (!city) continue;
      rows.push({ key: `${cc}-${idx}`, cc, city: city[0], at: [city[1], city[2]], v });
      perCc[cc] = (perCc[cc] || 0) + v;
    }
    for (const [k, v] of Object.entries(c)) {
      const cc = k.toUpperCase(), rest = v - (perCc[cc] || 0);
      if (rest > 0) rows.push({ key: k, cc: k === 'other' ? '' : cc, city: '', at: CENTRE[cc], v: rest });
    }
    rows.sort((a, b) => b.v - a.v);
    const total = rows.reduce((s, r) => s + r.v, 0);
    const label = r => r.cc ? [r.city, names?.of(r.cc) || r.cc].filter(Boolean).join(', ') : 'Other countries';
    // The big number is every download (GitHub's own count); places only exist from the day they were first counted.
    const all = await platformCounts().then(n => n.total).catch(() => 0);
    $$('[data-count="world-total"]', root).forEach(el => (el.textContent = fmt(Math.max(all, total))));
    const nc = new Set(rows.filter(r => r.cc).map(r => r.cc)).size, ncity = rows.filter(r => r.city).length;
    const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
    $$('[data-count="places"]', root).forEach(el => (el.textContent = [ncity && plural(ncity, 'city', 'cities'), plural(nc, 'country', 'countries')].filter(Boolean).join(' in ')));
    const cs = $('.pn-legend__cs', root); if (cs) cs.hidden = !nc;
    const max = rows.length ? rows[0].v : 1;
    const labelled = [];
    pins.innerHTML = rows.filter(r => r.at).map((r, i) => {
      const [x, y] = xy(r.at);
      const rad = (r.city ? 6 : 8) + 10 * Math.sqrt(r.v / max);
      // Close cities share one number (the biggest); the others show theirs on hover.
      const free = !labelled.some(([a, b]) => Math.hypot(a - x, b - y) < 34);
      if (free) labelled.push([x, y]);
      return `<g class="pn-pin${free ? '' : ' is-near'}" data-cc="${r.key}" style="--d:${i * 0.25}s"><title>${esc(label(r))}: ${fmt(r.v)}</title><circle class="pn-pin__ring" cx="${x}" cy="${y}" r="${rad}"/><circle class="pn-pin__dot" cx="${x}" cy="${y}" r="${rad * 0.55}"/><text x="${x}" y="${y - rad - 6}" text-anchor="middle">${fmt(r.v)}</text></g>`;
    }).join('');
    if (!rows.length) { list.dataset.state = 'empty'; return; }
    list.dataset.state = 'ready';
    list.innerHTML = rows.slice(0, 10).map(r => {
      const name = esc(label(r));
      const where = r.city ? `<span class="st__city">${esc(r.city)}</span><span class="st__cn">${esc(names?.of(r.cc) || r.cc)}</span>` : `<span class="st__city">${name}</span>${r.cc ? '<span class="st__cn">City not recorded</span>' : ''}`;
      return `<li data-cc="${r.key}" title="${name}"><span class="st__c">${r.cc ? `<span class="st__flag" aria-hidden="true">${flag(r.cc)}</span>` : ''}<span class="st__place">${where}</span></span><span class="st__bar" style="--w:${Math.max(4, Math.round((r.v / max) * 100))}%"><i></i></span><span class="st__n">${fmt(r.v)}</span></li>`;
    }).join('');
    // The legend and the map point at each other.
    const light = cc => { $$('.pn-pin', pins).forEach(p => p.classList.toggle('is-on', p.dataset.cc === cc)); $$('li', list).forEach(l => l.classList.toggle('is-on', l.dataset.cc === cc)); };
    root.addEventListener('pointerover', e => { const t = e.target.closest('[data-cc]'); light(t ? t.dataset.cc : null); });
  };
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '500px' });
  io.observe(root);
}

/* ---------- Scrolling: the night moves behind the page (black into blue), never the words ---------- */

function sky() {
  const el = $('.pn-sky');
  if (!el || reduced()) return;
  let y = -1;
  const tick = () => {
    if (scrollY !== y) {
      y = scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      el.style.setProperty('--sy', y.toFixed(1));
      el.style.setProperty('--sp', (y / max).toFixed(4));
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- Small things: links that report, the GitHub star count ---------- */

function links() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-ga]');
    if (a) window.gtag?.('event', a.dataset.ga, { link_url: a.href });
  });
}


hero();
simulator();
customise();
downloads();
stats();
world();
sky();
links();
