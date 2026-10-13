import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statusBarPath = path.join(
  projectRoot,
  'node_modules/@capacitor/status-bar/android/src/main/java/com/capacitorjs/plugins/statusbar/StatusBar.java',
);

if (!fs.existsSync(statusBarPath)) process.exit(0);

const source = fs.readFileSync(statusBarPath, 'utf8');
if (source.includes('SUDOKU_KING_ANDROID15_COMPAT')) process.exit(0);

const patchedSetBackground = `    /* SUDOKU_KING_ANDROID15_COMPAT
     * Android 15 deprecates status-bar color APIs. Edge-to-edge is handled by
     * MainActivity with WindowCompat; keep only icon appearance and metadata.
     */
    public void setBackgroundColor(int color) {
        currentStatusBarColor = color;
        if (currentStyle.equals("DEFAULT")) {
            boolean isLightColor = ColorUtils.calculateLuminance(color) > 0.5;
            WindowInsetsControllerCompat insetsController =
                    WindowCompat.getInsetsController(activity.getWindow(), activity.getWindow().getDecorView());
            insetsController.setAppearanceLightStatusBars(isLightColor);
        }
    }

`;

const setBackgroundPattern = /    public void setBackgroundColor\(int color\) \{[\s\S]*?\n    \}\n\n(?=    public void hide\(\))/;
if (!setBackgroundPattern.test(source)) {
  throw new Error('Unexpected Capacitor StatusBar source; Android 15 compatibility patch was not applied.');
}

let patched = source.replace(setBackgroundPattern, patchedSetBackground);
patched = patched.replace(
  '        this.currentStatusBarColor = getStatusBarColorDeprecated();',
  '        this.currentStatusBarColor = Color.TRANSPARENT; // SUDOKU_KING_ANDROID15_COMPAT',
);
patched = patched.replace(
  '            currentStatusBarColor = getStatusBarColorDeprecated();\n            setStatusBarColorDeprecated(Color.TRANSPARENT);',
  '            currentStatusBarColor = Color.TRANSPARENT; // SUDOKU_KING_ANDROID15_COMPAT',
);
patched = patched.replace(
  '            // recover the previous color of the status bar\n            setStatusBarColorDeprecated(currentStatusBarColor);',
  '            // Status-bar color is intentionally left to edge-to-edge system styling.',
);
patched = patched.replace(
  '        info.setColor(String.format("#%06X", 0xFFFFFF & getStatusBarColorDeprecated()));',
  '        info.setColor(String.format("#%06X", 0xFFFFFF & currentStatusBarColor));',
);
patched = patched.replace(
  /\n    @SuppressWarnings\("deprecation"\)\n    private int getStatusBarColorDeprecated\(\) \{[\s\S]*?\n    \}\n\n    @SuppressWarnings\("deprecation"\)\n    private void setStatusBarColorDeprecated\(int color\) \{[\s\S]*?\n    \}\n/,
  '\n',
);

fs.writeFileSync(statusBarPath, patched);
