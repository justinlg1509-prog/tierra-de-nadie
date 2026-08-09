/* ==========================================================================
   Tierra de Nadie — JavaScript de la web
   Vanilla, sin dependencias. Cada bloque es independiente: si un nodo no
   existe, ese bloque no hace nada y el resto sigue funcionando.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Configuración editable ------------------------------------ */
  // TODO (cliente): correo real de reservas y número de WhatsApp del restaurante.
  var EMAIL_RESERVAS = 'reservas@tierradenadiealmeria.es';
  var WHATSAPP = '34600000000'; // formato internacional sin "+" ni espacios
  var TELEFONO = '+34950718137';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ======================================================================
     1. Cabecera: transparente arriba, sólida al hacer scroll
     ====================================================================== */
  (function cabecera() {
    var header = $('#cabecera');
    if (!header) return;

    var solidas = ['backdrop-blur-md', 'border-b', 'border-filete/12', 'shadow-lg', 'shadow-black/10'];
    var esSolida = false;
    var pendiente = false;

    function actualizar() {
      var debeSerSolida = window.scrollY > 40;
      if (debeSerSolida !== esSolida) {
        esSolida = debeSerSolida;
        solidas.forEach(function (c) { header.classList.toggle(c, esSolida); });
        // Arriba la cabecera va sobre la foto oscura del hero (texto en tiza);
        // al hacer scroll pasa a papel y el texto se vuelve tinta. data-sin-fondo
        // es lo que la mantiene transparente mientras está arriba.
        header.dataset.superficie = esSolida ? 'papel' : 'tinta';
        if (esSolida) { delete header.dataset.sinFondo; }
        else { header.dataset.sinFondo = ''; }
      }
      pendiente = false;
    }

    window.addEventListener('scroll', function () {
      if (!pendiente) { pendiente = true; window.requestAnimationFrame(actualizar); }
    }, { passive: true });

    actualizar();
  })();

  /* ======================================================================
     2. Menú móvil a pantalla completa
     ====================================================================== */
  (function menuMovil() {
    var boton = $('#btn-menu');
    var panel = $('#menu-movil');
    if (!boton || !panel) return;

    var lineas = $$('[data-linea]', boton);
    var abierto = false;
    var ultimoFoco = null;

    function focoables() {
      return $$('a[href], button:not([disabled])', panel).filter(function (el) {
        return el.offsetParent !== null;
      });
    }

    function abrir() {
      abierto = true;
      ultimoFoco = document.activeElement;
      panel.classList.remove('hidden');
      boton.setAttribute('aria-expanded', 'true');
      boton.setAttribute('aria-label', 'Cerrar menú de navegación');
      document.body.style.overflow = 'hidden';
      if (lineas.length === 3) {
        lineas[0].style.transform = 'translateY(7px) rotate(45deg)';
        lineas[1].style.opacity = '0';
        lineas[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      }
      var primeros = focoables();
      if (primeros.length) primeros[0].focus();
    }

    function cerrar(devolverFoco) {
      abierto = false;
      panel.classList.add('hidden');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú de navegación');
      document.body.style.overflow = '';
      lineas.forEach(function (l) { l.style.transform = ''; l.style.opacity = ''; });
      if (devolverFoco !== false && ultimoFoco) ultimoFoco.focus();
    }

    boton.addEventListener('click', function () { abierto ? cerrar() : abrir(); });

    // Al pulsar un enlace, cerrar sin robar el foco al destino del ancla
    $$('a[href^="#"]', panel).forEach(function (a) {
      a.addEventListener('click', function () { cerrar(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!abierto) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      // Trampa de foco
      var lista = focoables();
      if (!lista.length) return;
      var primero = lista[0];
      var ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });

    // Si se pasa a escritorio con el menú abierto, cerrarlo
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches && abierto) cerrar(false);
    });
  })();

  /* ======================================================================
     3. Pestañas de la carta (patrón WAI-ARIA: tabs con foco móvil)
     ====================================================================== */
  (function pestanas() {
    var tabs = $$('[role="tab"]');
    if (!tabs.length) return;

    function seleccionar(tab, mueveFoco) {
      tabs.forEach(function (t) {
        var activa = t === tab;
        t.setAttribute('aria-selected', activa ? 'true' : 'false');
        t.tabIndex = activa ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !activa;
      });
      if (mueveFoco !== false) tab.focus();
      // Mantener la pestaña visible dentro del carril con scroll horizontal
      if (tab.scrollIntoView) {
        tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { seleccionar(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var destino = null;
        if (e.key === 'ArrowRight') destino = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') destino = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') destino = tabs[0];
        else if (e.key === 'End') destino = tabs[tabs.length - 1];
        if (destino) { e.preventDefault(); seleccionar(destino); }
      });
    });
  })();

  /* ======================================================================
     4. Scroll reveal con IntersectionObserver
     ====================================================================== */
  (function reveal() {
    var elementos = $$('[data-reveal]');
    if (!elementos.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      elementos.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var pendientes = elementos.slice();

    function revelar(el) {
      el.classList.add('is-visible');
      obs.unobserve(el);
      var i = pendientes.indexOf(el);
      if (i > -1) pendientes.splice(i, 1);
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) revelar(entrada.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    elementos.forEach(function (el) { obs.observe(el); });

    // Red de seguridad: un salto de scroll instantáneo (ancla, recarga con hash,
    // rueda rápida) puede dejar elementos sin notificar por el observer. Aquí se
    // recuperan los que ya han quedado por encima del viewport, que si no se
    // quedarían invisibles para siempre.
    var pendiente = false;
    function barrer() {
      pendiente = false;
      pendientes.slice().forEach(function (el) {
        if (el.getBoundingClientRect().bottom <= 0) revelar(el);
      });
      if (!pendientes.length) window.removeEventListener('scroll', alScroll);
    }
    function alScroll() {
      if (!pendiente) { pendiente = true; window.requestAnimationFrame(barrer); }
    }
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('load', barrer);
  })();

  /* ======================================================================
     5. Parallax ligero del hero (sólo transform, sin layout)
     ====================================================================== */
  (function parallax() {
    var capa = $('[data-parallax]');
    if (!capa || reduceMotion.matches) return;
    var img = capa.querySelector('img');
    if (!img) return;

    var hero = capa.closest('section');
    var alto = hero ? hero.offsetHeight : window.innerHeight;
    var pendiente = false;

    function pintar() {
      var y = Math.min(window.scrollY, alto) * 0.15;
      img.style.transform = 'translate3d(0,' + (-y).toFixed(1) + 'px,0)';
      pendiente = false;
    }

    window.addEventListener('scroll', function () {
      if (window.scrollY > alto) return;              // fuera del hero: no calcular
      if (!pendiente) { pendiente = true; window.requestAnimationFrame(pintar); }
    }, { passive: true });

    window.addEventListener('resize', function () {
      alto = hero ? hero.offsetHeight : window.innerHeight;
    }, { passive: true });

    pintar();
  })();

  /* ======================================================================
     6. Lightbox de la galería (<dialog> nativo: foco y Esc gratis)
     ====================================================================== */
  (function lightbox() {
    var dlg = $('#lightbox');
    var disparadores = $$('[data-lightbox]');
    if (!dlg || !disparadores.length || typeof dlg.showModal !== 'function') return;

    var img = $('#lightbox-img');
    var pie = $('#lightbox-caption');
    var contador = $('#lightbox-contador');
    var indice = 0;

    function mostrar(i) {
      indice = (i + disparadores.length) % disparadores.length;
      var disp = disparadores[indice];
      var interna = disp.querySelector('img');
      img.src = disp.getAttribute('data-lightbox');
      img.alt = interna ? interna.alt : '';
      pie.textContent = disp.getAttribute('data-caption') || '';
      contador.textContent = 'Imagen ' + (indice + 1) + ' de ' + disparadores.length;
    }

    disparadores.forEach(function (disp, i) {
      disp.addEventListener('click', function () {
        mostrar(i);
        dlg.showModal();
        document.body.style.overflow = 'hidden';
      });
    });

    function cerrar() { dlg.close(); }

    $('#lightbox-cerrar').addEventListener('click', cerrar);
    $('#lightbox-prev').addEventListener('click', function () { mostrar(indice - 1); });
    $('#lightbox-next').addEventListener('click', function () { mostrar(indice + 1); });

    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(indice - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(indice + 1); }
    });

    // Clic en el fondo (fuera de la imagen y de los botones)
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target === dlg.firstElementChild) cerrar();
    });

    dlg.addEventListener('close', function () {
      document.body.style.overflow = '';
      var disp = disparadores[indice];
      if (disp) disp.focus();
    });
  })();

  /* ======================================================================
     7. Carrusel de reseñas (scroll-snap + botones)
     ====================================================================== */
  (function resenas() {
    var pista = $('#pista-resenas');
    var prev = $('#resenas-prev');
    var next = $('#resenas-next');
    if (!pista || !prev || !next) return;

    function paso() {
      var tarjeta = pista.querySelector('li');
      if (!tarjeta) return pista.clientWidth;
      var estilo = window.getComputedStyle(pista);
      return tarjeta.getBoundingClientRect().width + (parseFloat(estilo.columnGap) || 16);
    }

    function mover(dir) {
      pista.scrollBy({ left: dir * paso(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { mover(-1); });
    next.addEventListener('click', function () { mover(1); });

    function estado() {
      var fin = pista.scrollWidth - pista.clientWidth - 4;
      prev.disabled = pista.scrollLeft <= 4;
      next.disabled = pista.scrollLeft >= fin;
      [prev, next].forEach(function (b) {
        b.classList.toggle('opacity-35', b.disabled);
        b.classList.toggle('cursor-not-allowed', b.disabled);
      });
    }

    pista.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado, { passive: true });
    estado();
  })();

  /* ======================================================================
     8. Formulario de reserva: validación en cliente + envío sin backend
     ====================================================================== */
  (function reserva() {
    var form = $('#form-reserva');
    if (!form) return;

    var estado = $('#form-estado');
    var btnWhatsapp = $('#btn-whatsapp');

    var REGLAS = {
      nombre: {
        valida: function (v) { return v.trim().length >= 3; },
        error: 'Escribe tu nombre completo (mínimo 3 caracteres).'
      },
      telefono: {
        valida: function (v) { return /^[+\d][\d\s().-]{7,19}$/.test(v.trim()); },
        error: 'Necesitamos un teléfono válido para confirmarte la mesa.'
      },
      email: {
        valida: function (v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v.trim()); },
        error: 'Revisa el email: parece que falta algo.'
      },
      fecha: {
        valida: function (v) {
          if (!v) return false;
          var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
          var d = new Date(v + 'T00:00:00');
          return !isNaN(d.getTime()) && d >= hoy;
        },
        error: 'Elige una fecha de hoy en adelante.'
      },
      hora: { valida: function (v) { return !!v; }, error: 'Dinos a qué hora quieres venir.' },
      comensales: {
        valida: function (v) { var n = parseInt(v, 10); return n >= 1 && n <= 60; },
        error: 'Indica entre 1 y 60 comensales. Para grupos mayores, llámanos.'
      },
      local: { valida: function (v) { return !!v; }, error: 'Elige en qué local quieres reservar.' },
      privacidad: { valida: null, error: 'Necesitamos que aceptes la política de privacidad.' }
    };

    function campo(nombre) { return form.elements[nombre]; }
    function cajaError(nombre) { return $('#err-' + nombre); }

    function validaCampo(nombre) {
      var el = campo(nombre);
      var caja = cajaError(nombre);
      if (!el || !caja) return true;

      var ok = el.type === 'checkbox' ? el.checked : REGLAS[nombre].valida(el.value);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      caja.textContent = ok ? '' : REGLAS[nombre].error;
      caja.classList.toggle('is-visible', !ok);
      return ok;
    }

    Object.keys(REGLAS).forEach(function (nombre) {
      var el = campo(nombre);
      if (!el) return;
      var evento = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' || el.type === 'time') ? 'change' : 'blur';
      el.addEventListener(evento, function () { validaCampo(nombre); });
      // Una vez marcado como erróneo, corregir en caliente
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') validaCampo(nombre);
      });
    });

    function validaTodo() {
      var primerFallo = null;
      Object.keys(REGLAS).forEach(function (nombre) {
        if (!validaCampo(nombre) && !primerFallo) primerFallo = campo(nombre);
      });
      if (primerFallo) {
        primerFallo.focus();
        primerFallo.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      return !primerFallo;
    }

    function datos() {
      var v = function (n) { var el = campo(n); return el ? el.value.trim() : ''; };
      return {
        nombre: v('nombre'), telefono: v('telefono'), email: v('email'),
        fecha: v('fecha'), hora: v('hora'), comensales: v('comensales'),
        local: v('local'), notas: v('notas') || '—'
      };
    }

    function fechaLarga(iso) {
      var d = new Date(iso + 'T00:00:00');
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function mensaje() {
      var d = datos();
      return [
        'Solicitud de reserva — Tierra de Nadie',
        '',
        'Nombre: ' + d.nombre,
        'Teléfono: ' + d.telefono,
        'Email: ' + d.email,
        'Fecha: ' + fechaLarga(d.fecha),
        'Hora: ' + d.hora,
        'Comensales: ' + d.comensales,
        'Local: ' + d.local,
        'Notas: ' + d.notas,
        '',
        'Enviado desde la web.'
      ].join('\n');
    }

    function avisa(texto) {
      if (!estado) return;
      estado.textContent = texto;
      estado.classList.remove('hidden');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validaTodo()) return;
      var d = datos();
      var asunto = 'Reserva ' + d.nombre + ' · ' + d.comensales + ' pax · ' + d.fecha + ' ' + d.hora;
      window.location.href = 'mailto:' + EMAIL_RESERVAS +
        '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(mensaje());
      avisa('Hemos abierto tu programa de correo con la solicitud lista. Envíala y te contestamos lo antes posible. Si no se ha abierto, llámanos al ' + TELEFONO.replace('+34', '') + '.');
    });

    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', function () {
        if (!validaTodo()) return;
        window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje()), '_blank', 'noopener');
        avisa('Te hemos abierto WhatsApp con la solicitud escrita. Dale a enviar y te confirmamos la mesa.');
      });
    }

    // "Pedir propuesta para grupo" precarga el motivo en las notas
    $$('[data-motivo]').forEach(function (a) {
      a.addEventListener('click', function () {
        var notas = campo('notas');
        if (notas && !notas.value) {
          notas.value = a.getAttribute('data-motivo') + ': somos ___ personas, fecha aproximada ___.';
        }
      });
    });
  })();

  /* ======================================================================
     9. Cookies y carga diferida de Google Maps
     ====================================================================== */
  (function cookies() {
    var CLAVE = 'tdn-consentimiento';
    var banner = $('#cookies');
    var mapas = $$('[data-mapa]');

    function cargarMapa(caja) {
      if (caja.getAttribute('data-cargado') === 'si') return;
      caja.setAttribute('data-cargado', 'si');
      var iframe = document.createElement('iframe');
      iframe.src = caja.getAttribute('data-src');
      iframe.title = caja.getAttribute('data-title') || 'Mapa de situación';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'aspect-[16/9] w-full border border-crema-50/12';
      iframe.setAttribute('allowfullscreen', '');
      caja.innerHTML = '';
      caja.appendChild(iframe);
    }

    function cargarTodos() { mapas.forEach(cargarMapa); }

    // Botón individual de cada mapa: carga sólo ese, sin guardar consentimiento global
    mapas.forEach(function (caja) {
      var btn = $('[data-mapa-cargar]', caja);
      if (btn) btn.addEventListener('click', function () { cargarMapa(caja); });
    });

    var guardado = null;
    try { guardado = window.localStorage.getItem(CLAVE); } catch (err) { guardado = null; }

    function decidir(valor) {
      try { window.localStorage.setItem(CLAVE, valor); } catch (err) { /* modo privado */ }
      if (banner) banner.classList.add('hidden');
      if (valor === 'aceptado') cargarTodos();
    }

    if (banner) {
      if (!guardado) banner.classList.remove('hidden');
      var aceptar = $('#cookies-aceptar');
      var rechazar = $('#cookies-rechazar');
      if (aceptar) aceptar.addEventListener('click', function () { decidir('aceptado'); });
      if (rechazar) rechazar.addEventListener('click', function () { decidir('esenciales'); });
    }

    if (guardado === 'aceptado') cargarTodos();

    var reabrir = $('#abrir-cookies');
    if (reabrir && banner) {
      reabrir.addEventListener('click', function () {
        try { window.localStorage.removeItem(CLAVE); } catch (err) { /* nada */ }
        banner.classList.remove('hidden');
        var primero = $('#cookies-rechazar');
        if (primero) primero.focus();
      });
    }
  })();

  /* ======================================================================
     10. Detalles finales
     ====================================================================== */
  (function detalles() {
    var anyo = $('#anyo');
    if (anyo) anyo.textContent = new Date().getFullYear();

    // La reserva nunca puede ser anterior a hoy
    var fecha = $('#r-fecha');
    if (fecha) {
      var hoy = new Date();
      var iso = hoy.getFullYear() + '-' +
        String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
        String(hoy.getDate()).padStart(2, '0');
      fecha.min = iso;
    }

    // Marcar en la navegación la sección visible
    var enlaces = $$('header nav a[href^="#"]');
    var secciones = enlaces.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    if (!('IntersectionObserver' in window) || !secciones.filter(Boolean).length) return;

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        var i = secciones.indexOf(entrada.target);
        if (i < 0) return;
        enlaces[i].classList.toggle('text-acento', entrada.isIntersecting);
        enlaces[i].classList.toggle('text-texto', !entrada.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    secciones.forEach(function (s) { if (s) obs.observe(s); });
  })();

})();
