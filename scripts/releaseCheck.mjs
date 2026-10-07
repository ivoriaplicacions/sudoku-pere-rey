#!/usr/bin/env node
/** Read-only preflight for store and native release preparation. */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');
const exists = (relativePath) => existsSync(join(root, relativePath));

const packageJson = JSON.parse(read('package.json'));
const failures = [];
const warnings = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function pngInfo(relativePath) {
  const bytes = readFileSync(join(root, relativePath));
  const signature = '89504e470d0a1a0a';
  if (bytes.subarray(0, 8).toString('hex') !== signature) return null;
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

const version = packageJson.version;
const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
check(versionMatch, `package.json version is not semver: ${version}`);

if (versionMatch) {
  const [, major, minor, patch] = versionMatch.map(Number);
  const build = major * 10000 + minor * 100 + patch;
  const versionSource = read('src/version.ts');
  const android = read('android/app/build.gradle');
  const ios = read('ios/App/App.xcodeproj/project.pbxproj');

  check(versionSource.includes(`APP_VERSION = '${version}'`), 'src/version.ts is out of sync');
  check(versionSource.includes(`APP_BUILD = ${build}`), 'src/version.ts build number is out of sync');
  check(android.includes(`versionCode ${build}`), 'Android versionCode is out of sync');
  check(android.includes(`versionName "${version}"`), 'Android versionName is out of sync');
  check((ios.match(new RegExp(`MARKETING_VERSION = ${version};`, 'g')) ?? []).length === 2, 'iOS marketing version is out of sync');
  check((ios.match(new RegExp(`CURRENT_PROJECT_VERSION = ${build};`, 'g')) ?? []).length === 2, 'iOS build number is out of sync');
}

for (const file of ['public/privacy.html', 'public/ai-act.html', 'public/governance.html', 'public/licenses.html']) {
  check(exists(file), `Missing legal source: ${file}`);
  check(exists(file.replace(/^public\//, 'docs/')), `Missing synced legal page: ${file.replace(/^public\//, 'docs/')}`);
}

const packsSource = read('src/data/packs.ts');
const listing = read('store/LISTING.md');
const productIds = [...packsSource.matchAll(/productId: '([^']+)'/g)].map((match) => match[1]);
for (const productId of productIds) {
  check(listing.includes(`\`${productId}\``), `Store listing is missing product ${productId}`);
}

const expectedIcons = [
  ['store/play-icon-512.png', 512],
  ['store/appstore-icon-1024.png', 1024],
];
for (const [file, size] of expectedIcons) {
  check(exists(file), `Missing store icon: ${file}`);
  if (exists(file)) {
    const info = pngInfo(file);
    check(info?.width === size && info?.height === size, `${file} must be ${size}x${size}`);
    check(info?.colorType === 2, `${file} must be RGB PNG without alpha`);
  }
}

warn(exists('android/keystore.properties'), 'Android signing keystore is not configured locally');
warn(exists('store/featured-graphic.png') || exists('store/featured-graphic.jpg'), 'Google Play featured graphic is still pending');
warn(exists('store/screenshots') || exists('store/screenshots-iphone'), 'Store screenshots are still pending');

if (failures.length > 0) {
  console.error('Release preflight failed:');
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exitCode = 1;
}

console.log(`Release preflight for ${packageJson.name} ${version}`);
console.log(`  ${failures.length === 0 ? '✓' : '✗'} ${failures.length} blocking issue(s)`);
for (const warning of warnings) console.warn(`  ! ${warning}`);
if (failures.length === 0) console.log('  ✓ Source-level release checks passed');
