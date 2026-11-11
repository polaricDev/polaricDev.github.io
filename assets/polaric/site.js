import { Notch, GLOWS, GLOW_NAMES } from './notch.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const VERSION = '1.4.2.1';
const REPO = 'polaricDev/polaricDev.github.io';
const DL = {
  macos: `https://github.com/${REPO}/releases/latest/download/Polaric-Notch.dmg`,
  windows: `https://github.com/${REPO}/releases/latest/download/Polaric-Setup.exe`,
};
const logo = n => `<img class="pn-logo" src="assets/img/logos/${n}.png" alt="" width="20" height="20">`;
const isWindows = /Win/i.test(navigator.userAgentData?.platform || navigator.platform || '');
const isMac = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform || '') && !('ontouchend' in document && navigator.maxTouchPoints > 1);

/* ---------- What the notch shows: the app's own layouts and words ---------- */

const SHOW = {
  rest: () => ['resting', `<div class="pn-wings"><span class="pn-eye"></span><span class="pn-cam"></span><span class="pn-eye"></span></div>`],
  closed: () => ['closed', ''],
  music: () => ['wings', `<div class="pn-wings"><span class="pn-art" aria-hidden="true"></span><span class="pn-cam"></span><span class="pn-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`],
  song: () => ['toast', `<div class="pn-line">${logo('media-spotify')}<b>Midnight Drive</b><span class="pn-dim">· Polaric FM</span></div>`],
  lyric: (line = 'City lights are calling out my name') => ['toast', `<div class="pn-line pn-line--lyric"><span class="pn-eq pn-eq--sm" aria-hidden="true"><i></i><i></i><i></i></span><b>${line}</b></div>`],
  whatsapp: (n = 1) => ['toast', `<div class="pn-line">${logo('notify-whatsapp')}<b>Rina</b><span class="pn-sep">|</span><span>${n} New message${n > 1 ? 's' : ''} received</span></div>`],
  email: () => ['toast', `<div class="pn-line">${logo('notify-gmail')}<span>Email received from <b>Dimas</b></span><span class="pn-sep">|</span><span class="pn-dim">Slides for Friday</span></div>`],
  slack: () => ['toast', `<div class="pn-line">${logo('notify-slack')}<b>#design</b><span class="pn-sep">|</span><span>1 New message received</span></div>`],
  meeting: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">Meeting in 1 minute</span><b class="pn-big">Daily stand-up</b><span class="pn-small pn-dim">10:00 to 10:15 · Google Meet</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Join</span><span class="pn-btn">Later</span></div></div>`],
  inCall: () => ['meetingLine', `<div class="pn-wings"><span class="pn-pill pn-pill--red">Mic</span><span class="pn-cam"></span><span class="pn-pill pn-pill--green">Cam · 03:12</span></div>`],
  aiWorking: (phase = 'Analyzing context') => ['aiWorking', `<div class="pn-wings pn-wings--ai"><span class="pn-spark" aria-hidden="true"></span><span class="pn-ai-txt">${phase === 'Analyzing context' ? 'Processing' : 'Evaluating'} <span class="pn-sep">|</span> <span class="pn-dim">${phase}</span></span></div>`],
  aiDone: () => ['ai', `<div class="pn-ai"><div class="pn-ai__head"><span class="pn-ok" aria-hidden="true"></span><span>Analysis <b class="pn-green">Complete</b></span></div><b class="pn-ai__ans">Canberra</b><p class="pn-ai__why">Many people guess Sydney, but Australia's capital is Canberra, a city built to be the seat of government.</p></div>`],
  volume: (v = 0.62) => ['level', `<div class="pn-level"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg><span class="pn-bar"><i style="width:${Math.round(v * 100)}%"></i></span></div>`],
  timer: (t = '24:59') => ['timer', `<div class="pn-wings"><span class="pn-ring" aria-hidden="true"></span><span class="pn-cam"></span><span class="pn-mono">${t}</span></div>`],
  focusDone: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">Timer</span><b class="pn-big">Focus done: 25 minutes</b><span class="pn-small pn-dim">Take five. The next one starts when you say.</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Start break</span></div></div>`],
  shot: () => ['toast', `<div class="pn-line"><svg class="pn-ic" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="5" width="15" height="11" rx="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="10" cy="10.5" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg><b>Screenshot</b><span class="pn-sep">|</span><span>Copied and saved</span></div>`],
  prompter: () => ['prompter', `<div class="pn-prompter"><div class="pn-prompter__roll"><p>Good morning, everyone.</p><p>Three things today: the launch date,</p><p>the new pricing, and who owns the demo.</p><p>First, the launch moves to the 18th.</p><p>Marketing has the assets ready,</p><p>and support has the answers written.</p></div></div>`],
  autotext: () => ['toast', `<div class="pn-line"><svg class="pn-ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 15 9 4l5 11M6 11h6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><b>AutoText</b><span class="pn-sep">|</span><span class="pn-dim">.addr became your address</span></div>`],
  memo: () => ['open', `<div class="pn-memo"><b>Today</b><p>Send the slides to Dimas</p><p>Book the dentist for Thursday</p><p>Ask Rina about the venue</p></div>`],
};

