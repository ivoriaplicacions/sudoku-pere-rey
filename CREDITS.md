# Crèdits i llicències — Maestros del Sudoku

Titular: Francesc Siuraneta Jové — IVORI APLICACIONS · NIF 47983327Z ·
<hola@ivoriaplicacions.es>

## Contingut propi

| Actiu | Origen | Llicència |
|-------|--------|-----------|
| 800 sudokus (`src/data/puzzles.ts`) | Generats per `scripts/generatePuzzles.mjs` (backtracking determinista, solució única verificada) | Obra pròpia |
| Logotip i icones d’app (`IMAGENES/logosudoku.png`, `store/`, `assets/`) | Encàrrec d’IVORI APLICACIONS | Obra pròpia |
| Temes visuals (`src/data/themes.ts`) | Degradats CSS escrits a mà; cap imatge de tercers | Obra pròpia |
| Efectes de so (`src/utils/audio.ts`) | Sintetitzats en temps real amb WebAudio; cap fitxer d’àudio | Obra pròpia |

L’app **no** incorpora fotografies, tipografies ni àudio de tercers. Les catorze imatges
de fons `bg_*.jpg` es van retirar el 7 de setembre de 2026: no s’usaven i no en constava
la procedència. Qualsevol actiu de tercers que s’hi afegeixi en el futur s’ha d’anotar
en aquesta taula amb autor, llicència, URL i data abans de publicar-lo.

## Dependències de temps d’execució

| Paquet | Versió | Llicència |
|--------|--------|-----------|
| @capacitor/android | 8.5.0 | MIT |
| @capacitor/app | 8.1.1 | MIT |
| @capacitor/core | 8.5.0 | MIT |
| @capacitor/haptics | 8.0.2 | MIT |
| @capacitor/ios | 8.5.0 | MIT |
| @capacitor/splash-screen | 8.0.2 | MIT |
| @capacitor/status-bar | 8.0.3 | MIT |
| @capgo/native-purchases | 8.6.5 | **MPL-2.0** |
| canvas-confetti | 1.9.4 | ISC |
| clsx | 2.1.1 | MIT |
| lucide-react | 1.28.0 | ISC |
| react | 19.2.8 | MIT |
| react-dom | 19.2.8 | MIT |
| tailwind-merge | 3.6.0 | MIT |

Tailwind CSS i les eines de compilació (Vite, TypeScript, oxlint) són MIT i no
s’incorporen al binari distribuït.

### Nota sobre @capgo/native-purchases (MPL-2.0)

La Mozilla Public License 2.0 és copyleft feble i **per fitxer**: es pot enllaçar des
d’una app propietària sense obrir-ne el codi, però cal conservar l’avís de llicència i,
si algun dia se’n modifica cap fitxer, publicar-ne la font modificada. Codi font:
<https://github.com/Cap-go/native-purchases>. Ara mateix s’usa sense modificacions.

## Com regenerar aquesta taula

```bash
node -e "const p=require('./package.json');for(const n of Object.keys(p.dependencies)){const m=require('./node_modules/'+n+'/package.json');console.log(n,m.version,m.license)}"
```
