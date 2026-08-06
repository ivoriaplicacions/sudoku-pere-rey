# Maestros del Sudoku

Sudoku gamificat per **Ivori Aplicacions**. Aplicació **multiplataforma**: mateix codi React per **web (PWA)**, **Android** i **iOS**.

## Característiques

- **Pack gratuït**: 10 nivells × 20 sudokus (200 puzzles verificats, solució única)
- **Packs addicionals**: 200 sudokus per **0,99 €** cadascun (en preparació)
- Estrelles, XP, ratxa diària i assoliments
- 14 temes visuals
- **Multilenguatge**: català, castellà i anglès
- **Vibració** (hàptics) en dispositius mòbils
- Intro animada i progrés guardat localment

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
npm run dev          # http://localhost:5173
npm run build        # compila a dist/
npm run preview      # previsualitza la build
npm run lint
```

## Sudokus (generació offline)

```bash
npm run puzzles:generate   # regenera src/data/puzzles.ts
npm run puzzles:verify     # audita els 200 puzzles
```

## Android (Windows)

```bash
npm run android:debug      # build web + sync + APK debug
npm run android:open       # obre el projecte a Android Studio
```

APK de debug: `android/app/build/outputs/apk/debug/app-debug.apk`

## iOS (requereix Mac)

iOS **no es pot compilar des de Windows**. Quan tinguis un Mac:

```bash
npm run ios:add
npm run cap:sync:ios
npm run ios:open
```

També hi ha un workflow manual `.github/workflows/ios.yml` per compilar en un runner macOS de GitHub Actions.

Consulta `npm run ios:info` per veure les instruccions des de qualsevol SO.

## CI (GitHub Actions)

- **Android**: cada push/PR a `main` compila l'APK debug i el publica com a artefacte.
- **iOS**: workflow manual (`workflow_dispatch`) en macOS.

## Estructura del projecte

```
src/           Codi React + TypeScript
public/        Assets estàtics, manifest PWA
scripts/       Generació i verificació de puzzles, build Android
android/       Projecte natiu Capacitor (Android)
assets/        Icona i splash per Capacitor
dist/          Build web (generat, no versionat)
```

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Capacitor 8 (Android + iOS)
- Gradle 8 + Android SDK 36

## Repositori

https://github.com/ivoriaplicacions/sudoku-pere-rey
