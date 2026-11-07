# The Chess Academy

Plataforma de TCA para el cuaderno White Pawn (300 ejercicios en 10 capítulos), vídeos, cálculo del Elo clásico FIDE y análisis de partidas para entrenadores.

## Desarrollo

La aplicación usa Node.js, PostgreSQL y JavaScript en el navegador. Usa Node 20 o superior para las pruebas con Playwright.

```sh
npm ci
npm run build
DATABASE_URL=postgresql://usuario:clave@localhost/tca npm start
```

El servidor escucha en el puerto de la variable PORT (por defecto 3000). La comprobación de salud es GET /health. Railway compila main y ejecuta npm run start en el servicio existente.

- build.js genera public/index.html a partir de src/template.html, el cuaderno, el texto de interfaz y la navegación. Al cambiar esos archivos hay que regenerar el HTML.
- server.js gestiona las cuentas, las sesiones y los permisos en PostgreSQL. El progreso del cuaderno se conserva en el navegador por usuario.
- /analysis y /api/analysis/ requieren una sesión de administrador o superadministrador. La importación valida el árbol PGN completo en el servidor. La edición del estudio reside en memoria y se puede descargar en formato PGN.
- /calculator calcula estimaciones de Elo clásico con las tablas de las secciones 7 y 8 del [reglamento FIDE](https://handbook.fide.com/chapter/B022024).

## Pruebas

```sh
npm test
npx playwright install chromium
TCA_TEST_DATABASE_URL=postgresql://usuario:clave@localhost/tca_test npm run test:e2e
```

La prueba de navegador usa OpenSSL y una base local en la que el usuario pueda crear esquemas. Crea un esquema aislado y lo elimina al terminar. Comprueba la interfaz, los permisos, la importación desde archivo y texto, la edición de variantes, la navegación móvil y ambos cálculos de Elo. TCA_TEST_CHROMIUM permite usar un ejecutable Chromium instalado.
