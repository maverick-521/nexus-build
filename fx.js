/* Grain assembly v7 (lighter: capped grains, one draw pass, max 4 at once, solid hairline frames): titles and cards condense from grains, then the real element appears
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
    const step = mobile ? 2.8 : 2.4, cap = mobile ? 1500 : 3200;
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
    const dust = Math.min(mobile ? 60 : 140, (w * h) / 3000);
    for (let i = 0; i < dust; i++) pts.push(rad * .5 + rand() * (w - rad), 6 + Math.pow(rand(), 1.8) * h * .4);
    return { pts, w, h, r, at, per, rad };
  }

  const items = [], active = new Set();
  const DUR = .8, LAND = .72, MAXA = 4, END = 1.75;   // MAXA: concurrent load (a title = 1, a card frame = .4)
  const cost = it => it.type === 'text' ? 1 : .4;
  let load = 0;          // grains are within ~1px of their target by u = LAND
  function build(it) {
    const s = it.type === 'text' ? sampleText(it.el) : sampleFrame(it.el);
    const n = s.pts.length / 2, P = new Float32Array(n * 8);
    const spread = it.type === 'text' ? 1 : .75;
    // colour class first, then sort so each class is one contiguous run (one fillStyle per run)
    const cls = new Uint8Array(n); for (let i = 0; i < n; i++) cls[i] = rand() < .16 ? (rand() < .3 ? 2 : 1) : 0;
    const ord = [...Array(n).keys()].sort((a, b) => cls[a] - cls[b]);
    it.runs = [0, 0, 0, n]; for (let i = 0; i < n; i++) { if (cls[ord[i]] >= 1 && !it.runs[1]) it.runs[1] = i; if (cls[ord[i]] >= 2 && !it.runs[2]) it.runs[2] = i; }
    if (!it.runs[1]) it.runs[1] = n; if (!it.runs[2]) it.runs[2] = n;
    for (let q = 0; q < n; q++) {
      const i = q, src = ord[q];
      const tx = s.pts[src * 2], ty = s.pts[src * 2 + 1], fx = clamp(tx / s.w, 0, 1);
      P[i * 8] = tx; P[i * 8 + 1] = ty;
      P[i * 8 + 2] = (-60 - rand() * 150) * spread;                 // drift in from the left
      P[i * 8 + 3] = ((rand() - .5) * 90 + (rand() - .5) * 30) * spread;
      P[i * 8 + 4] = fx * .35 + rand() * .10;                       // delay: left lands first, like the hero
      P[i * 8 + 5] = .7 + rand() * .45;                             // brightness
      P[i * 8 + 6] = rand() * 6.283;                                // swirl phase
      P[i * 8 + 7] = cls[src];                                     // 0 silver-blue, 1 ice sapphire, 2 pale spark
    }
    it.P = P; it.n = n; it.w = s.w; it.h = s.h; it.at = s.at; it.per = s.per; it.rad = s.rad;
  }
  const queue = [];
  function start(it, delay) {
    if (it.state) return;
    if (load + cost(it) > MAXA + .01) { if (!queue.includes(it)) queue.push(it); return; }
    it.state = 'run'; load += cost(it); it.t0 = performance.now() + delay * 1000;
    active.add(it);
    try { build(it); } catch (e) { finish(it); return; }
  }
  function finish(it) {
    if (it.state === 'done') return;
    if (active.delete(it)) load = Math.max(0, load - cost(it));
    it.state = 'done'; dirty = true;
    const s = it.el.style;
    if (it.type === 'text') { s.removeProperty('--gx'); it.el.classList.add('fx-done'); }
    else { s.removeProperty('--gf'); s.removeProperty('--gc'); it.el.classList.add('fx-done'); }
    it.P = null;
    while (queue.length && load + cost(queue[0]) <= MAXA + .01) start(queue.shift(), 0);
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
      batch.forEach((b, k) => start(b.it, Math.min(k, 6) * .07));
      batch = [];
    }, 30);
  }, { threshold: .22, rootMargin: '0px 0px -4% 0px' });
  // sample only once the real fonts are in, so glyph targets match the rendered text
  const go = () => items.forEach(it => io.observe(it.el));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);

  const COL = ['#e6eef8', '#9fc4e6', '#f5f8fc'];   // silver-blue, ice sapphire, pale spark
  // a soft ice-blue head for the hairline trace (pre-rendered once)
  const head = document.createElement('canvas'); head.width = head.height = 32;
  { const h = head.getContext('2d'), gr = h.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(235,244,255,.95)'); gr.addColorStop(.25, 'rgba(169,203,232,.45)'); gr.addColorStop(1, 'rgba(169,203,232,0)'); h.fillStyle = gr; h.fillRect(0, 0, 32, 32); }
  const setv = (it, k, v) => { if (it['_' + k] !== v) { it['_' + k] = v; it.el.style.setProperty(k, v); } };
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
      const front = (tt - .10 - DUR * LAND) / .3;                    // landed fraction of the width
      if (text) setv(it, '--gx', clamp((front + .125) / 1.25, 0, 1).toFixed(2));
      else {
        setv(it, '--gf', sm(.3 + DUR * LAND, .7 + DUR * LAND, tt).toFixed(2));
        setv(it, '--gc', expoOut(clamp((tt - .95) / .6, 0, 1)).toFixed(2));
      }
      if (dbg.at == null && tt > END) { finish(it); continue; }
      if (r.bottom < -40 || r.top > H + 40) continue;
      if (!text) {
        // solid hairline traced clockwise from the top-left, with a soft travelling head; hands over to the CSS rim
        const prog = expoOut(clamp((tt - .05) / (DUR * .95), 0, 1)), fade = 1 - sm(.55 + DUR * LAND, 1.0 + DUR * LAND, tt);
        if (fade > .01) {
          const w = it.w, h = it.h, rad = it.rad;
          g.globalAlpha = .55 * fade; g.strokeStyle = '#c4dcf5'; g.lineWidth = 1;
          g.setLineDash([it.per * prog, it.per + 10]); g.lineDashOffset = 0;
          g.beginPath();
          if (g.roundRect) g.roundRect(r.left + .5, r.top + .5, w - 1, h - 1, rad); else g.rect(r.left + .5, r.top + .5, w - 1, h - 1);
          g.stroke(); g.setLineDash([]);
          if (prog < .995) { const [hx, hy] = it.at(it.per * prog); g.globalAlpha = fade; g.drawImage(head, r.left + hx - 16, r.top + hy - 16); }
        }
      }
      const s = text ? 1.7 : 1.5, hs = s / 2;
      for (let c = 0; c < 3; c++) {
        g.fillStyle = COL[c];
        for (let i = it.runs[c], e = it.runs[c + 1]; i < e; i++) {
          const o = i * 8;
          const u = (tt - P[o + 4]) / DUR;
          if (u <= 0) continue;
          const fxn = P[o] / it.w;
          const full = text ? .10 + DUR * LAND + .3 * (fxn + .25) : .7 + DUR * LAND;
          const fade = 1 - sm(full - .05, full + .3, tt);
          const a = Math.min(1, u * 4) * fade * P[o + 5];
          if (a < .03) continue;
          let x = r.left + P[o], y = r.top + P[o + 1];
          if (u < 1) {
            const k = expoOut(u), inv = 1 - k;
            x += P[o + 2] * inv + Math.sin(P[o + 6] + tt * 3.1) * 12 * inv;
            y += P[o + 3] * inv + Math.cos(P[o + 6] + tt * 2.3) * 9 * inv;
          }
          g.globalAlpha = a;
          g.fillRect(x - hs, y - hs, s, s);
        }
      }
    }
    g.globalAlpha = 1;
  });
})();
