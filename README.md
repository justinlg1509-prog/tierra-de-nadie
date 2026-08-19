# Tierra de Nadie — web de propuesta (spec work)

Sitio one-page para **Restaurante Tierra de Nadie**, parrilla argentina en Almería.
HTML5 + Tailwind CSS v4 (compilado con CLI) + JavaScript vanilla. Sin framework, sin runtime.

## Identidad: de dónde sale

La dirección visual **no es una invención**: está sacada de la marca real del restaurante
(rótulo de Aguadulce, paneles del logo en sala, cartas y fotos públicas del local).

| Lo que tienen | Dónde se ve | Cómo entra en la web |
|---|---|---|
| Logotipo en **máquina de escribir desgastada**, caja baja y punto final: «Tierra de nadie.» | Rótulo y pared de sala | `--font-display: "Special Elite"`, y el logotipo de cabecera y pie escrito igual |
| **Azul petróleo** `#346269` del rótulo | Rótulo de Aguadulce | Color de marca: botón principal, acentos y el fondo de la carta |
| **Azul noche** `#0E1620` de los paneles donde va el logo | Paredes de sala | Superficie oscura: hero, reseñas, pie |
| **Blanco frío** `#F5F7F7` del logotipo | Letras del rótulo | Fondo dominante del sitio |
| **Espuma** `#89AFB2` (el mar del rótulo) | Fondo del rótulo | Acento sobre superficies oscuras |
| **Madera** `#855727` de los listones y las mesas | Sala | Botón secundario y avisos |

Los hexadecimales salen de muestrear sus propias fotos, no de elegir a ojo:
`tools/` no lo automatiza, pero el procedimiento está en el historial de git.

Tipografía de texto: **Chivo** (Omnibus-Type, Buenos Aires).

> ⚠️ **Falta lo más reconocible de su marca y no se ha falsificado:** el **monograma «DE»**
> del rótulo y el **camarero de dibujo** que usan como mascota y como marca de agua en todas
> sus fotos. Reproducirlos a ojo quedaba peor que no ponerlos. Hay que pedirle al cliente los
> vectores originales. Ver §3.1.

> ⚠️ **No es la web oficial del restaurante.** Es una propuesta comercial no encargada.
> Las fotos son provisionales, los precios están como `€—` y los textos legales son plantillas.
> No publicar en un dominio público con el nombre del negocio sin la autorización del titular.

---

## 1. Arrancar el proyecto

Requisitos: **Node 18+** (para el CLI de Tailwind) y, solo si quieres regenerar las imágenes,
**Python 3.9+ con Pillow** (`pip install Pillow`).

```bash
npm install          # instala @tailwindcss/cli
npm run build        # compila src/input.css -> css/output.css (minificado)
node tools/dev-server.js   # sirve el sitio en http://localhost:5173
```

Durante el desarrollo, en dos terminales:

```bash
npm run dev                # Tailwind en modo watch
node tools/dev-server.js   # servidor estático sin dependencias
```

**Importante:** el sitio usa rutas absolutas (`/css/…`, `/img/…`), así que hay que servirlo
desde la raíz. Abrir `index.html` con doble clic (`file://`) **no** funciona.

### Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run build` | Compila y minifica el CSS a `css/output.css` |
| `npm run dev` | Igual, en modo *watch* |
| `python tools/fetch-unsplash.py` | Regenera `/img` descargando las fotos provisionales de Unsplash |
| `npm run img` | Regenera `/img` con los placeholders sintéticos antiguos (en desuso) |
| `node tools/dev-server.js [puerto]` | Servidor estático (por defecto 5173) |
| `node tools/verify.js` | Batería de verificación automática (ver §6) |

---

## 2. Estructura

