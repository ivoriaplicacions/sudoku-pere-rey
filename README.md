# Maestros del Sudoku

Sudoku gamificat per **Ivori Aplicacions**. Aplicació **multiplataforma**: mateix codi React per **web (PWA)**, **Android** i **iOS**.

## Característiques

- **4 packs × 200 sudokus = 800 puzzles** verificats (solució única)
- **Pack 1 gratuït**; Packs II–IV a **0,99 €** via **Google Play Billing**
- Estrelles, XP, ratxa diària i assoliments
- 14 temes visuals
- **Multilenguatge**: català, castellà i anglès
- **Vibració** (hàptics) en dispositius mòbils
- Intro animada i progrés guardat localment

## Monetització (Google Play)

Productes **managed / one-time** a crear a Google Play Console (preu 0,99 €):

| Pack | Product ID | Nivells |
|------|------------|---------|
| Pack 1 | _(gratis, sense producte)_ | 1–10 |
| Pack 2 | `maestros_pack_2` | 11–20 |
| Pack 3 | `maestros_pack_3` | 21–30 |
| Pack 4 | `maestros_pack_4` | 31–40 |

Plugin: `@capgo/native-purchases` (Google Play Billing 7.x). En web / sense billing es simula la compra per a desenvolupament.

Les compres reals només funcionen amb una build signada publicada a Play (p. ex. internal testing) i els productes creats a la consola.

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

## Repositori

https://github.com/ivoriaplicacions/sudoku-pere-rey
