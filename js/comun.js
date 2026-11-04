/* =====================================================================
   COMUN.JS · lo que comparten todas las páginas
   1. Idioma (español / inglés)
   2. Menú del celular
   3. Cursor personalizado (solo con mouse)
   4. Transición circular entre páginas
   5. Elementos que aparecen al hacer scroll
   6. Botones con corchetes en pantallas táctiles
   ===================================================================== */

/* ¿El dispositivo usa mouse o dedo? Lo usan varios archivos. */
window.ES_TACTIL = window.matchMedia('(hover: none)').matches;
/* ¿La persona pidió menos movimiento en su sistema? */
window.MENOS_MOVIMIENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------
   SEPARAR UN TEXTO EN LETRAS
   Para animar letra por letra: cada letra queda en <span class="letra">
   con una variable --i (su número), y cada palabra se mantiene unida
   para que nunca se corte a mitad de línea. Respeta etiquetas como <em>.
   --------------------------------------------------------------------- */
function partirEnLetras(el) {
  let i = 0;
  const recorrer = (nodo) => {
    [...nodo.childNodes].forEach((hijo) => {
      if (hijo.nodeType === 3) {                        // nodo de texto
        const trozo = document.createDocumentFragment();
        hijo.textContent.split(/(\s+)/).forEach((parte) => {
          if (!parte) return;
          if (/^\s+$/.test(parte)) { trozo.appendChild(document.createTextNode(parte)); return; }
          const palabra = document.createElement('span');
          palabra.className = 'palabra-unida';
          [...parte].forEach((c) => {
            const l = document.createElement('span');
            l.className = 'letra';
            l.style.setProperty('--i', i++);
            l.textContent = c;
            palabra.appendChild(l);
          });
          trozo.appendChild(palabra);
        });
        hijo.replaceWith(trozo);
      } else if (hijo.nodeType === 1) recorrer(hijo);   // etiqueta: entrar
    });
  };
  recorrer(el);
}

/* ---------------------------------------------------------------------
   1. IDIOMA
   El texto en español está escrito directamente en cada HTML.
   La traducción al inglés vive en js/textos.js (objeto TEXTOS_EN).
   Cada elemento traducible tiene un atributo data-i18n="clave".
   --------------------------------------------------------------------- */
const Idioma = {
  actual: 'es',
  originales: new Map(),   // guarda los atributos en español para poder volver

  // Lee el idioma guardado (si el navegador lo permite)
  leer() {
    try { return localStorage.getItem('idioma') || 'es'; } catch (e) { return 'es'; }
  },
  guardar(valor) {
    try { localStorage.setItem('idioma', valor); } catch (e) { /* modo privado: no pasa nada */ }
  },

  // Cambia todos los textos marcados al idioma pedido
  aplicar(idioma) {
    const ingles = idioma === 'en' && window.TEXTOS_EN;
    document.documentElement.lang = idioma;

    // Textos dentro de etiquetas
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;   // guarda el español la primera vez
      const clave = el.dataset.i18n;
      el.innerHTML = ingles && TEXTOS_EN[clave] ? TEXTOS_EN[clave] : el.dataset.es;
      if (el.hasAttribute('data-partir')) partirEnLetras(el);   // vuelve a separar letras si hace falta
    });

    // Atributos traducibles → qué marca usar en el HTML:
    //   alt="..."          → data-i18n-alt="clave"
    //   aria-label="..."   → data-i18n-aria="clave"
    //   data-cursor="..."  → data-i18n-cursor="clave"
    const atributos = { alt: 'data-i18n-alt', 'aria-label': 'data-i18n-aria', 'data-cursor': 'data-i18n-cursor' };
    Object.entries(atributos).forEach(([atributo, marca]) => {
      document.querySelectorAll(`[${marca}]`).forEach((el) => {
        if (!this.originales.has(el)) this.originales.set(el, {});
        const memoria = this.originales.get(el);
        if (memoria[atributo] === undefined) memoria[atributo] = el.getAttribute(atributo) || '';
        const clave = el.getAttribute(marca);
        el.setAttribute(atributo, ingles && TEXTOS_EN[clave] ? TEXTOS_EN[clave] : memoria[atributo]);
      });
    });

    // Botón ES / EN: resalta el idioma activo
    document.querySelectorAll('.idioma').forEach((b) => {
      b.innerHTML = idioma === 'es' ? '<b>ES</b> / EN' : 'ES / <b>EN</b>';
      b.setAttribute('aria-label', idioma === 'es' ? 'Switch to English' : 'Cambiar a español');
    });

    this.actual = idioma;
    document.dispatchEvent(new CustomEvent('idioma', { detail: idioma }));
  },

  iniciar() {
    this.aplicar(this.leer());
    document.querySelectorAll('.idioma').forEach((b) =>
      b.addEventListener('click', () => {
        const nuevo = this.actual === 'es' ? 'en' : 'es';
        this.guardar(nuevo);
        this.aplicar(nuevo);
      })
    );
  },
};

/* ---------------------------------------------------------------------
   2. MENÚ DEL CELULAR (hamburguesa)
   --------------------------------------------------------------------- */
