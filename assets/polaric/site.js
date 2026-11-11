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

const IC = {"sun": "<circle cx=\"10\" cy=\"10\" r=\"3.4\" fill=\"currentColor\"/><path d=\"M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>", "bat": "<rect x=\"2\" y=\"6\" width=\"14\" height=\"8\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.5\" fill=\"none\"/><rect x=\"3.6\" y=\"7.6\" width=\"3\" height=\"4.8\" rx=\"1\" fill=\"#ff5f7e\"/><path d=\"M17.5 8.5v3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>", "pods": "<path d=\"M6 4a2.5 2.5 0 0 1 2.5 2.5V12a1.5 1.5 0 0 1-3 0V9.5A2.5 2.5 0 0 1 6 4zM14 4a2.5 2.5 0 0 0-2.5 2.5V12a1.5 1.5 0 0 0 3 0V9.5A2.5 2.5 0 0 0 14 4z\" stroke=\"currentColor\" stroke-width=\"1.4\" fill=\"none\"/>", "wifi": "<path d=\"M2.5 8a10.5 10.5 0 0 1 15 0M5 10.6a7 7 0 0 1 10 0M7.6 13.2a3.4 3.4 0 0 1 4.8 0\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"10\" cy=\"15.6\" r=\"1.2\" fill=\"currentColor\"/>", "down": "<path d=\"M10 3v9M6 8.5l4 4 4-4M4 16h12\" stroke=\"currentColor\" stroke-width=\"1.7\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "cam": "<rect x=\"2.5\" y=\"5.5\" width=\"10\" height=\"9\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"m12.5 9 5-3v8l-5-3z\" fill=\"currentColor\"/>", "moon": "<path d=\"M14.5 13.5A6.5 6.5 0 0 1 8 3.6a6.5 6.5 0 1 0 6.5 9.9z\" fill=\"currentColor\"/>", "text": "<path d=\"M3 5h14M3 9h14M3 13h9\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/>", "clip": "<rect x=\"5\" y=\"3.5\" width=\"10\" height=\"14\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M8 3.5h4v2H8z\" fill=\"currentColor\"/>", "rec": "<circle cx=\"10\" cy=\"10\" r=\"5\" fill=\"#ff4d5e\"/>", "lock": "<rect x=\"4.5\" y=\"9\" width=\"11\" height=\"8\" rx=\"2\" fill=\"currentColor\"/><path d=\"M7 9V7a3 3 0 0 1 6 0v2\" stroke=\"currentColor\" stroke-width=\"1.7\" fill=\"none\"/>", "remote": "<rect x=\"2.5\" y=\"4\" width=\"15\" height=\"10\" rx=\"1.8\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M7 17h6M10 14v3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><path d=\"M8 8l2.5 1.5L8 11z\" fill=\"currentColor\"/>", "chart": "<path d=\"M4 16V9M8.5 16V5M13 16v-5M17 16V7\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>", "warn": "<path d=\"M10 3 18 17H2z\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\" stroke-linejoin=\"round\"/><path d=\"M10 8v4\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><circle cx=\"10\" cy=\"14.4\" r=\"1\" fill=\"currentColor\"/>", "rain": "<path d=\"M6 11a4 4 0 0 1 .3-8A5 5 0 0 1 15.6 5 3 3 0 0 1 15 11z\" fill=\"currentColor\"/><path d=\"M7 14l-1 3M11 14l-1 3M15 14l-1 3\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>", "check": "<circle cx=\"10\" cy=\"10\" r=\"7.5\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"m6.8 10.2 2.2 2.2 4.2-4.6\" stroke=\"currentColor\" stroke-width=\"1.7\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "game": "<path d=\"M6 7h8a4 4 0 0 1 3.9 4.8l-.6 2.8a2 2 0 0 1-3.4.9L12 13.5H8l-1.9 2a2 2 0 0 1-3.4-.9l-.6-2.8A4 4 0 0 1 6 7z\" stroke=\"currentColor\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M7 9.5v2.5M5.8 10.75h2.4\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>", "caps": "<path d=\"M10 3 4 10h3.5v4h5v-4H16z\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\" stroke-linejoin=\"round\"/><path d=\"M7.5 17h5\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>"};
const ic = (k, c = "") => `<svg class="pn-ic ${c}" viewBox="0 0 20 20" aria-hidden="true">${IC[k]}</svg>`;
let mascotChoice = "kitsune";

