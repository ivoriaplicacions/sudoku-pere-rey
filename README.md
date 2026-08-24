# Maestros del Sudoku

Sudoku gamificat per **Ivori Aplicacions**. Aplicació **multiplataforma**: mateix codi React per **web (PWA)**, **Android** i **iOS**.

## Característiques

- **4 packs × 200 sudokus = 800 puzzles** verificats (solució única)
- **Pack 1 gratuït**; Packs II–IV a **0,99 €** via **Google Play Billing / App Store**
- Estrelles, XP, ratxa diària i assoliments
- 14 temes visuals
- **Multilenguatge**: català, castellà i anglès
- **Vibració** (hàptics) en dispositius mòbils
- Intro animada i progrés guardat localment

## Monetización (Google Play + App Store)

Mateixos productes **one-time / non-consumable** a Google Play Console i App Store Connect (preu 0,99 €):

| Pack | Product ID | Nivells |
|------|------------|---------|
| Pack 1 | _(gratis, sense producte)_ | 1–10 |
| Pack 2 | `maestros_pack_2` | 11–20 |
| Pack 3 | `maestros_pack_3` | 21–30 |
| Pack 4 | `maestros_pack_4` | 31–40 |

Plugin: `@capgo/native-purchases` (Google Play Billing + StoreKit). En web / sense billing es simula la compra per a desenvolupament.

Les compres reals només funcionen amb builds signades (Play internal testing / TestFlight o sandbox) i els productes creats a les respectives consoles.

**Bundle / application ID (Android + iOS):** `com.ivoriaplicacions.maestrosdelsudoku`

**Política de privadesa (URL pública per a les consoles):** https://ivoriaplicacions.github.io/sudoku-pere-rey/privacy.html

## Requisits (Windows)

| Eina | Versió recomanada |
|------|-------------------|
| Node.js | 20+ |
| npm | 10+ |
| JDK | 17 o 21 (Android) |
| Android Studio | última estable (Android) |

## Desenvolupament web

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Sudokus

```bash
npm run puzzles:generate   # regenera 800 puzzles
npm run puzzles:verify
```

## Android

```bash
npm run android:debug
npm run android:open
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`


## iOS (macOS + Xcode)

```bash
npm run cap:sync:ios
npm run ios:open
```

Team de signatura: `6VQVGXVTKQ`. Bundle ID idèntic a Android.

## Repositori

https://github.com/ivoriaplicacions/sudoku-pere-rey
