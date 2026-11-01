/* Nexus Studio v13: Recent edits reel.
   Loads nothing until the section is near the viewport (the hero stays untouched).
   Autoplays (playsinline, loop) while about half of it is on screen, pauses when it leaves.
   Sound: it first tries to play with sound. If the browser blocks that, it plays muted with
   "Tap for sound" showing. The visitor's first tap, click or key press anywhere unlocks sound,
   but the reel is only ever audible while it is on screen. Audio fades in and out (~200ms). */
(() => {
  const fig = document.querySelector('[data-reel]');
  if (!fig) return;
  const v = fig.querySelector('video');
  const snd = fig.querySelector('.reel-sound');
  const full = fig.querySelector('.reel-full');
  const bar = fig.querySelector('.reel-bar i');
  const marks = [...document.querySelectorAll('.reel-marks button')];
  let loaded = false, inView = false, wantPlay = true, userMuted = false, soundUnlocked = false, seq = 0, fadeRaf = 0;
  v.playsInline = true; v.loop = true; v.muted = true;

  const load = () => {
    if (loaded) return; loaded = true;
    JSON.parse(v.dataset.sources).forEach(o => {
      const s = document.createElement('source'); s.src = o.src; s.type = o.type; v.appendChild(s);
    });
    v.preload = 'auto'; v.load();
  };
  const setPaused = p => fig.classList.toggle('paused', p);
  const syncSound = () => {
    const on = !v.muted;
    snd.setAttribute('aria-pressed', String(on));
    snd.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  };
  v.addEventListener('volumechange', syncSound);

  /* ~200ms volume fade (iOS ignores volume, so there it is a plain mute/unmute). */
  const fade = (to, done) => {
    cancelAnimationFrame(fadeRaf);
    const from = v.volume, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 200);
      try { v.volume = from + (to - from) * k; } catch (e) {}
      if (k < 1) fadeRaf = requestAnimationFrame(step); else if (done) done();
    };
    fadeRaf = requestAnimationFrame(step);
  };
  const unmute = () => { if (!v.muted) return; try { v.volume = 0; } catch (e) {} v.muted = false; fade(1); };

  const playMuted = my => { if (my !== seq) return; v.muted = true; const q = v.play(); if (q && q.catch) q.catch(() => setPaused(true)); };
  /* In view: with sound if unlocked (or if the browser allows it), muted otherwise. */
  const tryPlay = () => {
    load(); const my = ++seq;
    if (userMuted) return playMuted(my);
    if (!v.muted && !v.paused) return;
    try { v.volume = 0; } catch (e) {}
    v.muted = false;
    const p = v.play();
    if (p && p.then) p.then(() => { if (my === seq) fade(1); }, () => playMuted(my));
    else fade(1);
  };
  /* Out of view: fade out, then pause, so it is never heard off screen. */
  const stop = () => {
    const my = ++seq;
    if (v.paused) return;
    if (v.muted) { v.pause(); return; }
    fade(0, () => { if (my === seq) { v.pause(); v.muted = true; try { v.volume = 1; } catch (e) {} } });
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) load(); }), { rootMargin: '600px 0px' }).observe(fig);
    new IntersectionObserver(es => es.forEach(e => {
      inView = e.isIntersecting && e.intersectionRatio >= 0.5;
      if (inView && wantPlay) tryPlay(); else if (!inView) stop();
    }), { threshold: [0, 0.5] }).observe(fig);
  } else { load(); inView = true; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (inView && wantPlay) tryPlay(); });

  v.addEventListener('play', () => setPaused(false));
  v.addEventListener('pause', () => setPaused(true));

  /* First gesture anywhere unlocks sound. Inside the gesture the reel is played muted
     (that is what lets later play() calls carry sound on iOS and Android); it only becomes
     audible if it is on screen. Taps on the reel itself are handled by its own controls. */
  const GESTURES = ['pointerdown', 'touchstart', 'click', 'keydown'];
  const unlock = e => {
    if (soundUnlocked) return off();
    if (e && e.target && e.target.closest && e.target.closest('[data-reel]')) return;
    const ua = navigator.userActivation;
    if (ua && !ua.isActive) return; /* e.g. touchstart: wait for the touchend/click that counts */
    soundUnlocked = true; off();
    load();
    if (inView && wantPlay && !userMuted) {
      seq++; unmute(); const p = v.play(); if (p && p.catch) p.catch(() => playMuted(seq));
    } else if (v.paused) {
      const my = ++seq; v.muted = true;
      const p = v.play();
      if (p && p.then) p.then(() => { if (my === seq && !inView) v.pause(); }, () => {});
    }
  };
  const off = () => GESTURES.forEach(t => document.removeEventListener(t, unlock, true));
  GESTURES.forEach(t => document.addEventListener(t, unlock, { capture: true, passive: true }));

  /* Tapping the reel or its button unlocks and unmutes. */
  const soundOn = () => {
    soundUnlocked = true; off(); userMuted = false; wantPlay = true; seq++;
    unmute(); const p = v.play(); if (p && p.catch) p.catch(() => {});
  };
  snd.addEventListener('click', e => {
    e.stopPropagation();
    if (v.muted || v.paused) soundOn(); else { userMuted = true; fade(0, () => { v.muted = true; try { v.volume = 1; } catch (er) {} }); }
  });
  v.addEventListener('click', () => {
    if (v.muted || v.paused) { soundOn(); return; }
    wantPlay = false; stop();
  });
  full.addEventListener('click', e => {
    e.stopPropagation(); load(); soundOn();
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
