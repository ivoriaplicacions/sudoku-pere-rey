# Maestros del Sudoku

Sudoku gamificat per **Ivori Aplicacions**. Aplicació **multiplataforma**: mateix codi React per **web (PWA)**, **Android** i **iOS**.

## Característiques

- **4 packs × 200 sudokus = 800 puzzles** verificats (solució única)
- **Pack 1 gratuït**; Packs II–IV a **0,99 €** via **Google Play Billing / App Store**
- Estrelles, XP, ratxa diària i assoliments
- **6 temes visuals** (zen, cyber, cosmic, sunset, mediterrani, montroig)
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

## Titular (LSSI-CE art. 10 · DSA art. 30)

| Camp | Valor |
|------|-------|
| Titular | Francesc Siuraneta Jové — IVORI APLICACIONS |
| NIF | 47983327Z |
| Adreça | Avinguda Roma 21, 6-5 · 43005 Tarragona · Espanya |
| Correu | hola@ivoriaplicacions.es |
| Web | https://ivoriaplicacions.es |
| D-U-N-S | 473131748 (verificació de desenvolupador a Google Play) |

Aquestes dades han de coincidir amb les del **trader status** d’App Store Connect i les
de verificació de desenvolupador de Play Console; a la UE es publiquen a la fitxa de l’app.

**URLs públiques (web corporativa):**

| Document | URL |
|----------|-----|
| Centre legal | https://ivoriaplicacions.es/ |
| Privadesa | https://ivoriaplicacions.es/privacy.html |
| Reglament UE d’IA | https://ivoriaplicacions.es/ai-act.html |
| Governança | https://ivoriaplicacions.es/governance.html |

Aquesta app **no és un sistema d’IA** (Reglament UE 2024/1689, considerant 12): sudokus deterministes, sense models ni inferència. La mateixa documentació va dins l’app (Configuració → Avís legal). Les pàgines de privacitat i governança públiques les manté el web corporatiu d’Ivori Aplicacions; `public/` continua sent la font de les còpies legals empaquetades amb l’app i `docs/` es conserva com a còpia de contingència.

`docs/` es **genera** des de `public/`; no l’editis a mà:

```bash
node scripts/syncLegalDocs.mjs
```

## Requisits

| Eina | Versió recomanada |
|------|-------------------|
| Node.js | 20+ |
| npm | 10+ |
| JDK | **21** (Android) — Capacitor 8 compila a Java 21; amb JDK 17 el build falla amb `invalid source release: 21` |
| Android Studio | última estable (Android) |

## Desenvolupament web

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Preflight de publicación

```bash
npm run release:check
```

Comprueba la coherencia de versiones, productos de compra integrada, páginas legales e
iconos de tienda. También avisa de materiales comerciales todavía pendientes.

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

Keystore de pujada a Play (local, no es commiteja):

```bash
chmod +x scripts/create-upload-keystore.sh
./scripts/create-upload-keystore.sh
```

Genera `android/maestros-release.jks` i `android/keystore.properties` (gitignored). Desa’ls en un gestor de contrasenyes abans de la primera pujada.


## iOS (macOS + Xcode)

```bash
npm run cap:sync:ios
npm run ios:open
```

Team de signatura: `6VQVGXVTKQ`. Bundle ID idèntic a Android.

## Repositori

https://github.com/ivoriaplicacions/sudoku-pere-rey
