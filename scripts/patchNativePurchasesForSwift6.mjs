import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginPath = path.join(
  projectRoot,
  'node_modules/@capgo/native-purchases/ios/Sources/NativePurchasesPlugin/NativePurchasesPlugin.swift',
);

if (!fs.existsSync(pluginPath)) {
  process.exit(0);
}

const source = fs.readFileSync(pluginPath, 'utf8');
const patchedBlock = `                    let currentPlugin = self
                    await MainActor.run {
                        currentPlugin?.notifyListeners("transactionUpdated", data: payload)
                    }`;

if (source.includes(patchedBlock)) {
  process.exit(0);
}

const originalBlock = `                    await MainActor.run {
                        self?.notifyListeners("transactionUpdated", data: payload)
                    }`;

if (!source.includes(originalBlock)) {
  throw new Error('Unexpected @capgo/native-purchases source; Swift 6 compatibility patch was not applied.');
}

const patched = source
  .replace(originalBlock, patchedBlock)
  .replace(
    `                case .unverified(let transaction, let error):\n                    await MainActor.run {\n                        self?.notifyListeners("transactionVerificationFailed", data: [`,
    `                case .unverified(let transaction, let error):\n                    let currentPlugin = self\n                    await MainActor.run {\n                        currentPlugin?.notifyListeners("transactionVerificationFailed", data: [`,
  );

fs.writeFileSync(pluginPath, patched);