```
├── index.html                 one-page completa
├── css/output.css             CSS compilado (NO editar: se regenera)
├── src/input.css              FUENTE de estilos: tokens, componentes, utilidades
├── js/main.js                 todo el comportamiento, vanilla, en bloques aislados
├── img/                       placeholders WebP + og-tierra-de-nadie.jpg
├── legal/                     aviso-legal · privacidad · cookies
├── tools/
│   ├── fetch-unsplash.py          genera /img con fotos de Unsplash
│   ├── generate-placeholders.py   generador sintético anterior (en desuso)
│   ├── dev-server.js              servidor estático sin dependencias
│   └── verify.js                  verificación headless vía CDP
├── favicon.svg · site.webmanifest · robots.txt · sitemap.xml
├── README.md                  este archivo
└── PROPUESTA.md               documento para el dueño del restaurante
```

Los estilos se editan **siempre** en `src/input.css`. `css/output.css` es un artefacto de build.

---

## 3. Contenido real que falta (⚠️ antes de publicar)

Todo lo pendiente está marcado en el código con `<!-- TODO -->` o `// TODO`.
Búsqueda rápida: `grep -rn "TODO" index.html js/ legal/ src/`

### 3.1 Bloqueantes — sin esto no se puede publicar

| # | Qué falta | Dónde | Notas |
|---|---|---|---|
| 1 | **Dominio definitivo** | `index.html` (canonical, OG, JSON-LD), `robots.txt`, `sitemap.xml`, los 3 `legal/*.html` | Ahora hay un marcador: `tierradenadiealmeria.es`. Aparece ~20 veces |
| 2 | **Datos del titular**: razón social, NIF/CIF, domicilio fiscal, correo, datos registrales | `legal/aviso-legal.html`, `legal/privacidad.html` | Obligatorio por LSSI art. 10 |
| 3 | **Revisión legal** de los tres documentos | `legal/` | Son plantillas de referencia, **no** asesoramiento jurídico |
| 4 | **Correo de reservas** | `js/main.js` → `EMAIL_RESERVAS` | Ahora `reservas@tierradenadiealmeria.es` (no existe) |
| 5 | **Número de WhatsApp** | `js/main.js` → `WHATSAPP` | Ahora `34600000000`. El fijo 950 no admite WhatsApp; hace falta un móvil |
| 6 | **Precios de la carta** | `index.html` §carta | Todos los importes van como `€—` a propósito |
| 7 | **Vectores de marca**: el monograma «DE» del rótulo y el camarero de dibujo (mascota y marca de agua de sus fotos) | Cabecera, pie, `favicon.svg` | Ahora la cabecera lleva **solo el logotipo**, que sí es fiel. El monograma se probó a ojo y quedaba peor que no ponerlo: a 32 px se leía como una «p». El favicon es una «D» de recurso |

### 3.2 Importantes

| # | Qué falta | Dónde |
|---|---|---|
| 8 | **Carta completa**: hay 13 platos, tomados solo de los que se mencionan públicamente. Faltan secciones enteras | `index.html` §carta |
| 9 | **Horario confirmado**: 13:00–16:00 / 20:30–00:00 y cierre los miércoles están como «sujeto a cambios». Confirmar y decidir si las dos sedes coinciden | `index.html` §locales, §reserva y JSON-LD |
| 10 | **Teléfono propio de Aguadulce**: en una foto de su propia carta de Aguadulce aparece **950 712 261**, distinto del 950 71 81 37 que muestra la web para las dos sedes. Confirmar y separarlos | `index.html` §locales + JSON-LD |
| 11 | **Código postal de Aguadulce**: se ha asumido 04720 | JSON-LD |
| 12 | **Coordenadas exactas** de ambos locales. Las actuales son aproximadas a nivel de calle | JSON-LD `geo` |
| 13 | **Año de apertura**: uno de los 4 datos de «La casa» debería ser «Desde 20XX» | `index.html` §la-casa |
| 14 | **Reseñas literales**: ver §4 | `index.html` §resenas |
| 15 | **Las 5 respuestas de preguntas frecuentes**: están escritas a partir de lo que ya afirmaba la web (horarios, sin gluten, grupos, terraza). Confirmar una por una, sobre todo la de terraza en ambos locales | `index.html` §preguntas + JSON-LD `FAQPage` |

---

## 4. Dos decisiones de contenido que conviene conocer

