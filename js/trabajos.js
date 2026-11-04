/* =====================================================================
   TRABAJOS.JS · presentaciones de cada proyecto y panel de detalle
   Basadas en las referencias de React Bits, escritas desde cero:
   1. Luz que sigue al mouse o al dedo en cada tarjeta
   2. Videos que se reproducen solo cuando se ven
   3. Expiria: pared de stickers elásticos (Elastic Sticker)
   4. Lyric video: credencial metálica que refleja el video (Reflective Card)
   5. Lit Killah: túnel de imágenes que termina en el cartel (Passage Gallery)
   6. Zagreb: deslizador antes / después
   7. Caso de estudio: carrusel con perspectiva
   8. Panel de detalle que se abre como un círculo
   ===================================================================== */

(() => {
  const tarjetas = [...document.querySelectorAll('.tarjeta')];
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- 1. LUZ QUE SIGUE AL PUNTERO ---------- */
  tarjetas.forEach((t) => {
    const mover = (x, y) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', x - r.left + 'px');
      t.style.setProperty('--my', y - r.top + 'px');
    };
    t.addEventListener('pointermove', (e) => mover(e.clientX, e.clientY));
  });

  /* ---------- 2. REPRODUCIR SOLO LO QUE SE VE ---------- */
  const visibles = new Set();
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(({ target, isIntersecting, intersectionRatio }) => {
      if (isIntersecting) visibles.add(target); else visibles.delete(target);
      target.querySelectorAll('.tarjeta__escena video').forEach((v) => {
        if (target.classList.contains('t-lit')) return;            // el del túnel se maneja aparte
        if (isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
      });
      if (window.ES_TACTIL) target.classList.toggle('en-foco', intersectionRatio > 0.6);
    });
  }, { threshold: [0, 0.6] });
  tarjetas.forEach((t) => observador.observe(t));

  /* ===================================================================
     3. EXPIRIA · STICKERS ELÁSTICOS
     Cada sticker se puede arrastrar (mouse, dedo o flechas del teclado):
     al levantarlo crece y su sombra se agranda, se inclina según la
     velocidad, y al soltarlo tiembla como algo elástico hasta quedarse
     quieto. Los rectangulares despegan una esquina al pasar el mouse.
     =================================================================== */
  const pared = document.querySelector('.stickers');
  if (pared) {
    const stickers = [...pared.querySelectorAll('.sticker')].map((el, n) => {
      el.style.width = getComputedStyle(el).getPropertyValue('--w').trim() || 'auto';
      el.tabIndex = 0;
      el.setAttribute('role', 'img');
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (el.querySelector('img') || el).getAttribute('alt') || el.textContent.trim());
      return {
        el, x: 0, y: 0, px: +el.dataset.x, py: +el.dataset.y,
        // posición alternativa para celular (data-xm / data-ym), si la tiene
        pxm: el.dataset.xm ? +el.dataset.xm : null, pym: el.dataset.ym ? +el.dataset.ym : null,
        rotBase: +el.dataset.rot || 0, rot: +el.dataset.rot || 0, vRot: 0,
        esc: 1, vEsc: 0, alto: 0, arrastrando: false, z: n + 1,
      };
    });
    let capaArriba = stickers.length + 1;

    // Coloca cada sticker según data-x / data-y (porcentajes de la tarjeta)
    const colocar = () => {
      const W = pared.clientWidth, H = pared.clientHeight;
      // nunca se sale de la tarjeta al empezar (en celular las piezas se acomodan solas)
      stickers.forEach((s) => {
        const w = s.el.offsetWidth, h = s.el.offsetHeight, m = 8;
        const movil = innerWidth <= 640 || (innerHeight <= 500 && innerWidth <= 960); // celular vertical u horizontal
        const px = movil && s.pxm !== null ? s.pxm : s.px, py = movil && s.pym !== null ? s.pym : s.py;
        s.x = limitar((px / 100) * W, m, Math.max(m, W - w - m));
        s.y = limitar((py / 100) * H, m, Math.max(m, H - h - m));
      });
    };
    colocar();
    addEventListener('resize', colocar);

    stickers.forEach((s) => {
      let ox = 0, oy = 0, ultimoX = 0;
      s.el.style.zIndex = s.z;
      s.el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        s.el.setPointerCapture(e.pointerId);
        s.arrastrando = true;
        s.el.style.zIndex = ++capaArriba;           // el que se toma queda encima
        ox = e.clientX - s.x; oy = e.clientY - s.y; ultimoX = e.clientX;
      });
      s.el.addEventListener('pointermove', (e) => {
        if (s.el.classList.contains('sticker--holo')) {
          const r = s.el.getBoundingClientRect();
          s.el.style.setProperty('--holo', ((e.clientX - r.left) / r.width) * 100 + '%');
        }
        if (!s.arrastrando) return;
        const W = pared.clientWidth, H = pared.clientHeight, w = s.el.offsetWidth, h = s.el.offsetHeight;
        // límites con un poco de "goma" en los bordes
        s.x = limitar(e.clientX - ox, -w * 0.3, W - w * 0.7);
        s.y = limitar(e.clientY - oy, -h * 0.3, H - h * 0.7);
        const vel = e.clientX - ultimoX; ultimoX = e.clientX;
        s.vRot += vel * 0.35;                       // se inclina hacia donde lo mueves
      });
      const soltar = () => {
        if (!s.arrastrando) return;
        s.arrastrando = false;
        s.vEsc -= 0.06;                             // pequeño rebote al pegarlo
        s.vRot += (Math.random() - 0.5) * 8;
      };
      s.el.addEventListener('pointerup', soltar);
      s.el.addEventListener('pointercancel', soltar);
      s.el.addEventListener('keydown', (e) => {
        const paso = 12, mapa = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
        if (!mapa[e.key]) return;
        e.preventDefault();
        s.x += mapa[e.key][0]; s.y += mapa[e.key][1]; s.vRot += mapa[e.key][0] * 0.4;
      });
    });

    // Bucle: resortes de inclinación y tamaño (la "elasticidad")
    (function animar() {
      if (visibles.has(pared.closest('.tarjeta')) || stickers.some((s) => s.arrastrando)) {
        stickers.forEach((s) => {
          const escMeta = s.arrastrando ? 1.08 : 1;
          s.vEsc += (escMeta - s.esc) * 0.18; s.vEsc *= 0.72; s.esc += s.vEsc;
          s.vRot += (s.rotBase - s.rot) * 0.06; s.vRot *= 0.86; s.rot += s.vRot * 0.1;
          s.alto += ((s.arrastrando ? 1 : 0) - s.alto) * 0.2;
          const st = s.el.style;
          st.setProperty('--x', s.x.toFixed(1) + 'px');
          st.setProperty('--y', s.y.toFixed(1) + 'px');
          st.setProperty('--rot', s.rot.toFixed(2) + 'deg');
          st.setProperty('--esc', s.esc.toFixed(3));
          st.setProperty('--alto', s.alto.toFixed(3));
        });
      }
      requestAnimationFrame(animar);
    })();

    // Pista: de vez en cuando un sticker levanta la esquina para invitar a tocarlo
    const conEsquina = stickers.filter((s) => s.el.classList.contains('sticker--forma'));
    setInterval(() => {
      if (window.MENOS_MOVIMIENTO || !visibles.has(pared.closest('.tarjeta'))) return;
      const s = conEsquina[Math.floor(Math.random() * conEsquina.length)];
      s.el.classList.add('insinua'); s.vRot += 6;
      setTimeout(() => s.el.classList.remove('insinua'), 1100);
    }, 3200);
  }

  /* ===================================================================
     4. LYRIC VIDEO · CREDENCIAL REFLECTANTE (Reflective Card)
     El video en loop se ve como un reflejo en una credencial metálica.
     Al inclinarla, el reflejo se desplaza al lado contrario (parallax)
     y una franja de luz recorre el metal.
     - Computadora: sigue al mouse sobre la tarjeta.
     - Celular: sigue al dedo; y si el teléfono lo permite, al giro del
       dispositivo (en iPhone se pide permiso al primer toque).
     No se usa la cámara en ningún momento.
     =================================================================== */
  const credencial = document.querySelector('.credencial');
  if (credencial) {
    const zona = credencial.closest('.tarjeta');
    let objX = 0, objY = 0, x = 0, y = 0;            // inclinación deseada y actual (-1 a 1)
    const apuntar = (cx, cy) => {
      const r = credencial.getBoundingClientRect();
      objX = limitar((cx - (r.left + r.width / 2)) / (r.width * 0.9), -1, 1);
      objY = limitar((cy - (r.top + r.height / 2)) / (r.height * 0.9), -1, 1);
    };
    zona.addEventListener('pointermove', (e) => apuntar(e.clientX, e.clientY));
    zona.addEventListener('pointerleave', () => { objX = 0; objY = 0; });
    credencial.addEventListener('pointerdown', (e) => apuntar(e.clientX, e.clientY));
    credencial.addEventListener('pointerup', () => { if (window.ES_TACTIL) setTimeout(() => { objX = 0; objY = 0; }, 900); });

    // Giro del teléfono
    let conGiro = false;
    const alGirar = (e) => {
      if (e.gamma == null) return;
      conGiro = true;
      objX = limitar(e.gamma / 25, -1, 1);           // izquierda / derecha
      objY = limitar((e.beta - 45) / 25, -1, 1);     // adelante / atrás (con el teléfono en la mano)
    };
    const activarGiro = () => {
      const D = window.DeviceOrientationEvent;
      if (!D) return;
      if (typeof D.requestPermission === 'function') {
        D.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', alGirar); }).catch(() => {});
      } else addEventListener('deviceorientation', alGirar);
    };
    if (window.ES_TACTIL) {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        credencial.addEventListener('click', activarGiro, { once: true });
      } else activarGiro();
    }

    // Suavizado y dibujo
    (function animar() {
      if (!conGiro && window.ES_TACTIL && !credencial.matches(':active') && visibles.has(zona) && !window.MENOS_MOVIMIENTO) {
        // sin sensor ni dedo: un balanceo lento para que se note que refleja la luz
        const t = performance.now() / 1000;
        if (objX === 0 && objY === 0) { x += (Math.sin(t * 0.7) * 0.5 - x) * 0.03; y += (Math.cos(t * 0.5) * 0.35 - y) * 0.03; }
        else { x += (objX - x) * 0.12; y += (objY - y) * 0.12; }
      } else { x += (objX - x) * 0.1; y += (objY - y) * 0.1; }
      credencial.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
      credencial.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg');
      credencial.style.setProperty('--lx', (50 + x * 45).toFixed(1) + '%');
      credencial.style.setProperty('--ly', (50 + y * 45).toFixed(1) + '%');
      credencial.style.setProperty('--px', (-x * 7).toFixed(2) + '%');
      credencial.style.setProperty('--py', (-y * 7).toFixed(2) + '%');
      requestAnimationFrame(animar);
    })();
  }

  /* ===================================================================
     5. LIT KILLAH · PASAJE 3D
     Un túnel con imágenes en las paredes, el piso y el techo. La cámara
     avanza sola; mantener presionado acelera; el mouse gira la vista.
     Al final del recorrido espera el cartel animado.
     PARA AGREGAR FOTOS: guárdalas en assets/img/lit-killah/ y añade su
     ruta a la lista IMAGENES_PASAJE (por ejemplo 'assets/img/lit-killah/foto-01.webp').
     =================================================================== */
  const IMAGENES_PASAJE = [
    'assets/img/lit-killah/fotograma-01.webp', 'assets/img/lit-killah/fotograma-02.webp',
    'assets/img/lit-killah/fotograma-03.webp', 'assets/img/lit-killah/fotograma-04.webp',
    'assets/img/lit-killah/fotograma-05.webp', 'assets/img/lit-killah/fotograma-06.webp',
    'assets/img/lit-killah/fotograma-07.webp', 'assets/img/lit-killah/fotograma-08.webp',
  ];
  const pasaje = document.querySelector('.pasaje');
  if (pasaje) {
    const mundo = pasaje.querySelector('.pasaje__mundo');
    const TRAMOS = 7;                 // cuántos tramos de túnel hay antes del cartel
    let piezas = [], final = null, video = null, largo = 0;
    let recorrido = 0, velocidad = 0, acelerar = false, alFinal = false;
    let giroX = 0, giroY = 0, metaX = 0, metaY = 0;

    function construir() {
      mundo.innerHTML = '';
      piezas = [];
      const W = pasaje.clientWidth * 0.86, H = pasaje.clientHeight * 0.74;
      const L = Math.max(180, H * 0.62);                      // largo de cada tramo
      largo = TRAMOS * L;
      let n = 0;
      const pieza = (ancho, altoP, transform, z) => {
        const d = document.createElement('div');
        const conImagen = n % 3 !== 2;                       // 2 de cada 3 con imagen, 1 de color
        d.className = 'pasaje__pieza' + (conImagen ? '' : ' pasaje__pieza--acento');
        if (conImagen) d.innerHTML = `<img src="${IMAGENES_PASAJE[n % IMAGENES_PASAJE.length]}" alt="" loading="lazy">`;
        d.style.width = ancho + 'px'; d.style.height = altoP + 'px';
        d.style.transform = `translate(-50%, -50%) ${transform}`;
        mundo.appendChild(d);
        piezas.push({ el: d, z });
        n++;
      };
      for (let i = 0; i < TRAMOS; i++) {
        const z = -(i + 0.5) * L;
        pieza(L * 0.92, H * 0.92, `translate3d(${-W / 2}px, 0, ${z}px) rotateY(90deg)`, z);    // pared izquierda
        pieza(L * 0.92, H * 0.92, `translate3d(${W / 2}px, 0, ${z}px) rotateY(-90deg)`, z);    // pared derecha
        pieza(W * 0.92, L * 0.92, `translate3d(0, ${H / 2}px, ${z}px) rotateX(90deg)`, z);     // piso
        pieza(W * 0.92, L * 0.92, `translate3d(0, ${-H / 2}px, ${z}px) rotateX(-90deg)`, z);   // techo
      }
      // el cartel animado al final del túnel
      final = document.createElement('div');
      final.className = 'pasaje__final';
      const altoFinal = H * 0.92, anchoFinal = altoFinal * 9 / 16;
      final.style.width = anchoFinal + 'px'; final.style.height = altoFinal + 'px';
      final.style.transform = `translate(-50%, -50%) translateZ(${-largo - 60}px)`;
      final.innerHTML = '<video src="assets/video/lit-killah-cartel.mp4" poster="assets/img/lit-killah/lit-killah-poster.webp" muted loop playsinline preload="none"></video>';
      mundo.appendChild(final);
      video = final.querySelector('video');
    }
    construir();
    addEventListener('resize', () => { construir(); });

    pasaje.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) acelerar = true; });
    addEventListener('pointerup', () => { acelerar = false; });
    addEventListener('pointercancel', () => { acelerar = false; });
    pasaje.addEventListener('pointermove', (e) => {
      const r = pasaje.getBoundingClientRect();
      metaY = ((e.clientX - r.left) / r.width - 0.5) * 14;      // girar a los lados
      metaX = -((e.clientY - r.top) / r.height - 0.5) * 8;      // mirar arriba/abajo
    });
    pasaje.addEventListener('pointerleave', () => { metaX = metaY = 0; });
    pasaje.querySelector('.pasaje__otra').addEventListener('click', () => {
      recorrido = 0; alFinal = false; pasaje.classList.remove('al-final'); video.pause(); video.currentTime = 0;
    });

    (function viajar() {
      const tarjeta = pasaje.closest('.tarjeta');
      if (visibles.has(tarjeta)) {
        const meta = alFinal ? 0 : (acelerar ? 9 : 1.4);          // px por cuadro
        velocidad += (meta - velocidad) * 0.08;
        if (!window.MENOS_MOVIMIENTO) recorrido += velocidad;
        const tope = largo - pasaje.clientHeight * 0.9;            // se detiene frente al cartel
        if (recorrido >= tope && !alFinal) {
          recorrido = tope; alFinal = true; pasaje.classList.add('al-final');
          video.preload = 'auto'; video.play().catch(() => {});
        }
        giroX += (metaX - giroX) * 0.06; giroY += (metaY - giroY) * 0.06;
        mundo.style.transform = `translateZ(${recorrido}px) rotateX(${giroX}deg) rotateY(${giroY}deg)`;
        // niebla: las piezas lejanas o ya pasadas se desvanecen
        piezas.forEach((p) => {
          const distancia = -(p.z + recorrido);                    // cuánto falta para llegar a esa pieza
          p.el.style.opacity = limitar(1 - distancia / (largo * 0.55), 0, 1) * limitar((distancia + 260) / 260, 0, 1);
        });
      } else if (video) video.pause();
      requestAnimationFrame(viajar);
    })();
  }

  /* ---------- 6. ZAGREB: ANTES / DESPUÉS ---------- */
  const comparar = document.querySelector('.comparar');
  if (comparar) {
    let arrastrando = false;
    const fijar = (pct) => comparar.style.setProperty('--corte', limitar(pct, 4, 96) + '%');
    const desdeX = (x) => { const r = comparar.getBoundingClientRect(); fijar(((x - r.left) / r.width) * 100); };
    comparar.addEventListener('pointerdown', (e) => { if (e.target.closest('.tarjeta__info')) return; arrastrando = true; desdeX(e.clientX); });
    addEventListener('pointermove', (e) => { if (arrastrando) desdeX(e.clientX); });
    addEventListener('pointerup', () => { arrastrando = false; });
    let inicio = null;
    comparar.addEventListener('touchstart', (e) => { inicio = e.touches[0]; }, { passive: true });
    comparar.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (inicio && Math.abs(t.clientX - inicio.clientX) > Math.abs(t.clientY - inicio.clientY)) desdeX(t.clientX);
    }, { passive: true });
    comparar.querySelector('.comparar__tirador').addEventListener('keydown', (e) => {
      const actual = parseFloat(comparar.style.getPropertyValue('--corte')) || 50;
      if (e.key === 'ArrowLeft') { fijar(actual - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { fijar(actual + 5); e.preventDefault(); }
    });
    const demo = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || window.MENOS_MOVIMIENTO) return;
      demo.disconnect();
      let t0 = null;
      const animar = (t) => {
        t0 = t0 || t; const s = (t - t0) / 1600;
        if (s > 1 || arrastrando) return;
        fijar(50 - Math.sin(s * Math.PI * 2) * 22);
        requestAnimationFrame(animar);
      };
      setTimeout(() => requestAnimationFrame(animar), 500);
    }, { threshold: 0.7 });
    demo.observe(comparar);
  }

  /* ---------- 7. CASO: CARRUSEL CON PERSPECTIVA ---------- */
  const flujo = document.querySelector('.flujo');
  if (flujo) {
    const items = [...flujo.querySelectorAll('.flujo__item')];
    let actual = 0;
    const colocar = () => {
      items.forEach((it, i) => {
        let d = i - actual;
        if (d > items.length / 2) d -= items.length;
        if (d < -items.length / 2) d += items.length;
        it.style.transform = `translateX(${d * 46}%) translateZ(${-Math.abs(d) * 160}px) rotateY(${-d * 38}deg)`;
        it.style.opacity = Math.abs(d) > 1.5 ? 0 : 1 - Math.abs(d) * 0.35;
        it.style.filter = d === 0 ? 'none' : 'brightness(0.55)';
        it.style.zIndex = 10 - Math.abs(d);
      });
    };
    colocar();
    if (!window.MENOS_MOVIMIENTO) setInterval(() => { actual = (actual + 1) % items.length; colocar(); }, 2600);
  }

  /* ---------- 8. PANEL DE DETALLE ---------- */
  const panel = document.querySelector('.detalle');
  const cuerpo = panel.querySelector('.detalle__cuerpo');
  const cerrarBtn = panel.querySelector('.detalle__cerrar');
  let origen = null;

  function abrir(id, x, y) {
    const plantilla = document.getElementById('p-' + id);
    if (!plantilla) return;
    origen = document.activeElement;
    cuerpo.innerHTML = '';
    cuerpo.appendChild(plantilla.content.cloneNode(true));
    if (typeof Idioma !== 'undefined') Idioma.aplicar(Idioma.actual);   // traduce lo recién agregado
    panel.style.setProperty('--x', (x ?? innerWidth / 2) + 'px');
    panel.style.setProperty('--y', (y ?? innerHeight / 2) + 'px');
    panel.scrollTop = 0;
    panel.classList.add('abierto');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.tarjeta__escena video').forEach((v) => v.pause());
    history.replaceState(null, '', '#' + id);
    setTimeout(() => cerrarBtn.focus(), 300);
  }
  function cerrar() {
    if (!panel.classList.contains('abierto')) return;
    panel.classList.remove('abierto');
    document.body.style.overflow = '';
    cuerpo.querySelectorAll('video').forEach((v) => v.pause());
    history.replaceState(null, '', location.pathname);
    if (origen) origen.focus();
  }
  document.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', (e) => abrir(b.dataset.abrir, e.clientX, e.clientY)));
  cerrarBtn.addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

  // Con un enlace como trabajos.html#expiria se abre ese proyecto
  const desdeEnlace = location.hash.slice(1);
  if (desdeEnlace && document.getElementById('p-' + desdeEnlace)) setTimeout(() => abrir(desdeEnlace), 700);
})();
