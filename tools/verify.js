/* Verificación automática del sitio con Chrome headless vía CDP.
   Sin dependencias: usa el WebSocket global de Node 22+.

   Comprueba en 375 / 768 / 1440:
     · errores de consola y excepciones
     · recursos que devuelven 404
     · imágenes rotas o sin alt
     · desbordamiento horizontal del body
     · JSON-LD parseable y con los campos clave
     · anclas internas con destino existente
     · funcionamiento de pestañas, menú móvil, lightbox y validación del formulario
   y guarda capturas en tools/capturas/.

   Uso:  node tools/verify.js [urlBase]
*/
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5173/';
const CDP = 'http://127.0.0.1:9222';
const SALIDA = path.resolve(__dirname, 'capturas');

const VIEWPORTS = [
  { nombre: '375-movil', width: 375, height: 812, dsf: 2, movil: true },
  { nombre: '768-tablet', width: 768, height: 1024, dsf: 2, movil: true },
  { nombre: '1440-escritorio', width: 1440, height: 900, dsf: 1, movil: false }
];

const problemas = [];
const notas = [];
const fallo = (m) => problemas.push(m);

/* ---------- cliente CDP mínimo ---------- */
function conectar(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pendientes = new Map();
    const oyentes = [];

    ws.addEventListener('open', () => resolve({
      enviar(metodo, params) {
        return new Promise((res, rej) => {
          const msgId = ++id;
          pendientes.set(msgId, { res, rej });
          ws.send(JSON.stringify({ id: msgId, method: metodo, params: params || {} }));
        });
      },
      al(cb) { oyentes.push(cb); },
      cerrar() { ws.close(); }
    }));

    ws.addEventListener('error', reject);
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pendientes.has(msg.id)) {
        const { res, rej } = pendientes.get(msg.id);
        pendientes.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        oyentes.forEach((cb) => cb(msg));
      }
    });
  });
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(SALIDA, { recursive: true });

  const lista = await (await fetch(CDP + '/json/list')).json();
  const target = lista.find((t) => t.type === 'page');
  if (!target) throw new Error('No hay ninguna pestaña disponible en Chrome.');

  const cli = await conectar(target.webSocketDebuggerUrl);
  const evaluar = async (expr) => {
    const r = await cli.enviar('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 90));
    return r.result.value;
  };

  await cli.enviar('Page.enable');
  await cli.enviar('Runtime.enable');
  await cli.enviar('Log.enable');
  await cli.enviar('Network.enable');

  let consola = [];
  let red = [];
  cli.al((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      consola.push(msg.params.type + ': ' + msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consola.push('excepción: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consola.push('log: ' + msg.params.entry.text + ' (' + (msg.params.entry.url || '') + ')');
    }
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      red.push(msg.params.response.status + ' → ' + msg.params.response.url);
    }
  });

  for (const vp of VIEWPORTS) {
    consola = []; red = [];
    await cli.enviar('Emulation.setDeviceMetricsOverride', {
      width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, mobile: vp.movil
    });
    await cli.enviar('Page.navigate', { url: BASE });
    await espera(2600);
    // Empujar el scroll para disparar el reveal y el lazy loading
    await evaluar('window.scrollTo(0, document.body.scrollHeight); true');
    await espera(1400);
    await evaluar('window.scrollTo(0, 0); true');
    await espera(700);

    console.log('\n=== ' + vp.nombre + ' (' + vp.width + 'px) ===');

    // --- consola y red
    const filtroFuentes = (t) => !/fonts\.(googleapis|gstatic)/.test(t);
    consola.filter(filtroFuentes).forEach((c) => fallo('[' + vp.nombre + '] consola → ' + c));
    red.filter(filtroFuentes).forEach((r) => fallo('[' + vp.nombre + '] red → ' + r));
    console.log('  consola/red: ' + (consola.filter(filtroFuentes).length + red.filter(filtroFuentes).length) + ' incidencias');

    // --- imágenes
    const imgs = await evaluar(`(() => {
      // Las imágenes sin atributo src (p. ej. la del lightbox, que se rellena al abrir)
      // no son un fallo: quedan fuera del recuento.
      const l = [...document.images].filter(i => i.hasAttribute('src'));
      return {
        total: l.length,
        rotas: l.filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src),
        sinAlt: l.filter(i => !i.hasAttribute('alt')).map(i => i.src),
        altVacio: l.filter(i => i.getAttribute('alt') === '').length,
        sinDimensiones: l.filter(i => !i.hasAttribute('width') || !i.hasAttribute('height')).map(i => i.src),
        lazy: l.filter(i => i.loading === 'lazy').length
      };
    })()`);
    imgs.rotas.forEach((s) => fallo('[' + vp.nombre + '] imagen rota → ' + s));
    imgs.sinAlt.forEach((s) => fallo('[' + vp.nombre + '] imagen sin alt → ' + s));
    imgs.sinDimensiones.forEach((s) => fallo('[' + vp.nombre + '] imagen sin width/height (CLS) → ' + s));
    console.log('  imágenes: ' + imgs.total + ' (lazy: ' + imgs.lazy + ', rotas: ' + imgs.rotas.length + ', sin alt: ' + imgs.sinAlt.length + ')');

    // --- desbordamiento horizontal
    const overflow = await evaluar(`(() => {
      const doc = document.documentElement;
      const culpables = [...document.querySelectorAll('body *')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > doc.clientWidth + 2 || r.left < -2);
        })
        .filter(el => getComputedStyle(el).position !== 'fixed')
        .slice(0, 6)
        .map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + (el.className.baseVal || el.className || '').toString().split(' ').slice(0,2).join('.'));
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, culpables };
    })()`);
    if (overflow.scrollW > overflow.clientW + 1) {
      fallo('[' + vp.nombre + '] scroll horizontal: ' + overflow.scrollW + ' > ' + overflow.clientW + ' → ' + overflow.culpables.join(' | '));
    }
    console.log('  ancho documento: ' + overflow.scrollW + ' / viewport ' + overflow.clientW);

    // --- anclas internas
    const anclas = await evaluar(`(() => {
      const rotas = [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute('href'))
        .filter(h => h.length > 1 && !document.querySelector(h));
      return [...new Set(rotas)];
    })()`);
    anclas.forEach((h) => fallo('[' + vp.nombre + '] ancla sin destino → ' + h));
    console.log('  anclas internas rotas: ' + anclas.length);

    // --- JSON-LD
    const jsonld = await evaluar(`(() => {
      const n = document.querySelector('script[type="application/ld+json"]');
      if (!n) return { ok: false, motivo: 'no hay bloque JSON-LD' };
      try {
        const d = JSON.parse(n.textContent);
        const g = d['@graph'] || [d];
        const r = g.find(x => x['@type'] === 'Restaurant');
        if (!r) return { ok: false, motivo: 'no hay nodo Restaurant' };
        const falta = ['name','address','telephone','priceRange','servesCuisine','geo','openingHoursSpecification','sameAs','image','url']
          .filter(k => !r[k]);
        return {
          ok: falta.length === 0, falta,
          nodos: g.map(x => x['@type']),
          sedes: 1 + (r.department ? r.department.length : 0),
          horarios: r.openingHoursSpecification.length
        };
      } catch (e) { return { ok: false, motivo: 'JSON inválido: ' + e.message }; }
    })()`);
    if (!jsonld.ok) fallo('[' + vp.nombre + '] JSON-LD → ' + (jsonld.motivo || 'faltan campos: ' + jsonld.falta.join(', ')));
    else console.log('  JSON-LD: válido · nodos ' + jsonld.nodos.join('+') + ' · ' + jsonld.sedes + ' sedes · ' + jsonld.horarios + ' bloques horarios');

    // --- estructura y accesibilidad básica
    const a11y = await evaluar(`(() => {
      const h1 = document.querySelectorAll('h1').length;
      const niveles = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]);
      let saltos = 0;
      for (let i = 1; i < niveles.length; i++) if (niveles[i] - niveles[i-1] > 1) saltos++;
      const botonesSinNombre = [...document.querySelectorAll('button')]
        .filter(b => !(b.textContent||'').trim() && !b.getAttribute('aria-label') && !b.querySelector('.sr-only')).length;
      const enlacesSinNombre = [...document.querySelectorAll('a')]
        .filter(a => !(a.textContent||'').trim() && !a.getAttribute('aria-label')).length;
      const inputsSinLabel = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')]
        .filter(i => !document.querySelector('label[for="' + i.id + '"]') && !i.closest('label') && !i.getAttribute('aria-label')).length;
      return {
        h1, saltos, botonesSinNombre, enlacesSinNombre, inputsSinLabel,
        lang: document.documentElement.lang,
        landmarks: ['header','nav','main','footer'].filter(t => document.querySelector(t)).length,
        titulo: document.title.length,
        descripcion: (document.querySelector('meta[name=description]')||{}).content?.length || 0
      };
    })()`);
    if (a11y.h1 !== 1) fallo('[' + vp.nombre + '] debe haber exactamente un h1, hay ' + a11y.h1);
    if (a11y.saltos) fallo('[' + vp.nombre + '] jerarquía de encabezados con ' + a11y.saltos + ' salto(s) de nivel');
    if (a11y.botonesSinNombre) fallo('[' + vp.nombre + '] ' + a11y.botonesSinNombre + ' botón(es) sin nombre accesible');
    if (a11y.enlacesSinNombre) fallo('[' + vp.nombre + '] ' + a11y.enlacesSinNombre + ' enlace(s) sin nombre accesible');
    if (a11y.inputsSinLabel) fallo('[' + vp.nombre + '] ' + a11y.inputsSinLabel + ' campo(s) sin etiqueta');
    if (a11y.lang !== 'es') fallo('[' + vp.nombre + '] lang del documento = "' + a11y.lang + '"');
    if (a11y.titulo > 65) notas.push('[' + vp.nombre + '] <title> de ' + a11y.titulo + ' caracteres (Google suele cortar sobre 60)');
    if (a11y.descripcion > 165) notas.push('[' + vp.nombre + '] meta description de ' + a11y.descripcion + ' caracteres');
    console.log('  a11y: h1=' + a11y.h1 + ' landmarks=' + a11y.landmarks + ' saltos=' + a11y.saltos +
                ' · title ' + a11y.titulo + 'c · description ' + a11y.descripcion + 'c');

    // --- interacciones
    const inter = await evaluar(`(async () => {
      const r = {};
      const espera = ms => new Promise(s => setTimeout(s, ms));

      // Pestañas de la carta
      const tabs = [...document.querySelectorAll('[role=tab]')];
      const tab3 = tabs[2];
      tab3.click(); await espera(120);
      r.tabs = {
        seleccionada: tab3.getAttribute('aria-selected') === 'true',
        panelVisible: !document.getElementById(tab3.getAttribute('aria-controls')).hidden,
        otrosOcultos: tabs.filter(t => t !== tab3)
          .every(t => document.getElementById(t.getAttribute('aria-controls')).hidden),
        total: tabs.length
      };
      tabs[0].click();

      // Menú móvil
      const btn = document.getElementById('btn-menu');
      const panel = document.getElementById('menu-movil');
      btn.click(); await espera(150);
      r.menu = { abre: !panel.classList.contains('hidden'), aria: btn.getAttribute('aria-expanded') === 'true' };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await espera(150);
      r.menu.cierraConEsc = panel.classList.contains('hidden');

      // Lightbox
      const disp = document.querySelector('[data-lightbox]');
      const dlg = document.getElementById('lightbox');
      disp.click(); await espera(200);
      r.lightbox = { abre: dlg.open, tieneSrc: !!document.getElementById('lightbox-img').src,
                     contador: document.getElementById('lightbox-contador').textContent };
      document.getElementById('lightbox-next').click(); await espera(120);
      r.lightbox.avanza = document.getElementById('lightbox-contador').textContent !== r.lightbox.contador;
      dlg.close(); await espera(120);
      r.lightbox.cierra = !dlg.open;

      // Formulario: debe rechazar el envío vacío y marcar los errores
      const form = document.getElementById('form-reserva');
      form.elements.nombre.value = '';
      form.elements.email.value = 'esto-no-es-un-email';
      form.requestSubmit(); await espera(200);
      r.form = {
        bloqueaVacio: form.elements.nombre.getAttribute('aria-invalid') === 'true',
        detectaEmail: form.elements.email.getAttribute('aria-invalid') === 'true',
        mensajeVisible: document.getElementById('err-nombre').classList.contains('is-visible'),
        fechaMin: !!document.getElementById('r-fecha').min
      };

      // Cookies y mapas
      const banner = document.getElementById('cookies');
      r.cookies = { visible: !banner.classList.contains('hidden'),
                    mapasBloqueados: document.querySelectorAll('[data-mapa] iframe').length === 0 };
      document.getElementById('cookies-aceptar').click(); await espera(250);
      r.cookies.cargaMapasTrasAceptar = document.querySelectorAll('[data-mapa] iframe').length === 2;
      r.cookies.bannerSeOculta = banner.classList.contains('hidden');
      try { localStorage.removeItem('tdn-consentimiento'); } catch (e) {}

      // Reveal
      r.reveal = { total: document.querySelectorAll('[data-reveal]').length,
                   visibles: document.querySelectorAll('[data-reveal].is-visible').length };
      return r;
    })()`);

    const chequeos = [
      ['pestañas · se selecciona', inter.tabs.seleccionada],
      ['pestañas · panel visible', inter.tabs.panelVisible],
      ['pestañas · resto oculto', inter.tabs.otrosOcultos],
      ['menú móvil · abre', inter.menu.abre],
      ['menú móvil · aria-expanded', inter.menu.aria],
      ['menú móvil · cierra con Esc', inter.menu.cierraConEsc],
      ['lightbox · abre', inter.lightbox.abre],
      ['lightbox · avanza', inter.lightbox.avanza],
      ['lightbox · cierra', inter.lightbox.cierra],
      ['formulario · bloquea vacío', inter.form.bloqueaVacio],
      ['formulario · detecta email inválido', inter.form.detectaEmail],
      ['formulario · muestra el mensaje', inter.form.mensajeVisible],
      ['formulario · fecha mínima = hoy', inter.form.fechaMin],
      ['cookies · banner visible', inter.cookies.visible],
      ['cookies · mapas bloqueados de inicio', inter.cookies.mapasBloqueados],
      ['cookies · carga los 2 mapas al aceptar', inter.cookies.cargaMapasTrasAceptar],
      ['cookies · el banner se oculta', inter.cookies.bannerSeOculta]
    ];
    chequeos.forEach(([nombre, ok]) => { if (!ok) fallo('[' + vp.nombre + '] ' + nombre + ' → KO'); });
    // Un [data-reveal] sin revelar tras recorrer la página entera es contenido invisible
    if (inter.reveal.visibles !== inter.reveal.total) {
      fallo('[' + vp.nombre + '] ' + (inter.reveal.total - inter.reveal.visibles) +
            ' elemento(s) [data-reveal] siguen ocultos tras recorrer la página');
    }
    console.log('  interacciones: ' + chequeos.filter((c) => c[1]).length + '/' + chequeos.length + ' OK' +
                ' · reveal ' + inter.reveal.visibles + '/' + inter.reveal.total);

    // --- captura
    const shot = await cli.enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SALIDA, vp.nombre + '.png'), Buffer.from(shot.data, 'base64'));

    await evaluar('document.getElementById("carta").scrollIntoView(); true');
    await espera(900);
    const shot2 = await cli.enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SALIDA, vp.nombre + '-carta.png'), Buffer.from(shot2.data, 'base64'));
  }

  /* ---------- páginas legales ---------- */
  for (const p of ['legal/aviso-legal.html', 'legal/privacidad.html', 'legal/cookies.html']) {
    consola = []; red = [];
    await cli.enviar('Page.navigate', { url: BASE + p });
    await espera(1400);
    const info = await evaluar(`({
      titulo: document.title,
      h1: document.querySelectorAll('h1').length,
      css: !!document.querySelector('link[href="/css/output.css"]'),
      estiloAplicado: getComputedStyle(document.documentElement).backgroundColor,
      rotos: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href'))
    })`);
    const errores = consola.filter((t) => !/fonts\.(googleapis|gstatic)/.test(t));
    errores.forEach((c) => fallo('[' + p + '] consola → ' + c));
    red.filter((t) => !/fonts\./.test(t)).forEach((r) => fallo('[' + p + '] red → ' + r));
    if (info.h1 !== 1) fallo('[' + p + '] h1 = ' + info.h1);
    // kraft-100 (#E9DCC4): el fondo de la superficie "papel". Si sale otra cosa,
    // o no ha cargado output.css o se ha tocado el token sin actualizar esto.
    if (info.estiloAplicado !== 'rgb(233, 220, 196)') fallo('[' + p + '] los estilos no se aplican (' + info.estiloAplicado + ')');
    console.log('\n=== ' + p + ' ===\n  ' + info.titulo + ' · h1=' + info.h1 + ' · estilos OK');
  }

  /* ---------- enlaces internos entre páginas ---------- */
  const rutas = ['/', '/css/output.css', '/js/main.js', '/favicon.svg', '/site.webmanifest',
                 '/robots.txt', '/sitemap.xml', '/legal/aviso-legal.html', '/legal/privacidad.html',
                 '/legal/cookies.html', '/img/og-tierra-de-nadie.jpg'];
  console.log('\n=== recursos de raíz ===');
  for (const r of rutas) {
    const res = await fetch(new URL(r, BASE));
    if (!res.ok) fallo('recurso → ' + res.status + ' en ' + r);
    else console.log('  200 ' + r);
  }

  cli.cerrar();

  /* ---------- resumen ---------- */
  console.log('\n' + '='.repeat(64));
  if (notas.length) {
    console.log('AVISOS (' + notas.length + '):');
    notas.forEach((n) => console.log('  · ' + n));
  }
  if (problemas.length) {
    console.log('\nPROBLEMAS (' + problemas.length + '):');
    problemas.forEach((p) => console.log('  ✗ ' + p));
    process.exitCode = 1;
  } else {
    console.log('SIN PROBLEMAS. Capturas en tools/capturas/');
  }
}

main().catch((e) => { console.error('ERROR DEL VERIFICADOR:', e); process.exitCode = 2; });
