/* Sample concepts. Fictional data, running on the shared clock and curve. */
(() => {
  const NX = window.NX; if (!NX) return;
  const { expoOut, easeIO, clamp, reduce } = NX;
  const seen = (el, cb) => new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { rootMargin: '60px' }).observe(el);

  /* ---------- 1. assistant over docs ---------- */
  const log = document.getElementById('chat-log');
  if (log) {
    const SCRIPT = [
      { u: 'Can I return something I already opened?' },
      { a: 'Yes, within 30 days. Opened items are refunded as store credit; unopened items get a full refund to your card.', src: 'returns-policy.pdf · page 2' },
      { u: 'Do you ship to Ireland?' },
      { a: 'We do. Standard delivery to Ireland takes 3–5 working days, and the cost is shown at checkout before you pay.', src: 'shipping-faq.md' }
    ];
    // timeline (s): user msg, typing, stream answer, source chip; loop every 18s (two light cycles)
    const T = [[0.3, 'u', 0], [1.0, 'typing'], [2.2, 'a', 1], [7.6, 'u', 2], [8.3, 'typing'], [9.5, 'a', 3], [16.6, 'fade'], [17.6, 'clear']];
    const LOOP = 18;
    let on = false, t0 = 0, done = 0, cur = null, typing = null;
    const el = (cls, txt) => { const d = document.createElement('div'); d.className = cls; if (txt) d.textContent = txt; return d; };
    const render = () => {
      if (reduce) {     // a still conversation
        SCRIPT.forEach(m => { const d = el('msg ' + (m.u ? 'u' : 'a'), m.u || m.a); if (m.src) d.append(el('src', m.src)); log.append(d); });
        return;
      }
    };
    if (reduce) render();
    else {
      seen(log, v => { if (v && !on) { on = true; t0 = performance.now(); done = 0; } else if (!v && on) { on = false; log.textContent = ''; log.classList.remove('fade'); cur = typing = null; } });
      NX.on(now => {
        if (!on) return;
        let t = (now - t0) / 1000;
        if (t >= LOOP) { t0 += LOOP * 1000; t -= LOOP; done = 0; }
        while (done < T.length && t >= T[done][0]) {
          const [, kind, idx] = T[done++];
          if (kind === 'u') { log.append(el('msg u', SCRIPT[idx].u)); }
          else if (kind === 'typing') { typing = el('msg a typing'); typing.innerHTML = '<i></i><i></i><i></i>'; log.append(typing); }
          else if (kind === 'a') {
            typing && typing.remove(); typing = null;
            const m = SCRIPT[idx], d = el('msg a'); const span = document.createElement('span'); d.append(span); log.append(d);
            cur = { d, span, words: m.a.split(' '), n: 0, start: T[done - 1][0], src: m.src, srcDone: false };
          }
          else if (kind === 'fade') log.classList.add('fade');
          else if (kind === 'clear') { log.textContent = ''; log.classList.remove('fade'); cur = null; }
        }
        if (cur) {
          const k = Math.min(cur.words.length, Math.floor((t - cur.start) / .085) + 1);
          if (k !== cur.n && k > 0) { cur.n = k; cur.span.textContent = cur.words.slice(0, k).join(' '); }
          if (k >= cur.words.length && !cur.srcDone && t - cur.start > cur.words.length * .085 + .35) { cur.srcDone = true; cur.d.append(el('src', cur.src)); cur = null; }
        }
      });
    }
  }

  /* ---------- 2. lead workflow ---------- */
  const flow = document.getElementById('flow');
  if (flow) {
    const NS = 'http://www.w3.org/2000/svg';
    // v7: each wire is sampled once into a lookup table, so packets never call getPointAtLength per frame
    const wires = ['w1', 'w2', 'w3', 'w4'].map(id => { const p = document.getElementById(id), L = p.getTotalLength(), S = 160, lut = new Float32Array((S + 1) * 2);
      for (let i = 0; i <= S; i++) { const q = p.getPointAtLength(i / S * L); lut[i * 2] = q.x; lut[i * 2 + 1] = q.y; }
      return { p, L, S, lut }; });
    const ptAt = (w, e) => { const f = clamp(e, 0, 1) * w.S, i = Math.min(w.S - 1, f | 0), u = f - i, a = i * 2; return [w.lut[a] + (w.lut[a + 2] - w.lut[a]) * u, w.lut[a + 1] + (w.lut[a + 3] - w.lut[a + 1]) * u]; };
    const nodes = ['n0', 'n1', 'n2', 'n3', 'n4'].map(id => document.getElementById(id));
    const pk = document.getElementById('packets'), runsEl = document.getElementById('runs');
    let runs = 126; runsEl.textContent = runs;
    const TRAIL = 7, packets = [];
    const mk = () => Array.from({ length: TRAIL }, (_, j) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', (2.6 - j * .27).toFixed(2)); c.style.opacity = (1 - j / TRAIL) * .95; c.setAttribute('cx', -50); pk.append(c); return c; });
    const hit = n => { n.classList.add('hit'); setTimeout(() => n.classList.remove('hit'), 140); };
    let on = false, lastSlot = -1;
    seen(flow, v => on = v);
    if (reduce) { [1, 2, 3, 4].forEach(i => nodes[i].classList.add('hit')); }
    else NX.on((now, dt, t) => {
      if (!on) return;
      const slot = Math.floor(t / 3);                    // one run every 3s: three per light cycle
      if (slot !== lastSlot) { lastSlot = slot; packets.push({ t: slot * 3, dots: [mk()], stage: 0 }); hit(nodes[0]); }
      for (let i = packets.length - 1; i >= 0; i--) {
        const P = packets[i], u = t - P.t;
        if (P.stage === 0) {
          const k = clamp(u / .95, 0, 1.2);
          P.dots[0].forEach((c, j) => { const pt = ptAt(wires[0], easeIO(clamp(k - j * .035, 0, 1))); c.setAttribute('cx', pt[0].toFixed(1)); c.setAttribute('cy', pt[1].toFixed(1)); });
          if (u >= 1.2) { P.stage = 1; hit(nodes[1]); P.dots[0].forEach(c => c.remove()); P.dots = [mk(), mk(), mk()]; }
        } else {
          const k = clamp((u - 1.55) / .95, 0, 1.2);
          P.dots.forEach((d, b) => d.forEach((c, j) => { const pt = ptAt(wires[b + 1], easeIO(clamp(k - j * .035, 0, 1))); c.setAttribute('cx', pt[0].toFixed(1)); c.setAttribute('cy', pt[1].toFixed(1)); }));
          if (u >= 1.55 + 1.2) { [2, 3, 4].forEach(n => hit(nodes[n])); P.dots.forEach(d => d.forEach(c => c.remove())); packets.splice(i, 1); runsEl.textContent = ++runs; }
        }
      }
    });
  }

  /* ---------- 3. dashboard with a liquid range toggle ---------- */
  const line = document.getElementById('c-line'), area = document.getElementById('c-area'), dot = document.getElementById('c-dot');
  if (line) {
    const N = 28, mkData = (seed, trend, vol) => Array.from({ length: N }, (_, i) => {
      const x = i / (N - 1);
      return .25 + trend * x + Math.sin(i * .9 + seed) * vol + Math.sin(i * .37 + seed * 2) * vol * 1.4 + Math.sin(i * 2.1 + seed * 3) * vol * .4;
    });
    const sets = [mkData(1.3, .38, .045), mkData(2.1, .46, .06), mkData(4.7, .55, .05)];
    const KP = [[312, 14.8, 3.1], [1284, 61.2, 3.4], [3960, 184, 3.6]];
    const k1 = document.getElementById('k1'), k2 = document.getElementById('k2'), k3 = document.getElementById('k3');
    const chart = document.getElementById('chart'), card = chart.closest('.s-dash');
    let p = 1, draw = reduce ? 1 : 0, drawT = 0, shown = false;
    const lerp = (a, b, f) => a + (b - a) * f;
    // the chart's box inside the card is measured on show / resize only, never per frame
    let box = null;
    const measure = () => { const cr = chart.getBoundingClientRect(), dr = card.getBoundingClientRect(); box = { x: cr.left - dr.left, y: cr.top - dr.top, w: cr.width, h: cr.height }; };
    const at = (arr, q) => { const i = clamp(Math.floor(q), 0, arr.length - 2), f = q - i; return arr[i].map((v, j) => typeof v === 'number' ? lerp(v, arr[i + 1][j], f) : v); };
    function render() {
      const q = clamp(p, 0, 2), i = Math.min(1, Math.floor(q)), f = q - i;
      const d = sets[i].map((v, j) => lerp(v, sets[i + 1][j], f));
      const pts = d.map((v, j) => [j / (N - 1) * 600, 190 - clamp(v, 0, 1) * 170 - 6]);
      let s = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let j = 0; j < N - 1; j++) {
        const p0 = pts[Math.max(0, j - 1)], p1 = pts[j], p2 = pts[j + 1], p3 = pts[Math.min(N - 1, j + 2)];
        s += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)},${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      line.setAttribute('d', s); area.setAttribute('d', s + ' L600 190 L0 190 Z');
      line.style.strokeDasharray = '1'; line.setAttribute('pathLength', '1'); line.style.strokeDashoffset = (1 - draw).toFixed(4);
      area.style.opacity = draw.toFixed(3);
      const kp = at(KP, q);
      k1.textContent = Math.round(kp[0] * draw).toLocaleString('en-US');
      k2.textContent = '$' + (kp[1] * draw).toFixed(1) + 'k';
      k3.textContent = (kp[2] * draw).toFixed(1) + '%';
      if (!box) measure();
      const last = pts[N - 1];
      dot.style.setProperty('--dx', (box.x + last[0] / 600 * box.w).toFixed(1) + 'px');
      dot.style.setProperty('--dy', (box.y + last[1] / 190 * box.h).toFixed(1) + 'px');
      dot.style.opacity = draw > .98 ? 1 : 0;
    }
    const rangeEl = document.querySelector('[data-lg="range"]');
    rangeEl && NX.liquid(rangeEl, { initial: 1, onMove: q => { if (Math.abs(q - p) > .0005) { p = q; render(); } } });
    seen(chart, v => { if (v) measure(); if (v && !shown) { shown = true; drawT = performance.now(); } });
    if (!reduce) NX.on(now => { if (shown && draw < 1) { draw = expoOut(clamp((now - drawT - 250) / 1100, 0, 1)); render(); } });
    render();
    addEventListener('resize', () => { measure(); render(); });
  }
})();
