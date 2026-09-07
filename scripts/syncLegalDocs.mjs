#!/usr/bin/env node
/**
 * Generates docs/ (GitHub Pages) from public/ so the legal pages have one source.
 *
 * The two copies differ only in where "Home" points: inside the app the hub is
 * legal-index.html, while on Pages the root document has to be index.html.
 * docs/ therefore gets both, with the nav rewritten.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public');
const out = join(root, 'docs');

const PAGES = ['privacy.html', 'ai-act.html', 'governance.html', 'licenses.html'];
const HUB = 'legal-index.html';
const ASSETS = ['legal.css'];

mkdirSync(out, { recursive: true });

/** On Pages the hub is served as index.html. */
const toPages = (html) => html.replaceAll('href="legal-index.html"', 'href="index.html"');

for (const asset of ASSETS) {
  writeFileSync(join(out, asset), readFileSync(join(src, asset)));
}

for (const page of PAGES) {
  writeFileSync(join(out, page), toPages(readFileSync(join(src, page), 'utf8')));
}

const hub = readFileSync(join(src, HUB), 'utf8');
writeFileSync(join(out, 'index.html'), toPages(hub));
writeFileSync(join(out, HUB), toPages(hub));

console.log(`Synced ${ASSETS.length + PAGES.length + 2} files from public/ to docs/`);