**Las reseñas no son citas literales.** La sección «Lo que más se repite» resume los temas
recurrentes de las opiniones publicadas (trato del equipo, raciones, punto de la carne, sin
gluten) y así lo declara bajo el carrusel. No se han inventado citas ni se han atribuido a
personas concretas. Para poner reseñas reales hay que copiarlas literalmente de Google o
TripAdvisor, con su autor y fecha, y contar con el permiso del restaurante.

**El JSON-LD no lleva `aggregateRating`.** Google no acepta que un negocio publique en su
propia web la valoración media de sus reseñas (*self-serving reviews*): la ignora y, en el
peor caso, es motivo de acción manual. El 4,5★ se muestra como contenido visible —donde es
perfectamente legítimo— pero fuera de los datos estructurados. Si en el futuro se recogen
reseñas en el propio sitio, entonces sí puede marcarse.

---

## 5. Fotografía que hay que pedir al cliente

Todas las imágenes de `/img` son **fotos de banco, provisionales**, bajadas de Unsplash con
`tools/fetch-unsplash.py` (Unsplash License: uso comercial permitido, sin atribución obligatoria;
los créditos están en `CREDITOS-FOTOS.md`). Reservan la proporción, el nombre de archivo y el peso
aproximado de la foto definitiva: sustituir es copiar encima, sin tocar el HTML.

> ⚠️ **Dos no coinciden con lo que promete su pie y hay que cambiarlas las primeras:**
> `galeria-03-empanadas` no muestra empanadas (son masas fritas de otro tipo) y
> `galeria-09-croquetas` no muestra croquetas. En Unsplash no hay foto buena de ninguna de
> las dos cosas, y son justamente dos señas de identidad de la casa.

Formato de entrega: **WebP, calidad 72–80**. Entregar cada foto en los anchos indicados
(el HTML ya trae el `srcset` montado). Si llegan en JPG, `tools/fetch-unsplash.py`
sirve de referencia para las conversiones y los recortes.

### Prioridad alta — se ven en la primera pantalla

| Archivo | Proporción | Anchos | Qué debe verse |
|---|---|---|---|
| `hero-parrilla` | 16:9 | 640 / 1000 / 1600 / 2400 | **La foto que manda.** Parrilla en marcha, carne y brasa, apaisada, con zona oscura a la izquierda para que respire el titular. Horizontal obligatorio |
| `og-tierra-de-nadie.jpg` | 1200×630 | 1200 (JPG) | La que sale al compartir en WhatsApp/Facebook. Puede ser un recorte del hero |

### Prioridad media — secciones de contenido

| Archivo | Proporción | Anchos | Qué debe verse |
|---|---|---|---|
| `casa-brasas` | 4:5 | 560 / 900 | Vertical. Brasas, detalle de la parrilla, humo |
| `casa-equipo` | 3:2 | 560 / 900 | Equipo de sala trabajando. Personas, no bodegón |
| `carta-entrantes` | 3:2 | 520 / 900 | Croquetas, canelones de aguacate o tartar |
| `carta-empanadas` | 3:2 | 520 / 900 | Empanadas, a poder ser recién hechas |
| `carta-parrilla` | 3:2 | 520 / 900 | Cortes sobre la parrilla |
| `carta-mar` | 3:2 | 520 / 900 | Pescado del día |
| `carta-postres` | 3:2 | 520 / 900 | Tarta de queso |
| `local-almeria-centro` | 16:10 | 560 / 1100 | Sala o fachada de C. Líbano 15 |
| `local-aguadulce-playa` | 16:10 | 560 / 1100 | Terraza de Aguadulce **con el mar a la vista** |
| `eventos-mesa-larga` | 21:9 | 900 / 1800 | Mesa larga montada para grupo. Muy apaisada |

### Galería — 9 fotos, 560 y 1200 de ancho cada una

`galeria-01-churrasco` (4:5) · `galeria-02-parrillada` (3:2) · `galeria-03-empanadas` (1:1)
`galeria-04-sala` (3:2) · `galeria-05-tartar` (4:5) · `galeria-06-brasas` (1:1)
`galeria-07-terraza-playa` (3:2) · `galeria-08-tarta-queso` (4:5) · `galeria-09-croquetas` (1:1)

