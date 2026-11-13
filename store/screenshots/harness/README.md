# Arnés de capturas para las tiendas

Con esto se hicieron las capturas de la 2.0 (`store/screenshots/appstore/` y
`store/screenshots/play/`) el 13 de noviembre de 2026, en un iPhone 16e. Solo funciona
en el Mac: necesita Xcode y un iPhone conectado por cable.

| Archivo | Para qué |
| --- | --- |
| `project.yml` | Proyecto de [XcodeGen](https://github.com/yonaskolb/XcodeGen) con una app vacía (`Host`) y las pruebas de interfaz (`UITests`) |
| `UITests/StoreScreenshots.swift` | Recorre SUDOKU KING ya instalada en el iPhone (por su bundle id) y hace las 6 capturas en castellano, catalán e inglés |
| `seed.js` | Progreso de demostración (73 sudokus, unas 210 estrellas, racha de 6) para que la lista de niveles no salga vacía |

Las pruebas no compilan SUDOKU KING: la manejan desde fuera. Los botones de las
casillas, del teclado y de los idiomas son interruptores (`.switch`), no botones; por
eso la prueba los busca así.

## Pasos

1. **Compilar la app con el progreso de demostración.** `seed.js` no debe llegar nunca
   a una build de tienda: se añade a `dist/` después de compilar, y `npm run build` lo
   borra la próxima vez.

   ```bash
   npm run build
   cp store/screenshots/harness/seed.js dist/
   # En dist/index.html, añadir <script src="seed.js"></script>
   # como primera línea dentro de <head>.
   npx cap sync ios
   ```

   Instalar en el iPhone desde Xcode (esquema App, configuración Debug), abrirla una
   vez y poner el tema claro Alba Daurada.

2. **Generar el proyecto del arnés y lanzar la prueba.** Llamar a `xcodebuild` por su
   ruta completa: en este Mac `xcrun` se cuelga.

   ```bash
   cd store/screenshots/harness
   xcodegen generate
   /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild test \
     -project Harness.xcodeproj -scheme UITests \
     -destination "id=<UDID del iPhone>" -allowProvisioningUpdates \
     -resultBundlePath /tmp/shots.xcresult \
     -only-testing:UITests/StoreScreenshots/testStoreFlow
   xcrun xcresulttool export attachments --path /tmp/shots.xcresult --output-path /tmp/raw
   ```

   La prueba espera unos minutos en la captura de victoria para que el tiempo sea
   creíble. Deja la app en castellano.

3. **Escalar y recortar.** Las capturas salen a 1170×2532.

   ```bash
   # App Store, clase «pantalla mediana»: 1179×2556
   ffmpeg -i in.png -vf "scale=1179:2556:flags=lanczos" -q:v 2 -pix_fmt yuvj444p out.jpg
   # Play: 1080×2160, sin la barra de estado del iPhone
   ffmpeg -i in.png -vf "scale=1080:-1:flags=lanczos,crop=1080:2160:0:125" -q:v 2 -pix_fmt yuvj444p out.jpg
   ```

4. **Volver a dejar la app limpia:** `npm run build && npx cap sync` borra `seed.js` de
   la copia de iOS. En el iPhone, desinstalar la versión de desarrollo y reinstalar la de
   la App Store.

## Lo que se puede mejorar

- La barra de estado es la real del teléfono (cargando). Para la de marketing (9:41,
  batería llena) hay que hacerlas en el simulador, que en este Mac de 8 GB no arranca
  con otras apps abiertas.
- Las capturas de Play salen del iPhone. Las de tableta de Play siguen siendo de la 1.x.