function put(n, key, ...args) {
  const [mode, html] = SHOW[key](...args);
  n.show(mode, html);
}

/* A run of steps that stops when another run starts (a new tab, a pause). */
function runner() {
  let token = 0;
  const api = {
    async play(steps) {
      const my = ++token;
      const wait = ms => new Promise(res => setTimeout(res, reduced() ? Math.min(ms, 400) : ms));
      for (const step of steps) {
        if (my !== token) return false;
        await step(wait, () => my === token);
      }
      return my === token;
    },
    stop() { token++; },
  };
  return api;
}

/* ---------- Hero: the top of a MacBook, the notch living through a minute in 13 seconds ---------- */

function hero() {
  const stage = $('[data-pn="hero"]');
  if (!stage) return;
  const scale = () => (stage.clientWidth < 600 ? 0.78 : stage.clientWidth < 900 ? 1 : 1.18);
  const n = new Notch(stage, { scale: scale(), palette: 'prism', mode: 'resting', top: 0 });
  window.addEventListener('resize', () => { n.scale = scale(); n.kick(); });
  put(n, 'rest');
  const r = runner();
  let paused = false;
  const loop = async () => {
    while (!paused) {
      const ok = await r.play([
        w => (put(n, 'rest'), w(2200)),
        w => (put(n, 'music'), w(1500)),
        w => (put(n, 'song'), w(2300)),
        w => (put(n, 'whatsapp'), w(2400)),
        w => (n.setGlow({ palette: 'blueViolet' }), put(n, 'aiWorking'), w(1300)),
        w => (put(n, 'aiWorking', 'Checking the answer'), w(1000)),
        w => (n.setGlow({ palette: 'green' }), put(n, 'aiDone'), w(3200)),
        w => (n.setGlow({ palette: 'prism' }), put(n, 'music'), w(1400)),
      ]);
      if (!ok || reduced()) break;
    }
  };
  // Under reduced motion the notch holds its finished picture: the AI answer, the glow still.
  if (reduced()) { n.setGlow({ palette: 'green' }); put(n, 'aiDone'); } else loop();
  const btn = $('[data-pn-pause="hero"]');
  btn?.addEventListener('click', () => {
    paused = !paused;
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play the notch' : 'Pause the notch');
    n.setPaused(paused);
    if (paused) r.stop(); else loop();
  });
}

/* ---------- The simulator: every feature, on a Mac or as the Windows island ---------- */

