/* Nexus Studio v8 — frosted reveals.
   Replaces the v7 grain-canvas assembly (a full-screen canvas, a left-to-right mask and a hand-off to the solid
   element, which read as a scramble/decode and could flick at the hand-off).
   - Titles: a grainy, frosted copy of the words condenses out of a blur and dissolves into the crisp metal text.
     Both layers are stacked in the same grid cell, so nothing ever has to line up with a canvas.
   - Cards and panels: one soft rise (opacity + translate only, long expo-out tail), triggered once.
   Every element is revealed exactly once (it is unobserved on the first hit); nothing restarts on a nav jump. */
(() => {
  const NX = window.NX; if (!NX || NX.reduce) return;
  const root = document.documentElement;
  root.classList.add('fx');
  const texts = [...document.querySelectorAll('.fx-text')], frames = [...document.querySelectorAll('.fx-frame')];

  texts.forEach(el => {
    const html = el.innerHTML, metal = el.classList.contains('metal-text');
    el.classList.remove('metal-text');                        // the crisp layer carries the metal; --band is inherited
    el.innerHTML = `<span class="fx-solid${metal ? ' metal-text' : ''}">${html}</span><span class="fx-frost" aria-hidden="true">${html}</span>`;
    const solid = el.firstChild;
    solid.addEventListener('animationend', () => {           // settle: drop the frost layer, keep the plain element
      el.classList.add('fx-done'); const f = el.querySelector('.fx-frost'); f && f.remove();
    }, { once: true });
  });
  frames.forEach(el => el.addEventListener('transitionend', e => { if (e.target === el && e.propertyName === 'opacity') el.classList.add('fx-done'); }));

  const log = window.__fx = { revealed: new Map() };          // element → number of times revealed (must stay 1)
  let batch = [], batchT = 0;
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); batch.push(e); } });
    if (!batch.length) return;
    clearTimeout(batchT);
    batchT = setTimeout(() => {
      // siblings that arrive together cascade gently (row by row, left to right), capped so nothing waits long
      batch.sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left));
      batch.forEach((e, k) => {
        const el = e.target;
        el.style.setProperty('--d', (Math.min(k, 7) * 0.06).toFixed(2) + 's');
        el.classList.add('in');
        log.revealed.set(el, (log.revealed.get(el) || 0) + 1);
      });
      batch = [];
    }, 16);
  }, { threshold: 0.14, rootMargin: '0px 0px -4% 0px' });
  const go = () => [...texts, ...frames].forEach(el => io.observe(el));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
})();
