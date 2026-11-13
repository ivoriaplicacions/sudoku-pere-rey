# SUDOKU KING 2.0.0 en las tiendas

13 de noviembre de 2026, por la noche. Nota de traspaso del Mac al HP. Continúa
[`2026-11-13-estado-y-siguientes-pasos.md`](2026-11-13-estado-y-siguientes-pasos.md).

## En una frase

La 2.0.0 está publicada en Google Play y en revisión en la App Store, con la ficha y las
capturas en catalán, castellano e inglés. Lo que queda son detalles para la 2.0.1 y
conseguir que la app se encuentre.

## Estado de las tiendas

| | App Store | Google Play |
| --- | --- | --- |
| Versión | 2.0.0 (20000) **Waiting for Review**, reenviada hacia las 22:48. Se publica sola al aprobarse | 2.0.0 (20000) **publicada** en producción |
| Idiomas de la ficha | Catalán (principal), castellano (España), inglés (EE. UU. y Reino Unido) | Catalán (predeterminado), castellano (España), inglés (EE. UU.) |
| Nombre | «SUDOKU KING» en catalán y castellano. En inglés, **«SUDOKU KING: Learn Sudoku»**: «SUDOKU KING» ya lo usa otro desarrollador en inglés | «SUDOKU KING» en los tres |
| Capturas | 6 por idioma. Las de inglés (Reino Unido) heredan las de EE. UU. | 6 por idioma, en orden 01 → 06. Enviadas a revisión esa noche, junto con el reorden de las catalanas, que estaban desordenadas |
| Pendiente de comprobar | Que Apple la apruebe. Si la rechaza, contestar o corregir | En «Visió general de la publicació», que los cambios de la ficha se hayan publicado. La publicación gestionada está desactivada: lo aprobado sale solo |

Precio: los packs II, III y IV siguen a 0,99 €. No habrá «Desbloquear todo» (decidido el
13 de noviembre: a 3,99–4,99 € costaba más que los tres packs juntos) ni suscripción.

La política de privacidad de ivoriaplicacions.es (`/sudokuking.html#privacy`) ya
menciona el recordatorio de racha, las copias del progreso y exportar o compartir. Está
desplegada y subida al repositorio de la web.

## Lo que se ha fusionado hoy en el Mac

| PR | Qué trae |
| --- | --- |
| #22 | Arreglos tras probar en el iPhone 16e: barra de estado legible con tema claro en iOS y la flecha doble de «Volver a los Niveles» |
| #23 | Vídeo de intro (hecho con Gemini, `public/intro/sudoku-king-intro.mp4`) antes de la animación, y pantallas de arranque oscuras lisas en lugar del icono de prueba |
| #24 | Versión 2.0.0 (build 20000), política de privacidad, licencias, declaración de IA y la ficha reescrita en `store/LISTING.md` |
| #25 | Capturas de las dos tiendas en tres idiomas y el arnés XCUITest que las hace (`store/screenshots/harness/`) |

En el iPhone pasaron todas las pruebas de la lista de la nota anterior, menos la
restauración desde la copia de iCloud.

## Para la 2.0.1

Detalles pequeños. Ninguno impide usar la 2.0.0.

- [ ] **Probar la 2.0.0 en Android.** En Android el vídeo de intro y la pantalla de
  arranque nueva solo los han visto las pruebas automáticas. Instalarla desde Play en el
  Galaxy y mirar: el vídeo (con y sin sonido), que no aparezca ningún icono antiguo al
  arrancar, la barra de estado con tema claro y la migración desde la 1.1.0.
- [ ] **«Castellà» en la app en castellano.** En `src/i18n/translations.ts`, bloque `es`,
  `spanish: 'Castellà'` debe ser `'Castellano'`. De paso, conviene decidir un único
  criterio para los nombres de idioma: ahora el bloque `es` dice `'Català'` (en catalán)
  pero `'Inglés'` (en castellano). Lo habitual en un selector de idioma es escribir cada
  idioma en sí mismo: Català, Castellano, English. Añadir la prueba en
  `translations.test.ts`.
- [ ] **Decidir el reto diario de los viernes.** `DAILY_TECHNIQUES` en
  `src/utils/dailyChallenge.ts` pide XY-Wing cada viernes (y cadenas cortas los sábados)
  como muestra de los packs de pago, aunque el jugador vaya por el nivel 1. Puede
  frustrar a un principiante. Es una decisión de producto, no un fallo.
- [ ] **Ficha de Play:**
  - Las capturas de tableta de 7" y 10" son de la 1.x, en inglés y con tema oscuro
    (`store/screenshots/android-tablet/`).
  - El gráfico destacado dice «Sube de nivel» en castellano en los tres idiomas. Hace
    falta uno por idioma o uno sin texto.
  - Las capturas de móvil son del iPhone recortadas. Valen, pero unas hechas en un
    Android quedarían más naturales.
