// How hard are the shipped puzzles really? Measure the simplest technique that solves each one.
// This is the script behind informes/2026-11-12-informe-y-plan.md. Run it from anywhere:
//   node informes/2026-11-12-medicion.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/data/puzzles.ts', import.meta.url), 'utf8');
const entries = [...src.matchAll(/'(\d+)\|(\d+)\|(\d+)\|(\d{81})\|(\d{81})'/g)].map(m => ({ level: +m[1], n: +m[2], givens: +m[3], grid: m[4] }));

const peers = Array.from({ length: 81 }, (_, i) => {
  const r = (i / 9) | 0, c = i % 9, s = new Set();
  for (let k = 0; k < 9; k++) { s.add(r * 9 + k); s.add(k * 9 + c); }
  const br = ((r / 3) | 0) * 3, bc = ((c / 3) | 0) * 3;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s.add((br + a) * 9 + bc + b);
  s.delete(i); return [...s];
});
const units = [];
for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) { const u = []; const br = ((b / 3) | 0) * 3, bc = (b % 3) * 3; for (let a = 0; a < 3; a++) for (let d = 0; d < 3; d++) u.push((br + a) * 9 + bc + d); units.push(u); }

// returns 'naked' if naked singles alone solve it, 'hidden' if hidden singles are also needed, 'beyond' otherwise
function grade(str) {
  const g = [...str].map(Number);
  const cand = i => { const used = new Set(peers[i].map(p => g[p])); const o = []; for (let v = 1; v <= 9; v++) if (!used.has(v)) o.push(v); return o; };
  let usedHidden = false;
  for (;;) {
    let progress = false;
    for (let i = 0; i < 81; i++) if (!g[i]) { const c = cand(i); if (c.length === 1) { g[i] = c[0]; progress = true; } }
    if (progress) continue;
    for (const u of units) for (let v = 1; v <= 9; v++) {
      if (u.some(i => g[i] === v)) continue;
      const spots = u.filter(i => !g[i] && cand(i).includes(v));
      if (spots.length === 1) { g[spots[0]] = v; progress = true; usedHidden = true; }
    }
    if (!progress) break;
  }
  if (g.every(Boolean)) return usedHidden ? 'hidden' : 'naked';
  return 'beyond';
}

const byBand = {};
for (const e of entries) {
  const band = ((e.level - 1) % 10) + 1;
  (byBand[band] ??= { naked: 0, hidden: 0, beyond: 0, givens: [] });
  byBand[band][grade(e.grid)]++;
  byBand[band].givens.push(e.givens);
}
console.log('banda  pistas  solo-desnudos  +ocultos  técnica-avanzada');
for (const b of Object.keys(byBand)) {
  const x = byBand[b]; const t = x.naked + x.hidden + x.beyond;
  const avg = (x.givens.reduce((a, c) => a + c, 0) / x.givens.length).toFixed(0);
  console.log(`${String(b).padStart(4)}   ${avg.padStart(5)}   ${String(x.naked).padStart(8)}  ${String(x.hidden).padStart(10)}  ${String(x.beyond).padStart(10)}   (de ${t})`);
}
const total = entries.length, beyond = Object.values(byBand).reduce((a, x) => a + x.beyond, 0);
console.log(`\ntotal: ${total} sudokus · requieren algo más que singles: ${beyond} (${(100 * beyond / total).toFixed(1)}%)`);
