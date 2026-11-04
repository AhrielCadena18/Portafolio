/* =====================================================================
   SOBRE-MI.JS
   1. Logo dentro de la bolita con el efecto "Tech Text" (js/tech-text.js).
   ===================================================================== */

(() => {
  /* ---------- 1. LOGO CON "TECH TEXT" ----------
     Las líneas tipográficas aparecen y las letras se rellenan; después una
     lupa recorre el logo sola (o sigue al mouse / al dedo) y convierte la
     letra enfocada en un contorno de trazos, con su marco y sus medidas.
     Las letras se pueden arrastrar y rebotan al tocarlas. */
  const caja = document.querySelector('.bolita-logo__texto');
  if (caja && window.TechText) {
    const arrancar = () => window.TechText(caja, {
      text: caja.dataset.texto,
      fontFamily: 'Ramesha, serif',
      fontWeight: 400,
      fontSize: 120,
      letterSpacing: 0,
      color: '#0F0D18',          // letras oscuras sobre el rosa
      accentColor: '#FFFFFF',    // marco, medidas y partículas en blanco
      reach: 120,
      dashLength: 4,
      dashGap: 3,
      strokeWidth: 1.4,
      specks: 12,
      bounce: 0.45,
      speed: 0.9,
      intro: 'metrics',          // entra dibujando las líneas tipográficas
      introDuration: 2.2,
    });
    // espera a que Ramesha esté lista para medir bien cada letra
    if (document.fonts) document.fonts.load('400 64px Ramesha').then(arrancar, arrancar); else arrancar();
  }

})();