function simulator() {
  const root = $('[data-pn="sim"]');
  if (!root) return;
  const desk = $('.sim__desk', root);
  const stage = $('.sim__notch', root);
  const scale = () => Math.max(0.62, Math.min(1, desk.clientWidth / 900));
  const n = new Notch(stage, { scale: scale(), palette: 'prism', mode: 'resting' });
  window.addEventListener('resize', () => { n.scale = scale(); n.kick(); });
  put(n, 'rest');
  const r = runner();
  const cover = $('.sim__privacy', root);
  const card = $('.sim__shot', root);
  const flash = $('.sim__flash', root);
  const field = $('.sim__type', root);
  const win = $('.sim__win', root);
  const reset = () => {
    cover.hidden = true; card.hidden = true; win.classList.remove('is-typing');
    n.setGlow({ palette: currentGlow() });
  };
  const type = async (w, alive, text, speed = 55) => {
    for (const ch of text) { if (!alive()) return; field.textContent += ch; await w(speed); }
  };

  const scenes = {
    music: [
      w => (put(n, 'music'), w(1400)),
      w => (put(n, 'song'), w(2200)),
      w => (put(n, 'lyric', 'City lights are calling out my name'), w(2000)),
      w => (put(n, 'lyric', 'Driving slow so I can feel the rain'), w(2000)),
      w => (put(n, 'volume', 0.4), w(900)),
      w => (put(n, 'volume', 0.7), w(1100)),
      w => (put(n, 'music'), w(10)),
    ],
    messages: [
      w => (put(n, 'whatsapp'), w(1500)),
      w => (put(n, 'whatsapp', 2), w(1500)),
      w => (put(n, 'whatsapp', 3), w(1700)),
      w => (put(n, 'email'), w(2600)),
      w => (put(n, 'slack'), w(2200)),
      w => (put(n, 'rest'), w(10)),
    ],
    meeting: [
      w => (put(n, 'meeting'), w(3200)),
      w => (put(n, 'inCall'), w(3600)),
      w => (put(n, 'rest'), w(10)),
    ],
    ai: [
      w => (n.setGlow({ palette: 'blueViolet' }), put(n, 'aiWorking'), w(1400)),
      w => (put(n, 'aiWorking', 'Checking the answer'), w(1100)),
      w => (n.setGlow({ palette: 'green' }), put(n, 'aiDone'), w(4200)),
      w => (n.setGlow({ palette: currentGlow() }), put(n, 'rest'), w(10)),
    ],
    privacy: [
      w => (cover.hidden = false, cover.classList.remove('is-open'), put(n, 'closed'), w(50)),
      w => (cover.classList.add('is-open'), w(10)),
    ],
    autotext: [
      w => (win.classList.add('is-typing'), field.textContent = '', put(n, 'rest'), w(300)),
      (w, a) => type(w, a, 'Send the package to .addr'),
      w => w(350),
      w => (field.textContent = 'Send the package to Jl. Merdeka 1, Jakarta 10110', put(n, 'autotext'), w(2600)),
      (w, a) => type(w, a, '. Thanks!', 70),
      w => (put(n, 'rest'), w(10)),
    ],
    shot: [
      w => (flash.classList.remove('is-on'), void flash.offsetWidth, flash.classList.add('is-on'), w(120)),
      w => (put(n, 'shot'), card.hidden = false, w(3400)),
      w => (card.hidden = true, put(n, 'rest'), w(10)),
    ],
    timer: [
      w => (put(n, 'timer', '00:05'), w(1000)),
      w => (put(n, 'timer', '00:04'), w(1000)),
      w => (put(n, 'timer', '00:03'), w(1000)),
      w => (put(n, 'timer', '00:02'), w(1000)),
      w => (put(n, 'timer', '00:01'), w(1000)),
      w => (put(n, 'focusDone'), w(3600)),
      w => (put(n, 'rest'), w(10)),
    ],
    prompter: [
      w => (put(n, 'prompter'), w(9000)),
      w => (put(n, 'rest'), w(10)),
    ],
    memo: [
      w => (put(n, 'memo'), w(4200)),
      w => (put(n, 'rest'), w(10)),
    ],
  };

  const tabs = $$('[data-play]', root);
  const play = id => {
    r.stop();
    reset();
    tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.play === id)));
    r.play(scenes[id]);
    window.gtag?.('event', 'notch_preview_select', { moment: id });
  };
  tabs.forEach(t => t.addEventListener('click', () => play(t.dataset.play)));
  $('.sim__unlock', root)?.addEventListener('click', () => { cover.classList.remove('is-open'); setTimeout(() => (cover.hidden = true, put(n, 'rest')), 380); });

  // Mac notch or the Windows island (no camera: it floats, round, at the top centre).
  $$('[data-os]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-os]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    root.dataset.platform = b.dataset.os;
    n.top = b.dataset.os === 'windows' ? 8 : 0;
    n.setGlow({ floating: b.dataset.os === 'windows' });
  }));
  if (isWindows) $('[data-os="windows"]', root)?.click();

  root.pnNotch = n;
  window.addEventListener('pn:glow', e => { n.setGlow(e.detail); });
}

/* ---------- Customise: the 20 glows, speed, light, mascots ---------- */

let glowChoice = 'prism';
const currentGlow = () => glowChoice;

function customise() {
  const root = $('[data-pn="custom"]');
  if (!root) return;
  const stage = $('.cz__notch', root);
  const big = () => (stage.clientWidth < 520 ? 1.1 : 1.6);
  const n = new Notch(stage, { scale: big(), palette: 'prism', mode: 'toast', top: 0 });
  window.addEventListener('resize', () => { n.scale = big(); n.kick(); });
  const mascot = name => n.show('toast', `<img class="pn-mascot" src="assets/img/mascots/${name}.webp" alt="" width="150" height="56">`);
  mascot('foxy');

  const grid = $('.cz__swatches', root);
  grid.innerHTML = Object.keys(GLOWS).map(k => {
    const c = GLOWS[k];
    const bg = c.length > 1 ? `conic-gradient(from 200deg, ${[...c, c[0]].join(',')})` : c[0];
    return `<button type="button" class="cz__sw" data-glow-pick="${k}" aria-pressed="${k === 'prism'}" aria-label="${GLOW_NAMES[k]}" title="${GLOW_NAMES[k]}" style="--sw:${bg}"></button>`;
  }).join('');
  const label = $('.cz__glowname', root);
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-glow-pick]');
    if (!b) return;
    glowChoice = b.dataset.glowPick;
    $$('[data-glow-pick]', grid).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    label.textContent = GLOW_NAMES[glowChoice];
    n.setGlow({ palette: glowChoice });
    window.dispatchEvent(new CustomEvent('pn:glow', { detail: { palette: glowChoice } }));
  });
  const speed = $('#cz-speed', root), light = $('#cz-light', root);
  const out = (input, el) => { el.textContent = (+input.value).toFixed(input.step.includes('.') ? 2 : 0).replace(/\.?0+$/, '') + '×'; };
  speed.addEventListener('input', () => { n.setGlow({ speed: +speed.value }); out(speed, $('#cz-speed-out')); window.dispatchEvent(new CustomEvent('pn:glow', { detail: { speed: +speed.value } })); });
  light.addEventListener('input', () => { n.setGlow({ amount: +light.value }); out(light, $('#cz-light-out')); window.dispatchEvent(new CustomEvent('pn:glow', { detail: { amount: +light.value } })); });
  $$('[data-mascot]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-mascot]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    mascot(b.dataset.mascot);
  }));
}

