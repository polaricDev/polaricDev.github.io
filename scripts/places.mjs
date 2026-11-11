// Sums the app's install/update notes (app-log-1..app-seq on the counter service) into assets/places.json:
// { seq, countries: { CC: [installs, updates] } }. A note = platform × 10000 + event × 1000 + country letters
// (event 1 install, 2 update). Run by .github/workflows/places.yml. Slow on purpose: the service allows
// about 20 requests in 10 s.
import { readFileSync, writeFileSync } from 'node:fs';
const API = 'https://abacus.jasoncameron.dev/get/polaric-site';
const FILE = new URL('../assets/places.json', import.meta.url);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(key) {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(`${API}/${key}`);
    if (r.status === 429) { await sleep(10000); continue; }
    if (!r.ok) return null;
    return (await r.json()).value;
  }
  throw new Error('rate limited');
}
const base = JSON.parse(readFileSync(FILE, 'utf8'));
const n = (await get('app-seq')) || 0;
let seq = base.seq || 0;
const countries = base.countries || {};
while (seq < n && seq - (base.seq || 0) < 600) {
  const v = await get(`app-log-${seq + 1}`);
  await sleep(700);
  seq++;
  if (v == null) continue; // a note that was never written (the app was closed too early)
  const ev = Math.floor((v % 10000) / 1000), c = v % 1000, cc = String.fromCharCode(65 + Math.floor(c / 26), 65 + (c % 26));
  if (!/^[A-Z]{2}$/.test(cc) || (ev !== 1 && ev !== 2)) continue;
  (countries[cc] ||= [0, 0])[ev - 1]++;
}
if (seq !== base.seq) {
  writeFileSync(FILE, JSON.stringify({ seq, countries, updated: new Date().toISOString().slice(0, 10) }) + '\n');
  console.log(`places.json: notes ${base.seq} -> ${seq}`);
} else console.log('no new notes');
