# Fitxes de botiga — SUDOKU KING

Material per enganxar a Google Play Console i App Store Connect. Tots els textos
estan comptats i caben al seu límit; el recompte va entre parèntesis.

> Els límits i les mides de captura els canvien Google i Apple sense avisar.
> Confirma cada xifra a la consola abans de produir els actius.

**Versió**: 2.0.0 (build 20000) · **Bundle**: `com.ivoriaplicacions.maestrosdelsudoku`

---

## 0. Titular — idèntic a les dues consoles

| Camp | Valor |
|------|-------|
| Titular | Francesc Siuraneta Jové — IVORI APLICACIONS |
| NIF | 47983327Z |
| Adreça | Avinguda Roma 21, 6-5 · 43005 Tarragona · Espanya |
| Correu | hola@ivoriaplicacions.es |
| Web | https://ivoriaplicacions.es |
| D-U-N-S | 473131748 |
| Privadesa | https://www.ivoriaplicacions.es/sudokuking.html#privacy |
| Suport | https://www.ivoriaplicacions.es/sudokuking.html |

A la UE aquestes dades **es publiquen** a la fitxa (DSA art. 30). Han de coincidir
exactament a les dues consoles.

---

## 1. Google Play

### Nom de l'app (30)

```
SUDOKU KING
```
(19/30, igual en els tres idiomes)

### Descripció curta (80)

**ca**
```
El sudoku sense anuncis que t'ensenya tècniques. 800 sudokus, 200 gratis.
```
(73/80)

**es**
```
El sudoku sin anuncios que te enseña técnicas. 800 sudokus, 200 gratis.
```
(71/80)

**en**
```
The ad-free sudoku that teaches you techniques. 800 puzzles, 200 free.
```
(70/80)

### Descripció completa (4000)