/* ---------- Downloads: the right file for this computer, counted by platform and by country ---------- */

const COUNTRIES = 'ID MY SG TH PH VN IN JP KR CN TW HK AU NZ US CA MX BR AR CL CO PE GB IE FR DE NL BE ES PT IT CH AT SE NO DK FI PL CZ RO HU GR TR UA RU IL AE SA QA EG MA NG KE ZA PK BD LK NP'.split(' ');
const COUNTER = 'https://abacus.jasoncameron.dev';
const NS = 'polaric-site';

async function country() {
  try {
    const r = await fetch('https://get.geojs.io/v1/ip/country.json', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.country) return String(j.country).toUpperCase(); }
  } catch {}
  try {
    const r = await fetch('https://ipwho.is/?fields=country_code', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.country_code) return String(j.country_code).toUpperCase(); }
  } catch {}
  return '';
}

function countDownload(platform) {
  window.gtag?.('event', platform === 'macos' ? 'download_macos' : 'download_windows', { platform, app_version: VERSION, transport_type: 'beacon' });
  // One download from this page: the visitor's country (from their IP, asked only now) gets one more.
  country().then(cc => {
    const key = COUNTRIES.includes(cc) ? `dl-${cc.toLowerCase()}` : 'dl-other';
    return Promise.all([
      fetch(`${COUNTER}/hit/${NS}/${key}`, { keepalive: true, cache: 'no-store' }),
      fetch(`${COUNTER}/hit/${NS}/dl-${platform}-site`, { keepalive: true, cache: 'no-store' }),
    ]);
  }).then(() => { try { sessionStorage.removeItem('pn-countries'); } catch {} }).catch(() => {});
}

function downloads() {
  // The page's main button takes this computer's file; elsewhere it goes to both.
  $$('[data-download="auto"]').forEach(a => {
    if (isMac) { a.href = DL.macos; a.dataset.platform = 'macos'; }
    else if (isWindows) { a.href = DL.windows; a.dataset.platform = 'windows'; }
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-download]');
    if (!a) return;
    const p = a.dataset.platform || a.dataset.download;
    if (p === 'macos' || p === 'windows') countDownload(p);
  });
}

const fmt = n => n.toLocaleString('en-US');

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

  const list = $('.st__countries', root);
  const names = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
  const load = () => countryCounts().then(c => {
    const rows = Object.entries(c).sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, [, v]) => s + v, 0);
    $$('[data-count="countries"]').forEach(el => (el.textContent = fmt(rows.filter(([k]) => k !== 'other').length)));
    $$('[data-count="tracked"]').forEach(el => (el.textContent = fmt(total)));
    if (!rows.length) { list.dataset.state = 'empty'; return; }
    list.dataset.state = 'ready';
    list.innerHTML = rows.slice(0, 8).map(([k, v]) => {
      const cc = k.toUpperCase();
      const name = k === 'other' ? 'Other countries' : names?.of(cc) || cc;
      return `<li><span class="st__c">${k === 'other' ? '' : `<span class="st__flag" aria-hidden="true">${flag(cc)}</span>`}${name}</span><span class="st__bar" style="--w:${Math.max(4, Math.round((v / rows[0][1]) * 100))}%"><i></i></span><span class="st__n">${fmt(v)}</span></li>`;
    }).join('');
  }).catch(() => { list.dataset.state = 'empty'; });
  // Asked for only when the section comes near, never at load.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '400px' });
    io.observe(root);
  } else load();
}

/* ---------- Small things: links that report, the GitHub star count ---------- */

function links() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-ga]');
    if (a) window.gtag?.('event', a.dataset.ga, { link_url: a.href });
  });
}

hero();
customise();
simulator();
downloads();
stats();
links();
