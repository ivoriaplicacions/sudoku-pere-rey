#!/usr/bin/env node
/**
 * package.json is the single source of truth for the app version.
 *
 * The same number used to be kept by hand in five places (version.ts, Gradle, the
 * Xcode project and two legal pages), which is how they drift. This copies it out
 * and fails loudly if any target no longer matches the shape it expects, rather
 * than silently leaving one behind.
 *
 * versionCode is derived as major*10000 + minor*100 + patch, so it always grows
 * with the version name and leaves room for 99 minors and 99 patches.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const write = (p, text) => writeFileSync(join(root, p), text);

const { version } = JSON.parse(read('package.json'));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
if (!match) {
  throw new Error(`package.json version "${version}" is not major.minor.patch`);
}
const [, major, minor, patch] = match.map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

/** Applies one replacement and refuses to continue if the anchor has moved. */
function patchFile(path, edits) {
  let text = read(path);
  for (const [pattern, replacement, expected = 1] of edits) {
    const hits = text.match(pattern);
    const found = hits ? (pattern.global ? hits.length : 1) : 0;
    if (found !== expected) {
      throw new Error(
        `${path}: expected ${expected} match(es) for ${pattern}, found ${found}. ` +
          'Update scripts/syncVersion.mjs to follow the file.',
      );
    }
    text = text.replace(pattern, replacement);
  }
  write(path, text);
}

patchFile('src/version.ts', [
  [/export const APP_VERSION = '[^']*';/, `export const APP_VERSION = '${version}';`],
  [/export const APP_BUILD = \d+;/, `export const APP_BUILD = ${versionCode};`],
]);

patchFile('android/app/build.gradle', [
  [/versionCode \d+/, `versionCode ${versionCode}`],
  [/versionName "[^"]*"/, `versionName "${version}"`],
]);

patchFile('ios/App/App.xcodeproj/project.pbxproj', [
  [/MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${version};`, 2],
  [/CURRENT_PROJECT_VERSION = [^;]*;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`, 2],
]);

patchFile('public/ai-act.html', [[/(·\s*Version\s*)\d+\.\d+\.\d+/, `$1${version}`]]);
patchFile('public/licenses.html', [[/(·\s*Version\s*)\d+\.\d+\.\d+/, `$1${version}`]]);
patchFile('public/governance.html', [[/(,\s*version\s*)\d+\.\d+\.\d+/, `$1${version}`]]);

console.log(`Version ${version} (code ${versionCode}) written to 6 files`);
