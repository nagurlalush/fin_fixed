/* Animated background (canvas only - UI elements stay static).
   Works on desktop and phones/tablets: DPR aware, touch aware, pauses when tab hidden. */
(function () {
  'use strict';
  var canvas = document.getElementById('bgCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1, frame = 0, running = true;
  var mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
  var COLORS = ['99,102,241', '56,189,248', '168,85,247', '52,211,153'];
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = reduced ? 0.4 : 1; // gentler (never fully off) so it shows on every device
  var particles = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(28, Math.min(90, Math.round((W * H) / 22000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      var vx = (Math.random() - 0.5) * 0.5, vy = (Math.random() - 0.5) * 0.5;
      particles.push({
        x: Math.random() * W, y: Math.random() * H, vx: vx, vy: vy, bvx: vx, bvy: vy,
        r: Math.random() * 1.8 + 0.8, c: COLORS[i % COLORS.length],
        a: Math.random() * 0.4 + 0.25, ph: Math.random() * 6.28, ps: 0.01 + Math.random() * 0.02
      });
    }
  }

  function pointer(e) {
    var t = (e.touches && e.touches[0]) || e;
    mouse.vx = t.clientX - mouse.x; mouse.vy = t.clientY - mouse.y;
    mouse.x = t.clientX; mouse.y = t.clientY;
  }
  window.addEventListener('mousemove', pointer, { passive: true });
  window.addEventListener('touchmove', pointer, { passive: true });
  window.addEventListener('touchend', function () { mouse.x = mouse.y = -9999; }, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden; if (running) loop();
  });

  function glow(x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    if (!running) return;
    frame += speed;
    ctx.clearRect(0, 0, W, H);

    // drifting nebula glows
    var m = Math.min(W, H);
    glow(W * 0.25 + Math.sin(frame * 0.006) * W * 0.08, H * 0.35 + Math.cos(frame * 0.005) * H * 0.08, m * 0.7, '99,102,241', 0.10);
    glow(W * 0.75 + Math.cos(frame * 0.005) * W * 0.08, H * 0.65 + Math.sin(frame * 0.007) * H * 0.08, m * 0.75, '168,85,247', 0.09);
    glow(W * 0.5 + Math.sin(frame * 0.004) * W * 0.1, H * 0.5 + Math.cos(frame * 0.006) * H * 0.1, m * 0.6, '6,182,212', 0.06);

    mouse.vx *= 0.9; mouse.vy *= 0.9;
    var i, j, p, q, dx, dy, d;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
      if (d < 150 && d > 0) {
        var f = (1 - d / 150) * 1.2;
        p.vx += (dx / d) * f * 0.4; p.vy += (dy / d) * f * 0.4;
        ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = 'rgba(' + p.c + ',' + ((1 - d / 150) * 0.35) + ')'; ctx.lineWidth = 1; ctx.stroke();
      }
      p.vx = p.vx * 0.95 + p.bvx * 0.05; p.vy = p.vy * 0.95 + p.bvy * 0.05;
      p.x += p.vx * speed; p.y += p.vy * speed;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;

      var al = Math.max(0.1, p.a + Math.sin(frame * p.ps + p.ph) * 0.15);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + p.c + ',' + al + ')'; ctx.fill();

      for (j = i + 1; j < particles.length; j++) {
        q = particles[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
        if (d < 12000) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(' + p.c + ',' + ((1 - d / 12000) * 0.16) + ')'; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }

  resize();
  loop();
})();
