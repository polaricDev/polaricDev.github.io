const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const VERSION = '1.5.0';
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


// A download started from this page counts in Google Analytics and, with its city and country, on the
// map: one write-once note on the same counter the app uses (event 3 = website download; same number
// layout, see scripts/places.mjs). Once per platform per browser, so repeated clicks don't inflate it.
const COUNTER = 'https://abacus.jasoncameron.dev', NS = 'polaric-site';
function noteCode(platform, cc, lat, lon) {
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  let la = 9999, lo = 9999;
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0)) {
    la = Math.round((lat + 90) * 10); lo = Math.round((lon + 180) * 10);
  }
  const c = (cc.charCodeAt(0) - 65) * 26 + (cc.charCodeAt(1) - 65);
  return (platform === 'macos' ? 1 : 2) * 1e12 + 3 * 1e11 + c * 1e8 + la * 1e4 + lo;
}
async function noteDownload(platform) {
  const mark = `pn-dl-noted-${platform}`;
  try { if (localStorage.getItem(mark)) return; localStorage.setItem(mark, '1'); } catch {}
  try {
    const g = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' }).then(r => r.json());
    const code = noteCode(platform, String(g.country_code || '').toUpperCase(), parseFloat(g.latitude), parseFloat(g.longitude));
    if (!code) return;
    const n = (await fetch(`${COUNTER}/hit/${NS}/app-seq`, { cache: 'no-store' }).then(r => r.json())).value;
    if (n > 0) await fetch(`${COUNTER}/create/${NS}/app-log-${n}?initializer=${code}`, { keepalive: true, cache: 'no-store' });
  } catch {}
}
function countDownload(platform) {
  window.gtag?.('event', platform === 'macos' ? 'download_macos' : 'download_windows', { platform, app_version: VERSION, transport_type: 'beacon' });
  noteDownload(platform);
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

// Installs and updates by country, sent by the app itself (once per install, once per update).
// A GitHub Action sums the notes into assets/places.json every few hours; the page reads that file and
// only the few notes written since. A note = platform × 10000 + event × 1000 + country letters.
// (The counter service allows about 20 requests in 10 s, so never read many.)
const ccOf = n => String.fromCharCode(65 + Math.floor(n / 26), 65 + (n % 26));
const centres = () => cached('pn-centres', 864e5, () => fetch('assets/polaric/countries.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})));
// Cities and countries from assets/places.json, which a GitHub Action fills from the app's notes every
// hour (the counter service itself is too slow to ask from the page).
async function placeCounts() {
  const base = await fetch('assets/places.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  const rows = [];
  const left = {};
  for (const [cc, [i, u, d]] of Object.entries(base.countries || {})) left[cc] = [+i || 0, +u || 0, +d || 0];
  for (const [key, c] of Object.entries(base.cities || {})) {
    const [cc, city] = key.split('|');
    const [i = 0, u = 0, d = 0] = (c.n || []).map(x => +x || 0);
    rows.push({ key: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), cc, city, i, u, d, at: c.at });
    if (left[cc]) { left[cc][0] -= i; left[cc][1] -= u; left[cc][2] -= d; }
  }
  // Older notes knew only the country.
  for (const [cc, [i, u, d]] of Object.entries(left)) if (i > 0 || u > 0 || d > 0) rows.push({ key: cc.toLowerCase(), cc, city: null, i: Math.max(0, i), u: Math.max(0, u), d: Math.max(0, d), at: null });
  return rows;
}

function flag(cc) {
  if (cc.length !== 2 || isWindows) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function stats() {
  // The counts sit in the hero (.pn-counts); the old download section is gone.
  const root = $('[data-pn="stats"]') || $('.pn-counts');
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
    const [places, mid] = await Promise.all([placeCounts().catch(() => []), centres()]);
    const rows = places.map(r => ({ ...r, v: r.i + r.u + r.d, at: r.at || CENTRE[r.cc] || mid[r.cc] })).filter(r => r.v > 0).sort((a, b) => b.v - a.v);
    const total = rows.reduce((s, r) => s + r.v, 0);
    const country = r => names?.of(r.cc) || r.cc;
    const label = r => (r.city ? `${r.city}, ${country(r)}` : country(r));
    const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
    const detail = r => [r.d && plural(r.d, 'download', 'downloads'), r.i && plural(r.i, 'install', 'installs'), r.u && plural(r.u, 'update', 'updates')].filter(Boolean).join(' · ');
    const nCountries = new Set(rows.map(r => r.cc)).size, nCities = rows.filter(r => r.city).length;
    $$('[data-count="world-total"]', root).forEach(el => (el.textContent = fmt(total)));
    $$('[data-count="places"]', root).forEach(el => (el.textContent = [nCities && plural(nCities, 'city', 'cities'), plural(nCountries, 'country', 'countries')].filter(Boolean).join(' · ')));
    const cs = $('.pn-legend__cs', root); if (cs) cs.hidden = !rows.length;
    const max = rows.length ? rows[0].v : 1;
    const labelled = [];
    pins.innerHTML = rows.filter(r => r.at).map((r, i) => {
      const [x, y] = xy(r.at);
      const rad = 7 + 11 * Math.sqrt(r.v / max);
      // Close countries share one number (the biggest); the others show theirs on hover.
      const free = !labelled.some(([a, b]) => Math.hypot(a - x, b - y) < 34);
      if (free) labelled.push([x, y]);
      return `<g class="pn-pin${free ? '' : ' is-near'}" data-cc="${r.key}" style="--d:${i * 0.25}s"><title>${esc(label(r))}: ${esc(detail(r))}</title><circle class="pn-pin__ring" cx="${x}" cy="${y}" r="${rad}"/><circle class="pn-pin__dot" cx="${x}" cy="${y}" r="${rad * 0.55}"/><text x="${x}" y="${y - rad - 6}" text-anchor="middle">${fmt(r.v)}</text></g>`;
    }).join('');
    if (!rows.length) { list.dataset.state = 'empty'; return; }
    list.dataset.state = 'ready';
    list.innerHTML = rows.slice(0, 12).map(r => `<li data-cc="${r.key}" title="${esc(label(r))}: ${esc(detail(r))}"><span class="st__c"><span class="st__flag" aria-hidden="true">${flag(r.cc)}</span><span class="st__place"><span class="st__city">${esc(r.city || country(r))}</span><span class="st__cn">${esc(r.city ? `${country(r)} · ${detail(r)}` : detail(r))}</span></span></span><span class="st__bar" style="--w:${Math.max(4, Math.round((r.v / max) * 100))}%"><i></i></span><span class="st__n">${fmt(r.v)}</span></li>`).join('');
    // The legend and the map point at each other.
    const light = cc => { $$('.pn-pin', pins).forEach(p => p.classList.toggle('is-on', p.dataset.cc === cc)); $$('li', list).forEach(l => l.classList.toggle('is-on', l.dataset.cc === cc)); };
    root.addEventListener('pointerover', e => { const t = e.target.closest('[data-cc]'); light(t ? t.dataset.cc : null); });
  };
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '500px' });
  io.observe(root);
}

/* ---------- Scrolling: the night moves behind the page (black into blue), never the words ---------- */

/* ---------- Polaric's puppy: leans toward the pointer, hops when clicked ---------- */

function mascot() {
  const host = $('.pn-puppy');
  if (!host || reduced()) return;
  let raf = 0, x = 0, y = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = (e.clientX / innerWidth - 0.5) * 2; y = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; host.style.setProperty('--lx', x.toFixed(3)); host.style.setProperty('--ly', y.toFixed(3)); });
  }, { passive: true });
  host.addEventListener('click', () => {
    host.classList.remove('is-hop'); void host.offsetWidth; host.classList.add('is-hop');
  });
  host.addEventListener('animationend', e => { if (e.animationName === 'pn-hop') host.classList.remove('is-hop'); });
}

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

