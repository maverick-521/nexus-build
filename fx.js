/* Grain assembly v5: titles and cards condense from grains, then the real element appears
   exactly underneath them. Rules that keep the sketch and the solid in the same place:
   - fx elements and their ancestors never transform during a reveal (opacity / mask only);
   - targets are sampled after fonts load, from the element's live layout box;
   - every frame the grains are drawn relative to the element's live box (read phase), so
     Lenis scroll, resize and DPR changes can't shift them;
   - the solid only appears where the grains have already landed (to within a fraction of a pixel). */
(() => {
  const NX = window.NX; if (!NX || NX.reduce) return;
  const root = document.documentElement;
  const cv = document.getElementById('fx'); if (!cv) return;
  const g = cv.getContext('2d');
  const mobile = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  let DPR = 1, W = 0, H = 0;
  const size = () => { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); dirty = true; };
  let dirty = true;
  size();
  root.classList.add('fx');
  const { expoOut, clamp } = NX;
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let rnd = 12345; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;

  /* ---- glyphs, drawn exactly where the browser laid out each word ---- */
  function sampleText(el) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const w = Math.ceil(r.width), h = Math.ceil(r.height);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing;
    if ('fontKerning' in x) x.fontKerning = 'normal';
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
        x.fillText(m[0], rr.left - r.left, rr.top - r.top + (rr.height - (asc + desc)) / 2 + asc);
      }
    }
    const d = x.getImageData(0, 0, w, h).data, pts = [];
    const step = mobile ? 2.5 : 2.0, cap = mobile ? 2800 : 7000;
    for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) {
      const jx = xx + rand() * step, jy = yy + rand() * step;
      if (d[((jy | 0) * w + (jx | 0)) * 4 + 3] > 110) pts.push(jx, jy);
    }
    let out = pts;
    if (pts.length / 2 > cap) { const keep = cap / (pts.length / 2); out = []; for (let i = 0; i < pts.length; i += 2) if (rand() < keep) out.push(pts[i], pts[i + 1]); }
    return { pts: out, w, h, r };
  }
  /* ---- a card's rounded edge (on the 1px border line) plus light dust near its top ---- */
  function sampleFrame(el) {
    const r = el.getBoundingClientRect(), w = r.width, h = r.height;
    const rad = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 20, w / 2, h / 2);
    const pts = [], per = 2 * (w + h - 4 * rad) + 2 * Math.PI * rad, step = mobile ? 3.0 : 2.2;
    const i0 = .5;                       // centre of the 1px hairline
    const at = s => {
      const L1 = w - 2 * rad, L2 = h - 2 * rad, q = Math.PI * rad / 2, R = rad - i0;
      if (s < L1) return [rad + s, i0]; s -= L1;
      if (s < q) { const a = -Math.PI / 2 + s / rad; return [w - rad + Math.cos(a) * R, rad + Math.sin(a) * R]; } s -= q;
      if (s < L2) return [w - i0, rad + s]; s -= L2;
      if (s < q) { const a = s / rad; return [w - rad + Math.cos(a) * R, h - rad + Math.sin(a) * R]; } s -= q;
      if (s < L1) return [w - rad - s, h - i0]; s -= L1;
      if (s < q) { const a = Math.PI / 2 + s / rad; return [rad + Math.cos(a) * R, h - rad + Math.sin(a) * R]; } s -= q;
      if (s < L2) return [i0, h - rad - s]; s -= L2;
      const a = Math.PI + s / rad; return [rad + Math.cos(a) * R, rad + Math.sin(a) * R];
    };
    for (let s = 0; s < per; s += step) { const [x, y] = at(s + rand() * step); pts.push(x, y); }
    const dust = Math.min(mobile ? 200 : 480, (w * h) / 1500);
    for (let i = 0; i < dust; i++) pts.push(rad * .5 + rand() * (w - rad), 6 + Math.pow(rand(), 1.8) * h * .4);
    return { pts, w, h, r };
  }

  const items = [], active = new Set();
  const DUR = 1.0, LAND = .72;          // grains are within ~1px of their target by u = LAND
  function build(it) {
    const s = it.type === 'text' ? sampleText(it.el) : sampleFrame(it.el);
    const n = s.pts.length / 2, P = new Float32Array(n * 8);
    const spread = it.type === 'text' ? 1 : .75;
    for (let i = 0; i < n; i++) {
      const tx = s.pts[i * 2], ty = s.pts[i * 2 + 1], fx = clamp(tx / s.w, 0, 1);
      P[i * 8] = tx; P[i * 8 + 1] = ty;
      P[i * 8 + 2] = (-60 - rand() * 150) * spread;                 // drift in from the left
      P[i * 8 + 3] = ((rand() - .5) * 90 + (rand() - .5) * 30) * spread;
      P[i * 8 + 4] = fx * .35 + rand() * .10;                       // delay: left lands first, like the hero
      P[i * 8 + 5] = .62 + rand() * .5;                             // brightness
      P[i * 8 + 6] = rand() * 6.283;                                // swirl phase
      P[i * 8 + 7] = rand() < .14 ? (rand() < .3 ? 2 : 1) : 0;      // 0 silver, 1 sage whisper, 2 pale spark
    }
    it.P = P; it.n = n; it.w = s.w; it.h = s.h;
  }
  function start(it, delay) {
    if (it.state) return;
    it.state = 'run'; it.t0 = performance.now() + delay * 1000;
    try { build(it); } catch (e) { finish(it); return; }
    active.add(it);
  }
  function finish(it) {
    it.state = 'done'; active.delete(it); dirty = true;
    const s = it.el.style;
    if (it.type === 'text') { s.removeProperty('--gx'); it.el.classList.add('fx-done'); }
    else { s.removeProperty('--gf'); s.removeProperty('--gc'); it.el.classList.add('fx-done'); }
  }
  // resize: re-sample whatever is mid-reveal so the targets match the new layout
  addEventListener('resize', () => { size(); active.forEach(it => { try { build(it); } catch (e) { finish(it); } }); }, { passive: true });

  document.querySelectorAll('.fx-text').forEach(el => { el.style.setProperty('--gx', '0'); items.push({ el, type: 'text' }); });
  document.querySelectorAll('.fx-frame').forEach(el => { el.style.setProperty('--gf', '0'); el.style.setProperty('--gc', '0'); items.push({ el, type: 'frame' }); });

  let batch = [], batchT = 0;
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const it = items.find(i => i.el === e.target);
      if (it) batch.push({ it, r: e.boundingClientRect });
    });
    clearTimeout(batchT);
    batchT = setTimeout(() => {
      batch.sort((a, b) => (a.r.top - b.r.top) || (a.r.left - b.r.left));
      batch.forEach((b, k) => start(b.it, k * .12));
      batch = [];
    }, 30);
  }, { threshold: .22, rootMargin: '0px 0px -4% 0px' });
  // sample only once the real fonts are in, so glyph targets match the rendered text
  const go = () => items.forEach(it => io.observe(it.el));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);

  const COL = ['#e9ebed', '#a9c2b7', '#f3f5f6'];   // silver, a whisper of sage, pale spark
  const dbg = window.__fx = { items, active, at: null };   // `at` freezes reveal time (s) for alignment checks

  // read phase: live boxes of everything mid-reveal
  NX.read(now => { for (const it of active) it.r = it.el.getBoundingClientRect(); });
  NX.on(now => {
    if (!active.size) { if (dirty) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); dirty = false; } return; }
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H); dirty = true;
    for (const it of active) {
      const tt = dbg.at != null ? dbg.at : (now - it.t0) / 1000;
      if (tt < 0) continue;
      const r = it.r || it.el.getBoundingClientRect();
      const P = it.P, n = it.n, text = it.type === 'text';
      // the solid appears only where grains have landed
      const front = (tt - .10 - DUR * LAND) / .35;                   // landed fraction of the width
      if (text) it.el.style.setProperty('--gx', clamp((front + .125) / 1.25, 0, 1).toFixed(3));
      else {
        it.el.style.setProperty('--gf', sm(.45 + DUR * LAND, .95 + DUR * LAND, tt).toFixed(3));
        it.el.style.setProperty('--gc', expoOut(clamp((tt - 1.25) / .8, 0, 1)).toFixed(3));
      }
      if (dbg.at == null && tt > 2.4) { finish(it); continue; }
      if (r.bottom < -40 || r.top > H + 40) continue;
      for (let c = 0; c < 3; c++) {
        g.fillStyle = COL[c];
        for (let i = 0; i < n; i++) {
          const o = i * 8; if (P[o + 7] !== c) continue;
          const u = (tt - P[o + 4]) / DUR;
          if (u <= 0) continue;
          const k = expoOut(Math.min(1, u)), inv = 1 - k;
          const x = r.left + P[o] + P[o + 2] * inv + Math.sin(P[o + 6] + tt * 3.1) * 12 * inv;
          const y = r.top + P[o + 1] + P[o + 3] * inv + Math.cos(P[o + 6] + tt * 2.3) * 9 * inv;
          // fade once the solid under this grain is fully in
          const fxn = P[o] / it.w;
          const full = text ? .10 + DUR * LAND + .35 * (fxn + .25) : .95 + DUR * LAND;
          const fade = 1 - sm(full - .05, full + .4, tt);
          const a = Math.min(1, u * 4) * fade * P[o + 5];
          if (a < .02) continue;
          g.globalAlpha = a;
          const s = text ? 1.4 : 1.25;
          g.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
    }
    g.globalAlpha = 1;
  });
})();