La rejilla es tipo *masonry*: la mezcla de verticales, cuadradas y apaisadas es intencionada.
Mantener esas proporciones para que el ritmo no se rompa.

**Además:** cada foto necesita una descripción corta para el `alt` (accesibilidad y SEO).
Los `alt` actuales son provisionales pero descriptivos; ajustarlos a lo que se vea de verdad.

---

## 6. Verificación automática

`tools/verify.js` levanta Chrome en headless, se conecta por CDP y comprueba el sitio a
**375 / 768 / 1440 px**. No necesita ninguna dependencia de npm.

```bash
# terminal 1
node tools/dev-server.js

# terminal 2
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new ^
  --remote-debugging-port=9222 --user-data-dir=%TEMP%\tdn-chrome about:blank

# terminal 3
node tools/verify.js
```

Qué comprueba: errores de consola y excepciones · respuestas HTTP ≥ 400 · imágenes rotas,
sin `alt` o sin `width`/`height` · desbordamiento horizontal · anclas internas sin destino ·
JSON-LD parseable y con los campos clave · un único `h1` y jerarquía de encabezados sin
saltos · botones, enlaces y campos sin nombre accesible · longitud de `title` y
`description` · y el funcionamiento real de pestañas, menú móvil, lightbox, validación del
formulario, consentimiento de cookies y scroll reveal. Guarda capturas en `tools/capturas/`.

**Estado actual: 0 problemas** en los tres anchos y en las tres páginas legales.

Lo que **no** cubre y hay que mirar a mano antes de entregar:

- **Lighthouse** con el sitio ya desplegado (en local, el CSS de Google Fonts y la ausencia
  de compresión falsean la nota).
- **Rich Results Test** de Google sobre la URL real: <https://search.google.com/test/rich-results>
- **Validador del W3C** sobre la URL real: <https://validator.w3.org/>
- **Contraste real** de las fotos definitivas contra el texto del hero.
- Prueba con lector de pantalla (NVDA o VoiceOver) del formulario y del menú móvil.

---

## 7. Decisiones técnicas que conviene no deshacer

- **Tailwind por CLI, no CDN.** El CDN de Tailwind es un compilador en el navegador: mata la
  nota de rendimiento. El CSS compilado son ~40 KB minificados, y menos aún tras gzip.
- **Fuentes asíncronas.** El CSS de Google Fonts se carga con `preload` + `onload` y
  `noscript` de respaldo, para que no bloquee el pintado. Con `font-display: swap`.
- **Google Maps bloqueado por defecto.** Los iframes solo se insertan tras aceptar cookies
  o pulsar «Cargar el mapa» de cada tarjeta. Cargarlos sin consentimiento sería una
  infracción de la LSSI y penaliza el rendimiento.
- **Todas las imágenes llevan `width` y `height`.** Es lo que evita el *layout shift* (CLS).
  Si se cambia una foto por otra de distinta proporción, hay que actualizar esos atributos.
- **`prefers-reduced-motion` se respeta de verdad:** desactiva reveal, parallax, scroll suave
  y el grano. No es solo una media query decorativa.
- **El scroll reveal lleva red de seguridad.** Un `IntersectionObserver` puro deja elementos
  invisibles para siempre si el usuario salta de golpe (ancla, recarga con hash). Hay un
  barrido en `scroll` que recupera lo que quedó por encima del viewport. No quitarlo.
- **El `<img>` del lightbox no lleva `src` en el HTML.** Un `src=""` dispara una petición a
  la propia página.
- **La foto del hero se precarga con `imagesrcset`**, el mismo del `<img>`. Es el LCP: así la
  petición sale al leer el `<head>` en vez de al construir el `<body>`, y no descarga de más
  porque el navegador elige la misma candidata. Si se cambia el `srcset` del hero, hay que
  cambiar el `preload` igual, o se bajarán dos ficheros distintos.