/* ---------- Rating Polaric: five stars beside the puppy, kept on the counter (no GitHub) ---------- */
// One counter per star (rate-1 … rate-5); a browser rates once (localStorage), the card shows the average.
function rating() {
  const root = $('[data-pn="rate"]');
  if (!root) return;
  const stars = $$('.pn-rate__star', root), msg = $('.pn-rate__msg', root);
  const MARK = 'pn-rated';
  let mine = 0;
  try { mine = +localStorage.getItem(MARK) || 0; } catch {}
  let counts = [0, 0, 0, 0, 0];
  const light = n => stars.forEach((b, i) => { b.classList.toggle('is-lit', i < n); b.setAttribute('aria-checked', String(i + 1 === n)); });
  const show = () => {
    const total = counts.reduce((a, b) => a + b, 0);
    const avg = total ? counts.reduce((a, c, i) => a + c * (i + 1), 0) / total : 0;
    $('[data-rate="avg"]', root).textContent = total ? avg.toFixed(1) : '–';
    root.toggleAttribute('data-empty', !total);
    $('[data-rate="count"]', root).textContent = total ? `${fmt(total)} ${total === 1 ? 'rating' : 'ratings'}` : 'Be the first to rate';
    if (!mine) light(Math.round(avg));
  };
  const done = n => {
    root.dataset.state = 'done';
    light(n);
    msg.textContent = `Thank you! You gave Polaric ${n} star${n > 1 ? 's' : ''}.`;
    stars.forEach(b => b.setAttribute('aria-disabled', 'true'));
  };
  if (mine >= 1 && mine <= 5) done(mine);
  Promise.all([1, 2, 3, 4, 5].map(i => fetch(`${COUNTER}/get/${NS}/rate-${i}`, { cache: 'no-store' })
    .then(r => r.json()).then(j => +j.value || 0).catch(() => 0)))
    .then(v => { counts = v.map((x, i) => Math.max(x, mine === i + 1 ? 1 : 0)); show(); });
  const open = () => root.dataset.state === 'open';
  stars.forEach((b, i) => {
    b.addEventListener('pointerenter', () => open() && light(i + 1));
    b.addEventListener('focus', () => open() && light(i + 1));
    b.addEventListener('click', () => {
      if (!open()) return;
      const n = i + 1;
      mine = n;
      try { localStorage.setItem(MARK, String(n)); } catch {}
      done(n);
      // Each lit star pops in turn and throws a few sparks.
      if (!reduced()) stars.slice(0, n).forEach((s, k) => {
        s.classList.remove('is-pop'); void s.offsetWidth;
        s.style.setProperty('--d', `${k * 0.07}s`); s.classList.add('is-pop');
        s.querySelectorAll('i').forEach(x => x.remove());
        for (let a = 0; a < 6; a++) { const sp = document.createElement('i'); sp.style.setProperty('--a', `${a * 60 + k * 12}deg`); sp.style.setProperty('--d', `${k * 0.07 + 0.12}s`); s.append(sp); }
      });
      const pup = $('.pn-puppy');
      if (pup && !reduced()) { pup.classList.remove('is-hop'); void pup.offsetWidth; pup.classList.add('is-hop'); }
      counts[n - 1]++; show();
      fetch(`${COUNTER}/hit/${NS}/rate-${n}`, { keepalive: true, cache: 'no-store' }).catch(() => {});
      window.gtag?.('event', 'rate_polaric', { stars: n });
    });
  });
  root.addEventListener('pointerleave', () => { if (open()) show(); });
  root.addEventListener('focusout', e => { if (open() && !root.contains(e.relatedTarget)) show(); });
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
mascot();
links();
rating();
