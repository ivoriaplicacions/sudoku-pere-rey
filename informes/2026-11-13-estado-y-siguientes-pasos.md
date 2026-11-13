# Estado y siguientes pasos de SUDOKU KING

13 de noviembre de 2026. Nota de traspaso del HP (Windows) al Mac. Continúa el plan de
[`2026-11-12-informe-y-plan.md`](2026-11-12-informe-y-plan.md).

## En una frase

Las fases 0 a 4 del plan están programadas, probadas en un emulador Android y fusionadas
en `main`. Falta probarlo en un iPhone, decidir las versiones y preparar la publicación.

## Lo que hay en `main`

Once PR fusionados en orden, con commits de fusión. El CI de `main` (Android, iOS y Pages)
está en verde tras cada uno. Hay 383 pruebas automáticas y `puzzles:verify` pasa 800 de 800.

| PR | Fase | Qué trae |
| --- | --- | --- |
| #10 | 0 | Versión 1.1.1: Capacitor 8.5.3 (cierra la vulnerabilidad), CSP, idiomas en `Info.plist`, textos honestos, el tema ya no cambia de claro a oscuro en el segundo arranque, barra de estado legible en Android 15+ |
| #11 | 1 | Solucionador humano de 13 técnicas (`src/solver/humanSolver.ts`) y `npm run puzzles:grade` |
| #12 | 1 | Escalera de 40 niveles (`src/data/ladder.ts`), generador por técnica, 800 sudokus nuevos, migración del progreso (`CATALOGUE_VERSION = 2`) |
| #13 | 2 | Pistas explicadas en tres pasos: zona, técnica y número |
| #14 | 2 | Notas automáticas (botón «Auto») |
| #15 | 2 | Modo «número primero» |
| #16 | 2 | Una lección por técnica, que se abre sola al llegar al primer nivel que la exige |
| #17 | 3 | Copia nativa del progreso (Preferences) y exportar/importar en Ajustes |
| #18 | 4 | Reto diario con calendario, con su propia partida guardada aparte de la de niveles |
| #19 | 4 | 25 logros de largo recorrido y compartir el resultado |
| #20 | 4 | Petición de valoración nativa y recordatorio de racha opcional a las 20:00 |

La versión de `main` sigue siendo **1.1.1 (build 10101)**, aunque ya contiene lo que el plan
llamaba 2.0 y 2.1.

## Para empezar en el Mac

```bash
git checkout main
git fetch --prune
git pull
npm ci
npm test
npm run puzzles:verify
npm run cap:sync:ios
npm run ios:open
```

- Hace falta Node 22.18 o posterior (`node -v`): los scripts de `scripts/` importan `.ts` directamente. El README todavía dice «20+».
- `npm ci` instala cinco plugins nuevos de Capacitor (preferences, filesystem, share, local-notifications y app-review). Xcode los resuelve por Swift Package Manager al abrir el proyecto.
- `ios/App/CapApp-SPM/Package.swift` se generó en Windows y se corrigieron a mano las barras. Si tras `cap:sync:ios` aparece en `git status`, es normal: revisa que solo cambien rutas y súbelo.
- Las ramas `fase-*` del Mac, si las hay, están obsoletas: todo está en `main`.

## Qué probar en el iPhone

En el emulador Android todo funciona. En iOS no se ha probado nada todavía.

- [ ] La app arranca. La CSP nueva corre por primera vez dentro de WKWebView (`capacitor://localhost`). Si sale en blanco, mira la consola de Safari (Desarrollo → el iPhone).
- [ ] **Barra de estado con tema claro.** `src/native/bootstrap.ts` pone `Style.Dark` (texto blanco) en todas las plataformas, y el tema por defecto de un jugador nuevo es `alba`, que es claro. Lo más probable es que en iOS la hora y la batería salgan blancas sobre fondo claro. En Android se resolvió pintando de oscuro el fondo de la ventana.
- [ ] Migración: instalar encima de la 1.1.0 de la App Store con progreso y comprobar que se conservan estrellas, racha y compras.
- [ ] Copia de seguridad, como pide la Fase 3: hacer copia del iPhone en iCloud, desinstalar, restaurar y comprobar que vuelven niveles, estrellas y racha.
- [ ] Exportar el progreso abre la hoja de compartir de iOS; importar el archivo lo recupera.
- [ ] Recordatorio de racha: pide el permiso de notificaciones al activarlo y avisa a las 20:00.
- [ ] Valoración: el diálogo nativo aparece en builds de desarrollo, pero en TestFlight Apple no lo muestra. Es normal.
- [ ] Lecciones, «número primero» y el tiempo que tarda en generarse el reto diario en un iPhone real (en el emulador, menos de un segundo).

