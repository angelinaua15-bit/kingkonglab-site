/* Сторінки послуг: тема, меню, поява блоків, форма з частинок у hero, заявка */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 860px)').matches;
  const root = document.documentElement;
  const FX = { light: root.dataset.theme !== 'dark' };

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // ── тема ──
  const themeBtn = $('#themeToggle');
  const setTheme = (t) => {
    root.dataset.theme = t;
    FX.light = t !== 'dark';
    try { localStorage.setItem('kk-theme', t); } catch (e) { /* приватний режим */ }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'dark' ? '#0B1450' : '#F4F6FD';
  };
  themeBtn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (document.startViewTransition && !reduced) {
      const vt = document.startViewTransition(() => setTheme(next));
      vt.ready.then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' },
      )).catch(() => {});
    } else {
      root.classList.add('theme-anim');
      setTheme(next);
      setTimeout(() => root.classList.remove('theme-anim'), 700);
    }
  });

  // ── меню ──
  const nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer');
  const toggleDrawer = (on) => {
    drawer?.classList.toggle('is-on', on);
    burger?.classList.toggle('is-on', on);
    burger?.setAttribute('aria-expanded', String(on));
    drawer?.setAttribute('aria-hidden', String(!on));
    document.body.style.overflow = on ? 'hidden' : '';
    document.body.classList.toggle('menu-open', on);
  };
  burger?.addEventListener('click', () => toggleDrawer(!drawer.classList.contains('is-on')));
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => toggleDrawer(false)));
  let lastS = scrollY;
  const onScroll = () => {
    const y = scrollY;
    nav?.classList.toggle('is-solid', y > 16);
    if (y > lastS + 4 && y > innerHeight * .8 && !drawer?.classList.contains('is-on')) nav?.classList.add('is-away');
    if (y < lastS - 4 || y < 80) nav?.classList.remove('is-away');
    lastS = y;
    const bar = $('#scrollProgress');
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── поява блоків при скролі ──
  const items = $$('[data-rise]');
  if ('IntersectionObserver' in window && !reduced) {
    root.classList.add('rv-on');
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el, i) => {
      // сусіди в одній сітці з'являються по черзі
      const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-rise')) : [];
      el.style.setProperty('--d', `${Math.max(0, sib.indexOf(el)) * 80}ms`);
      io.observe(el);
    });
  }

  // ── FAQ: відкритий лише один ──
  const accs = $$('.acc details');
  accs.forEach((d) => d.addEventListener('toggle', () => { if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; }); }));

  // ── заявка ──
  const form = $('#leadForm');
  const phone = $('#fPhone');
  phone?.addEventListener('focus', () => { if (!phone.value) phone.value = '+380 '; });
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.company.value) return;
    const name = form.name.value.trim();
    const tel = phone.value.trim();
    let ok = true;
    [[form.name, name.length >= 2], [phone, tel.replace(/\D/g, '').length >= 10]].forEach(([input, valid]) => {
      input.parentElement.classList.toggle('is-error', !valid);
      if (!valid) ok = false;
    });
    const status = $('#formStatus');
    if (!ok) { if (status) status.textContent = 'Вкажіть ім\'я та коректний телефон'; return; }
    const service = form.dataset.service || '—';
    const pack = $$('input[name="pack"]:checked', form).map((i) => i.value).join(', ') || '—';
    const body = `Ім'я: ${name}\nТелефон: ${tel}\nПослуга: ${service}\nФормат: ${pack}\n\nЗадача:\n${form.message.value.trim() || '—'}`;
    location.href = `mailto:kingkonglab2024@gmail.com?subject=${encodeURIComponent(`Заявка: ${service} — ${name}`)}&body=${encodeURIComponent(body)}`;
    if (status) status.textContent = 'Дякуємо! Відкриється поштовий клієнт — надішліть лист.';
    form.reset();
  });
  // «Обговорити» → до форми з підсвіткою
  $$('a[href="#leadForm"]').forEach((a) => a.addEventListener('click', (ev) => {
    const f0 = $('#leadForm');
    if (f0) { ev.preventDefault(); toggleDrawer(false); const go = () => scrollTo({ top: f0.getBoundingClientRect().top + scrollY - 80, behavior: reduced ? 'auto' : 'smooth' }); go(); setTimeout(go, 700); }
  }));
  $$('a[href="#leadForm"]').forEach((a) => a.addEventListener('click', () => setTimeout(() => {
    const f = $('#leadForm'); if (!f) return;
    f.classList.remove('is-flash'); void f.offsetWidth; f.classList.add('is-flash');
    if (!mobile) $('#fName')?.focus({ preventScroll: true });
  }, 700)));
  // кнопки пакетів одразу обирають формат у формі
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    const box = $(`input[name="pack"][value="${a.dataset.pick}"]`);
    if (box) box.checked = true;
  }));

  // ── зірки на фоні ──
  const space = $('#space');
  const DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  if (space && !reduced) {
    const ctx = space.getContext('2d');
    const N = mobile ? 50 : 220;
    const D = ['255,255,255', '226,232,255', '255,214,150', '150,170,255'];
    const L = ['11,20,80', '47,75,255', '216,150,31', '90,110,200'];
    let W = 0, H = 0;
    const stars = [];
    const resize = () => { W = innerWidth; H = innerHeight; space.width = W * DPR; space.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    resize(); addEventListener('resize', resize);
    for (let i = 0; i < N; i++) stars.push({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.2, ci: (Math.random() * 4) | 0, tw: Math.random() * 6.3, v: .02 + Math.random() * .06 });
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      const pal = FX.light ? L : D;
      for (const s of stars) {
        const y = ((s.y * H - scrollY * s.v) % H + H) % H;
        const a = (.35 + .35 * Math.sin(now * .002 + s.tw)) * (FX.light ? .5 : 1);
        ctx.fillStyle = `rgba(${pal[s.ci]},${a})`;
        ctx.fillRect(s.x * W, y, s.r, s.r);
      }
    };
    requestAnimationFrame(tick);
  }

  // ── форма послуги з частинок у hero ──
  const canvas = $('#particles');
  const anchor = $('#shapeAnchor');
  if (!canvas || !anchor || reduced || !canvas.getContext) { root.classList.add('no-canvas'); return; }
  const ctx = canvas.getContext('2d');
  const N = mobile ? 650 : 2600;
  const SN = 220;
  const rr = (o, x, y, w, h, r) => { o.beginPath(); if (o.roundRect) o.roundRect(x, y, w, h, r); else o.rect(x, y, w, h); o.stroke(); };
  const line = (o, ...p) => { o.beginPath(); o.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) o.lineTo(p[i], p[i + 1]); o.stroke(); };
  const PAINT = {
    web: (o) => {
      rr(o, 22, 42, 176, 136, 16); line(o, 22, 70, 198, 70);
      [40, 54, 68].forEach((x) => { o.beginPath(); o.arc(x, 56, 3.5, 0, 7); o.fill(); });
      line(o, 44, 94, 116, 94); line(o, 44, 112, 104, 112); line(o, 44, 130, 92, 130);
      rr(o, 44, 146, 50, 16, 8); rr(o, 128, 90, 52, 70, 8);
    },
    plane: (o) => {
      o.save(); o.translate(14, 18); o.scale(8, 8); o.lineWidth = .62;
      o.stroke(new Path2D('M21.4 3.2 2.9 10.4c-1.3.5-1.2 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.5zM8.6 13.2l9.9-6.3c.5-.3.9-.1.5.2l-8.4 7.6-.3 3.6-1.7-5.1z'));
      o.restore();
    },
    chart: (o) => {
      line(o, 26, 188, 196, 188);
      [[40, 40], [80, 72], [120, 104], [160, 138]].forEach(([x, h]) => rr(o, x, 188 - h, 24, h, 5));
      line(o, 34, 128, 80, 100, 116, 110, 178, 40); line(o, 152, 42, 178, 40, 174, 66);
    },
    gem: (o) => {
      o.beginPath(); o.moveTo(70, 42); o.lineTo(150, 42); o.lineTo(188, 88); o.lineTo(110, 192); o.lineTo(32, 88); o.closePath(); o.stroke();
      line(o, 32, 88, 188, 88); line(o, 70, 42, 90, 88, 110, 192); line(o, 150, 42, 130, 88, 110, 192); line(o, 90, 88, 110, 42, 130, 88);
    },
  };
  const paint = PAINT[anchor.dataset.shape] || PAINT.web;
  const off = document.createElement('canvas');
  off.width = off.height = SN;
  const o = off.getContext('2d');
  o.strokeStyle = o.fillStyle = '#fff';
  o.lineCap = o.lineJoin = 'round';
  o.lineWidth = 5;
  paint(o);
  const d = o.getImageData(0, 0, SN, SN).data;
  const pts = [];
  let x0 = SN, x1 = 0, y0 = SN, y1 = 0;
  for (let y = 0; y < SN; y++) for (let x = 0; x < SN; x++) {
    if (d[(y * SN + x) * 4 + 3] > 90) { pts.push(x, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  const bx = (x0 + x1) / 2, by = (y0 + y1) / 2, bs = Math.max(x1 - x0, y1 - y0) || 1;
  const parts = [];
  for (let i = 0; i < N; i++) {
    const j = ((Math.random() * (pts.length / 2)) | 0) * 2;
    const r = Math.random();
    const big = !mobile && Math.random() < .07;
    parts.push({
      u: (pts[j] + (Math.random() - .5) * .8 - bx) / bs, v: (pts[j + 1] + (Math.random() - .5) * .8 - by) / bs, z: (Math.random() - .5) * .14,
      ci: r < .5 ? 0 : r < .8 ? 1 : 2, a: .65 + Math.random() * .35,
      size: big ? 2.3 + Math.random() * 1.5 : 1 + Math.random() * 1.2, big,
      sx: Math.random(), sy: Math.random(), delay: Math.random() * 900, tw: Math.random() * 6.28,
      ex: Math.random() - .5, ey: Math.random() - .5, ox: 0, oy: 0,
    });
  }
  let W = 0, H = 0;
  const resize = () => { W = innerWidth; H = innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  resize(); addEventListener('resize', resize);
  let mouse = { x: -9999, y: -9999 }, mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const t0 = performance.now();
  const draw = (now) => {
    requestAnimationFrame(draw);
    if (document.hidden) return;
    const r = anchor.getBoundingClientRect();
    if (r.bottom < -40 || r.top > H + 40) { ctx.clearRect(0, 0, W, H); return; }
    smx += (mx - smx) * .05; smy += (my - smy) * .05;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, S = r.width * .92;
    const rot = Math.sin(now * .00032) * .26 + smx * .6, cs = Math.cos(rot), sn = Math.sin(rot);
    // при скролі вниз обʼєкт м'яко розсипається
    const leave = Math.min(1, Math.max(0, -r.top / (r.height * .9)));
    const burst = leave * leave * Math.max(W, H) * .5;
    const PAL = FX.light ? ['206,138,20', '11,20,80', '47,75,255'] : ['255,200,112', '240,244,255', '120,148,255'];
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = FX.light ? 'source-over' : 'lighter';
    for (const p of parts) {
      const x3 = p.u * cs + p.z * sn, z3 = -p.u * sn + p.z * cs + p.v * smy * .3;
      const k = 1 / (1 - z3 * .55);
      let tx = cx + x3 * S * k + p.ex * burst, ty = cy + p.v * S * k + p.ey * burst + Math.sin(now * .0016 + p.tw) * 1.2;
      const dx = tx + p.ox - mouse.x, dy = ty + p.oy - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 9000) { const f = (9000 - d2) / 9000 * 3, dl = Math.sqrt(d2) + .01; p.ox += dx / dl * f; p.oy += dy / dl * f; }
      p.ox *= .92; p.oy *= .92;
      tx += p.ox; ty += p.oy;
      const q = Math.min(1, Math.max(0, (now - t0 - p.delay) / 1700)), g = 1 - Math.pow(1 - q, 4);
      const x = p.sx * W + (tx - p.sx * W) * g, y = p.sy * H + (ty - p.sy * H) * g;
      const al = p.a * (.72 + .28 * Math.sin(now * .003 + p.tw)) * Math.min(1, .45 + k * .55) * (.25 + .75 * g) * (1 - leave * .85);
      if (al < .02) continue;
      const sz = p.size * k * (1 + leave * 1.5) * (FX.light ? 1.15 : 1);
      const pc = PAL[p.ci];
      ctx.fillStyle = `rgba(${pc},${al.toFixed(3)})`;
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      if (p.big) { const gz = sz * 3.2; ctx.fillStyle = `rgba(${pc},${(al * (FX.light ? .08 : .12)).toFixed(3)})`; ctx.fillRect(x - gz / 2, y - gz / 2, gz, gz); }
    }
    ctx.globalCompositeOperation = 'source-over';
  };
  requestAnimationFrame(draw);
})();