- [ ] **iPhone:** probar la restauración desde la copia de iCloud (Fase 3). Obliga a
  borrar el teléfono, por eso no se hizo.
- [ ] **README:** dice «Node.js 20+» en la tabla de requisitos, pero hace falta 22.18 o
  posterior.
- [ ] **Que la encuentren.** Es el problema de fondo: Play muestra 2 adquisiciones en los
  últimos 28 días. Ideas: revisar las palabras clave en castellano e inglés ahora que hay
  ficha en esos idiomas, promoción cruzada desde las otras apps de IVORI y ver en dos o
  tres semanas si la petición de valoración trae reseñas.

Para subir de versión: en `package.json`, `version` a `2.0.1` y `buildNumber` a `20001`.
`npm run build` lo propaga a Android (`versionCode`, `versionName`) e iOS. La 2.0.1 de iOS
solo se puede enviar cuando la 2.0.0 esté aprobada, o retirándola de revisión.

## Si se trabaja en el HP

- **iOS no se puede compilar ni subir desde el HP.** Hace falta Xcode, en el Mac.
- **El keystore de Android está en el Mac** (`android/sudoku-king-release.jks` y
  `android/keystore.properties`, fuera de git). El AAB firmado de la 2.0.0 se hizo allí.
  En el HP se puede compilar en debug y probar en el Galaxy o en el emulador Pixel 7. Para
  una versión de tienda, compilar en el Mac o copiar el keystore por un canal seguro,
  nunca por git.
- Los secretos `ANDROID_*` de GitHub no se han comprobado. Mientras falten, no subas
  etiquetas `v*`: lanzan el workflow «Android Release», que fallaría.
- Para empezar: `git pull`, `npm ci`, `npm test` (405 pruebas) y `npm run puzzles:verify`
  (800 de 800).
- La web se despliega con Firebase desde la carpeta entera. Mira `git status` antes, y
  haz `git push` después de desplegar o el otro ordenador la revertirá en su próximo
  despliegue.

## Cosas aprendidas que ahorran tiempo

- **App Store, capturas:** mientras la versión está en «Waiting for Review» no se pueden
  cambiar. Hay que retirarla de revisión (queda en «Developer Rejected»), cambiar, «Add for
  Review» y «Submit for Review».
- **App Store, idiomas nuevos:** cada idioma necesita su «Support URL» en la versión y la
  URL de la política de privacidad en «App Privacy»; si no, «Add for Review» falla. El
  nombre de la app tiene que ser único en cada idioma.
- **Subir la build de iOS:** desde la línea de comandos falla porque Xcode elige la
  cuenta de Apple que no es. Usar Transporter o el Organizer de Xcode.
- **En este Mac, `xcrun` se cuelga.** Llamar a `xcodebuild`, `devicectl` y compañía por su
  ruta completa dentro de `/Applications/Xcode.app/Contents/Developer/`.
- **Play, versión nueva:** el AAB subido a la biblioteca no entra solo en la versión. Hay
  que añadirlo con «Afegeix de la biblioteca».
- **Play, capturas:** al subir varias a la vez entran desordenadas. Para fijar el orden,
  quitarlas del campo, marcarlas en la biblioteca en el orden deseado y pulsar «Afegeix».
  Conviene ponerles prefijo de idioma (`es-01-levels.jpg`): la biblioteca es común.
- **Play, declaración de IA:** al guardar la ficha la pide. Están marcados como hechos con
  IA el icono y el gráfico destacado: el logo (`IMAGENES/logosudoku.png`) lleva la firma
  C2PA de ChatGPT. Las capturas no, porque son pantallas reales.
- **Claude in Chrome** solo se conecta con el panel lateral de la extensión abierto en
  Chrome. El navegador integrado de la app de Claude no puede subir archivos.

## Limpieza pendiente

- `VIDEOS/` (sin seguimiento en git) tiene el vídeo original de Gemini. La copia de
  `public/intro/` es idéntica byte a byte. No lo subas ni lo recodifiques: perdería la
  firma C2PA que lo identifica como hecho con IA.
- PR #7 (novedades de la 1.1.0): cerrarlo sin fusionar. Las ramas remotas `fase-*` ya
  están fusionadas y se pueden borrar.
- En el Mac, la carpeta del Escritorio `Capturas SUDOKU KING 2.0` ya no hace falta.
- En el iPhone 16e:
  - Está instalada la versión de desarrollo con progreso de demostración y el
    recordatorio de las 20:00 activado. Cuando la 2.0.0 salga en la App Store,
    desinstalarla y reinstalar desde la tienda.
  - En iCloud Drive → Documentos queda un `sudoku-king-2026-11-13.json` de la prueba de
    exportar.
- En la cuenta de desarrollador de Apple, Xcode dio de alta los identificadores
  `com.ivoriaplicacions.harness.host` y `com.ivoriaplicacions.harness.uitests` para el
  arnés. Se pueden dejar o borrar.