function iniciarMenu() {
  const boton = document.querySelector('.menu__abrir');
  if (!boton) return;
  const cerrar = () => { document.body.classList.remove('menu-abierto'); boton.setAttribute('aria-expanded', 'false'); };
  boton.addEventListener('click', () => {
    const abierto = document.body.classList.toggle('menu-abierto');
    boton.setAttribute('aria-expanded', String(abierto));
  });
  document.querySelectorAll('.menu__enlace').forEach((a) => a.addEventListener('click', cerrar));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
}

/* ---------------------------------------------------------------------
   3. CURSOR PERSONALIZADO
   Sigue al mouse con un pequeño retraso (interpolación).
   - Sobre enlaces y botones crece.
   - Sobre elementos con data-cursor="Texto" se vuelve rojo y muestra el texto.
   En celular y tablet no se crea.
   --------------------------------------------------------------------- */
function iniciarCursor() {
  if (window.ES_TACTIL || !window.matchMedia('(pointer: fine)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<div class="cursor__bola"><span class="cursor__texto"></span></div>';
  document.body.appendChild(cursor);
  document.body.classList.add('con-cursor');
  const texto = cursor.querySelector('.cursor__texto');

  let x = innerWidth / 2, y = innerHeight / 2;   // posición real del mouse
  let cx = x, cy = y;                            // posición dibujada (va detrás)

  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });

  (function mover() {
    cx += (x - cx) * 0.22;      // 0.22 = qué tan rápido alcanza al mouse
    cy += (y - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(mover);
  })();

  // Cambia el estado del cursor según lo que haya debajo
  document.addEventListener('pointerover', (e) => {
    const conTexto = e.target.closest('[data-cursor]');
    const enlace = e.target.closest('a, button, input, [role="button"]');
    cursor.classList.toggle('cursor--texto', !!conTexto);
    cursor.classList.toggle('cursor--enlace', !conTexto && !!enlace);
    texto.innerHTML = conTexto ? conTexto.getAttribute('data-cursor') : '';
  });
  document.addEventListener('pointerleave', () => { cursor.style.opacity = 0; });
  document.addEventListener('pointerenter', () => { cursor.style.opacity = 1; });
}

/* ---------------------------------------------------------------------
   4. TRANSICIÓN ENTRE PÁGINAS
   Al hacer clic en un enlace interno: un círculo rojo crece desde el
   punto del clic y, cuando cubre la pantalla, cambia de página.
   En la página nueva el círculo se abre desde el centro.
   --------------------------------------------------------------------- */
function iniciarTransicion() {
  const capa = document.querySelector('.transicion');
  if (!capa) return;

  // Abrir la cortina al llegar
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('cargando');
    capa.classList.add('abre');
    setTimeout(() => capa.classList.remove('abre'), 900);
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    // Solo para páginas propias (.html), no para anclas, correo o redes
    if (!/\.html(#.*)?$/.test(href) || /^https?:/.test(href)) return;
    if (window.MENOS_MOVIMIENTO) return;
    e.preventDefault();
    capa.style.setProperty('--x', e.clientX + 'px');
    capa.style.setProperty('--y', e.clientY + 'px');
    capa.classList.remove('abre');
    void capa.offsetWidth;          // reinicia la animación
    capa.classList.add('cubre');
    setTimeout(() => { location.href = href; }, 650);
  });

  // Si se vuelve con el botón "atrás" del navegador, quitar la cortina
  addEventListener('pageshow', (e) => { if (e.persisted) capa.classList.remove('cubre'); });
}

/* ---------------------------------------------------------------------
   5. APARECER AL HACER SCROLL
   Todo elemento con la clase .aparece recibe .visible al entrar en pantalla.
   --------------------------------------------------------------------- */
function iniciarApariciones() {
  const elementos = document.querySelectorAll('.aparece');
  if (!('IntersectionObserver' in window)) { elementos.forEach((el) => el.classList.add('visible')); return; }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) { entrada.target.classList.add('visible'); observador.unobserve(entrada.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  elementos.forEach((el) => observador.observe(el));
}

/* ---------------------------------------------------------------------
   6. CORCHETES EN PANTALLAS TÁCTILES
   En celular no hay "hover": los corchetes se abren al tocar y, además,
   cuando el botón entra en pantalla, para que el efecto se vea igual.
   --------------------------------------------------------------------- */
function iniciarBotonesTactiles() {
  if (!window.ES_TACTIL || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => en.target.classList.toggle('tocado', en.intersectionRatio > 0.9));
  }, { threshold: [0, 0.9, 1] });
  document.querySelectorAll('.boton').forEach((b) => obs.observe(b));
}

/* Arranque cuando el HTML está listo */
document.addEventListener('DOMContentLoaded', () => {
  Idioma.iniciar();
  iniciarMenu();
  iniciarCursor();
  iniciarTransicion();
  iniciarApariciones();
  iniciarBotonesTactiles();
  // Año actual en el pie de página
  document.querySelectorAll('[data-anio]').forEach((el) => { el.textContent = new Date().getFullYear(); });
});