- **El bloque de preguntas frecuentes va en `<details>` nativos.** Sin JS, y el texto está en
  el DOM aunque esté plegado: es lo que exige Google para el `FAQPage`, que no admite marcado
  sobre respuestas que el visitante no puede ver. Si se quita una pregunta del HTML, hay que
  quitarla también del JSON-LD.
- **El color va por superficies, no por clases sueltas.** Cada sección declara
  `data-superficie="papel | papel-hondo | tinta | pizarra"` y eso redefine los tokens
  semánticos (`--color-fuerte`, `--color-texto`, `--color-suave`, `--color-acento`,
  `--color-filete`, `--color-fondo`, `--color-alza`). El HTML usa **siempre** esos nombres
  (`text-fuerte`, `border-filete/20`…), nunca un color concreto. Cambiar una sección de clara
  a oscura es cambiar un atributo. Si se escribe `text-tiza-50` a pelo en el HTML, se rompe
  esa propiedad.
- **El fondo del sitio lo pinta solo `<html>`, nunca `<body>`.** Si los dos pintan, la caja del
  `body` tapa las capas en `-z-10`, que es donde viven la foto y el degradado del hero: el hero
  se queda en blanco y su texto, en tiza sobre kraft, desaparece. Por eso el `body` no lleva
  `data-superficie`: hereda del tema los valores de «papel», que son los que le tocan.
- **Las secciones con foto a sangre llevan `data-sin-fondo`** (hero y eventos), y la cabecera
  también mientras está arriba del todo. Heredan los colores de texto de su superficie pero
  dejan ver lo que tienen detrás. `js/main.js` conmuta la cabecera entre `tinta` y `papel`
  al hacer scroll.

---

## 8. Checklist de despliegue

**Contenido**
- [ ] Sustituidas las 22 imágenes por las fotos reales, con sus `alt` revisados
- [ ] Precios reales en la carta (quitar los `€—`) y carta completa
- [ ] Horario confirmado; revisar si Aguadulce difiere de Almería
- [ ] Año de apertura en «La casa»
- [ ] Reseñas literales con autor y fecha, o mantener los resúmenes actuales
- [ ] Textos legales revisados por un asesor y con los datos del titular

**Configuración**
- [ ] Dominio definitivo sustituido en canonical, OG, JSON-LD, `robots.txt`, `sitemap.xml` y las 3 páginas legales
- [ ] `EMAIL_RESERVAS` y `WHATSAPP` reales en `js/main.js`
- [ ] Coordenadas `geo` exactas y CP de Aguadulce en el JSON-LD
- [ ] `lastmod` del `sitemap.xml` actualizado
- [ ] Fecha de «Última actualización» en las tres páginas legales

**Técnico**
- [ ] `npm run build` ejecutado y `css/output.css` actualizado y subido
- [ ] `node tools/verify.js` sin problemas
- [ ] HTTPS activo y redirección 301 de http → https y de www → sin www (o al revés, pero una sola)
- [ ] Compresión Brotli/gzip activa
- [ ] `Cache-Control` largo para `/img`, `/css` y `/js`; corto para el HTML
- [ ] Cabeceras de seguridad: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Página 404 (pendiente: no existe todavía)

**Lanzamiento**
- [ ] Lighthouse ≥ 90 en las cuatro métricas sobre la URL real
- [ ] Rich Results Test sin errores
- [ ] Validador del W3C sin errores
- [ ] Formulario probado de verdad: llega el correo y el WhatsApp
- [ ] Sitio dado de alta en Google Search Console y sitemap enviado
- [ ] **Ficha de Google Business Profile actualizada con el dominio nuevo** (es lo que más
      mueve la aguja: hoy apunta a Facebook)
- [ ] Enlace de la web añadido en la bio de Instagram y en la página de Facebook

### Dónde está desplegado ahora

| | |
|---|---|
| Web | https://tierra-de-nadie.vercel.app |
| Código | https://github.com/justinlg1509-prog/tierra-de-nadie (rama `main`) |
| Hosting | Vercel, desplegando automáticamente en cada push a `main` |