Vegeu la secció [3. Descripció llarga](#3-descripció-llarga). La mateixa serveix
per a Play i per a l'App Store.

### Gràfics

| Actiu | Requisit | Estat |
|-------|----------|-------|
| Icona | 512×512 PNG, ≤1 MB | ✅ `store/play-icon-512.png` |
| Gràfic destacat | 1024×500 JPG o PNG 24 bits, **sense transparència** | ✅ `store/play-featured-1024x500.png` |
| Captures de telèfon | 2–8, costat entre 320 i 3840 px, proporció entre 16:9 i 9:16 | ✅ `store/screenshots/play/{ca,es,en}/` — 6 per idioma a 1080×2160 |
| Captures de tauleta | opcionals | — (l'app és de telèfon) |

Sense captures de tauleta, Play mostra un avís als usuaris de tauleta. No bloqueja
la publicació.

### Productes de compra integrada

Tipus: **producte gestionat** (compra única, no consumible). Preu: 0,99 € a Espanya,
i deixa que Play converteixi la resta de països.

| Product ID | Nom (55) | Descripció (200) |
|------------|----------|------------------|
| `maestros_pack_2` | Pack II — 200 sudokus (nivells 11-20) | 200 sudokus nous. En comprar-lo, els 10 nivells s'obren immediatament. |
| `maestros_pack_3` | Pack III — 200 sudokus (nivells 21-30) | 200 sudokus nous. En comprar-lo, els 10 nivells s'obren immediatament. |
| `maestros_pack_4` | Pack IV — 200 sudokus (nivells 31-40) | 200 sudokus nous. En comprar-lo, els 10 nivells s'obren immediatament. |

Els tres han d'estar **actius** abans d'enviar a revisió, o la botiga de dins de
l'app apareixerà buida.

### Formularis de Play

**Seguretat de les dades**
- Recull o comparteix dades d'usuari? **No**
- Les dades estan xifrades en trànsit? *no aplica, no se'n recull cap*
- Ofereix una manera de demanar-ne la supressió? *no aplica*
- Les dades de pagament les tracta Google Play, no l'app, i queden fora d'aquest formulari.

**Classificació de contingut (IARC)**
- Categoria: **Joc**
- Violència, sexe, llenguatge, drogues, apostes, por: **cap**
- Contingut generat per usuaris: **no**
- Comparteix la ubicació: **no**
- Permet comprar béns digitals: **sí**
- Resultat esperat: PEGI 3 / ESRB Everyone

**Públic objectiu i contingut**
- Franges d'edat: **13 i més**. No marquis cap franja infantil: activaria la
  política de Famílies, amb requisits addicionals que aquesta app no necessita.

**Anuncis**: l'app conté anuncis? **No**

**Accés a l'app**: tota la funcionalitat està disponible sense credencials. Els
packs de pagament es proven amb comptes de prova de llicència de Play; vegeu
[5. Notes per a la revisió](#5-notes-per-a-la-revisió).

---

## 2. App Store

L'app és **només d'iPhone** (`TARGETED_DEVICE_FAMILY = "1"`), així que no calen
captures d'iPad.

### Nom (30)

```
SUDOKU KING
```
(19/30)

### Subtítol (30)

**ca**
```
Sense anuncis. Aprèn tècniques
```
(30/30)

**es**
```
Sin anuncios. Aprende técnicas
```
(30/30)

**en**
```
No ads. Learn real techniques
```
(29/30)

### Text promocional (170) — es pot canviar sense revisió

**ca**
```
Novetat 2.0: cada nivell exigeix una tècnica, i l'app te l'ensenya amb una lliçó i amb pistes que expliquen el pas. Repte diari. Compra única, mai subscripció.
```
(159/170)

**es**
```
Novedad 2.0: cada nivel exige una técnica, y la app te la enseña con una lección y con pistas que explican el paso. Reto diario. Compra única, nunca suscripción.
```
(161/170)

**en**
```
New in 2.0: every level asks for a technique, and the app teaches it with a lesson and hints that explain the step. Daily challenge. One-time purchases, no subscription.
```
(169/170)

### Paraules clau (100, separades per comes, sense espai després de la coma)

No repeteixis paraules que ja són al nom o al subtítol: Apple ja les indexa i
gastaries caràcters. Per això «sense anuncis» i «tècniques» ja no hi són: ara van al subtítol.

**ca**
```
sudokus,passatemps,nombres,lògica,repte diari,pistes,lliçons,sense connexió,trencaclosques,cervell
```
(98/100)

**es**
```
sudokus,pasatiempos,numeros,logica,reto diario,pistas,lecciones,offline,rompecabezas,juego,cerebro
```
(98/100)

**en**
```
sudokus,puzzle,numbers,logic,daily challenge,hints,lessons,offline,brain,classic,game,mind,teaser
```
(97/100)

### Captures

| Actiu | Requisit | Estat |
|-------|----------|-------|
| Icona | 1024×1024 PNG, **sense canal alfa** | ✅ `store/appstore-icon-1024.png` |
| iPhone (pantalla mitjana) | 1179×2556 o 1206×2622, vertical, 2–10 | ✅ `store/screenshots/appstore/{ca,es,en}/` — 6 per idioma a 1179×2556 |
| iPad | — | no cal, l'app és d'iPhone |

La fitxa d'aquesta app només ofereix la classe «iPhone amb Dynamic Island (pantalla
mitjana)». El simulador de l'iPhone 17 captura exactament a 1206×2622.

### Productes de compra integrada

Tipus: **No consumible**. Preu: nivell equivalent a 0,99 €.

| Product ID | Nom visible (30) | Descripció (45) |
|------------|------------------|-----------------|
| `maestros_pack_2` | Pack II · 200 sudokus | ca: 200 sudokus nous, nivells 11 a 20.<br>es: 200 sudokus nuevos, niveles 11 a 20.<br>en: 200 new sudokus, levels 11 to 20. |
| `maestros_pack_3` | Pack III · 200 sudokus | ca: 200 sudokus nous, nivells 21 a 30.<br>es: 200 sudokus nuevos, niveles 21 a 30.<br>en: 200 new sudokus, levels 21 to 30. |
| `maestros_pack_4` | Pack IV · 200 sudokus | ca: 200 sudokus nous, nivells 31 a 40.<br>es: 200 sudokus nuevos, niveles 31 a 40.<br>en: 200 new sudokus, levels 31 to 40. |

Cada producte necessita **una captura de revisió** (val la de la botiga de dins de
l'app) i notes de revisió. Sense això, el producte queda en «Missing Metadata» i
no es pot enviar.

### Formularis d'Apple

**Estat de comerciant (UE)** — bloquejant. Sense verificar, l'app no es distribueix
a la UE. Dades de la secció 0.

**Privadesa de l'app**: *Data Not Collected*. Coherent amb
`ios/App/App/PrivacyInfo.xcprivacy`, que ja declara zero seguiment i zero recollida.

**Classificació per edat**: sense contingut censurable → la categoria més baixa.
Sense contingut generat per usuaris, sense anuncis, sense web sense restriccions.

**Xifratge**: ja resolt al `Info.plist` amb `ITSAppUsesNonExemptEncryption = false`.

---

## 3. Descripció llarga

Serveix per a Play (descripció completa) i per a l'App Store (descripció).

### Català (1963/4000)

```
El sudoku sense anuncis que t'ensenya a resoldre els més difícils.

Cada nivell exigeix una tècnica concreta, de la més senzilla a la més avançada. Quan n'arribes a una de nova, una lliçó curta te l'ensenya sobre un tauler de debò. I si t'encalles, la pista no et regala el número: t'assenyala on mirar i t'explica el pas.

CONTINGUT
• 4 packs · 40 nivells · 800 sudokus
• 10 tècniques en escala: singles nus i ocults, candidats bloquejats, parells i trios nus, parells ocults, X-Wing, XY-Wing, Swordfish i cadenes curtes
• Cada sudoku té una única solució i exigeix exactament la tècnica del seu nivell, comprovat un per un
• Repte diari: el mateix sudoku per a tothom, cada dia, amb el calendari del mes

PACK INICIAL GRATUÏT
200 sudokus, nivells 1 a 10. Els nivells s'obren a mesura que completes partides.

PACKS DE PAGAMENT
Els packs II, III i IV són compres úniques, mai subscripcions. En comprar un pack, els seus 10 nivells s'obren immediatament, sense haver d'esperar cap progrés.

COM ES JUGA
• Pistes que expliquen el pas: on mirar, quina tècnica i, al final, el número. Llegir-les és gratis; posar el número gasta una de les 3 pistes del sudoku
• Notes a mà o automàtiques
• Mode «Número primer»: tria un número i toca les caselles on va
• Desfer sense límit i comprovació d'errors, que pots desactivar
• Cronòmetre i estrelles segons temps, errors i pistes

TAMBÉ
• Català, castellà i anglès
• 12 temes visuals
• Ratxa diària, 25 assoliments i un recordatori de ratxa opcional
• Exporta el progrés a un arxiu per guardar-lo o passar-lo a un altre mòbil
• Comparteix el resultat en acabar
• Vibració, que pots desactivar
• Teclat físic: xifres, fletxes, esborrar i desfer

PRIVADESA
Cap compte. Cap identificador publicitari. Cap servidor nostre. El progrés es desa només al teu dispositiu, i el recordatori és una notificació local. Les compres les processa la botiga.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

### Castellà (2001/4000)

```
El sudoku sin anuncios que te enseña a resolver los más difíciles.

Cada nivel exige una técnica concreta, de la más sencilla a la más avanzada. Cuando llegas a una nueva, una lección corta te la enseña sobre un tablero de verdad. Y si te atascas, la pista no te regala el número: te señala dónde mirar y te explica el paso.

CONTENIDO
• 4 packs · 40 niveles · 800 sudokus
• 10 técnicas en escala: singles desnudos y ocultos, candidatos bloqueados, pares y tríos desnudos, pares ocultos, X-Wing, XY-Wing, Swordfish y cadenas cortas
• Cada sudoku tiene una única solución y exige exactamente la técnica de su nivel, comprobado uno a uno
• Reto diario: el mismo sudoku para todos, cada día, con el calendario del mes

PACK INICIAL GRATIS
200 sudokus, niveles 1 a 10. Los niveles se abren a medida que completas partidas.

PACKS DE PAGO
Los packs II, III y IV son compras únicas, nunca suscripciones. Al comprar un pack, sus 10 niveles se abren de inmediato, sin tener que esperar ningún progreso.

CÓMO SE JUEGA
• Pistas que explican el paso: dónde mirar, qué técnica y, al final, el número. Leerlas es gratis; poner el número gasta una de las 3 pistas del sudoku
• Notas a mano o automáticas
• Modo «Número primero»: elige un número y toca las casillas donde va
• Deshacer sin límite y comprobación de errores, que puedes desactivar
• Cronómetro y estrellas según tiempo, errores y pistas

ADEMÁS
• Catalán, castellano e inglés
• 12 temas visuales
• Racha diaria, 25 logros y un recordatorio de racha opcional
• Exporta el progreso a un archivo para guardarlo o pasarlo a otro móvil
• Comparte el resultado al terminar
• Vibración, que puedes desactivar
• Teclado físico: cifras, flechas, borrar y deshacer

PRIVACIDAD
Ninguna cuenta. Ningún identificador publicitario. Ningún servidor nuestro. El progreso se guarda solo en tu dispositivo, y el recordatorio es una notificación local. Las compras las procesa la tienda.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

### Anglès (1916/4000)

```
The ad-free sudoku that teaches you to solve harder ones.

Every level demands one technique, from the simplest to the most advanced. When you reach a new one, a short lesson teaches it on a real board. And if you get stuck, the hint does not hand you the digit: it shows you where to look and explains the step.

WHAT YOU GET
• 4 packs · 40 levels · 800 sudokus
• 10 techniques in one climb: naked and hidden singles, locked candidates, naked pairs and triples, hidden pairs, X-Wing, XY-Wing, Swordfish and short chains
• Every sudoku has exactly one solution and demands exactly its level's technique, each one checked
• Daily challenge: the same sudoku for everyone, every day, with a monthly calendar

FREE STARTER PACK
200 sudokus, levels 1 to 10. Levels open as you finish puzzles.

PAID PACKS
Packs II, III and IV are one-time purchases, never subscriptions. Buying a pack opens all ten of its levels straight away, with no progress to grind first.

HOW IT PLAYS
• Hints that explain the step: where to look, which technique and, last, the digit. Reading them is free; placing the digit uses one of the puzzle's 3 hints
• Pencil notes, by hand or automatic
• Digit-first mode: pick a digit, then tap the cells where it goes
• Unlimited undo and mistake checking you can switch off
• Timer and stars based on time, mistakes and hints

ALSO
• Catalan, Spanish and English
• 12 visual themes
• Daily streak, 25 achievements and an optional streak reminder
• Export your progress to a file to keep it or move it to another phone
• Share your result when you finish
• Haptics you can switch off
• Hardware keyboard: digits, arrows, erase and undo

PRIVACY
No account. No advertising identifier. No servers of ours. Progress is stored on your device only, and the reminder is a local notification. Purchases are handled by the store.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

Les dues descripcions diuen explícitament que al pack gratuït els nivells s'obren
amb el progrés i que als de pagament no. És el que exigeix la informació
precontractual, i evita la reclamació de qui compra esperant una cosa altra.

---

## 3 bis. Novetats de la versió — 2.0.0 (build 20000)

El camp «Novetats» de Play té un límit de **500 caràcters**; el d'Apple, 4000. Els
tres textos caben al límit més estret, així que serveix el mateix per a les dues
botigues. A l'App Store només hi ha el català; a Play van tots tres en un sol bloc
(`<ca>`, `<es-ES>`, `<en-US>`).

La 1.1.1 no es va publicar mai sola: el que portava (pedaç de seguretat de
Capacitor, CSP, textos de nivell) va dins de la 2.0.0.

### Català (457/500)

```
La versió més gran fins ara.

Dificultat de debò: 40 nivells en escala, dels singles nus a les cadenes curtes. Cada nivell exigeix la seva tècnica, i una lliçó curta te l'ensenya.

Pistes que expliquen el pas abans de donar el número, notes automàtiques i mode «Número primer».

Repte diari, 25 assoliments, recordatori de ratxa opcional i exportació del progrés.

Els 800 sudokus són nous. Conserves estrelles, experiència, ratxa, nivells oberts i compres.
```

### Castellà (466/500)

```
La versión más grande hasta ahora.

Dificultad de verdad: 40 niveles en escala, de los singles desnudos a las cadenas cortas. Cada nivel exige su técnica, y una lección corta te la enseña.

Pistas que explican el paso antes de dar el número, notas automáticas y modo «Número primero».

Reto diario, 25 logros, recordatorio de racha opcional y exportación del progreso.

Los 800 sudokus son nuevos. Conservas estrellas, experiencia, racha, niveles abiertos y compras.
```

### Anglès (433/500)

```
Our biggest update yet.

Real difficulty: 40 levels in one climb, from naked singles to short chains. Every level demands its technique, and a short lesson teaches it.

Hints that explain the step before giving the digit, automatic notes and digit-first mode.

Daily challenge, 25 achievements, an optional streak reminder and progress export.

All 800 sudokus are new. You keep your stars, XP, streak, unlocked levels and purchases.
```

L'última línia hi és a propòsit. Els sudokus nous canvien quin sudoku hi ha a cada
casella de la llista, així que es reinicia el resultat de cada sudoku i es perd la
partida que hi hagués a mitges. El que el jugador s'ha guanyat es conserva, i dir-ho
s'estalvia la ressenya de qui pensa que ho ha perdut tot.

---

## 4. Captures: què ha de sortir a cadascuna

Sis captures per idioma, en aquest ordre. Les dues primeres són les úniques que la
majoria de gent veurà al resultat de cerca, així que han de dir de què va l'app soles.

| # | Fitxer | Què mostra |
|---|--------|------------|
| 1 | `01-levels.jpg` | Llista de nivells amb el repte diari, estrelles i ratxa |
| 2 | `02-hint.jpg` | Una pista explicant el pas abans de donar el número |
| 3 | `03-lesson.jpg` | La lliçó de candidats bloquejats sobre un tauler de debò |
| 4 | `04-notes.jpg` | Notes automàtiques en un sudoku de nivell 8 |
| 5 | `05-daily.jpg` | El calendari del repte diari amb els dies fets |
| 6 | `06-victory.jpg` | Victòria amb tres estrelles, temps i experiència |

Capturades el 13 de novembre de 2026 a l'iPhone 16e (1170×2532) amb proves XCUITest,
amb el tema clar Alba Daurada i la versió 2.0.0.

- **App Store** (`store/screenshots/appstore/`): escalades a 1179×2556, la mida de la
  classe «pantalla mitjana» que admet la fitxa. L'escalat és de menys de l'1 %.
- **Play** (`store/screenshots/play/`): a 1080×2160, retallades per dalt i per baix per
  treure la barra d'estat de l'iPhone, que a Android no hi pinta res.

El progrés que es veu és de demostració (73 sudokus, uns 210 estrelles, ratxa de 6),
sembrat amb un `seed.js` afegit a `dist/` abans de compilar. No toca cap codi font i
no ha d'arribar mai a una build de botiga: `npm run build` el fa desaparèixer. L'arnés
XCUITest, el `seed.js` i els passos per refer-les són a `store/screenshots/harness/`.

La barra d'estat és la real del telèfon, carregant. Si es vol la de màrqueting (9:41,
bateria plena), s'han de refer al simulador de l'iPhone 17, que a aquest Mac de 8 GB
no arrenca amb la resta d'apps obertes.

Les captures de tauleta de `store/screenshots/android-tablet/` encara són de l'1.x.

---

## 5. Notes per a la revisió

Enganxa-ho al camp de notes de revisió de les dues consoles.

```
The app needs no account and no login: all functionality is reachable from first launch.

Free content: Pack 1 (200 sudokus, levels 1-10) is playable immediately. Inside the free
pack, levels open as the player completes puzzles, which is stated in the store listing
and on the pack card.

Paid content: Packs II, III and IV are one-time non-consumable purchases. Buying a pack
opens all ten of its levels straight away, with no progress requirement. Open the shop
from the bottom bar ("Botiga" / "Tienda" / "Store").

Restore: the shop screen has a "Restore purchases" button that re-reads entitlements from
the store receipts.

Streak reminder: optional and off by default. Turning it on in Settings asks for
notification permission and schedules a local notification for 20:00. There is no push
server and nothing leaves the device.

Daily challenge: generated on the device from the date, with no network access.

The app makes no network requests of its own, collects no personal data and contains no
advertising. It works fully offline.

Contact: hola@ivoriaplicacions.es
```

---

## 6. Checklist abans d'enviar

**Google Play**
- [ ] Verificació de desenvolupador completada
- [ ] Estat de comerciant / dades públiques del titular
- [ ] Els 3 productes IAP creats i **actius**, amb preu per país
- [ ] Seguretat de les dades, IARC, públic objectiu, anuncis, accés a l'app
- [ ] URL de política de privadesa, **actualitzada a ivoriaplicacions.es** amb el
      recordatori i les còpies del progrés (el text és a `public/privacy.html`)
- [ ] Icona 512, gràfic destacat 1024×500, 2–8 captures
- [ ] AAB signat pel workflow `Android Release` (no el del CI de cada commit)

IVORI APLICACIONS és un **compte d'organització** (id 9082694457813802039), així que
no li aplica el període de prova tancada que Google exigeix als comptes personals
nous: es pot enviar a producció directament.

**App Store**
- [ ] Estat de comerciant UE verificat *(sense això no hi ha distribució a la UE)*
- [ ] Els 3 productes IAP amb captura i notes de revisió
- [ ] Privadesa de l'app: *Data Not Collected*
- [ ] Classificació per edat
- [ ] URL de suport i de privadesa (la de privadesa, actualitzada com a Play)
- [ ] Icona 1024 sense alfa, captures d'iPhone 6,9"
- [ ] Formularis fiscals i perfil bancari
- [ ] Build pujada des d'Xcode amb l'SDK vigent

**Les dues**
- [ ] Provar una compra real: comprar, cancel·lar a mitges, restaurar en un
      dispositiu net, reinstal·lar, i comprovar que un reemborsament retira
      l'accés en sincronitzar
- [ ] Provar sense connexió: primer arrencada en mode avió i pàgines legals
      obertes des de dins de l'app
