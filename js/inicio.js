/* =====================================================================
   INICIO.JS · efectos de la página de Inicio
   1. Precarga con porcentaje real
   2. Lienzo: bolita roja + fragmentos de vidrio
      - Mantener presionado ordena los fragmentos en una órbita y, al
        completarse, aparecen "Del caos a la forma" y el texto de portada.
      - La bolita viaja con el scroll y pasa por el medio de los anillos.
      - En el cierre, la bolita crece hasta llenar la pantalla de rojo.
   3. Anillos transparentes con el nombre de cada trabajo
   4. Barra lateral de avance
   Todo está hecho con JavaScript propio, sin librerías.
   ===================================================================== */

(() => {
  /* -------------------------------------------------------------------
     AJUSTES QUE PUEDES CAMBIAR
     ------------------------------------------------------------------- */
  const AJUSTES = {
    colorBolita: '#F0402F',                                   // rojo de la marca
    paleta: ['#4FD9AC', '#F5C13D', '#F57894', '#5B54B0'],     // fragmentos de color
    fragmentos: window.ES_TACTIL ? 46 : 70,                   // cuántos fragmentos de vidrio
    segundosParaOrdenar: 1.6,                                 // tiempo que hay que mantener presionado
  };

  const lienzo = document.querySelector('.inicio-lienzo');
  if (!lienzo) return;
  const ctx = lienzo.getContext('2d');

  /* ===================================================================
     1. PRECARGA (solo la primera vez en la sesión)
     =================================================================== */
  const precarga = document.querySelector('.precarga');
  const terminarPrecarga = () => precarga && precarga.classList.add('lista');
  if (precarga) {
    let yaVisto = false;
    try { yaVisto = sessionStorage.getItem('precarga') === '1'; sessionStorage.setItem('precarga', '1'); } catch (e) {}
    if (yaVisto) terminarPrecarga();
    else {
      const imagenes = [...document.images];
      const total = imagenes.length + 1;          // +1 = las fuentes
      let listos = 0;
      const barra = precarga.querySelector('.precarga__barra i');
      const numero = precarga.querySelector('.precarga__num span');
      const inicio = performance.now();
      const sumar = () => {
        listos++;
        const pct = Math.round((listos / total) * 100);
        barra.style.width = pct + '%';
        numero.textContent = pct;
        if (listos >= total) setTimeout(terminarPrecarga, Math.max(0, 900 - (performance.now() - inicio)));
      };
      imagenes.forEach((img) => (img.complete ? sumar() : (img.addEventListener('load', sumar), img.addEventListener('error', sumar))));
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(sumar);
      setTimeout(terminarPrecarga, 6000);         // nunca más de 6 s
    }
  }

  /* ===================================================================
     2. LIENZO
     =================================================================== */
  let ancho = 0, alto = 0, dpr = 1;
  function ajustarTamano() {
    dpr = Math.min(window.devicePixelRatio || 1, window.ES_TACTIL ? 1.5 : 1.75);
    ancho = innerWidth; alto = innerHeight;
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ajustarTamano();
  addEventListener('resize', ajustarTamano);

  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const mezclar = (a, b, t) => a + (b - a) * t;
  const suave = (t) => t * t * (3 - 2 * t);
  const azar = (a, b) => a + Math.random() * (b - a);

  // Aclara (+) u oscurece (−) un color hex
  function tono(hex, cantidad) {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(cantidad >= 0 ? c + (255 - c) * cantidad : c * (1 + cantidad));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // Esfera brillante. "plano" (0 a 1) le quita volumen: en 1 es un círculo liso.
  function esfera(x, y, r, color, brillo = 0, plano = 0) {
    if (r <= 0) return;
    const base = tono(color, 0).replace('rgb', 'rgba');
    if (plano < 1) {
      const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * (1.7 + brillo * 0.4));
      halo.addColorStop(0, base.replace(')', `,${(0.18 + brillo * 0.2) * (1 - plano)})`));
      halo.addColorStop(1, base.replace(')', ',0)'));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * (1.7 + brillo * 0.4), 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, plano ? color : tono(color, 0.55));
    g.addColorStop(0.35, color);
    g.addColorStop(0.82, tono(color, -0.45 * (1 - plano)));
    g.addColorStop(1, tono(color, -0.72 * (1 - plano)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (plano < 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - plano)})`;
      ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.46, r * 0.16, r * 0.09, -0.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ---------- Mouse o dedo ---------- */
  const puntero = { x: -9999, y: -9999, activo: false };
  addEventListener('pointermove', (e) => { puntero.x = e.clientX; puntero.y = e.clientY; puntero.activo = true; }, { passive: true });
  addEventListener('touchmove', (e) => { const t = e.touches[0]; puntero.x = t.clientX; puntero.y = t.clientY; puntero.activo = true; }, { passive: true });
  addEventListener('touchend', () => setTimeout(() => { puntero.x = puntero.y = -9999; }, 400));

  /* ---------- Gesto "mantener presionado" ---------- */
  const portada = document.querySelector('.portada');
  const botonMantener = document.querySelector('.mantener');
  const anilloProgreso = document.querySelector('.mantener__anillo .lleno');
  let presionando = false;
  let orden = 0;                 // 0 = caos, 1 = órbita ordenada
  let revelado = false;

  // Si ya se completó en esta visita, mostrar la frase directamente
  try { revelado = sessionStorage.getItem('revelado') === '1'; } catch (e) {}
  if (revelado) document.body.classList.add('revelado');

  function revelar() {
    if (revelado) return;
    revelado = true;
    document.body.classList.add('revelado');
    try { sessionStorage.setItem('revelado', '1'); } catch (e) {}
  }

  const enPortada = () => scrollY < portada.offsetHeight * 0.6;
  addEventListener('pointerdown', (e) => {
    if (!enPortada() || e.target.closest('a, .cabecera, .idioma')) return;
    presionando = true;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach((ev) => addEventListener(ev, () => { presionando = false; }));
  // Teclado: mantener Espacio o Enter sobre el botón
  botonMantener.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); presionando = true; } });
  botonMantener.addEventListener('keyup', () => { presionando = false; });
  portada.addEventListener('contextmenu', (e) => e.preventDefault());   // evita el menú del celular al mantener el dedo

  /* ---------- Fragmentos de vidrio ---------- */
  const fragmentos = Array.from({ length: AJUSTES.fragmentos }, (_, i) => ({
    cx: azar(-2.8, 2.8), cy: azar(-2.2, 2.2), cz: azar(-1, 1),            // lugar en el caos (en radios de la bolita)
    fase: azar(0, Math.PI * 2), vel: azar(0.2, 0.6),
    angulo: (i / AJUSTES.fragmentos) * Math.PI * 2,                       // lugar en la órbita
    capa: (i % 3) - 1,
    tam: azar(0.06, 0.16), giro: azar(0, Math.PI * 2),
    color: i % 7 === 0 ? AJUSTES.paleta[i % AJUSTES.paleta.length] : null, // la mayoría de vidrio blanco
    dx: 0, dy: 0,
  }));

  /* ---------- Recorrido de la bolita según el scroll ----------
     Para cada sección: dónde está la bolita (en % de pantalla) y su tamaño. */
  const secciones = [...document.querySelectorAll('main > section')];
  function paradas() {
    const movil = ancho < 760;
    return [
      { x: movil ? 0.5 : 0.66, y: movil ? 0.34 : 0.42, r: 1 },     // portada
      { x: movil ? 0.84 : 0.86, y: 0.5, r: movil ? 0.4 : 0.48 },   // lo que hago
      { x: 0.5, y: 0.5, r: 0.6 },                                   // anillos: la bolita queda en su centro
      { x: 0.5, y: 0.62, r: 0.5 },                                  // cierre (luego crece)
    ];
  }
  function posicionPorScroll() {
    const lista = paradas();
    const centros = secciones.map((s, i) => (i === 0 ? 0 : s.offsetTop + Math.min(s.offsetHeight, alto) / 2 - alto / 2));
    let i = 0;
    while (i < centros.length - 2 && scrollY > centros[i + 1]) i++;
    const t = suave(limitar((scrollY - centros[i]) / Math.max(1, centros[i + 1] - centros[i]), 0, 1));
    const a = lista[i], b = lista[i + 1];
    return { x: mezclar(a.x, b.x, t), y: mezclar(a.y, b.y, t), r: mezclar(a.r, b.r, t), tramo: i + t };
  }

  const bolita = { x: ancho * 0.66, y: alto * 0.42, r: 0, escala: 1 };
  let ultimo = performance.now(), reloj = 0;
  const cierre = secciones[secciones.length - 1];

  function cuadro(ahora) {
    const dt = Math.min(2, (ahora - ultimo) / 16.67);
    ultimo = ahora; reloj += dt / 60;
    const R = Math.min(ancho, alto) * (ancho < 760 ? 0.24 : 0.17);

    // --- gesto ---
    const paso = dt / 60 / AJUSTES.segundosParaOrdenar;
    orden = presionando ? Math.min(1, orden + paso) : Math.max(0, orden - paso * (revelado ? 0.5 : 1.6));
    if (orden >= 1) revelar();
    if (anilloProgreso) anilloProgreso.style.strokeDashoffset = 126 * (1 - orden);

    // --- posición ---
    const p = posicionPorScroll();
    let mx = 0, my = 0;
    if (!window.ES_TACTIL && puntero.activo) { mx = (puntero.x / ancho - 0.5) * 30; my = (puntero.y / alto - 0.5) * 30; }
    const meta = { x: p.x * ancho + mx, y: p.y * alto + my, r: R * p.r };
    bolita.x = mezclar(bolita.x, meta.x, 0.08 * dt);
    bolita.y = mezclar(bolita.y, meta.y, 0.08 * dt);
    bolita.r = mezclar(bolita.r || meta.r, meta.r, 0.08 * dt);
    bolita.escala = mezclar(bolita.escala, presionando ? 0.92 : 1, 0.12 * dt);
    const respira = 1 + Math.sin(reloj * 1.6) * 0.012;

    // --- cierre: de 0 a 1 mientras la sección sube ---
    const rc = cierre.getBoundingClientRect();
    const k = suave(limitar((alto * 0.85 - rc.top) / (alto * 0.8), 0, 1));
    document.body.classList.toggle('en-rojo', k > 0.62);

    ctx.clearRect(0, 0, ancho, alto);

    // --- fragmentos (solo en la portada) ---
    const visibles = limitar(1 - p.tramo * 1.4, 0, 1);
    const rx = bolita.r * 1.55, ry = bolita.r * 0.42;
    const atras = [], delante = [];
    if (visibles > 0) {
      const t = suave(orden);
      const giroOrbita = reloj * 0.5;
      for (const f of fragmentos) {
        const caosX = (f.cx + Math.sin(reloj * f.vel + f.fase) * 0.25) * bolita.r;
        const caosY = (f.cy + Math.cos(reloj * f.vel * 0.8 + f.fase) * 0.25) * bolita.r;
        const a = f.angulo + giroOrbita * (1 + f.capa * 0.15);
        const ordX = Math.cos(a) * rx * (1 + f.capa * 0.12);
        const ordY = Math.sin(a) * ry * (1 + f.capa * 0.12) + f.capa * bolita.r * 0.08;
        const fx = bolita.x + mezclar(caosX, ordX, t), fy = bolita.y + mezclar(caosY, ordY, t);
        // el mouse empuja los fragmentos mientras están en caos
        const ex = fx - puntero.x, ey = fy - puntero.y, ed = Math.hypot(ex, ey);
        if (ed < 120 && ed > 0 && t < 0.5) { f.dx += (ex / ed) * 2.2 * dt; f.dy += (ey / ed) * 2.2 * dt; }
        f.dx *= 0.92; f.dy *= 0.92;
        const z = mezclar(f.cz, Math.sin(a), t);
        (z < 0 ? atras : delante).push({ f, x: fx + f.dx, y: fy + f.dy, z });
      }
    }
    const dibujar = ({ f, x, y, z }) => {
      const s = f.tam * bolita.r * (1 + z * 0.25);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(f.giro + reloj * (0.4 + orden * 1.2));
      ctx.globalAlpha = visibles * (0.35 + (z + 1) * 0.3);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, s * 0.6); ctx.lineTo(-s * 0.55, s * 0.45); ctx.closePath();
      ctx.fillStyle = f.color || 'rgba(244,241,236,0.12)'; ctx.fill();
      ctx.strokeStyle = f.color ? 'rgba(255,255,255,0.4)' : 'rgba(244,241,236,0.7)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    };
    atras.forEach(dibujar);

    // --- la bolita (en el cierre crece hasta cubrir la pantalla) ---
    const cubrir = Math.hypot(ancho, alto) * 0.62;
    const bx = mezclar(bolita.x, ancho / 2, k), by = mezclar(bolita.y, alto / 2, k);
    const br = mezclar(bolita.r * bolita.escala * respira, cubrir, k);
    if (k >= 0.999) { ctx.fillStyle = AJUSTES.colorBolita; ctx.fillRect(0, 0, ancho, alto); }
    else esfera(bx, by, br, AJUSTES.colorBolita, orden, k);

    delante.forEach(dibujar);
    ctx.globalAlpha = 1;
    requestAnimationFrame(cuadro);
  }
  if (window.MENOS_MOVIMIENTO) {
    esfera(ancho * 0.66, alto * 0.42, Math.min(ancho, alto) * 0.17, AJUSTES.colorBolita);
    revelar();
  } else {
    requestAnimationFrame(cuadro);
  }

  /* ===================================================================
     3. ANILLOS TRANSPARENTES
     Cada anillo tiene dos capas idénticas. En la trasera solo se ven las
     letras de atrás y en la delantera solo las de adelante: como la
     bolita se dibuja entre ambas, parece atravesar el anillo.
     =================================================================== */
  const anillos = [...document.querySelectorAll('.anillo')];
  let velocidadScroll = 0, ultimoScroll = scrollY;
  addEventListener('scroll', () => { velocidadScroll = Math.min(30, Math.abs(scrollY - ultimoScroll)); ultimoScroll = scrollY; }, { passive: true });

  const datosAnillos = anillos.map((anillo, n) => {
    const base = anillo.dataset.texto;
    const texto = base.repeat(Math.max(1, Math.ceil(40 / base.length)));   // ~40 letras alrededor
    const capas = ['atras', 'frente'].map((lado) => {
      const capa = document.createElement('span');
      capa.className = `anillo__capa anillo__capa--${lado}`;
      capa.setAttribute('aria-hidden', 'true');
      capa.innerHTML = '<span class="anillo__vidrio"></span><span class="anillo__giro"></span>';
      const giro = capa.querySelector('.anillo__giro');
      const letras = [...texto].map((c) => {
        const s = document.createElement('span');
        s.className = 'anillo__letra';
        s.textContent = c === ' ' ? ' ' : c;
        giro.appendChild(s);
        return s;
      });
      anillo.appendChild(capa);
      return { giro, letras };
    });
    return { anillo, capas, total: texto.length, angulo: n * 40, sentido: n % 2 ? -1 : 1, visible: false, hover: false };
  });

  function colocarLetras() {
    datosAnillos.forEach((d) => {
      const radio = Math.min(d.anillo.clientWidth * 0.34, 330);
      d.capas.forEach(({ letras }) => letras.forEach((l, i) => {
        l.style.setProperty('--a', (i * 360) / d.total + 'deg');
        l.style.setProperty('--r', radio + 'px');
      }));
    });
  }
  colocarLetras();
  addEventListener('resize', colocarLetras);

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((ents) => ents.forEach((e) => {
      datosAnillos.find((x) => x.anillo === e.target).visible = e.isIntersecting;
    }));
    anillos.forEach((a) => obs.observe(a));
  }
  datosAnillos.forEach((d) => {
    d.anillo.addEventListener('pointerenter', () => (d.hover = true));
    d.anillo.addEventListener('pointerleave', () => (d.hover = false));
  });

  function girarAnillos() {
    const centro = innerHeight / 2;
    datosAnillos.forEach((d) => {
      if (!d.visible) return;
      if (window.ES_TACTIL) {   // en táctil se activa el anillo del centro de la pantalla
        const r = d.anillo.getBoundingClientRect();
        d.anillo.classList.toggle('activo', Math.abs(r.top + r.height / 2 - centro) < r.height * 0.6);
      }
      const rapido = d.hover || d.anillo.classList.contains('activo');
      d.angulo += d.sentido * (0.18 + velocidadScroll * 0.08 + (rapido ? 0.9 : 0));
      d.capas.forEach(({ giro }) => giro.style.setProperty('--giro', d.angulo + 'deg'));
      for (let i = 0; i < d.total; i++) {
        const atras = Math.cos(((i * 360) / d.total + d.angulo) * (Math.PI / 180)) < 0;
        const lt = d.capas[0].letras[i], lf = d.capas[1].letras[i];
        if (lt.classList.contains('oculta') === atras) lt.classList.toggle('oculta', !atras);   // capa trasera: solo letras de atrás
        if (lf.classList.contains('oculta') !== atras) lf.classList.toggle('oculta', atras);    // capa delantera: solo letras de adelante
      }
    });
    velocidadScroll *= 0.92;
    requestAnimationFrame(girarAnillos);
  }
  requestAnimationFrame(girarAnillos);

  /* ===================================================================
     4. BARRA LATERAL DE AVANCE
     =================================================================== */
  const avance = document.querySelector('.avance');
  if (avance) {
    const actualizar = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = Math.round((scrollY / Math.max(1, max)) * 100);
      avance.querySelector('i').style.setProperty('--p', pct + '%');
      avance.querySelector('span').textContent = pct + '%';
    };
    addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  }
})();
