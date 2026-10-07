# Fitxes de botiga — SUDOKU KING

Material per enganxar a Google Play Console i App Store Connect. Tots els textos
estan comptats i caben al seu límit; el recompte va entre parèntesis.

> Els límits i les mides de captura els canvien Google i Apple sense avisar.
> Confirma cada xifra a la consola abans de produir els actius.

**Versió**: 1.0.0 (versionCode 10000) · **Bundle**: `com.ivoriaplicacions.maestrosdelsudoku`

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
800 sudokus verificats. 200 gratis. Sense anuncis ni registre.
```
(62/80)

**es**
```
800 sudokus verificados. 200 gratis. Sin anuncios ni registro.
```
(62/80)

**en**
```
800 verified sudokus. 200 free. No ads, no sign-up, no tracking.
```
(64/80)

### Descripció completa (4000)

Vegeu la secció [3. Descripció llarga](#3-descripció-llarga). La mateixa serveix
per a Play i per a l'App Store.

### Gràfics

| Actiu | Requisit | Estat |
|-------|----------|-------|
| Icona | 512×512 PNG, ≤1 MB | ✅ `store/play-icon-512.png` |
| Gràfic destacat | 1024×500 JPG o PNG 24 bits, **sense transparència** | ❌ per fer |
| Captures de telèfon | 2–8, costat entre 320 i 3840 px, proporció entre 16:9 i 9:16 | ❌ per fer |
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
800 sudokus, sense anuncis
```
(26/30)

**es**
```
800 sudokus, sin anuncios
```
(25/30)

**en**
```
800 sudokus, no ads, offline
```
(28/30)

### Text promocional (170) — es pot canviar sense revisió

**ca**
```
Pack inicial gratuït: 200 sudokus de solució única. Sense anuncis, sense registre i sense connexió. Els packs són compra única, mai subscripció.
```
(144/170)

**es**
```
Pack inicial gratis: 200 sudokus de solución única. Sin anuncios, sin registro y sin conexión. Los packs son compra única, nunca suscripción.
```
(141/170)

**en**
```
Free starter pack: 200 sudokus with a single verified solution. No ads, no sign-up, works offline. Packs are one-time purchases, never a subscription.
```
(150/170)

### Paraules clau (100, separades per comes, sense espai després de la coma)

No repeteixis paraules que ja són al nom o al subtítol: Apple ja les indexa i
gastaries caràcters.

**ca**
```
sudokus,passatemps,nombres,lògica,mental,sense connexió,sense anuncis,trencaclosques,joc,cervell
```
(96/100)

**es**
```
sudokus,pasatiempos,numeros,logica,mental,offline,sin anuncios,rompecabezas,juego,cerebro,puzzle
```
(96/100)

**en**
```
sudokus,puzzle,numbers,logic,brain,offline,no ads,training,classic,game,solitaire,mind,teaser
```
(93/100)

### Captures

| Actiu | Requisit | Estat |
|-------|----------|-------|
| Icona | 1024×1024 PNG, **sense canal alfa** | ✅ `store/appstore-icon-1024.png` |
| iPhone 6,9" | 1290×2796 o 1320×2868, vertical, 2–10 | ❌ per fer |
| iPad | — | no cal, l'app és d'iPhone |

Apple escala el joc de 6,9" per als iPhone més petits; ja no calen els jocs de
6,5" i 5,5".

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

### Català (1273/4000)

```
800 sudokus verificats un per un. El primer pack, 200 sudokus, és gratuït.

SUDOKU KING no té anuncis, no demana registre i no recull cap dada. Funciona sense connexió, del primer sudoku fins a l'últim.

CONTINGUT
• 4 packs · 40 nivells · 800 sudokus
• Del nivell Iniciació (50 pistes) al Mestre (30 pistes)
• Cada sudoku té una única solució, comprovada amb un verificador abans de publicar-lo

PACK INICIAL GRATUÏT
200 sudokus, nivells 1 a 10. Els nivells s'obren a mesura que completes partides.

PACKS DE PAGAMENT
Els packs II, III i IV són compres úniques, mai subscripcions. En comprar un pack, els seus 10 nivells s'obren immediatament, sense haver d'esperar cap progrés.

COM ES JUGA
• Notes a cada casella
• Fins a 3 pistes per sudoku
• Desfer sense límit
• Comprovació d'errors, que pots desactivar
• Cronòmetre i estrelles segons temps, errors i pistes

TAMBÉ
• Català, castellà i anglès
• 6 temes visuals
• Ratxa diària i assoliments
• Vibració, que pots desactivar
• Teclat físic: xifres, fletxes, esborrar i desfer

PRIVADESA
Cap compte. Cap identificador publicitari. Cap servidor nostre. El progrés es desa només al teu dispositiu. Les compres les processa la botiga.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

### Castellà (1305/4000)

```
800 sudokus verificados uno a uno. El primer pack, 200 sudokus, es gratis.

