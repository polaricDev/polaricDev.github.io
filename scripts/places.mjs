// Sums the download notes (dl-log-1..dl-seq on the counter service) into assets/places.json.
// Run by .github/workflows/places.yml. Slow on purpose: the service allows about 20 requests in 10 s.
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
const n = (await get('dl-seq')) || 0;
let seq = base.seq || 0;
const places = base.places || {};
while (seq < n && seq - (base.seq || 0) < 600) {
  const v = await get(`dl-log-${seq + 1}`);
  await sleep(700);
  if (v == null) { seq++; continue; } // a note that was never written (the visitor left too early)
  const c = Math.floor(v / 100000), cc = String.fromCharCode(65 + Math.floor(c / 26), 65 + (c % 26)), idx = (v % 100000) - 1;
  if (/^[A-Z]{2}$/.test(cc)) places[`${cc}:${idx}`] = (places[`${cc}:${idx}`] || 0) + 1;
  seq++;
}
if (seq !== base.seq) {
  writeFileSync(FILE, JSON.stringify({ seq, places, updated: new Date().toISOString().slice(0, 10) }) + '\n');
  console.log(`places.json: notes ${base.seq} -> ${seq}`);
} else console.log('no new notes');
