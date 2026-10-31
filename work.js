/* Nexus Studio v9 — selected work: the mobile carousel rail and the case-study lightbox.
   The lightbox is a native modal <dialog> (focus stays inside, Esc closes, focus returns to the card),
   Lenis is stopped while it is open so the page underneath cannot scroll, and the sheet scrolls natively
   inside it (data-lenis-prevent). Transform + opacity only; the image box is sized before it loads. */
(() => {
  const NX = window.NX || {};
  const grid = document.getElementById('work-grid'), lb = document.getElementById('lb');
  if (!grid || !lb) return;
  const cards = [...grid.querySelectorAll('.wk-card')], N = cards.length;
  const pad = n => String(n).padStart(2, '0');

  /* carousel rail (only visible on the mobile carousel; cheap: one transform per scroll frame) */
  const bar = document.getElementById('wk-bar'), pos = document.getElementById('wk-pos');
  let railQ = false, lastP = -1;
  const rail = () => {
    railQ = false;
    const max = grid.scrollWidth - grid.clientWidth; if (max <= 0) return;
    const f = grid.scrollLeft / max, p = Math.min(N - 1, Math.round(f * (N - 1)));
    bar.style.transform = `scaleX(${(1 / N + f * (1 - 1 / N)).toFixed(4)})`;
    if (p !== lastP) { lastP = p; pos.textContent = pad(p + 1); }
  };
  grid.addEventListener('scroll', () => { if (!railQ) { railQ = true; requestAnimationFrame(rail); } }, { passive: true });

  /* lightbox */
  const img = document.getElementById('lb-img'), title = document.getElementById('lb-title'), svc = document.getElementById('lb-svc');
  const lbPos = document.getElementById('lb-pos'), scroller = document.getElementById('lb-scroll');
  let cur = -1, opener = null, closing = 0, token = 0;
  const preload = i => { const c = cards[(i + N) % N]; if (c && !c.__pre) { c.__pre = new Image(); c.__pre.decoding = 'async'; c.__pre.src = c.dataset.cs; } };

  function show(i) {
    i = (i + N) % N; cur = i;
    const c = cards[i], t = ++token;
    title.textContent = c.dataset.brand;
    svc.textContent = c.dataset.svc.replace(/&amp;/g, '&');
    lbPos.textContent = pad(i + 1);
    img.classList.remove('ok');
    img.alt = c.dataset.alt;
    img.src = c.dataset.cs;
    scroller.scrollTop = 0;
    const done = () => { if (t === token) img.classList.add('ok'); };
    (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    preload(i + 1); preload(i - 1);
  }
  function open(i, from) {
    clearTimeout(closing); closing = 0;
    opener = from || null;
    show(i);
    if (!lb.open) lb.showModal();
    NX.lenis && NX.lenis.stop();
    document.documentElement.classList.add('lb-open');
    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-in')));
  }
  function close() {
    if (!lb.open || closing) return;
    lb.classList.remove('is-in');
    const finish = () => {
      closing = 0; lb.close();
      document.documentElement.classList.remove('lb-open');
      NX.lenis && NX.lenis.start();
      opener && opener.focus({ preventScroll: true });
    };
    closing = setTimeout(finish, NX.reduce ? 0 : 420);
  }

  grid.addEventListener('click', e => {
    const c = e.target.closest('.wk-card'); if (!c) return;
    open(+c.dataset.i, c);
  });
  // warm the sheet on intent so it is usually decoded before the click lands
  grid.addEventListener('pointerover', e => { const c = e.target.closest('.wk-card'); if (c) preload(+c.dataset.i); }, { passive: true });
  grid.addEventListener('focusin', e => { const c = e.target.closest('.wk-card'); if (c) preload(+c.dataset.i); });

  lb.addEventListener('cancel', e => { e.preventDefault(); close(); });          // Esc: animate out, then close
  lb.addEventListener('click', e => {
    const b = e.target.closest('[data-lb]');
    if (b) { const a = b.dataset.lb; a === 'close' ? close() : show(cur + (a === 'next' ? 1 : -1)); return; }
    if (!e.target.closest('.lb-panel')) close();                                  // click outside the panel
  });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
  });
  // swipe left / right on the sheet to move between case studies (vertical drags scroll the sheet)
  let sx = 0, sy = 0, st = 0;
  scroller.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = performance.now(); }, { passive: true });
  scroller.addEventListener('touchend', e => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && performance.now() - st < 600) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
