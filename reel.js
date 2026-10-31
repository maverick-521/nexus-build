/* Nexus Studio v12i: Recent edits reel.
   Loads nothing until the section is near the viewport (the hero stays untouched),
   plays muted only while on screen, tap for sound, button for full screen.
   Reduced motion: poster only, plays on request. */
(() => {
  const fig = document.querySelector('[data-reel]');
  if (!fig) return;
  const v = fig.querySelector('video');
  const snd = fig.querySelector('.reel-sound');
  const full = fig.querySelector('.reel-full');
  const play = fig.querySelector('.reel-play');
  const bar = fig.querySelector('.reel-bar i');
  const marks = [...document.querySelectorAll('.reel-marks button')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let loaded = false, inView = false, wantPlay = !reduce;

  const load = () => {
    if (loaded) return; loaded = true;
    JSON.parse(v.dataset.sources).forEach(o => {
      const s = document.createElement('source'); s.src = o.src; s.type = o.type; v.appendChild(s);
    });
    v.preload = 'auto'; v.load();
  };
  const setPaused = p => fig.classList.toggle('paused', p);
  const tryPlay = () => { load(); const p = v.play(); if (p && p.catch) p.catch(() => setPaused(true)); };
  setPaused(reduce);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) load(); }), { rootMargin: '600px 0px' }).observe(fig);
    new IntersectionObserver(es => es.forEach(e => {
      inView = e.isIntersecting;
      if (inView && wantPlay) tryPlay(); else if (!inView) v.pause();
    }), { threshold: 0.45 }).observe(fig);
  } else { load(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else if (inView && wantPlay) tryPlay(); });

  v.addEventListener('play', () => setPaused(false));
  v.addEventListener('pause', () => setPaused(true));

  const setSound = on => {
    v.muted = !on; snd.setAttribute('aria-pressed', String(on));
    snd.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  };
  snd.addEventListener('click', e => { e.stopPropagation(); const on = v.muted; setSound(on); if (on) { wantPlay = true; tryPlay(); } });
  v.addEventListener('click', () => {
    if (v.paused) { wantPlay = true; tryPlay(); return; }
    if (v.muted) { setSound(true); v.currentTime = 0; } else { v.pause(); wantPlay = false; }
  });
  play.addEventListener('click', () => { wantPlay = true; tryPlay(); });
  full.addEventListener('click', e => {
    e.stopPropagation(); load(); setSound(true); wantPlay = true; tryPlay();
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  });
  marks.forEach(b => b.addEventListener('click', () => {
    load(); const t = +b.dataset.t;
    const go = () => { v.currentTime = t; wantPlay = true; tryPlay(); };
    v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go, { once: true });
  }));

  let raf = 0;
  const tick = () => {
    raf = 0;
    if (v.duration) {
      bar.style.transform = `scaleX(${v.currentTime / v.duration})`;
      let k = -1; marks.forEach((b, i) => { if (v.currentTime >= +b.dataset.t) k = i; });
      marks.forEach((b, i) => b.parentNode.classList.toggle('now', i === k && !v.paused));
    }
  };
  v.addEventListener('timeupdate', () => { if (!raf) raf = requestAnimationFrame(tick); });
})();
