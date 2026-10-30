/* Grain assembly: section titles gather from grains, cards condense from particles.
   Same language as the hero: grains drift in from the left on the expo-out curve,
   staggered by x, and the real element is unveiled behind them. 2D canvas, one loop. */
(() => {
  const NX = window.NX; if (!NX || NX.reduce) return;
  const root = document.documentElement;
  const cv = document.getElementById('fx'); if (!cv) return;
  const g = cv.getContext('2d');
  const mobile = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); };
  size(); addEventListener('resize', size);
  root.classList.add('fx');
  const { expoOut, clamp } = NX;
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let rnd = 12345; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;

  /* ---- sample a heading's glyphs exactly where the browser laid them out ---- */
  function sampleText(el) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const w = Math.ceil(r.width), h = Math.ceil(r.height);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing;
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node; (node = walker.nextNode());) {
      const s = node.textContent; const re = /\S+/g; let m;
      while ((m = re.exec(s))) {
        range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
        const rr = range.getClientRects()[0]; if (!rr) continue;
        const mt = x.measureText(m[0]);
        const asc = mt.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * .9;
        const desc = mt.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * .22;
        const base = rr.top - r.top + (rr.height - (asc + desc)) / 2 + asc;
        x.fillText(m[0], rr.left - r.left, base);
      }
    }
    const d = x.getImageData(0, 0, w, h).data, pts = [];
    const step = mobile ? 2.6 : 2.1, cap = mobile ? 2600 : 6500;
    for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) {
      const jx = xx + rand() * step, jy = yy + rand() * step;
      const a = d[((jy | 0) * w + (jx | 0)) * 4 + 3];
      if (a > 110) pts.push(jx, jy);
    }
    // thin evenly if above the cap
    let out = pts;
    if (pts.length / 2 > cap) { const keep = cap / (pts.length / 2); out = []; for (let i = 0; i < pts.length; i += 2) if (rand() < keep) out.push(pts[i], pts[i + 1]); }
    return { pts: out, w, h };
  }
  /* ---- a card's rounded edge, plus a faint dust of its body ---- */
  function sampleFrame(el) {
    const r = el.getBoundingClientRect(), w = r.width, h = r.height;
    const rad = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 20, w / 2, h / 2);
    const pts = [], per = 2 * (w + h - 4 * rad) + 2 * Math.PI * rad, step = mobile ? 3.2 : 2.4;
    const at = s => {         // point on the rounded-rect perimeter at arc length s (clockwise from top-left straight)
      const L1 = w - 2 * rad, L2 = h - 2 * rad, q = Math.PI * rad / 2;
      if (s < L1) return [rad + s, 0]; s -= L1;
      if (s < q) { const a = -Math.PI / 2 + s / rad; return [w - rad + Math.cos(a) * rad, rad + Math.sin(a) * rad]; } s -= q;
      if (s < L2) return [w, rad + s]; s -= L2;
      if (s < q) { const a = s / rad; return [w - rad + Math.cos(a) * rad, h - rad + Math.sin(a) * rad]; } s -= q;
      if (s < L1) return [w - rad - s, h]; s -= L1;
      if (s < q) { const a = Math.PI / 2 + s / rad; return [rad + Math.cos(a) * rad, h - rad + Math.sin(a) * rad]; } s -= q;
      if (s < L2) return [0, h - rad - s]; s -= L2;
      const a = Math.PI + s / rad; return [rad + Math.cos(a) * rad, rad + Math.sin(a) * rad];
    };
    for (let s = 0; s < per; s += step) { const [x, y] = at(s + rand() * step); pts.push(x, y); }
    const dust = Math.min(mobile ? 220 : 520, (w * h) / 1400);
    for (let i = 0; i < dust; i++) pts.push(rand() * w, rand() * h * .35);   // light pools near the top edge
    return { pts, w, h };
  }

  const items = [];
  function build(it) {
    const s = it.type === 'text' ? sampleText(it.el) : sampleFrame(it.el);
    const n = s.pts.length / 2, P = new Float32Array(n * 7);
    for (let i = 0; i < n; i++) {
      const tx = s.pts[i * 2], ty = s.pts[i * 2 + 1], fx = tx / s.w;
      const spread = it.type === 'text' ? 1 : .7;
      P[i * 7] = tx; P[i * 7 + 1] = ty;
      P[i * 7 + 2] = (-120 - rand() * 280) * spread;                       // start offset: drifting in from the left
      P[i * 7 + 3] = (rand() - .5) * 140 * spread + (rand() - .5) * 40;
      P[i * 7 + 4] = fx * .45 + rand() * .18;                              // delay: left lands first, like the hero
      P[i * 7 + 5] = .45 + rand() * .65;                                   // brightness
      P[i * 7 + 6] = rand() * 6.283;                                       // swirl phase
    }
    it.P = P; it.n = n; it.w = s.w;
  }
  const DUR = 1.25;                    // flight time per grain (s), expo-out
  function start(it, delay) {
    if (it.state) return;
    it.state = 'run'; it.t0 = performance.now() + delay * 1000;
    try { build(it); } catch (e) { finish(it); return; }
    active.add(it);
  }
  function finish(it) {
    it.state = 'done'; active.delete(it);
    it.el.style.setProperty(it.type === 'text' ? '--gx' : '--gf', '1');
    if (it.type !== 'text') it.el.style.setProperty('--gc', '1');
  }
  const active = new Set();

  document.querySelectorAll('.fx-text').forEach(el => { el.style.setProperty('--gx', '0'); items.push({ el, type: 'text' }); });
  document.querySelectorAll('.fx-frame').forEach(el => { el.style.setProperty('--gf', '0'); el.style.setProperty('--gc', '0'); items.push({ el, type: 'frame' }); });

  // grouped stagger: siblings entering together are spaced 120ms apart
  let batch = [], batchT = 0;
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const it = items.find(i => i.el === e.target);
      if (it) batch.push(it);
    });
    clearTimeout(batchT);
    batchT = setTimeout(() => {
      batch.sort((a, b) => { const ra = a.el.getBoundingClientRect(), rb = b.el.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
      batch.forEach((it, k) => start(it, k * .12));
      batch = [];
    }, 30);
  }, { threshold: .22, rootMargin: '0px 0px -4% 0px' });
  items.forEach(it => io.observe(it.el));

  // if the hero is still on screen, don't run under it (the stage is sticky)
  NX.on(now => {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!active.size) return;
    for (const it of active) {
      const tt = (now - it.t0) / 1000;
      if (tt < 0) continue;
      const r = it.el.getBoundingClientRect();
      const P = it.P, n = it.n, text = it.type === 'text';
      // the element itself: titles wipe in left→right behind the grains; frames condense
      if (text) it.el.style.setProperty('--gx', clamp((tt - .55) / .75, 0, 1).toFixed(3));
      else {
        it.el.style.setProperty('--gf', expoOut(clamp((tt - .5) / .9, 0, 1)).toFixed(3));
        it.el.style.setProperty('--gc', expoOut(clamp((tt - .8) / .8, 0, 1)).toFixed(3));
      }
      if (tt > 2.6) { finish(it); continue; }
      if (r.bottom < -40 || r.top > H + 40) continue;
      for (let i = 0; i < n; i++) {
        const o = i * 7, u = (tt - P[o + 4]) / DUR;
        if (u <= 0) continue;
        const k = expoOut(Math.min(1, u)), inv = 1 - k;
        const sw = Math.sin(P[o + 6] + tt * 3.1) * 14 * inv;
        const x = r.left + P[o] + P[o + 2] * inv + sw;
        const y = r.top + P[o + 1] + P[o + 3] * inv + Math.cos(P[o + 6] + tt * 2.3) * 10 * inv;
        // grains fade out once the real surface has formed under them
        const land = P[o + 4] + DUR * .45;
        const fade = text ? 1 - sm(land + .15, land + .7, tt) : 1 - sm(1.1 + P[o + 4] * .6, 1.9 + P[o + 4] * .6, tt);
        const a = Math.min(1, u * 5) * fade * P[o + 5];
        if (a < .02) continue;
        g.globalAlpha = a;
        const s = text ? 1.25 : 1.1;
        g.fillStyle = P[o + 5] > 1.0 ? '#ffffff' : '#e3e5ec';
        g.fillRect(x, y, s, s);
      }
    }
    g.globalAlpha = 1;
  });
})();