Lo que **no** se publica lo marca `.vercelignore`: `src/`, `tools/`, `.claude/`, este README y
`PROPUESTA.md`. Como el sitio se sirve desde la raíz, sin esa lista quedarían accesibles por URL.
Si algún día el HTML pasa a referenciar algo de ahí, hay que sacarlo del `.vercelignore`.

El sitio se sirve **como estático desde la raíz**: `vercel.json` deja `installCommand` y
`buildCommand` vacíos, así que Vercel no compila nada, solo publica los ficheros del repo.

> ⚠️ **Consecuencia:** `css/output.css` va versionado y es lo que se publica tal cual.
> Si tocas `src/input.css`, hay que ejecutar `npm run build` **y commitear el CSS resultante**,
> o el despliegue saldrá con los estilos viejos.

`vercel.json` también resuelve, para este despliegue de propuesta, varios puntos del checklist
técnico de arriba: cabeceras `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`,
`Cache-Control` de un día para `/img`, y HTTPS y compresión que ya pone Vercel por su cuenta.

Y añade **`X-Robots-Tag: noindex, nofollow` en todas las respuestas**, a propósito: mientras esto
sea una propuesta no aprobada, no debe indexarse ni competir en Google con el negocio real. Esa
cabecera manda por encima del `<meta name="robots" content="index, follow">` del HTML, que se ha
dejado intacto para el dominio definitivo. **Al publicar de verdad hay que quitar ese bloque de
`vercel.json`**, o la web oficial nacerá invisible para los buscadores.

---

## 9. Accesibilidad

Objetivo WCAG 2.1 AA. Lo que ya está resuelto:

- Contrastes medidos con `node tools/contrast.js`, **las 25 combinaciones de las cuatro
  superficies**. Las más ajustadas: espuma `#89AFB2` sobre la carta **4,90:1** y texto suave
  `#96A9AC` sobre la carta **4,75:1**. El resto va de 5,4:1 a 16,9:1.
  El azul petróleo de la marca `#346269` no llega a 4,5:1 sobre el blanco frío, así que en
  texto se usa una versión más oscura (`#2A5158`, 8,1:1) y el `#346269` queda para rellenos.
  La espuma `#89AFB2` es al revés: preciosa sobre oscuro (7,7:1) e ilegible sobre claro, así
  que **solo** aparece sobre las superficies oscuras.
  Si se toca cualquier color de `src/input.css`, volver a pasar `node tools/contrast.js`.
- HTML semántico con `header` / `nav` / `main` / `footer`, un solo `h1` y jerarquía sin saltos.
- Foco visible en todo el sitio y enlace «Saltar al contenido». El anillo de foco es petróleo
  sobre las superficies claras y espuma sobre las oscuras, porque ninguno de los dos se ve
  bien en las dos.
- Pestañas de la carta con el patrón WAI-ARIA completo: flechas, `Home`/`End` y `tabindex` móvil.
- Menú móvil con trampa de foco, `Escape`, `aria-expanded` y devolución del foco al cerrar.
- Lightbox sobre `<dialog>` nativo: foco y `Escape` los gestiona el navegador; flechas para navegar.
- Formulario con `label` en todos los campos, `aria-invalid`, `aria-describedby`, mensajes de
  error en español y foco automático en el primer campo que falla.
- Todas las imágenes con `alt`; los iconos decorativos con `aria-hidden`.

---

## 10. Rendimiento

Peso total de la página: **~40 KB de CSS + ~11 KB de JS + las imágenes**. Cero librerías.

- WebP con `srcset` y `sizes` en todas las fotos; `loading="lazy"` en las 19 que no están
  en la primera pantalla; `fetchpriority="high"` solo en el hero.
- El grano es un `feTurbulence` SVG en línea (~350 bytes), no una textura descargada.
- El parallax y la cabecera van con `requestAnimationFrame` y solo tocan `transform`:
  no provocan reflow.
- El `IntersectionObserver` deja de observar cada elemento en cuanto lo revela.

Puntos a vigilar cuando entren las fotos reales: el hero a 2400 px es el mayor riesgo para el
LCP. Mantenerlo por debajo de ~250 KB en WebP.
