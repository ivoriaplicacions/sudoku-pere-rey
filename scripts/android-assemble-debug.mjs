/**
 * Cross-platform wrapper: runs `gradlew assembleDebug` inside android/.
 * Works on Windows (gradlew.bat) and macOS/Linux (./gradlew).
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const androidDir = join(root, 'android');
const isWin = process.platform === 'win32';
const gradlew = isWin ? 'gradlew.bat' : './gradlew';

const result = spawnSync(gradlew, ['assembleDebug'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(result.status ?? 1);