const SHOW = {
  rest: (m = mascotChoice) => ['toast', `<img class="pn-mascot" src="assets/img/mascots/${m}.webp" alt="" width="150" height="56">`],
  closed: () => ['closed', ''],
  music: () => ['wings', `<div class="pn-wings"><span class="pn-art" aria-hidden="true"></span><span class="pn-cam"></span><span class="pn-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`],
  song: () => ['toast', `<div class="pn-line">${logo('media-spotify')}<b>Midnight Drive</b><span class="pn-dim">· Polaric FM</span></div>`],
  lyric: (line = 'City lights are calling out my name') => ['toast', `<div class="pn-line pn-line--lyric"><span class="pn-eq pn-eq--sm" aria-hidden="true"><i></i><i></i><i></i></span><b>${line}</b></div>`],
  whatsapp: (n = 1) => ['toast', `<div class="pn-line">${logo('notify-whatsapp')}<b>Rina</b><span class="pn-sep">|</span><span>${n} New message${n > 1 ? 's' : ''} received</span></div>`],
  telegram: () => ['toast', `<div class="pn-line">${logo('notify-telegram')}<b>Family</b><span class="pn-sep">|</span><span>1 New message received</span></div>`],
  email: () => ['toast', `<div class="pn-line">${logo('notify-gmail')}<span>Email received from <b>Dimas</b></span><span class="pn-sep">|</span><span class="pn-dim">Slides for Friday</span></div>`],
  slack: () => ['toast', `<div class="pn-line">${logo('notify-slack')}<b>#design</b><span class="pn-sep">|</span><span>1 New message received</span></div>`],
  teams: () => ['toast', `<div class="pn-line">${logo('notify-teams')}<b>Budi</b><span class="pn-sep">|</span><span>1 New message received</span></div>`],
  meeting: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">Meeting in 1 minute</span><b class="pn-big">Daily stand-up</b><span class="pn-small pn-dim">10:00 to 10:15 · Google Meet</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Join</span><span class="pn-btn">Later</span></div></div>`],
  inCall: () => ['meetingLine', `<div class="pn-wings"><span class="pn-pill pn-pill--red">Mic</span><span class="pn-cam"></span><span class="pn-pill pn-pill--green">Cam · 03:12</span></div>`],
  aiWorking: (phase = 'Analyzing context') => ['aiWorking', `<div class="pn-wings pn-wings--ai"><span class="pn-spark" aria-hidden="true"></span><span class="pn-ai-txt">${phase === 'Analyzing context' ? 'Processing' : 'Evaluating'} <span class="pn-sep">|</span> <span class="pn-dim">${phase}</span></span></div>`],
  aiDone: () => ['ai', `<div class="pn-ai"><div class="pn-ai__head"><span class="pn-ok" aria-hidden="true"></span><span>Analysis <b class="pn-green">Complete</b></span></div><b class="pn-ai__ans">Canberra</b><p class="pn-ai__why">Many people guess Sydney, but Australia's capital is Canberra, a city built to be the seat of government.</p></div>`],
  aiTask: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">${logo('claude')} Claude Code › website</span><b class="pn-big">Task <span class="pn-green">Completed</span></b><span class="pn-small pn-dim">Finished while you were away · 4 min</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Open</span></div></div>`],
  aiAsk: () => ['toast', `<div class="pn-line">${logo('claude')}<b>Claude is asking you a question</b><span class="pn-sep">|</span><span class="pn-dim">website</span></div>`],
  aiLimit: () => ['level', `<div class="pn-level">${logo('claude')}<span class="pn-small">Claude</span><span class="pn-bar pn-bar--warn"><i style="width:82%"></i></span><span class="pn-mono pn-sm">82%</span></div>`],
  volume: (v = 0.62) => ['level', `<div class="pn-level"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg><span class="pn-bar"><i style="width:${Math.round(v * 100)}%"></i></span></div>`],
  bright: (v = 0.5) => ['level', `<div class="pn-level">${ic('sun')}<span class="pn-bar"><i style="width:${Math.round(v * 100)}%"></i></span></div>`],
  caps: () => ['toast', `<div class="pn-line">${ic('caps')}<b>Caps Lock</b><span class="pn-sep">|</span><span class="pn-green">On</span></div>`],
  battery: () => ['toast', `<div class="pn-line">${ic('bat', 'pn-ic--warn')}<b>Battery 18%</b><span class="pn-sep">|</span><span class="pn-dim">About 40 minutes left</span></div>`],
  pods: () => ['toast', `<div class="pn-line">${ic('pods')}<b>AirPods Pro</b><span class="pn-sep">|</span><span class="pn-dim">L 80% · R 76% · Case 62%</span></div>`],
  wifi: () => ['toast', `<div class="pn-line">${ic('wifi')}<b>Wi-Fi</b><span class="pn-sep">|</span><span class="pn-dim">Connected to Home 5G · 412 Mbps</span></div>`],
  unstable: () => ['toast', `<div class="pn-line">${ic('warn', 'pn-ic--warn')}<b>Network unstable</b><span class="pn-sep">|</span><span class="pn-dim">Told once, not every time</span></div>`],
  publicWifi: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">${ic('warn', 'pn-ic--warn')} Public Wi-Fi</span><b class="pn-big">"Cafe Free WiFi" is open</b><span class="pn-small pn-dim">Anyone nearby can see what isn't encrypted.</span></div><div class="pn-alert__btns"><span class="pn-btn">OK</span></div></div>`],
  data: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">${ic('chart')} Data Usage Today</span><b class="pn-big">↓ 2.41 GB · ↑ 318 MB</b><span class="pn-small pn-dim">Since midnight, every Wi-Fi and hotspot</span></div></div>`],
  download: () => ['toast', `<div class="pn-line">${ic('down')}<b>Download complete</b><span class="pn-sep">|</span><span class="pn-dim">Report-Q3.pdf · 4.2 MB</span></div>`],
  camera: () => ['toast', `<div class="pn-line">${ic('cam', 'pn-ic--green')}<b>Camera in use</b><span class="pn-sep">|</span><span class="pn-dim">Zoom started it</span></div>`],
  mic: () => ['toast', `<div class="pn-line"><span class="pn-pill pn-pill--red">Mic</span><b>Microphone in use</b><span class="pn-sep">|</span><span class="pn-dim">Voice Memos</span></div>`],
  remote: () => ['meetingLine', `<div class="pn-wings"><span class="pn-small">${ic('remote', 'pn-ic--warn')} <b>Remote Active</b></span><span class="pn-cam"></span><span class="pn-small pn-dim">by Budi · AnyDesk</span></div>`],
  locked: () => ['toast', `<div class="pn-line">${ic('lock')}<b>Chrome</b><span class="pn-sep">|</span><span class="pn-dim">Locked by App Lock</span></div>`],
  timer: (t = '24:59') => ['timer', `<div class="pn-wings"><span class="pn-ring" aria-hidden="true"></span><span class="pn-cam"></span><span class="pn-mono">${t}</span></div>`],
  focusDone: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">Timer</span><b class="pn-big">Focus done: 25 minutes</b><span class="pn-small pn-dim">Take five. The next one starts when you say.</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Start break</span></div></div>`],
  todo: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">${ic('check')} To-do, due now</span><b class="pn-big">Send the invoice to Dimas</b><span class="pn-small pn-dim">Reminder you set this morning</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Done</span><span class="pn-btn">In 10 min</span></div></div>`],
  prayer: () => ['alert', `<div class="pn-alert"><div class="pn-alert__txt"><span class="pn-small">${ic('moon')} Prayer Times · Jakarta</span><b class="pn-big">Asr, 15:12</b><span class="pn-small pn-dim">Kemenag RI times for your city</span></div><div class="pn-alert__btns"><span class="pn-btn pn-btn--go">Done</span><span class="pn-btn">In 10 min</span></div></div>`],
  ambient: () => ['wings', `<div class="pn-wings">${ic('rain')}<span class="pn-cam"></span><span class="pn-small">Rain · 60%</span></div>`],
  shot: () => ['toast', `<div class="pn-line"><svg class="pn-ic" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="5" width="15" height="11" rx="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="10" cy="10.5" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg><b>Screenshot</b><span class="pn-sep">|</span><span>Copied and saved</span></div>`],
  ocr: () => ['toast', `<div class="pn-line">${ic('text')}<b>Text copied</b><span class="pn-sep">|</span><span class="pn-dim">3 lines, ready to paste</span></div>`],
  rec: (t = '00:03') => ['wings', `<div class="pn-wings">${ic('rec')}<span class="pn-cam"></span><span class="pn-mono">${t}</span></div>`],
  recDone: () => ['toast', `<div class="pn-line">${ic('rec')}<b>Recording saved</b><span class="pn-sep">|</span><span class="pn-dim">MP4 · 0:06 · copied</span></div>`],
  clip: () => ['open', `<div class="pn-panel"><b class="pn-panel__h">${ic('clip')} Clipboard</b><ul class="pn-list"><li>Jl. Merdeka 1, Jakarta 10110<span>now</span></li><li>https://polaricdev.github.io<span>2 min</span></li><li>Meeting notes, Friday<span>9 min</span></li><li>BCA 123 456 7890<span>1 h</span></li></ul></div>`],
  snap: () => ['open', `<div class="pn-snap"><b class="pn-panel__h">Drop the window into a layout</b><div class="pn-snap__grid"><i class="is-on"><b></b><b></b></i><i><b></b><b></b><b></b></i><i><b></b><b></b><b></b><b></b></i><i><b></b><b></b></i><i><b></b></i><i><b></b><b></b><b></b></i></div></div>`],
  game: () => ['toast', `<div class="pn-line">${ic('game')}<b>Game</b><span class="pn-sep">·</span><span class="pn-mono">144 FPS</span><img class="pn-mascot pn-mascot--sm" src="assets/img/mascots/${mascotChoice}.webp" alt=""></div>`],
  clock: () => ['open', `<div class="pn-clock"><b class="pn-clock__t">10:42</b><span class="pn-dim">Wednesday 11 November</span><img class="pn-mascot" src="assets/img/mascots/${mascotChoice}.webp" alt=""></div>`],
  prompter: () => ['prompter', `<div class="pn-prompter"><div class="pn-prompter__roll"><p>Good morning, everyone.</p><p>Three things today: the launch date,</p><p>the new pricing, and who owns the demo.</p><p>First, the launch moves to the 18th.</p><p>Marketing has the assets ready,</p><p>and support has the answers written.</p></div></div>`],
  autotext: () => ['toast', `<div class="pn-line"><svg class="pn-ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 15 9 4l5 11M6 11h6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><b>AutoText</b><span class="pn-sep">|</span><span class="pn-dim">.addr became your address</span></div>`],
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
  put(n, 'rest', 'kitsune');
  const r = runner();
  let paused = false;
  // A different mascot greets each round.
  const crew = ['kitsune', 'foxy', 'nyanko', 'aurora', 'mochi', 'draco'];
  let round = 0;
  const loop = async () => {
    while (!paused) {
      const ok = await r.play([
        w => (put(n, 'rest', crew[round++ % crew.length]), w(2400)),
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
  const memo = $('.sim__memo', root);
  const ocr = $('.sim__ocr', root);
  const rec = $('.sim__rec', root);
  const coverTxt = $('.sim__privacy-txt', root);
  const unlock = $('.sim__unlock', root);
  const reset = () => {
    cover.hidden = true; card.hidden = true; win.classList.remove('is-typing', 'is-snapped', 'is-dragging');
    memo.classList.remove('is-open'); ocr.classList.remove('is-on'); rec.classList.remove('is-on');
    root.classList.remove('is-locked');
    n.setGlow({ palette: currentGlow() });
  };
  const type = async (w, alive, text, speed = 55) => {
    for (const ch of text) { if (!alive()) return; field.textContent += ch; await w(speed); }
  };
  const rest = w => (put(n, 'rest'), w(10));
  const say = (key, ms, ...args) => w => (put(n, key, ...args), w(ms));
  const glow = p => w => (n.setGlow({ palette: p }), w(0));

  const scenes = {
    music: [say('music', 1400), say('song', 2200), say('lyric', 2000, 'City lights are calling out my name'), say('lyric', 2000, 'Driving slow so I can feel the rain'), say('music', 10)],
    hud: [say('volume', 900, 0.35), say('volume', 900, 0.7), say('bright', 900, 0.4), say('bright', 1100, 0.8), say('caps', 1800), rest],
    messages: [say('whatsapp', 1400), say('whatsapp', 1400, 2), say('telegram', 2000), say('teams', 2000), say('slack', 2000), rest],
    email: [say('email', 3200), rest],
    meeting: [say('meeting', 3200), say('inCall', 3600), rest],
    ai: [glow('blueViolet'), say('aiWorking', 1400), say('aiWorking', 1100, 'Checking the answer'), glow('green'), say('aiDone', 4200), glow('prism'), rest],
    aitask: [say('aiAsk', 2400), glow('green'), say('aiTask', 3600), glow('prism'), rest],
    ailimit: [say('aiLimit', 3200), rest],
    privacy: [
      w => (coverTxt.innerHTML = 'Polaric <b>Privacy</b>', unlock.textContent = 'Unlock with ⌥⇧U', cover.hidden = false, cover.classList.remove('is-open'), put(n, 'closed'), w(50)),
      w => (cover.classList.add('is-open'), w(10)),
    ],
    applock: [
      w => (root.classList.add('is-locked'), coverTxt.innerHTML = 'Chrome <b>Locked</b>', unlock.textContent = 'Unlock with Touch ID', cover.hidden = false, cover.classList.remove('is-open'), put(n, 'locked'), w(50)),
      w => (cover.classList.add('is-open'), w(10)),
    ],
    remote: [say('remote', 4600), rest],
    cammic: [say('camera', 2400), say('mic', 2400), say('inCall', 2600), rest],
    autotext: [
      w => (win.classList.add('is-typing'), field.textContent = '', put(n, 'rest'), w(300)),
      (w, a) => type(w, a, 'Send the package to .addr'),
      w => w(350),
      w => (field.textContent = 'Send the package to Jl. Merdeka 1, Jakarta 10110', put(n, 'autotext'), w(2600)),
      (w, a) => type(w, a, '. Thanks!', 70),
      rest,
    ],
    ocr: [w => (ocr.classList.add('is-on'), w(1500)), w => (ocr.classList.remove('is-on'), put(n, 'ocr'), w(2600)), rest],
    shot: [
      w => (flash.classList.remove('is-on'), void flash.offsetWidth, flash.classList.add('is-on'), w(120)),
      w => (put(n, 'shot'), card.hidden = false, w(3400)),
      w => (card.hidden = true, put(n, 'rest'), w(10)),
    ],
    record: [w => (rec.classList.add('is-on'), put(n, 'rec', '00:01'), w(1000)), say('rec', 1000, '00:02'), say('rec', 1000, '00:03'), say('rec', 1000, '00:04'), say('rec', 1000, '00:05'), w => (rec.classList.remove('is-on'), put(n, 'recDone'), w(2600)), rest],
    snap: [
      w => (win.classList.add('is-dragging'), w(700)),
      say('snap', 1700),
      w => (win.classList.remove('is-dragging'), win.classList.add('is-snapped'), put(n, 'rest'), w(10)),
    ],
    clipboard: [say('clip', 4200), rest],
    memo: [w => (put(n, 'closed'), memo.classList.add('is-open'), w(10))],
    prompter: [say('prompter', 9000), rest],
    timer: [say('timer', 1000, '00:05'), say('timer', 1000, '00:04'), say('timer', 1000, '00:03'), say('timer', 1000, '00:02'), say('timer', 1000, '00:01'), say('focusDone', 3600), rest],
    todo: [say('todo', 4000), rest],
    prayer: [say('prayer', 4200), rest],
    ambient: [say('ambient', 4200), rest],
    battery: [say('pods', 2600), say('battery', 2600), rest],
    network: [say('wifi', 2400), say('unstable', 2600), rest],
    publicwifi: [say('publicWifi', 4000), rest],
    data: [say('data', 4000), rest],
    download: [say('download', 3000), rest],
    game: [say('game', 4200), rest],
    clock: [say('clock', 4200), rest],
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
  unlock.addEventListener('click', () => { cover.classList.remove('is-open'); root.classList.remove('is-locked'); setTimeout(() => (cover.hidden = true, put(n, 'rest')), 380); });
  $('.sim__memo-close', root)?.addEventListener('click', () => { memo.classList.remove('is-open'); put(n, 'rest'); });
  window.addEventListener('pn:mascot', () => { if (n.mode === 'toast' && n.content.querySelector('.pn-mascot')) put(n, 'rest'); });

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
  mascot(mascotChoice);

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
    mascotChoice = b.dataset.mascot;
    window.dispatchEvent(new CustomEvent('pn:mascot'));
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

/* ---------- Support: a mascot waves thank you, still (the page's one loop is the hero's) ---------- */

function thanks() {
  const stage = $('[data-pn="thanks"]');
  if (!stage) return;
  const n = new Notch(stage, { scale: stage.clientWidth < 520 ? 1.05 : 1.5, palette: 'polaric', mode: 'toast', amount: 1.2 });
  n.show('toast', `<div class="pn-line pn-line--thanks"><img class="pn-logo" src="assets/img/polaric-icon.png" alt=""><b>Thank you</b><span class="pn-sep">|</span><span class="pn-dim">for keeping Polaric free</span></div>`);
}

hero();
thanks();
customise();
simulator();
downloads();
stats();
links();
