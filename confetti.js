/* ──────────────────────────────────────────────────────────────
   Konfetti — canvas 2D, bez zależności.
   Port modułu z designu na klasyczny skrypt (window.confettiBurst),
   żeby strona działała także z file:// bez serwera.

   window.confettiBurst(canvas, opts) -> stop()
     opts.colors — tablica kolorów (hex)
     opts.count  — liczba cząstek
     opts.shape  — "rect" (domyślnie) | "square" | "circle"
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  function burst(canvas, opts) {
    opts = opts || {};

    var colors = opts.colors || ['#e8743b', '#f2c14e', '#4c9f8f', '#2e3a4d'];
    var shape = opts.shape || 'rect';
    var count = opts.count || 150;

    var ctx = canvas.getContext('2d');
    if (!ctx) return function () {};

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    // ResizeObserver łapie też zmianę orientacji i chowanie paska adresu
    // na mobile — window.resize potrafi tam nie zadziałać.
    var observer = null;
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }

    var parts = [];
    for (var i = 0; i < count; i++) {
      parts.push({
        x: rnd(0, w),
        y: rnd(-h * 0.5, 0),
        vx: rnd(-0.5, 0.5),
        vy: rnd(1.6, 4.4),
        size: shape === 'square' ? rnd(5, 9) : rnd(4, 8),
        ar: shape === 'rect' ? rnd(1.6, 3.4) : 1,
        rot: rnd(0, Math.PI * 2),
        vr: rnd(-0.09, 0.09),
        color: colors[Math.floor(Math.random() * colors.length)],
        sway: rnd(0.4, 1.4),
        phase: rnd(0, Math.PI * 2)
      });
    }

    var t = 0;
    var raf = 0;
    var finished = false;

    function cleanup() {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', resize);
    }

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      var alive = 0;
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.x += p.vx + Math.sin(t / 26 + p.phase) * p.sway * 0.5;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < h + 40) alive++;

        var fade = Math.max(0, Math.min(1, (h + 40 - p.y) / 160));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * p.ar / 2, -p.size / 2, p.size * p.ar, p.size);
        }
        ctx.restore();
      }

      if (alive > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        finished = true;
        cleanup();
        if (typeof opts.onDone === 'function') opts.onDone();
      }
    }

    raf = requestAnimationFrame(frame);

    // stop() sprząta też listenery — w oryginale zostawały przy
    // przerwaniu animacji przed czasem.
    return function stop() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      cleanup();
    };
  }

  window.confettiBurst = burst;
})();