## Decisiones que te tocan

| Decisión | Recomiendo | Por qué |
| --- | --- | --- |
| ¿Se publica aún la 1.1.1 sola? | Solo si la 2.0 va a tardar más de una semana | Cierra la vulnerabilidad. Se compila desde el commit `3ed7be1` (la fusión del PR #10), no desde `main` |
| ¿2.0 y 2.1 por separado, o todo junto? | Todo junto como 2.0.0 | Fase 4 ya está fusionada y probada con el resto; separarla exige desmontarla |
| Precio de «Desbloquear todo» (Fase 5) | Entre 3,99 y 4,99 € | Hoy el máximo por usuario es 2,97 € |
| PR #7 (novedades de la 1.1.0), sigue abierto | Cerrarlo sin fusionar | Las novedades que tocan ahora son las de la 2.0 |
| Ramas `fase-*` remotas, ya fusionadas | Borrarlas | Solo ensucian; el historial queda en `main` |

## Antes de publicar

- [ ] Subir la versión: cambiar `version` en `package.json` a `2.0.0` y quitar `buildNumber` (o ponerle `20000`). `npm run build` propaga la versión a Android e iOS.
- [ ] `store/LISTING.md` sigue prometiendo «Hasta 3 pistas por sudoku» y no menciona reto diario, notas automáticas ni lecciones. Hay que reescribir la descripción en los tres idiomas y escribir las novedades de la 2.0.
- [ ] La política de privacidad debería mencionar el permiso de notificaciones (local, opcional, sin datos fuera del teléfono).
- [ ] `npm run release:check` sin fallos.
- [ ] Android: el keystore (`android/sudoku-king-release.jks` y `android/keystore.properties`) no está en el HP. Si está en el Mac, el AAB firmado se puede compilar ahí con `JAVA_HOME` apuntando a JDK 21.
- [ ] Los cuatro secretos `ANDROID_*` siguen sin crear en GitHub. Mientras falten, no subas etiquetas `v*`: lanzan el workflow «Android Release», que fallará.
- [ ] Fase 5: capturas nuevas con tema claro (iPhone 1206×2622, Android 1080×2160), subtítulo y palabras clave con «sin anuncios» y «aprende técnicas», compra «Desbloquear todo», lanzamiento en catalán.

## Pendientes menores

- `npm audit`: 3 avisos moderados de `uuid`, que llega a través de `@capacitor/cli` (herramienta de desarrollo, no va dentro de la app).
- `puzzles:grade` no corre en el CI; `puzzles:verify` sí, y es la que importa.
- En el HP queda instalado el SDK de Android con un emulador Pixel 7 (Android 16) por si hay que volver a probar allí.

## Notas para Claude en el Mac

- El usuario escribe en castellano. Quiere Auto-fix activado en cada PR que se abra.
- Si se regeneran los sudokus, hay que subir `CATALOGUE_VERSION` en `src/services/persistence.ts`; si no, el progreso guardado apunta a sudokus distintos.
- El generador es determinista: la misma semilla da el mismo sudoku en cualquier dispositivo. El reto diario depende de ello (`src/utils/dailyChallenge.ts`).
- Las PR apiladas se fusionan con commit de fusión, nunca con squash, para que las siguientes no entren en conflicto.
- El progreso vive en `localStorage` con copia en Preferences (`src/services/nativeStore.ts`). Las claves que se copian están en `NATIVE_BACKUP_KEYS` de `persistence.ts`; las que se exportan, en `EXPORTED_KEYS` de `progressFile.ts` (sin compras ni partida en curso).
