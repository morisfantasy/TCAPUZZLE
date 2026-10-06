# TCA Tactics Trainer (prototipo)

Web interactiva de The Chess Academy para resolver los ejercicios de los libros de táctica (libros 1 a 4, 800 puzzles).

## Desplegar en Railway

1. Sube esta carpeta a un repositorio de GitHub (o usa `railway up` desde la carpeta con la CLI de Railway).
2. En Railway: **New Project → Deploy from GitHub repo** y elige el repositorio.
3. Railway detecta Node automáticamente y ejecuta `npm start`. No hay dependencias que instalar.
4. En **Settings → Networking → Generate Domain** para obtener la URL pública.

El servidor escucha en la variable `PORT` que asigna Railway. Hay un endpoint `/health` por si quieres configurar el health check.

Probar en local: `npm start` y abrir http://localhost:3000

## Estructura

```
public/index.html     La web completa en un solo archivo (es lo que se sirve)
server.js             Servidor estático mínimo, sin dependencias
build.js              Regenera public/index.html a partir de src/
src/template.html     HTML y estilos
src/app.js            Lógica: registro, compras, progreso, tablero
src/minichess.js      Motor de reglas de ajedrez (jugadas legales, notación, mate)
src/data/books.js     Posiciones y soluciones de los libros 1 a 4
src/data/pieces.json  Piezas en SVG (extraídas de los PDF)
src/data/logo.png     Logo
```

Si editas algo en `src/`, ejecuta `npm run build` para regenerar `public/index.html`.

## Cambios rápidos

- **Precios:** `src/app.js`, objeto `CONFIG.prices` al principio del archivo.
- **Número total de libros:** `CONFIG.totalBooks` (los que no tienen datos salen como "Coming soon").
- **Títulos y descripciones de los libros:** `src/data/books.js` (campos `title`, `desc`, `level`).

## Limitaciones de este prototipo

- Las cuentas, compras y progreso se guardan en el navegador de cada usuario (localStorage). No se comparten entre dispositivos y un entrenador no puede ver el progreso de sus alumnos.
- El pago es simulado: no se cobra nada.
- Para producción hace falta un backend (base de datos de usuarios y progreso) y una pasarela de pago como Stripe. Toda esa lógica está aislada en los objetos `Auth` y `Data` de `src/app.js`, así que se puede sustituir por llamadas a una API sin tocar la interfaz.

## Créditos

Diseño de piezas: Colin M. L. Burnett (Wikimedia Commons), el mismo que usan los PDF de los libros.
