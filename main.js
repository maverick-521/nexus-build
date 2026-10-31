/* Nexus Studio v9 — one clock, one curve, one light, one rAF loop.
   NX: shared timing (expo-out everywhere, cubic in-out for the light), a single
   global light band that travels top-left → bottom-right across the viewport,
   Lenis scroll, magnetic buttons, parallax and the liquid glass controls. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  if (reduce) root.classList.add('static');
  setTimeout(() => { if (!window.__heroOK) root.classList.add('static'); }, 6000);

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
    ticks: new Set(), reads: new Set(),
    on(f) { NX.ticks.add(f); return () => NX.ticks.delete(f); },      // write phase
    read(f) { NX.reads.add(f); return () => NX.reads.delete(f); },    // read phase (runs first, no writes)
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
    NX.lenis = new Lenis({ lerp: .1, smoothWheel: true, wheelMultiplier: .95, touchMultiplier: 1 });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('.lg') || a.classList.contains('skip')) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    e.preventDefault(); NX.scrollTo(id);
  });

  /* ---------- reveals ---------- */
  // v8: one observer for every reveal. Each element gets .in exactly once (then it is unobserved), and the motion is a
  // plain CSS transition on opacity + transform with a long expo-out tail, so nothing restarts or snaps at the end.
  document.querySelectorAll('.steps, .pp-list, .why-grid, .faq-list, .start-steps').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.09) + 's')));
  NX.revealed = 0;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); NX.revealed++; }
  }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  NX.reveal = el => io.observe(el);

  /* ---------- layout cache: document-space boxes, refreshed only when layout changes ---------- */
  // Per-frame code never calls getBoundingClientRect on these; it uses cached boxes + the scroll offset.
  let layoutGen = 0;
  const bumpLayout = () => { layoutGen++; };
  addEventListener('resize', bumpLayout, { passive: true });
  new ResizeObserver(bumpLayout).observe(document.body);
  document.fonts && document.fonts.ready.then(bumpLayout);
  const boxCache = new WeakMap();
  const docBox = el => {
    let c = boxCache.get(el);
    if (!c || c.g !== layoutGen) {
      const r = el.getBoundingClientRect(), fixed = !!el.closest('.nav-wrap');
      c = { g: layoutGen, l: r.left + (fixed ? 0 : scrollX), t: r.top + (fixed ? 0 : scrollY), h: r.height, w: r.width, fixed };
      boxCache.set(el, c);
    }
    return c;
  };
  NX.docBox = docBox; NX.bumpLayout = bumpLayout;
  const sy = () => NX.lenis ? NX.lenis.animatedScroll : scrollY;

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
    const y = scrollY;
    // v8: only elements the band is actually crossing get a new value (each write = a repaint of that element's rim)
    for (const el of sweepEls) {
      const b = docBox(el), top = b.fixed ? b.t : b.t - y;
      const v = Math.round(D - (b.l * DIR[0] + top * DIR[1])), ext = b.w * DIR[0] + b.h * DIR[1];
      const out = v < -260 || v > ext + 260;
      if (out) { if (el.__bo !== 1) { el.__bo = 1; el.style.setProperty('--band', '-9999px'); } continue; }
      el.__bo = 0; el.style.setProperty('--band', v + 'px');
    }
  }

  /* ---------- magnetic buttons ---------- */
  // v7: boxes are read once per frame in the read phase (never inside pointermove), the pull is softer
  // and wider, and a fluid ice-blue bubble follows the cursor inside .btn-metal (--bx / --by / --bo)
  const mags = fine && !reduce ? [...document.querySelectorAll('.magnetic')].map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0, bx: 50, by: 50, tbx: 50, tby: 50, bo: 0, tbo: 0, metal: el.classList.contains('btn-metal') })) : [];
  const ptr = { x: -1e4, y: -1e4, moved: false };
  if (mags.length) {
    addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = true; }, { passive: true });
    NX.read(() => {
      if (!ptr.moved) return; ptr.moved = false;
      const vh = innerHeight;
      for (const m of mags) {
        const r = m.el.getBoundingClientRect();
        if (r.bottom < -60 || r.top > vh + 60) { m.tx = m.ty = 0; m.tbo = 0; continue; }
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = ptr.x - cx, dy = ptr.y - cy;
        const near = Math.abs(dx) < r.width / 2 + 44 && Math.abs(dy) < r.height / 2 + 36;
        m.tx = near ? clamp(dx * .18, -8, 8) : 0; m.ty = near ? clamp(dy * .26, -6, 6) : 0;
        const inside = Math.abs(dx) <= r.width / 2 && Math.abs(dy) <= r.height / 2;
        m.tbo = inside ? 1 : 0;
        if (near) { m.tbx = clamp((ptr.x - r.left) / r.width * 100, -10, 110); m.tby = clamp((ptr.y - r.top) / r.height * 100, -20, 120); }
      }
    });
  }

  /* ---------- parallax ---------- */
  const deps = reduce ? [] : [...document.querySelectorAll('[data-depth]')].map(el => ({ el, d: +el.dataset.depth }));

  /* ---------- one shared hover light for the card grids ---------- */
  // v8: replaces the per-card cursor gradient (a repaint per pointermove per card, restarting on every card).
  // A single plate springs between cards: critically damped, transform + opacity only, boxes read on enter only.
  const hovers = [];
  if (fine && !reduce) document.querySelectorAll('.glance, .why-grid, .work-grid').forEach(grid => {
    const hl = document.createElement('div'); hl.className = 'hl'; hl.setAttribute('aria-hidden', 'true');
    hl.innerHTML = '<i class="hl-l"></i><i class="hl-m"></i><i class="hl-r"></i>';
    grid.prepend(hl);
    const [L, M, R] = hl.children;
    const H = { grid, hl, L, M, R, on: false, x: 0, y: 0, w: 0, h: 0, o: 0, vx: 0, vy: 0, vw: 0, vh: 0, vo: 0, tx: 0, ty: 0, tw: 0, th: 0, to: 0, h0: 0, idle: true, leaveT: 0 };
    const target = card => {
      const g = grid.getBoundingClientRect(), r = card.getBoundingClientRect();
      H.tx = r.left - g.left + grid.scrollLeft; H.ty = r.top - g.top; H.tw = r.width; H.th = r.height; H.to = 1;
      if (!H.h0) { H.h0 = r.height; H.hl.style.height = r.height + 'px'; }
      if (H.o < .02) { H.x = H.tx; H.y = H.ty; H.w = H.tw; H.h = H.th; H.vx = H.vy = H.vw = H.vh = 0; }   // first entry: appear in place
      H.idle = false; clearTimeout(H.leaveT);
    };
    grid.addEventListener('pointerover', e => { const c = e.target.closest('.gl-card, .why-item, .wk-card'); if (c && grid.contains(c)) target(c); });
    grid.addEventListener('pointerleave', () => { H.leaveT = setTimeout(() => { H.to = 0; H.idle = false; }, 60); });
    grid.addEventListener('focusin', e => { const c = e.target.closest('.gl-card, .why-item, .wk-card'); if (c) target(c); });
    grid.addEventListener('focusout', () => { H.to = 0; H.idle = false; });
    hovers.push(H);
  });
  const W0 = 22;                                  // cap width = card radius
  function springHover(dt) {
    for (const H of hovers) {
      if (H.idle) continue;
      const w = 15, k = w * w, c = 2 * w;           // ω=15 rad/s, ζ=1: no overshoot, ~0.3s to settle
      const sub = Math.max(1, Math.ceil(dt * 120)), h = dt / sub;      // fixed 120Hz sub-steps: same feel at any frame rate
      const st = (p, v, t) => { const a = k * (t - H[p]) - c * H[v]; H[v] += a * h; H[p] += H[v] * h; };
      for (let i = 0; i < sub; i++) { st('x', 'vx', H.tx); st('y', 'vy', H.ty); st('w', 'vw', H.tw); st('h', 'vh', H.th); }
      H.o += (H.to - H.o) * (1 - Math.exp(-dt * (H.to ? 14 : 7)));
      const sy = H.h / (H.h0 || H.h || 1), mid = Math.max(0, H.w - 2 * W0);
      H.hl.style.opacity = H.o.toFixed(3);
      H.hl.style.transform = `translate3d(${H.x.toFixed(2)}px,${H.y.toFixed(2)}px,0) scaleY(${sy.toFixed(4)})`;
      H.M.style.transform = `translate3d(${W0}px,0,0) scaleX(${mid.toFixed(2)})`;
      H.R.style.transform = `translate3d(${(W0 + mid).toFixed(2)}px,0,0)`;
      const still = Math.abs(H.tx - H.x) + Math.abs(H.ty - H.y) + Math.abs(H.tw - H.w) + Math.abs(H.th - H.h) < .05 && Math.abs(H.to - H.o) < .002;
      if (still) H.idle = true;
    }
  }
  NX.hovers = hovers;

  /* ---------- the frame loop ---------- */
  const steps = document.querySelector('.steps');
  const grain = document.querySelector('.grain'), stageEl0 = document.querySelector('.stage');
  const GRAIN = .085, G_HERO = 1.3, G_REST = .75;  // the locked 'New' look: noise7 tile, .085, 200px
  let last = performance.now();
  let visible = !document.hidden;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!visible) return;
    requestAnimationFrame(frame);
    const dt = Math.min(.05, Math.max(0, now - last) / 1000); last = now;
    if (NX.lenis) NX.lenis.raf(now);
    const t = NX.time(now);
    NX.reads.forEach(f => f(now, dt, t));          // 1. read
    sweep(t);                                       // 2. write (from cached boxes only)
    const vh = innerHeight, y = scrollY;
    for (const m of mags) {
      const k = 1 - Math.exp(-dt * 8), kb = 1 - Math.exp(-dt * 6), ko = 1 - Math.exp(-dt * (m.tbo ? 7 : 4));
      m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k;
      if (Math.abs(m.x - m.tx) + Math.abs(m.y - m.ty) > .01 || m.mv) {
        m.mv = Math.abs(m.x - m.tx) + Math.abs(m.y - m.ty) > .01;
        m.el.style.setProperty('--mx-t', m.x.toFixed(2) + 'px'); m.el.style.setProperty('--my-t', m.y.toFixed(2) + 'px');
      }
      if (m.metal && (m.bo > .002 || m.tbo)) {
        m.bx += (m.tbx - m.bx) * kb; m.by += (m.tby - m.by) * kb; m.bo += (m.tbo - m.bo) * ko;
        if (m.bo < .002 && !m.tbo) m.bo = 0;
        const st = m.el.style;
        st.setProperty('--bx', m.bx.toFixed(1) + '%'); st.setProperty('--by', m.by.toFixed(1) + '%'); st.setProperty('--bo', m.bo.toFixed(3));
      }
    }
    for (const p of deps) {
      const b = docBox(p.el.parentElement), top = b.t - y;
      if (top + b.h < -200 || top > vh + 200) continue;
      const v = ((top + b.h / 2 - vh / 2) * -p.d).toFixed(1);
      if (v !== p.v) { p.v = v; p.el.style.setProperty('--py', v + 'px'); }
    }
    springHover(dt);
    if (grain && stageEl0) {                        // grain: heavier over the hero, lighter below (built in; no UI)
      const b = docBox(stageEl0), bottom = b.t + b.h - y;
      let u = clamp((bottom - vh * .15) / vh, 0, 1); u = u * u * (3 - 2 * u);
      const v = (GRAIN * (G_REST + (G_HERO - G_REST) * u)).toFixed(4);
      if (v !== grain._v) { grain._v = v; grain.style.opacity = v; }
    }
    if (steps && !reduce) {
      const top = docBox(steps).t - y, v = clamp((vh * .82 - top) / (vh * .5), 0, 1).toFixed(3);
      if (v !== steps._v) { steps._v = v; steps.style.setProperty('--progress', v); }
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
    const r = mh / 2, cx = mw / 2, cy = mh / 2, bez = r * .5;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const qx = Math.max(Math.abs(x + .5 - cx) - (mw / 2 - r), 0) * Math.sign(x + .5 - cx), qy = y + .5 - cy;
      const len = Math.hypot(qx, qy) || 1e-6, e = r - len;      // distance inside the rim
      const k = clamp(1 - e / bez, 0, 1), s = k * k * (3 - 2 * k) * k;   // refraction rises steeply at the rim
      let dx = qx / len * s, dy = qy / len * s;
      dx -= (x + .5 - cx) / (mw / 2) * .05; dy -= qy / r * .05;     // a little magnification in the body
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
      dm.setAttribute('scale', (h * .26).toFixed(1));
    };
  }

  /* A lens carried between options: follows the finger, stretches with speed,
     settles on a soft spring, and commits on release. Transform/opacity only. */
  function liquid(el, { initial = 0, onCommit = () => {}, onMove = null, onRun = null, links = false } = {}) {
    const lens = el.querySelector('.lg-lens'), opts = [...el.querySelectorAll('.lg-opt')], n = opts.length;
    const scroller = el.parentElement.classList.contains('lg-scroll') ? el.parentElement : null;
    const sizeFilter = refract ? makeFilter(lens) : null;
    let geo = [], sel = initial, x = 0, w = 0, vx = 0, vw = 0, tx = 0, tw = 0, lo = initial < 0 ? 0 : 1, tlo = lo;
    let press = null, drag = false, grab = 0, px = 0, pressAmt = 0, running = false, lastSet = '', lastW = -1, H = 40, elL = 0;
    const measure = () => { geo = opts.map(o => ({ c: o.offsetLeft + o.offsetWidth / 2, w: o.offsetWidth })); H = opts[0].offsetHeight; elL = el.offsetLeft; };
    const setRun = on => { if (on === running) return; running = on; el.classList.toggle('moving', on); onRun && onRun(on); };
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
    const put = (node, k, v) => { const c = node.__v || (node.__v = {}); if (c[k] !== v) { c[k] = v; node.style.setProperty(k, v); } };
    function paint() {
      const sp = reduce ? 0 : Math.min(1, Math.abs(vx) / 1700);
      const sx = 1 + sp * .32 + pressAmt * .07, sy = 1 - sp * .2 + pressAmt * .07;
      if (Math.abs(w - lastW) > .25) { lastW = w; lens.style.width = w.toFixed(1) + 'px'; sizeFilter && sizeFilter(w, H); }
      const s = `translate3d(${(x - w / 2).toFixed(2)}px,0,0) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      if (s !== lastSet) { lens.style.transform = s; lastSet = s; }
      // v7: only touch a custom property when its value really changes (fewer style recalcs while dragging)
      put(lens, '--press', pressAmt.toFixed(3));
      put(lens, '--ang', clamp(vx / 30, -50, 50).toFixed(1) + 'deg');
      put(lens, '--lo', lo.toFixed(3));
      opts.forEach((o, k) => put(o, '--on', (lo * Math.max(0, 1 - Math.abs(x - geo[k].c) / (geo[k].w * .9))).toFixed(2)));
      onMove && onMove(idxF(x), lo);
      if (scroller && (drag || running)) {   // keep the lens in view inside a scrolling track
        const L = elL + x - scroller.scrollLeft, SW = scroller.clientWidth, m = Math.min(90, SW * .2);
        if (L < m) scroller.scrollLeft -= Math.min(18, (m - L) * .25); else if (L > SW - m) scroller.scrollLeft += Math.min(18, (L - SW + m) * .25);
      }
    }
    function tick(now, dt) {
      if (!running) return;
      if (drag) {
        const x0 = x; x += (rubber(px - grab) - x) * (1 - Math.exp(-dt * 30));   // v7: a touch more fluid follow
        vx = vx * .78 + ((x - x0) / Math.max(dt, 1e-3)) * .22;
        w += (widthAt(x) - w) * (1 - Math.exp(-dt * 24));
      } else {
        const k = 220, c = 2 * .7 * Math.sqrt(k), kw = 300, cw = 2 * .82 * Math.sqrt(kw), h = dt / 4;   // soft, slightly elastic settle (v7: a little smoother)
        for (let s = 0; s < 4; s++) { vx += (k * (tx - x) - c * vx) * h; x += vx * h; vw += (kw * (tw - w) - cw * vw) * h; w += vw * h; }
      }
      pressAmt += ((press ? 1 : 0) - pressAmt) * (1 - Math.exp(-dt * 14));
      lo += (tlo - lo) * (1 - Math.exp(-dt * 10));
      if (!drag && !press && Math.abs(tx - x) < .05 && Math.abs(vx) < 2 && Math.abs(tw - w) < .05 && pressAmt < .002 && Math.abs(tlo - lo) < .002) {
        x = tx; w = tw; vx = 0; pressAmt = 0; lo = tlo; setRun(false);
      }
      paint();
    }
    NX.on(tick);
    const go = () => { if (reduce) { x = tx; w = tw; vx = 0; lo = tlo; pressAmt = 0; paint(); return; } setRun(true); };
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
      press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on, lx };
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
        drag = true; el.classList.add('is-drag'); const g0 = press.lx - x; grab = Math.abs(g0) <= w / 2 ? g0 : 0;   // grab the lens where you hold it; elsewhere it comes to the finger
      }
      px = localX(e); go();
    });
    const end = (e, cancel) => {
      if (!press || e.pointerId !== press.id) return;
      const wasDrag = drag, on = press.on;
      press = null; drag = false; el.classList.remove('is-drag');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      if (cancel) { set(sel); return; }
      const proj = x + clamp(vx * .05, -90, 90);           // a flick carries a little further
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
    // external scrub (panel swipe): fractional index in, spring snap out
    const posAt = f => {
      if (f <= 0) return geo[0].c + f * (n > 1 ? geo[1].c - geo[0].c : 60);
      if (f >= n - 1) return geo[n - 1].c + (f - n + 1) * (n > 1 ? geo[n - 1].c - geo[n - 2].c : 60);
      const i = Math.floor(f), u = f - i; return geo[i].c + (geo[i + 1].c - geo[i].c) * u;
    };
    let f0 = 0;
    const scrub = {
      start() { measure(); f0 = sel; drag = true; grab = 0; px = x; el.classList.add('is-drag'); go(); },
      move(df) { if (!drag) return; px = posAt(f0 + df); go(); },
      end(fl = 0) { if (!drag) return; drag = false; el.classList.remove('is-drag'); set(clamp(Math.round(idxF(x) + fl), 0, n - 1), { commit: true }); }
    };
    return { set, get sel() { return sel; }, el, scrub };
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
  // v9: spy over every section in reading order, so the lens rests only on the section you are actually in.
  // Sections without a nav item (Why, FAQ, How to start) fade the lens out instead of leaving it on the previous item.
  const secs = [...document.querySelectorAll('main > section[id]')].filter(s => s.id !== 'top').map(s => ({ s, i: navIds.indexOf('#' + s.id) }));
  if (nav) NX.on(() => {
    if (spyLock) return;
    const y = innerHeight * .42, sc = scrollY; let cur = -1;
    for (const o of secs) { if (docBox(o.s).t - sc <= y) cur = o.i; else break; }
    if (cur !== nav.sel) nav.set(cur);
  });

  /* services switcher: the active panel moves with the lens, frame for frame */
  const panels = [...document.querySelectorAll('.sv-panel')];
  const svLight = document.querySelector('.sv-light');
  const cards = [...document.querySelectorAll('.gl-card[data-go]')];
  panels.forEach(p => p.removeAttribute('hidden'));
  const svEl = document.querySelector('[data-lg="services"]');
  let lastP = -1;
  const switcherEl = document.querySelector('.switcher');
  const services = svEl && liquid(svEl, {
    initial: 0,
    onRun: on => switcherEl && switcherEl.classList.toggle('moving', on),
    onMove: p => {
      if (Math.abs(p - lastP) < .0005) return; lastP = p;
      panels.forEach((el, k) => {
        const d = p - k, a = Math.abs(d), o = reduce ? (a < .5 ? 1 : 0) : Math.pow(clamp(1 - a * 1.7, 0, 1), 1.4);
        if (o < .002 && el.__off) return;                    // v7: panels that stay hidden are not touched
        el.__off = o < .002;
        el.style.setProperty('--o', o.toFixed(3));
        el.style.setProperty('--x', (-d * 90).toFixed(1) + 'px');
        el.classList.toggle('off', o < .002);
      });
      svLight && svLight.style.setProperty('--lx', (-p * 26).toFixed(1) + 'px');
    },
    onCommit: i => {
      panels.forEach((el, k) => { const on = k === i; el.toggleAttribute('inert', !on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); });
      cards.forEach((c, k) => c.classList.toggle('active', k === i));
    }
  });
  /* swipe the panel itself: it drags the lens, the lens drags the panels */
  const stageEl = document.querySelector('.sv-stage');
  if (services && stageEl) {
    let sw = null;
    stageEl.addEventListener('pointerdown', e => {
      if (e.button !== 0 || sw || e.target.closest('a,button')) return;
      sw = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, W: stageEl.clientWidth, hx: [[e.timeStamp, e.clientX]] };
    });
    stageEl.addEventListener('pointermove', e => {
      if (!sw || e.pointerId !== sw.id) return;
      const dx = e.clientX - sw.x0, dy = e.clientY - sw.y0;
      if (!sw.on) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
        if (Math.abs(dx) < 8) return;
        sw.on = true; try { stageEl.setPointerCapture(e.pointerId); } catch (_) {}
        stageEl.classList.add('swiping'); getSelection && getSelection().removeAllRanges();
        services.scrub.start();
      }
      sw.hx.push([e.timeStamp, e.clientX]); if (sw.hx.length > 6) sw.hx.shift();
      services.scrub.move(-dx / (sw.W * .6));
    });
    const swEnd = e => {
      if (!sw || e.pointerId !== sw.id) return;
      const s = sw; sw = null;
      if (!s.on) return;
      stageEl.classList.remove('swiping');
      try { stageEl.releasePointerCapture(e.pointerId); } catch (_) {}
      const a = s.hx[0], b = s.hx[s.hx.length - 1], v = (b[1] - a[1]) / Math.max(16, b[0] - a[0]) * 1000;   // px/s
      services.scrub.end(clamp(-v / s.W * .35, -1, 1) * (Math.abs(v) > 250 ? 1 : 0));
    };
    stageEl.addEventListener('pointerup', swEnd);
    stageEl.addEventListener('pointercancel', swEnd);
    stageEl.addEventListener('dragstart', e => e.preventDefault());
  }
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
  const article = s => ({ 'AI assistant': 'an AI assistant', 'Video editing': 'a video edit', 'Social media': 'social media', 'Website': 'a website or web app', 'SEO': 'an SEO project', 'Shopify store': 'a Shopify store', 'Brand kit': 'a brand kit', 'Email marketing': 'email marketing', 'Automation': 'an automation', 'Bot': 'a bot', 'Scraping': 'a scraping project', 'Web app': 'a web app' }[s] || 'your project');
  cEl && cBtn && liquid(cEl, {
    initial: 0,
    onCommit: (i, o) => {
      const s = o.dataset.subj, lbl = cBtn.querySelector('.lbl');
      cBtn.href = `mailto:nexusbuild@mail.grokbot.com?subject=${encodeURIComponent(s + ' project')}`;
      if (reduce) { lbl.textContent = 'Email about ' + article(s); return; }
      lbl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        lbl.textContent = 'Email about ' + article(s);
        lbl.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
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

