/* Nexus Studio v14: Recent edits reel.
   - Loads nothing until the section is near the viewport (the hero stays untouched).
   - Autoplays muted (playsinline, loop) while about half of it is on screen; pauses off screen.
   - One tap, click or key press anywhere turns sound on: straight away if the reel is on screen,
     otherwise as soon as it scrolls into view. "Tap for sound" does the same with one tap.
   - Sound is only ever heard while the reel is on screen. No fades, volume is always 1.
   - Unmuting happens synchronously inside the gesture handler (click / touchend / keydown),
     which is what iOS Safari and Chrome require. */
(() => {
  const fig = document.querySelector('[data-reel]');
  if (!fig) return;
  const v = fig.querySelector('video');
  const snd = fig.querySelector('.reel-sound');
  const full = fig.querySelector('.reel-full');
  const bar = fig.querySelector('.reel-bar i');
  const marks = [...document.querySelectorAll('.reel-marks button')];

  let loaded = false, inView = false;
  let soundOn = false;     // the visitor wants sound (remembered for this page session)
  let userMuted = false;   // the visitor turned sound off with the button: respect that
  let userPaused = false;  // the visitor paused by tapping the playing reel
  v.playsInline = true; v.loop = true; v.muted = true; v.volume = 1;

  const load = () => {
    if (loaded) return; loaded = true;
    // MP4 (H.264 + AAC) first: Safari/iOS always take it; WebM is the fallback.
    JSON.parse(v.dataset.sources).forEach(o => {
      const s = document.createElement('source'); s.src = o.src; s.type = o.type; v.appendChild(s);
    });
    v.preload = 'auto'; v.load();
  };
  const sync = () => {
    const on = !v.muted && !v.paused;
    snd.setAttribute('aria-pressed', String(on));
    snd.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    fig.classList.toggle('paused', v.paused);
  };
  ['volumechange', 'play', 'pause', 'playing'].forEach(t => v.addEventListener(t, sync));

  const playMuted = () => {
    v.muted = true;
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  };
  /* Sound on, synchronously: call this only from a gesture handler or after one has happened. */
  const playWithSound = () => {
    load();
    v.muted = false; v.volume = 1;
    const p = v.play();
    if (p && p.then) p.then(() => {
      // If the browser still refused sound (it pauses or keeps it muted), fall back to muted.
      if (v.paused) playMuted();
    }, () => { if (inView) playMuted(); });
  };

  /* Visibility: play while ~50% on screen, with sound if the visitor asked for it. */
  const enter = () => {
    if (userPaused) return;
    if (soundOn && !userMuted) playWithSound(); else { load(); playMuted(); }
  };
  const leave = () => { v.pause(); v.muted = true; };  // silent off screen; soundOn is kept

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) load(); }), { rootMargin: '600px 0px' }).observe(fig);
    new IntersectionObserver(es => es.forEach(e => {
      const now = e.isIntersecting && e.intersectionRatio >= 0.5;
      if (now === inView) return;
      inView = now; inView ? enter() : leave();
    }), { threshold: [0, 0.5] }).observe(fig);
  } else { inView = true; enter(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); else if (inView) enter(); });

  /* One idempotent "turn sound on". Never toggles. */
  const enableSound = () => {
    soundOn = true; userMuted = false; userPaused = false;
    if (inView) { playWithSound(); return; }
    // Off screen: nothing audible now. Prime the element inside this gesture so a later
    // play() with sound is allowed on iOS (play then pause straight away, still muted).
    load();
    if (v.paused) { v.muted = true; const p = v.play(); v.pause(); if (p && p.catch) p.catch(() => {}); }
  };

  /* Any tap, click or key press on the page (outside the reel) turns sound on.
     'click' and 'touchend' are user-activation events on iOS, Android and desktop;
     touchstart / pointerdown are not, so they are not used. */
  const onGesture = e => {
    if (userMuted) return;
    if (e.target && e.target.closest && e.target.closest('[data-reel]')) return; // the reel's own controls handle it
    if (soundOn && (!inView || (!v.muted && !v.paused))) return;               // already on
    enableSound();
  };
  ['click', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, onGesture, true));

  /* Reel controls. Each stops propagation so nothing else handles the same tap. */
  snd.addEventListener('click', e => {
    e.stopPropagation();
    if (v.muted || v.paused) enableSound();           // first tap: sound on, no toggle
    else { userMuted = true; soundOn = false; v.muted = true; } // tap again while audible: mute
  });
  v.addEventListener('click', e => {
    e.stopPropagation();
    if (v.muted || v.paused) { enableSound(); return; } // tap the reel: sound on
    userPaused = true; v.pause();                        // tap while audible: pause
  });
  full.addEventListener('click', e => {
    e.stopPropagation(); enableSound();
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  });
  marks.forEach(b => b.addEventListener('click', () => {
    load(); const t = +b.dataset.t; userPaused = false;
    const go = () => { v.currentTime = t; };
    v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go, { once: true });
    // the page-wide handler already turned sound on (capture phase) if the reel is in view
    if (inView && v.paused) (soundOn && !userMuted) ? playWithSound() : playMuted();
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
  sync();
})();
