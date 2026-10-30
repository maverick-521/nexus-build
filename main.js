/* Nexus Build v4 — one clock, one curve, one light.
   NX: shared timing (expo-out everywhere, cubic in-out for the light), a single
   global light band that travels top-left → bottom-right across the viewport,
   Lenis scroll, magnetic buttons, parallax and the liquid glass controls. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  if (reduce) root.classList.add('static');
  setTimeout(() => { if (!window.__heroOK) root.classList.add('static'); }, 3500);

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const DIR = [0.788, 0.616];                       // 128deg, the one light direction
  const NX = window.NX = {
    reduce, fine, clamp,
    t0: performance.now(),
    CYCLE: 9, FIRST: 4.6, DUR: 4.2,                 // light cadence (s)
    expoOut: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeIO: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    time: now => ((now ?? performance.now()) - NX.t0) / 1000,
    restart() { NX.t0 = performance.now(); },
    band: null,                                     // px along DIR in viewport space, or null
    bandAt(t, W, H) {
      if (reduce || t < NX.FIRST) return null;
      const ph = (t - NX.FIRST) % NX.CYCLE;
      if (ph > NX.DUR) return null;
      return -420 + NX.easeIO(ph / NX.DUR) * (W * DIR[0] + H * DIR[1] + 840);
    },
    DIR,
    ticks: new Set(),
    on(f) { NX.ticks.add(f); return () => NX.ticks.delete(f); },
    lenis: null,
    scrollTo(target, opts = {}) {
      const el = typeof target === 'string' ? (target === '#top' ? 0 : document.querySelector(target)) : target;
      if (el == null) return;
      if (NX.lenis) NX.lenis.scrollTo(el, { duration: 1.6, easing: NX.expoOut, ...opts });
      else {
        const y = el === 0 ? 0 : el.getBoundingClientRect().top + scrollY + (opts.offset || 0);
        scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        opts.onComplete && setTimeout(opts.onComplete, reduce ? 0 : 900);
      }
    }
  };

  /* ---------- Lenis ---------- */
  if (!reduce && window.Lenis) {
    NX.lenis = new Lenis({ duration: 1.15, easing: NX.expoOut, smoothWheel: true, wheelMultiplier: .95, touchMultiplier: 1 });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('.lg') || a.classList.contains('skip')) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    e.preventDefault(); NX.scrollTo(id);
  });

  /* ---------- reveals ---------- */
  document.querySelectorAll('.steps, .pp-list').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.12) + 's')));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- global light band targets ---------- */
  const sweepEls = new Set();
  const vis = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? sweepEls.add(e.target) : (sweepEls.delete(e.target), e.target.style.setProperty('--band', '-9999px'))), { rootMargin: '80px' });
  const watchSweep = el => vis.observe(el);
  document.querySelectorAll('.sweepable, .glass, .btn-metal, .lg-lens, .metal-text, .headline').forEach(watchSweep);
  NX.watchSweep = watchSweep;
  let bandWasOn = false;
  function sweep(t) {
    const W = innerWidth, H = innerHeight;
    const D = NX.bandAt(t, W, H); NX.band = D;
    if (D == null) {
      if (bandWasOn) { sweepEls.forEach(el => el.style.setProperty('--band', '-9999px')); bandWasOn = false; }
      return;
    }
    bandWasOn = true;
    const list = [...sweepEls], rs = list.map(el => el.getBoundingClientRect());   // read all, then write all
    for (let i = 0; i < list.length; i++) {
      const r = rs[i];
      list[i].style.setProperty('--band', (D - (r.left * DIR[0] + r.top * DIR[1])).toFixed(1) + 'px');
    }
  }

  /* ---------- magnetic buttons ---------- */
  const mags = fine && !reduce ? [...document.querySelectorAll('.magnetic')].map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0 })) : [];
  if (mags.length) addEventListener('pointermove', e => {
    for (const m of mags) {
      const r = m.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      const near = Math.abs(dx) < r.width / 2 + 36 && Math.abs(dy) < r.height / 2 + 30;
      m.tx = near ? clamp(dx * .2, -7, 7) : 0; m.ty = near ? clamp(dy * .3, -5, 5) : 0;
    }
  }, { passive: true });

  /* ---------- parallax ---------- */
  const deps = reduce ? [] : [...document.querySelectorAll('[data-depth]')].map(el => ({ el, d: +el.dataset.depth }));

  /* ---------- glass cursor light ---------- */
  if (fine && !reduce) document.querySelectorAll('.glass').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  });

  /* ---------- the frame loop ---------- */
  const steps = document.querySelector('.steps');
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (NX.lenis) NX.lenis.raf(now);
    const t = NX.time(now);
    sweep(t);
    const vh = innerHeight;
    for (const m of mags) {
      const k = 1 - Math.exp(-dt * 10);
      m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k;
      if (Math.abs(m.x) + Math.abs(m.y) + Math.abs(m.tx) + Math.abs(m.ty) > .02) {
        m.el.style.setProperty('--mx-t', m.x.toFixed(2) + 'px'); m.el.style.setProperty('--my-t', m.y.toFixed(2) + 'px');
      }
    }
    for (const p of deps) {
      const r = p.el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      p.el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * -p.d).toFixed(1) + 'px');
    }
    if (steps && !reduce) {
      const r = steps.getBoundingClientRect();
      steps.style.setProperty('--progress', clamp((vh * .82 - r.top) / (vh * .5), 0, 1).toFixed(3));
    }
    NX.ticks.forEach(f => f(now, dt, t));
  }
  requestAnimationFrame(frame);

  /* ---------- liquid glass ---------- */
  const refract = !!navigator.userAgentData && CSS.supports('backdrop-filter', 'url(#a)') && !reduce;
  if (refract) root.classList.add('refract');
  const defs = document.getElementById('lg-defs');
  const SVGNS = 'http://www.w3.org/2000/svg';
  let mapURL = null;
  function lensMap() {
    if (mapURL) return mapURL;
    const mw = 320, mh = 120, c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const g = c.getContext('2d'), img = g.createImageData(mw, mh), d = img.data;
    const r = mh / 2, cx = mw / 2, cy = mh / 2, bez = r * .62;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const qx = Math.max(Math.abs(x + .5 - cx) - (mw / 2 - r), 0) * Math.sign(x + .5 - cx), qy = y + .5 - cy;
      const len = Math.hypot(qx, qy) || 1e-6, e = r - len;      // distance inside the rim
      const k = clamp(1 - e / bez, 0, 1), s = k * k * (3 - 2 * k) * k;   // refraction rises steeply at the rim
      let dx = qx / len * s, dy = qy / len * s;
      dx -= (x + .5 - cx) / (mw / 2) * .10; dy -= qy / r * .10;     // a little magnification in the body
      const o = (y * mw + x) * 4;
      d[o] = 128 + clamp(dx, -1, 1) * 127; d[o + 1] = 128 + clamp(dy, -1, 1) * 127; d[o + 2] = 128; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (mapURL = c.toDataURL());
  }
  let lgN = 0;
  function makeFilter(lens) {
    const id = 'lgf' + (lgN++);
    const f = document.createElementNS(SVGNS, 'filter');
    f.setAttribute('id', id); f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('primitiveUnits', 'userSpaceOnUse');
    f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('color-interpolation-filters', 'sRGB');
    const im = document.createElementNS(SVGNS, 'feImage');
    im.setAttribute('href', lensMap()); im.setAttribute('x', '0'); im.setAttribute('y', '0'); im.setAttribute('preserveAspectRatio', 'none'); im.setAttribute('result', 'm');
    const dm = document.createElementNS(SVGNS, 'feDisplacementMap');
    dm.setAttribute('in', 'SourceGraphic'); dm.setAttribute('in2', 'm'); dm.setAttribute('xChannelSelector', 'R'); dm.setAttribute('yChannelSelector', 'G');
    f.append(im, dm); defs.append(f);
    lens.style.setProperty('--lf', `url(#${id})`);
    let lw = 0, lh = 0;
    return (w, h) => {
      if (Math.abs(w - lw) < .75 && Math.abs(h - lh) < .75) return;
      lw = w; lh = h;
      for (const el of [f, im]) { el.setAttribute('width', w.toFixed(1)); el.setAttribute('height', h.toFixed(1)); }
      dm.setAttribute('scale', (h * .55).toFixed(1));
    };
  }

  /* A lens carried between options: follows the finger, stretches with speed,
     settles on a soft spring, and commits on release. Transform/opacity only. */
  function liquid(el, { initial = 0, onCommit = () => {}, onMove = null, links = false } = {}) {
    const lens = el.querySelector('.lg-lens'), opts = [...el.querySelectorAll('.lg-opt')], n = opts.length;
    const scroller = el.parentElement.classList.contains('lg-scroll') ? el.parentElement : null;
    const sizeFilter = refract ? makeFilter(lens) : null;
    let geo = [], sel = initial, x = 0, w = 0, vx = 0, vw = 0, tx = 0, tw = 0, lo = initial < 0 ? 0 : 1, tlo = lo;
    let press = null, drag = false, grab = 0, px = 0, pressAmt = 0, running = false, lastSet = '', lastW = -1, H = 40;
    const measure = () => { geo = opts.map(o => ({ c: o.offsetLeft + o.offsetWidth / 2, w: o.offsetWidth })); H = opts[0].offsetHeight; };
    const widthAt = cx => {
      if (cx <= geo[0].c) return geo[0].w;
      for (let i = 0; i < n - 1; i++) if (cx <= geo[i + 1].c) { const f = (cx - geo[i].c) / (geo[i + 1].c - geo[i].c); return geo[i].w + (geo[i + 1].w - geo[i].w) * f; }
      return geo[n - 1].w;
    };
    const idxF = cx => {
      if (cx <= geo[0].c) return 0;
      for (let i = 0; i < n - 1; i++) if (cx <= geo[i + 1].c) return i + (cx - geo[i].c) / (geo[i + 1].c - geo[i].c);
      return n - 1;
    };
    const nearest = cx => { let b = 0, d = Infinity; geo.forEach((g, k) => { const dd = Math.abs(g.c - cx); if (dd < d) { d = dd; b = k; } }); return b; };
    const rubber = cx => {           // resistance past the ends
      const a = geo[0].c, b = geo[n - 1].c;
      if (cx < a) { const d = a - cx; return a - d * .4 / (1 + d / 90); }
      if (cx > b) { const d = cx - b; return b + d * .4 / (1 + d / 90); }
      return cx;
    };
    function paint() {
      const sp = reduce ? 0 : Math.min(1, Math.abs(vx) / 1700);
      const sx = 1 + sp * .32 + pressAmt * .07, sy = 1 - sp * .2 + pressAmt * .07;
      if (Math.abs(w - lastW) > .25) { lastW = w; lens.style.width = w.toFixed(1) + 'px'; sizeFilter && sizeFilter(w, H); }
      const s = `translate3d(${(x - w / 2).toFixed(2)}px,0,0) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      if (s !== lastSet) { lens.style.transform = s; lastSet = s; }
      lens.style.setProperty('--press', pressAmt.toFixed(3));
      lens.style.setProperty('--ang', clamp(vx / 30, -50, 50).toFixed(1) + 'deg');
      lens.style.setProperty('--lo', lo.toFixed(3));
      opts.forEach((o, k) => o.style.setProperty('--on', (lo * Math.max(0, 1 - Math.abs(x - geo[k].c) / (geo[k].w * .9))).toFixed(3)));
      onMove && onMove(idxF(x), lo);
      if (scroller && (drag || running)) {   // keep the lens in view inside a scrolling track
        const L = el.offsetLeft + x - scroller.scrollLeft, SW = scroller.clientWidth, m = Math.min(90, SW * .2);
        if (L < m) scroller.scrollLeft -= Math.min(18, (m - L) * .25); else if (L > SW - m) scroller.scrollLeft += Math.min(18, (L - SW + m) * .25);
      }
    }
    function tick(now, dt) {
      if (!running) return;
      if (drag) {
        const x0 = x; x += (rubber(px - grab) - x) * (1 - Math.exp(-dt * 36));
        vx = vx * .7 + ((x - x0) / Math.max(dt, 1e-3)) * .3;
        w += (widthAt(x) - w) * (1 - Math.exp(-dt * 30));
      } else {
        const k = 240, c = 2 * .64 * Math.sqrt(k), kw = 320, cw = 2 * .8 * Math.sqrt(kw), h = dt / 4;   // soft, slightly elastic settle
        for (let s = 0; s < 4; s++) { vx += (k * (tx - x) - c * vx) * h; x += vx * h; vw += (kw * (tw - w) - cw * vw) * h; w += vw * h; }
      }
      pressAmt += ((press ? 1 : 0) - pressAmt) * (1 - Math.exp(-dt * 14));
      lo += (tlo - lo) * (1 - Math.exp(-dt * 10));
      if (!drag && !press && Math.abs(tx - x) < .05 && Math.abs(vx) < 2 && Math.abs(tw - w) < .05 && pressAmt < .002 && Math.abs(tlo - lo) < .002) {
        x = tx; w = tw; vx = 0; pressAmt = 0; lo = tlo; running = false;
      }
      paint();
    }
    NX.on(tick);
    const go = () => { if (reduce) { x = tx; w = tw; vx = 0; lo = tlo; pressAmt = 0; paint(); return; } running = true; };
    const mark = i => opts.forEach((o, k) => {
      if (links) { k === i ? o.setAttribute('aria-current', 'true') : o.removeAttribute('aria-current'); return; }
      const on = k === i ? 'true' : 'false';
      o.setAttribute(o.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', on);
      o.tabIndex = k === i ? 0 : -1;
    });
    function set(i, { commit = false, focus = false, instant = false } = {}) {
      if (!geo.length) measure();
      sel = i;
      if (i < 0) { tlo = 0; } else { tlo = 1; tx = geo[i].c; tw = geo[i].w; if (lo < .05) { x = tx; w = tw; vx = 0; } }
      mark(i);
      if (instant) { x = tx; w = tw; vx = 0; lo = tlo; paint(); } else go();
      if (focus && i >= 0) opts[i].focus({ preventScroll: true });
      if (commit && i >= 0) onCommit(i, opts[i]);
    }
    const localX = e => e.clientX - el.getBoundingClientRect().left;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || press) return;
      measure();
      const lx = localX(e), on = nearest(lx);
      press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on };
      drag = false; px = lx;
      if (lo < .05) { x = geo[on].c; w = geo[on].w; }      // appear where pressed
      tlo = 1; tx = geo[on].c; tw = geo[on].w;
      grab = 0;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      go();
    });
    el.addEventListener('pointermove', e => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x0, dy = e.clientY - press.y0;
      if (!drag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { return; }
        if (Math.abs(dx) < 4) return;
        drag = true; el.classList.add('is-drag'); grab = clamp(localX(e) - x, -w / 2, w / 2);
      }
      px = localX(e); go();
    });
    const end = (e, cancel) => {
      if (!press || e.pointerId !== press.id) return;
      const wasDrag = drag, on = press.on;
      press = null; drag = false; el.classList.remove('is-drag');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      if (cancel) { set(sel); return; }
      const proj = x + clamp(vx * .09, -140, 140);           // a flick carries a little further
      const i = wasDrag ? nearest(proj) : on;
      set(i, { commit: true });
    };
    el.addEventListener('pointerup', e => end(e, false));
    el.addEventListener('pointercancel', e => end(e, true));
    el.addEventListener('lostpointercapture', e => { if (press && e.pointerId === press.id) end(e, true); });
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('click', e => {
      const o = e.target.closest('.lg-opt'); if (!o) return;
      e.preventDefault();
      if (e.detail === 0) set(opts.indexOf(o), { commit: true });   // keyboard / assistive activation
    });
    el.addEventListener('keydown', e => {
      const cur = Math.max(0, opts.indexOf(document.activeElement));
      let i = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (cur + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (cur - 1 + n) % n;
      else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1;
      if (i == null) return;
      e.preventDefault();
      if (links) { opts[i].focus(); set(i); } else set(i, { commit: true, focus: true });
    });
    const ro = new ResizeObserver(() => { measure(); if (sel >= 0) { tx = geo[sel].c; tw = geo[sel].w; x = tx; w = tw; } lastW = -1; paint(); });
    ro.observe(el);
    measure(); if (sel >= 0) { x = tx = geo[sel].c; w = tw = geo[sel].w; } else { x = geo[0].c; w = geo[0].w; }
    mark(sel); paint();
    return { set, get sel() { return sel; }, el };
  }
  NX.liquid = liquid;

  /* nav: the lens marks where you are; drag it to another section and let go */
  const navEl = document.querySelector('[data-lg="nav"]');
  const navIds = navEl ? [...navEl.querySelectorAll('.lg-opt')].map(a => a.getAttribute('href')) : [];
  let spyLock = false;
  const nav = navEl && liquid(navEl, {
    initial: -1, links: true,
    onCommit: i => { spyLock = true; NX.scrollTo(navIds[i], { onComplete: () => { spyLock = false; } }); setTimeout(() => spyLock = false, 2200); }
  });
  const secs = navIds.map(id => document.querySelector(id));
  if (nav) NX.on(() => {
    if (spyLock) return;
    const y = innerHeight * .42; let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= y) cur = i; });
    if (cur !== nav.sel) nav.set(cur);
  });

  /* services switcher: the active panel moves with the lens, frame for frame */
  const panels = [...document.querySelectorAll('.sv-panel')];
  const svLight = document.querySelector('.sv-light');
  const cards = [...document.querySelectorAll('.gl-card[data-go]')];
  panels.forEach(p => p.removeAttribute('hidden'));
  const svEl = document.querySelector('[data-lg="services"]');
  let lastP = -1;
  const services = svEl && liquid(svEl, {
    initial: 0,
    onMove: p => {
      if (Math.abs(p - lastP) < .0005) return; lastP = p;
      panels.forEach((el, k) => {
        const d = p - k, a = Math.abs(d), o = reduce ? (a < .5 ? 1 : 0) : Math.pow(clamp(1 - a * 1.7, 0, 1), 1.4);
        el.style.setProperty('--o', o.toFixed(3));
        el.style.setProperty('--x', (-d * 90).toFixed(1) + 'px');
        el.style.setProperty('--b', Math.min(a * 6, 4).toFixed(2) + 'px');
        el.classList.toggle('off', o < .002);
      });
      svLight && svLight.style.setProperty('--lx', (-p * 26).toFixed(1) + 'px');
    },
    onCommit: i => {
      panels.forEach((el, k) => { const on = k === i; el.toggleAttribute('inert', !on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); });
      cards.forEach((c, k) => c.classList.toggle('active', k === i));
    }
  });
  if (services) {
    panels.forEach((el, k) => { el.toggleAttribute('inert', k !== 0); el.setAttribute('aria-hidden', k ? 'true' : 'false'); });
    cards[0] && cards[0].classList.add('active');
    cards.forEach((c, i) => c.addEventListener('click', () => {
      NX.scrollTo(document.querySelector('.switcher'), { offset: -110, onComplete: () => services.set(i, { commit: true }) });
    }));
  }

  /* currency: prices count to their converted value on the same curve */
  const RATES = { USD: [1, '$'], GBP: [0.75093, '£'], EUR: [0.89847, '€'] };   // ECB reference via frankfurter.app, 29 Oct 2026
  const priceEls = [...document.querySelectorAll('.price-val')].map(el => ({ el, usd: +el.dataset.usd, v: +el.dataset.usd }));
  const curNote = document.getElementById('cur-note');
  let curAnim = null;
  const curEl = document.querySelector('[data-lg="currency"]');
  curEl && liquid(curEl, {
    initial: 0,
    onCommit: (i, o) => {
      const code = o.dataset.cur, [rate, sym] = RATES[code];
      const from = priceEls.map(p => p.v), to = priceEls.map(p => code === 'USD' ? p.usd : Math.round(p.usd * rate / 5) * 5);
      const t0 = performance.now();
      curAnim && curAnim();
      curAnim = NX.on(now => {
        const k = reduce ? 1 : NX.expoOut(Math.min(1, (now - t0) / 900));
        priceEls.forEach((p, j) => { p.v = from[j] + (to[j] - from[j]) * k; p.el.textContent = sym + Math.round(p.v); });
        if (k >= 1) { curAnim(); curAnim = null; }
      });
      if (curNote) curNote.textContent = code === 'USD'
        ? 'Prices are starting points in USD. Final quote after a short scope chat.'
        : `Approximate ${code} conversions of our USD prices (ECB reference rate, 29 Oct 2026), rounded. Final quote after a short scope chat.`;
    }
  });

  /* contact: pick what you need, the email button follows */
  const cBtn = document.getElementById('contact-btn');
  const cEl = document.querySelector('[data-lg="contact"]');
  const article = s => ({ 'AI assistant': 'an AI assistant', 'Bot': 'a bot', 'Automation': 'an automation', 'Scraping': 'a scraping project', 'Website': 'a website', 'Web app': 'a web app' }[s] || 'your project');
  cEl && cBtn && liquid(cEl, {
    initial: 0,
    onCommit: (i, o) => {
      const s = o.dataset.subj, lbl = cBtn.querySelector('.lbl');
      cBtn.href = `mailto:nexusbuild@mail.grokbot.com?subject=${encodeURIComponent(s + ' project')}`;
      if (reduce) { lbl.textContent = 'Email about ' + article(s); return; }
      lbl.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(4px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        lbl.textContent = 'Email about ' + article(s);
        lbl.animate([{ opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      };
    }
  });

  /* ---------- mobile menu ---------- */
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('mobile-menu');
  const setMenu = open => {
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open; if (open) menu.querySelector('a').focus();
  };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); } });
})();
