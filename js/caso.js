/* =====================================================================
   CASO.JS · revista en perspectiva del estudio de caso
   - Las páginas se acomodan como un carrusel 3D (la actual al centro).
   - Se pasan deslizando con el dedo, arrastrando con el mouse,
     con las flechas en pantalla o con ← → del teclado.
   - La altura se adapta a la página más larga: nada se corta.
   - Botón para escuchar 20 s del álbum.
   - Visor para ampliar las láminas del proceso.
   ===================================================================== */

(() => {
  const escena = document.querySelector('.revista__escena');
  if (!escena) return;
  const paginas = [...escena.querySelectorAll('.pagina')];
  const puntos = document.querySelector('.revista__puntos');
  const flechas = [...document.querySelectorAll('.revista__flecha')];
  let actual = 0;
  let arrastre = 0;            // cuánto se ha arrastrado (en páginas, ej. 0,3)

  // Crear un punto por página
  paginas.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `${i + 1} / ${paginas.length}`);
    b.addEventListener('click', () => ir(i));
    puntos.appendChild(b);
  });

  /* ---------- Colocar las páginas en 3D ---------- */
  function colocar() {
    const movil = innerWidth < 760;
    paginas.forEach((p, i) => {
      const d = i - actual + arrastre;           // distancia a la página central
      const ad = Math.abs(d);
      const x = d * (movil ? 104 : 64);          // % del ancho de la página
      const z = -ad * (movil ? 120 : 280);
      const giro = -d * (movil ? 16 : 30);
      p.style.transform = `translateX(${x}%) translateZ(${z}px) rotateY(${giro}deg)`;
      p.style.opacity = ad > 1.6 ? 0 : 1 - ad * 0.45;
      p.style.filter = ad > 0.5 ? 'brightness(0.6)' : 'none';
      p.style.zIndex = 100 - Math.round(ad * 10);
      const esActual = i === actual;
      p.style.pointerEvents = esActual ? 'auto' : 'none';
      p.toggleAttribute('inert', !esActual);    // el teclado solo recorre la página visible
      p.setAttribute('aria-hidden', String(!esActual));
    });
    [...puntos.children].forEach((b, i) => b.setAttribute('aria-current', String(i === actual)));
    flechas[0].disabled = actual === 0;
    flechas[1].disabled = actual === paginas.length - 1;
  }

  function ir(n) {
    actual = Math.max(0, Math.min(paginas.length - 1, n));
    arrastre = 0;
    paginas.forEach((p) => (p.style.transition = ''));
    colocar();
  }

  flechas.forEach((f) => f.addEventListener('click', () => ir(actual + Number(f.dataset.dir))));

  // Teclado: ← → cuando la revista está en pantalla
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.visor.abierto')) return;
    const r = escena.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (e.key === 'ArrowRight') ir(actual + 1);
    if (e.key === 'ArrowLeft') ir(actual - 1);
  });

  /* ---------- Arrastrar / deslizar ----------
     Funciona con mouse y dedo (pointer events). Como la escena tiene
     touch-action: pan-y, el scroll vertical sigue funcionando normal. */
  let inicioX = null, inicioY = null, seMovio = false;
  escena.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, audio')) return;
    inicioX = e.clientX; inicioY = e.clientY; seMovio = false;
    paginas.forEach((p) => (p.style.transition = 'none'));
  });
  addEventListener('pointermove', (e) => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX, dy = e.clientY - inicioY;
    if (!seMovio && Math.abs(dx) < 8) return;
    if (!seMovio && Math.abs(dy) > Math.abs(dx)) { inicioX = null; paginas.forEach((p) => (p.style.transition = '')); return; }
    seMovio = true;
    const anchoPagina = paginas[0].offsetWidth;
    arrastre = Math.max(-1, Math.min(1, dx / anchoPagina));
    colocar();
  });
  const terminar = () => {
    if (inicioX === null) return;
    inicioX = null;
    const umbral = 0.18;      // arrastre mínimo para cambiar de página
    if (arrastre < -umbral) ir(actual + 1);
    else if (arrastre > umbral) ir(actual - 1);
    else ir(actual);
  };
  addEventListener('pointerup', terminar);
  addEventListener('pointercancel', terminar);

  colocar();
  addEventListener('resize', colocar);

  /* ---------- Altura: la escena mide lo que mide la página más larga ----------
     Así ninguna página corta su texto (también en celular). Se recalcula
     al cargar imágenes y fuentes, al girar el teléfono y al cambiar de idioma. */
  function medir() {
    paginas.forEach((p) => (p.style.minHeight = ''));      // primero, cada página a su altura natural
    const mayor = Math.max(...paginas.map((p) => p.offsetHeight));
    paginas.forEach((p) => (p.style.minHeight = mayor + 'px')); // luego todas iguales: mismos bordes y márgenes
    escena.style.height = mayor + 'px';
  }
  medir();
  addEventListener('resize', medir);
  addEventListener('load', medir);
  document.addEventListener('idioma', () => requestAnimationFrame(medir));
  if (document.fonts) document.fonts.ready.then(medir);
  escena.querySelectorAll('img').forEach((img) => img.addEventListener('load', medir));

  /* ---------- Audio: 20 s del álbum ---------- */
  const boton = document.querySelector('.escuchar');
  const audio = document.querySelector('.pagina audio');
  if (boton && audio) {
    const pintar = (sonando) => {
      boton.classList.toggle('sonando', sonando);
      boton.setAttribute('aria-pressed', String(sonando));
      boton.querySelector('.escuchar__icono').textContent = sonando ? '❚❚' : '▶';
    };
    boton.addEventListener('click', () => {
      if (audio.paused) { audio.play().then(() => pintar(true)).catch(() => pintar(false)); }
      else { audio.pause(); pintar(false); }
    });
    audio.addEventListener('ended', () => { audio.currentTime = 0; pintar(false); });
  }

  /* ---------- Visor de láminas ---------- */
  const visor = document.querySelector('.visor');
  const visorImg = visor.querySelector('img');
  document.querySelectorAll('[data-ampliar]').forEach((b) =>
    b.addEventListener('click', () => {
      if (seMovio) return;                     // si fue un arrastre, no abrir
      visorImg.src = b.dataset.ampliar;
      visorImg.alt = b.querySelector('img').alt;
      visor.classList.add('abierto');
      visor.querySelector('button').focus();
    })
  );
  const cerrarVisor = () => visor.classList.remove('abierto');
  visor.addEventListener('click', (e) => { if (e.target !== visorImg) cerrarVisor(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarVisor(); });
})();
