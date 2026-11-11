// Sums the app's install/update notes (app-log-1..app-seq on the counter service) into assets/places.json:
// { seq, countries: { CC: [installs, updates] }, cities: { "CC|City": { at: [lat, lon], n: [installs, updates] } } }.
// A note (13 digits, from 1.5.0) = platform × 10¹² + event × 10¹¹ + country letters × 10⁸ + (lat + 90) × 10 × 10⁴
// + (lon + 180) × 10; older notes (below 10¹²) = platform × 10000 + event × 1000 + country letters.
// The city is the nearest place of over 15,000 people in that country (GeoNames cities15000, CC BY 4.0).
// Run by .github/workflows/places.yml. The counter service is slow and rate limited: patient tries.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const API = 'https://abacus.jasoncameron.dev/get/polaric-site';
const FILE = new URL('../assets/places.json', import.meta.url);
const CITIES = process.env.CITIES || 'cities15000.txt';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const started = Date.now(), BUDGET = 20 * 60e3;
async function get(key) {
  for (let t = 0; t < 5; t++) {
    try {
      const r = await fetch(`${API}/${key}`, { signal: AbortSignal.timeout(90e3) });
      if (r.status === 404) return null;
      if (r.ok) { const j = await r.json(); if (j.error) return null; return j.value; }
    } catch {}
    await sleep(10e3);
  }
  throw new Error(`counter unreachable for ${key}`);
}
const cities = {};
if (existsSync(CITIES)) for (const line of readFileSync(CITIES, 'utf8').split('\n')) {
  const f = line.split('\t'); if (f.length < 15) continue;
  (cities[f[8]] ||= []).push([f[1], +f[4], +f[5], +f[14] || 0]);
}
// The biggest city within ~25 km (so a district reads as its city), else the nearest within ~150 km.
function nearest(cc, lat, lon) {
  let best = null, d0 = Infinity, big = null;
  for (const c of cities[cc] || []) {
    const d = (c[1] - lat) ** 2 + ((c[2] - lon) * Math.cos(lat * Math.PI / 180)) ** 2;
    if (d < d0) { d0 = d; best = c; }
    if (d < 0.25 ** 2 && (!big || c[3] > big[3])) big = c;
  }
  return big || (best && d0 < 1.5 ** 2 ? best : null);
}
const base = JSON.parse(readFileSync(FILE, 'utf8'));
const n = (await get('app-seq')) || 0;
let seq = base.seq || 0;
const countries = base.countries || {}, cityCounts = base.cities || {};
while (seq < n && Date.now() - started < BUDGET) {
  const v = await get(`app-log-${seq + 1}`);
  seq++;
  if (v == null) continue; // a note that was never written
  let ev, c, lat = null, lon = null;
  if (v >= 1e12) {
    ev = Math.floor(v / 1e11) % 10; c = Math.floor(v / 1e8) % 1000;
    const la = Math.floor(v / 1e4) % 1e4, lo = v % 1e4;
    if (la !== 9999 && lo !== 9999) { lat = la / 10 - 90; lon = lo / 10 - 180; }
  } else { ev = Math.floor((v % 10000) / 1000); c = v % 1000; }
  const cc = String.fromCharCode(65 + Math.floor(c / 26), 65 + (c % 26));
  if (c > 675 || (ev !== 1 && ev !== 2)) continue;
  (countries[cc] ||= [0, 0])[ev - 1]++;
  if (lat != null) {
    const near = nearest(cc, lat, lon);
    const key = `${cc}|${near ? near[0] : `${lat.toFixed(1)}, ${lon.toFixed(1)}`}`;
    (cityCounts[key] ||= { at: near ? [+near[1].toFixed(2), +near[2].toFixed(2)] : [lat, lon], n: [0, 0] }).n[ev - 1]++;
  }
  await sleep(600);
}
if (seq !== base.seq) {
  writeFileSync(FILE, JSON.stringify({ seq, countries, cities: cityCounts, updated: new Date().toISOString().slice(0, 16) + 'Z' }) + '\n');
  console.log(`places.json: notes ${base.seq} -> ${seq} of ${n}`);
} else console.log(`no new notes (${n})`);