SUDOKU KING no tiene anuncios, no pide registro y no recoge ningún dato. Funciona sin conexión, del primer sudoku hasta el último.

CONTENIDO
• 4 packs · 40 niveles · 800 sudokus
• Del nivel Iniciación (50 pistas) al Maestro (30 pistas)
• Cada sudoku tiene una única solución, comprobada con un verificador antes de publicarlo

PACK INICIAL GRATIS
200 sudokus, niveles 1 a 10. Los niveles se abren a medida que completas partidas.

PACKS DE PAGO
Los packs II, III y IV son compras únicas, nunca suscripciones. Al comprar un pack, sus 10 niveles se abren de inmediato, sin tener que esperar ningún progreso.

CÓMO SE JUEGA
• Notas en cada casilla
• Hasta 3 pistas por sudoku
• Deshacer sin límite
• Comprobación de errores, que puedes desactivar
• Cronómetro y estrellas según tiempo, errores y pistas

ADEMÁS
• Catalán, castellano e inglés
• 6 temas visuales
• Racha diaria y logros
• Vibración, que puedes desactivar
• Teclado físico: cifras, flechas, borrar y deshacer

PRIVACIDAD
Ninguna cuenta. Ningún identificador publicitario. Ningún servidor nuestro. El progreso se guarda solo en tu dispositivo. Las compras las procesa la tienda.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

### Anglès (1196/4000)

```
800 sudokus, every one verified. The first pack, 200 sudokus, is free.

SUDOKU KING has no ads, asks for no account and collects no data. It works offline, from the first sudoku to the last.

WHAT YOU GET
• 4 packs · 40 levels · 800 sudokus
• From Initiation (50 clues) to Master (30 clues)
• Every sudoku has exactly one solution, checked by a verifier before release

FREE STARTER PACK
200 sudokus, levels 1 to 10. Levels open as you finish puzzles.

PAID PACKS
Packs II, III and IV are one-time purchases, never subscriptions. Buying a pack opens all ten of its levels straight away, with no progress to grind first.

HOW IT PLAYS
• Pencil notes in any cell
• Up to 3 hints per sudoku
• Unlimited undo
• Mistake checking you can switch off
• Timer and stars based on time, mistakes and hints

ALSO
• Catalan, Spanish and English
• 6 visual themes
• Daily streak and achievements
• Haptics you can switch off
• Hardware keyboard: digits, arrows, erase and undo

PRIVACY
No account. No advertising identifier. No servers of ours. Progress is stored on your device only. Purchases are handled by the store.

Francesc Siuraneta Jové — IVORI APLICACIONS · Tarragona
hola@ivoriaplicacions.es
```

Les dues descripcions diuen explícitament que al pack gratuït els nivells s'obren
amb el progrés i que als de pagament no. És el que exigeix la informació
precontractual, i evita la reclamació de qui compra esperant una cosa altra.

---

## 4. Captures: què ha de sortir a cadascuna

Sis captures, en aquest ordre. Les dues primeres són les úniques que la majoria
de gent veurà al resultat de cerca, així que han de dir de què va l'app soles.

| # | Pantalla | Per què |
|---|----------|---------|
| 1 | Tauler a mig joc, tema Jardí Zen, amb notes visibles en alguna casella | És el producte. Que es vegi el tauler gran i net |
| 2 | Graella de nivells amb estrelles i progrés | Comunica volum i progressió |
| 3 | Botiga interna amb els packs i el preu | Expectatives honestes abans de descarregar |
| 4 | Tauler amb el mode notes i una pista aplicada | Les mecàniques que diferencien |
| 5 | Ajustos amb els sis temes | Personalització |
| 6 | Assoliments i ratxa | Motiu per tornar |

Per a la 1.0, captures netes del dispositiu són suficients: no calen marcs ni
textos superposats. Si més endavant hi afegeixes rètols, hauràs de mantenir-los
en els tres idiomes.

Com obtenir-les a la mida exacta:

```bash
npm run dev
```

I al simulador d'iPhone amb pantalla de 6,9", capturar amb `Cmd+S`. Per a Play,
qualsevol captura d'entre 320 i 3840 px de costat serveix; les d'iPhone valen.

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
- [ ] URL de política de privadesa
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
- [ ] URL de suport i de privadesa
- [ ] Icona 1024 sense alfa, captures d'iPhone 6,9"
- [ ] Formularis fiscals i perfil bancari
- [ ] Build pujada des d'Xcode amb l'SDK vigent

**Les dues**
- [ ] Provar una compra real: comprar, cancel·lar a mitges, restaurar en un
      dispositiu net, reinstal·lar, i comprovar que un reemborsament retira
      l'accés en sincronitzar
- [ ] Provar sense connexió: primer arrencada en mode avió i pàgines legals
      obertes des de dins de l'app
