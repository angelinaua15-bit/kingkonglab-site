(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3600);
  };

  const nav = $('#nav');
  const burger = $('#burger');
  const drawer = $('#drawer');
  const closeDrawer = () => {
    drawer?.classList.remove('is-on');
    burger?.classList.remove('is-on');
    burger?.setAttribute('aria-expanded', 'false');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('menu-open');
  };
  burger?.addEventListener('click', () => {
    const on = !drawer.classList.contains('is-on');
    drawer.classList.toggle('is-on', on);
    burger.classList.toggle('is-on', on);
    burger.setAttribute('aria-expanded', String(on));
    drawer.setAttribute('aria-hidden', String(!on));
    document.body.style.overflow = on ? 'hidden' : '';
    document.body.classList.toggle('menu-open', on);
    if (on) nav?.classList.remove('is-away');
  });
  $$('#drawer a').forEach((a) => a.addEventListener('click', closeDrawer));

  const sections = ['solutions', 'about', 'work', 'stories', 'news', 'faq', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$('.nav__links a');
  const setActive = () => {
    const y = scrollY + 140;
    let current = '';
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === `#${current}`));
    nav?.classList.toggle('is-solid', scrollY > 16);
    const bar = $('#scrollProgress');
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }
  };
  addEventListener('scroll', setActive, { passive: true });
  setActive();

  const sols = $$('.sol');
  const labImg = $('#labImg');
  const labStage = $('.lab__stage');
  const activateSol = (btn) => {
    sols.forEach((s) => {
      const on = s === btn;
      s.classList.toggle('is-on', on);
      s.setAttribute('aria-selected', String(on));
    });
    if (!labImg || !btn.dataset.img || labImg.src.includes(btn.dataset.img.split('/').pop())) return;
    labStage?.classList.add('is-swap');
    setTimeout(() => {
      labImg.src = btn.dataset.img;
      labImg.alt = btn.dataset.alt || '';
      labStage?.classList.remove('is-swap');
    }, 160);
  };
  sols.forEach((btn) => {
    btn.addEventListener('mouseenter', () => { if (fine) activateSol(btn); });
    btn.addEventListener('click', () => activateSol(btn));
    btn.addEventListener('focus', () => activateSol(btn));
  });

  $$('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.filter').forEach((b) => {
        b.classList.toggle('is-on', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      const cat = btn.dataset.filter;
      $$('.case-card').forEach((card) => {
        card.classList.toggle('is-hidden', cat !== 'all' && card.dataset.cat !== cat);
      });
    });
  });

  // портфоліо: якщо живий скріншот не завантажився — стара картинка
  $$('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => { if (!img.dataset.failed) { img.dataset.failed = '1'; img.src = img.dataset.fallback; } });
  });

  // «Про нас»: безшовна стрічка фактів справа наліво
  const factsTrack = $('.facts__track');
  if (factsTrack) {
    [...factsTrack.children].forEach((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      factsTrack.appendChild(c);
    });
  }

  // контент-стрічка: пости з Telegram-каналу
  const feed = $('#feed');
  const feedMore = $('#feedMore');
  if (feed) {
    const channel = feed.dataset.channel;
    let next = Number(feed.dataset.latest);
    const mobile = matchMedia('(max-width: 860px)').matches;
    const step = mobile ? 3 : (Number(feed.dataset.count) || 6);
    // кожен пост вантажимо лише коли він близько до екрана — легше для телефону
    const lazy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        lazy.unobserve(e.target);
        const box = e.target;
        const sc = document.createElement('script');
        sc.async = true;
        sc.src = 'https://telegram.org/js/telegram-widget.js?22';
        sc.dataset.telegramPost = box.dataset.post;
        sc.dataset.width = '100%';
        sc.dataset.userpic = 'false';
        sc.dataset.color = '2700EE';
        box.appendChild(sc);
        const done = () => box.classList.remove('is-wait');
        new MutationObserver((m, obs) => {
          const f = box.querySelector('iframe');
          if (f) { f.addEventListener('load', done); setTimeout(done, 5000); obs.disconnect(); }
        }).observe(box, { childList: true });
      });
    }, { root: mobile ? null : feed, rootMargin: mobile ? '300px 0px' : '0px 400px' });
    const addPost = (id) => {
      const box = document.createElement('div');
      box.className = 'post is-wait';
      box.dataset.post = `${channel}/${id}`;
      feed.appendChild(box);
      lazy.observe(box);
    };
    const loadBatch = () => {
      for (let i = 0; i < step && next > 0; i += 1) addPost(next--);
      if (next <= 0 && feedMore) feedMore.hidden = true;
    };
    const io = new IntersectionObserver((en) => {
      if (en.some((e) => e.isIntersecting)) { loadBatch(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(feed);
    feedMore?.addEventListener('click', () => {
      const before = feed.children.length;
      loadBatch();
      if (!mobile) feed.children[before]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  }

  const accs = $$('.acc details');
  accs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  const form = $('#leadForm');
  const phone = $('#fPhone');
  phone?.addEventListener('focus', () => { if (!phone.value) phone.value = '+380 '; });
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.company.value) return;
    const name = form.name.value.trim();
    const tel = phone.value.trim();
    const digits = tel.replace(/\D/g, '');
    let ok = true;
    [[form.name, name.length >= 2], [phone, digits.length >= 10]].forEach(([input, valid]) => {
      input.parentElement.classList.toggle('is-error', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { showToast('Вкажіть ім\'я та коректний телефон'); return; }
    const services = $$('input[name="service"]:checked', form).map((i) => i.value).join(', ') || '—';
    const body = `Ім'я: ${name}\nТелефон: ${tel}\nПослуги: ${services}\n\nЗадача:\n${form.message.value.trim() || '—'}`;
    location.href = `mailto:kingkonglab2024@gmail.com?subject=${encodeURIComponent('Заявка з сайту — ' + name)}&body=${encodeURIComponent(body)}`;
    const status = $('#formStatus');
    if (status) status.textContent = 'Дякуємо! Відкриється поштовий клієнт — надішліть лист.';
    showToast('Заявку сформовано');
    form.reset();
  });

  if (fine && !reduced) {
    document.body.classList.add('has-cursor');
    const cur = $('#cursor');
    const dot = $('i', cur);
    const ring = $('em', cur);
    let x = -200, y = -200, rx = -200, ry = -200;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    const loop = () => {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      if (dot) dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$('a, button, .sol, .case-card, .filter').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cur.classList.add('is-hover');
        if (el.dataset.cursor) {
          cur.classList.add('is-label');
          ring.textContent = el.dataset.cursor;
        }
      });
      el.addEventListener('mouseleave', () => {
        cur.classList.remove('is-hover', 'is-label');
        ring.textContent = '';
      });
    });
    $$('.mag').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * .16}px, ${dy * .2}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    addEventListener('pointermove', (e) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    });
  }


  // кнопки: світловий відблиск іде за курсором
  $$('.btn').forEach((b) => b.addEventListener('pointermove', (e) => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', `${e.clientX - r.left}px`);
    b.style.setProperty('--by', `${e.clientY - r.top}px`);
  }));

  // картки портфоліо: 3D-нахил і блік
  if (fine && !reduced) {
    $$('.case-card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', `${((x - .5) * 7).toFixed(2)}deg`);
        c.style.setProperty('--rx', `${((.5 - y) * 6).toFixed(2)}deg`);
        c.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        c.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  // меню ховається при скролі вниз і повертається при скролі вгору
  let lastS = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    const down = y > lastS + 4;
    const up = y < lastS - 4;
    if (down && y > innerHeight * .9 && !drawer?.classList.contains('is-on')) nav?.classList.add('is-away');
    if (up || y < 80) nav?.classList.remove('is-away');
    lastS = y;
  }, { passive: true });

  /* спільний стан: наскільки «вибухнула» горила і як сильно зірки тягнуться в гіперпростір */
  const state = { explode: 0, warp: 0, warpT: 0, vel: 0 };
  const mobile = matchMedia('(max-width: 860px)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ───── КОСМОС: зоряне поле на всю сторінку ───── */
  const space = $('#space');
  if (space && !reduced) {
    const ctx = space.getContext('2d');
    const N = mobile ? 150 : 320;
    const COLS = ['255,255,255', '226,232,255', '255,214,150', '150,170,255'];
    let W = 0, H = 0;
    const stars = [];
    const resize = () => {
      W = innerWidth; H = innerHeight;
      space.width = W * DPR; space.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    addEventListener('resize', resize);
    const reset = (s, far) => {
      s.x = (Math.random() - .5) * 2.2;
      s.y = (Math.random() - .5) * 2.2;
      s.z = far ? .9 + Math.random() * .1 : .08 + Math.random() * .92;
      s.pz = s.z;
      s.c = COLS[(Math.random() * COLS.length) | 0];
      s.r = .4 + Math.random() * 1.1;
      s.tw = Math.random() * 6.28;
    };
    for (let i = 0; i < N; i++) { const s = {}; reset(s, false); stars.push(s); }
    let lastY = scrollY;
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      const dy = scrollY - lastY; lastY = scrollY;
      state.vel += (Math.min(Math.abs(dy), 140) / 140 - state.vel) * .08;
      state.warp += (state.warpT - state.warp) * .08;
      const w = Math.max(state.warp, state.vel * .3);
      const speed = .0007 + w * .03;
      ctx.clearRect(0, 0, W, H);
      const cx = W * .5, cy = H * .5, f = Math.max(W, H) * .5;
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= .03) { reset(s, true); continue; }
        const sx = cx + (s.x / s.z) * f, sy = cy + (s.y / s.z) * f;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) { reset(s, true); continue; }
        const near = 1 - s.z;
        const a = Math.min(1, near * 1.4 + .1) * (.65 + .35 * Math.sin(now * .002 + s.tw));
        const size = s.r * (.5 + near * 1.6);
        if (w > .05) {
          const px = cx + (s.x / (s.pz + w * .02)) * f, py = cy + (s.y / (s.pz + w * .02)) * f;
          ctx.strokeStyle = `rgba(${s.c},${a})`;
          ctx.lineWidth = size;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${s.c},${a})`;
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }
      }
    };
    requestAnimationFrame(tick);
  }

  /* ───── HERO: горила з частинок (золото / біле / синє), вибухає на скролі ───── */
  const hero = $('.banner');
  const canvas = $('#particles');
  const kongEl = $('#kong');
  let heroVisible = true;
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  if (!canvas || reduced || !canvas.getContext) document.documentElement.classList.add('no-canvas');

  if (canvas && !reduced && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const N = mobile ? 1500 : 3400;
    let W = 0, H = 0, cx = 0, cy = 0, S = 0;
    let parts = [];
    let t0 = performance.now();
    let mx = 0, my = 0, smx = 0, smy = 0;
    let mouse = { x: -9999, y: -9999 };
    const measure = () => {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const k = kongEl.getBoundingClientRect();
      cx = k.left - r.left + k.width / 2;
      cy = k.top - r.top + k.height / 2;
      S = k.width;
    };
    const build = (img) => {
      const n = 220;
      const off = document.createElement('canvas');
      off.width = off.height = n;
      const o = off.getContext('2d');
      o.drawImage(img, 0, 0, n, n);
      const d = o.getImageData(0, 0, n, n).data;
      const pts = [];
      let x0 = n, x1 = 0, y0 = n, y1 = 0;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (d[(y * n + x) * 4 + 3] > 90) {
          pts.push([x, y]);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      if (!pts.length) return;
      const bx = (x0 + x1) / 2, by = (y0 + y1) / 2, bs = Math.max(x1 - x0, y1 - y0);
      parts = [];
      for (let i = 0; i < N; i++) {
        const dust = Math.random() < .08;
        let u, v;
        if (dust) {
          const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * .62;
          u = Math.cos(a) * rr; v = Math.sin(a) * rr * .95;
        } else {
          const p = pts[(Math.random() * pts.length) | 0];
          u = (p[0] + (Math.random() - .5) * .8 - bx) / bs;
          v = (p[1] + (Math.random() - .5) * .8 - by) / bs;
        }
        const r = Math.random();
        const c = r < .4 ? '255,200,112' : r < .76 ? '240,244,255' : '120,148,255';
        const len = Math.hypot(u, v) || 1;
        parts.push({
          u, v, z: (Math.random() - .5) * (dust ? .7 : .14),
          c, a: dust ? .12 + Math.random() * .25 : .7 + Math.random() * .3,
          size: dust ? .6 + Math.random() * .8 : (Math.random() < .07 ? 2.4 + Math.random() * 1.6 : 1.1 + Math.random() * 1.2),
          ex: u / len + (Math.random() - .5) * .9, ey: v / len + (Math.random() - .5) * .9,
          dist: .4 + Math.random() * 1.6,
          sx: Math.random(), sy: Math.random(),
          delay: Math.random() * 900, tw: Math.random() * 6.28,
          ox: 0, oy: 0,
        });
      }
      t0 = performance.now();
    };
    measure();
    const img = new Image();
    img.onload = () => { measure(); build(img); };
    img.onerror = () => document.documentElement.classList.add('no-canvas');
    img.src = 'assets/img/logo-line.png';
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      mx = (e.clientX / innerWidth) - .5; my = (e.clientY / innerHeight) - .5;
    });
    hero.addEventListener('pointerleave', () => { mouse = { x: -9999, y: -9999 }; mx = 0; my = 0; });
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 120); });
    const draw = (now) => {
      requestAnimationFrame(draw);
      if (!heroVisible || document.hidden || !parts.length) return;
      smx += (mx - smx) * .05; smy += (my - smy) * .05;
      const rot = Math.sin(now * .00032) * .26 + smx * .7;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const tilt = smy * .3;
      const breathe = 1 + Math.sin(now * .0011) * .015;
      const E = state.explode;
      const E2 = E * E;
      const span = Math.max(W, H);
      const scale = S * .92 * breathe;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        const x3 = p.u * cs + p.z * sn;
        const z3 = -p.u * sn + p.z * cs + p.v * tilt;
        const k = 1 / (1 - z3 * .55);
        let tx = cx + x3 * scale * k;
        let ty = cy + p.v * scale * k + Math.sin(now * .0016 + p.tw) * 1.4;
        if (E > 0) { const dd = E2 * p.dist * span; tx += p.ex * dd; ty += p.ey * dd; }
        const dx = tx + p.ox - mouse.x, dy = ty + p.oy - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          const f = (9000 - d2) / 9000 * 3;
          const dl = Math.sqrt(d2) + .01;
          p.ox += (dx / dl) * f; p.oy += (dy / dl) * f;
        }
        p.ox *= .92; p.oy *= .92;
        tx += p.ox; ty += p.oy;
        const q = Math.min(1, Math.max(0, (now - t0 - p.delay) / 1700));
        const e = 1 - Math.pow(1 - q, 4);
        const x = p.sx * W + (tx - p.sx * W) * e;
        const y = p.sy * H + (ty - p.sy * H) * e;
        const tw = .7 + .3 * Math.sin(now * .003 + p.tw);
        const al = p.a * tw * Math.min(1, .45 + k * .55) * (1 - E * .8) * (.25 + .75 * e);
        if (al < .02) continue;
        const sz = p.size * k * (1 + E * 2.4);
        ctx.fillStyle = `rgba(${p.c},${al.toFixed(3)})`;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        if (p.size > 2.3) { // м'яке сяйво навколо великих частинок
          const g = sz * 3.2;
          ctx.fillStyle = `rgba(${p.c},${(al * .12).toFixed(3)})`;
          ctx.fillRect(x - g / 2, y - g / 2, g, g);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    requestAnimationFrame(draw);
    canvas.restart = () => { measure(); t0 = performance.now(); };
  }

  if (!hasGsap || reduced) {
    document.documentElement.classList.add('no-anim');
    $('#loader')?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');

  if (fine && typeof window.Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el && id !== '#top') return;
      e.preventDefault();
      lenis.scrollTo(id === '#top' ? 0 : el, { offset: -20, duration: 1.4 });
    }));
  }

  const loader = $('#loader');
  const bar = $('#loaderBar');
  gsap.to({ n: 0 }, {
    n: 100, duration: .8, ease: 'power2.inOut',
    onUpdate() { if (bar) bar.style.width = Math.round(this.targets()[0].n) + '%'; },
    onComplete() {
      loader?.classList.add('is-done');
      document.body.classList.remove('is-loading');
      intro();
    },
  });

  function split(el) {
    const wrap = document.createElement('span');
    wrap.innerHTML = el.innerHTML;
    const walk = (node, frag) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const outer = document.createElement('span');
            outer.style.display = 'inline-block';
            outer.style.overflow = 'hidden';
            outer.style.paddingBottom = '.06em';
            outer.style.marginBottom = '-.06em';
            const inner = document.createElement('span');
            inner.style.display = 'inline-block';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
        } else if (n.nodeName === 'EM' || n.nodeName === 'B') {
          const em = document.createElement(n.nodeName.toLowerCase());
          const f = document.createDocumentFragment();
          walk(n, f);
          em.appendChild(f);
          frag.appendChild(em);
        } else {
          walk(n, frag);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(wrap, frag);
    el.textContent = '';
    el.appendChild(frag);
    return $$('span span', el);
  }

  function intro() {
    const tl = gsap.timeline();
    tl.from('.nav', { y: -40, opacity: 0, duration: .9, ease: 'power3.out' }, 0)
      .from('.banner__title .line > span', { yPercent: 115, rotate: 3, duration: 1.15, ease: 'power4.out', stagger: .1 }, .05)
      .from('.glowdot', { scale: 0, duration: .8, ease: 'back.out(3)' }, .7)
      .from('.banner [data-rise]', { y: 26, opacity: 0, duration: .8, ease: 'power3.out', stagger: .07 }, .3)
      .from('.frame i', { opacity: 0, scale: .4, duration: .8, ease: 'power3.out', stagger: .06 }, .2)
      .from('.banner__meta, .banner__scroll', { opacity: 0, duration: 1.2 }, .8)
      .fromTo('.fab', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: .9, ease: 'back.out(2)', clearProps: 'transform' }, .9)
      .from('.kong__halo', { scale: .4, opacity: 0, duration: 2, ease: 'power3.out' }, 0);
    $$('.banner__stats b[data-count]').forEach((b) => {
      const end = Number(b.dataset.count);
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', delay: .5, onUpdate: () => { b.textContent = `${Math.round(o.v)}+`; } });
    });
    $('#particles')?.restart?.();
  }

  /* hero → гіперпростір: горила розлітається, зірки тягнуться, далі «Рішення» з кільцем */
  const heroEnd = mobile ? 'bottom top' : '+=90%';
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  gsap.timeline({
    scrollTrigger: {
      trigger: '.banner', start: 'top top', end: heroEnd, pin: !mobile, scrub: .5, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        state.explode = smooth(.14, .92, p);
        state.warpT = Math.sin(smooth(.05, 1, p) * Math.PI) * (mobile ? .6 : 1);
      },
      onLeave: () => { state.warpT = 0; },
      onLeaveBack: () => { state.warpT = 0; state.explode = 0; },
    },
  })
    .to('.banner__copy', { y: mobile ? -40 : -160, opacity: 0, ease: 'power2.in', duration: .7 }, 0)
    .to('.kong__halo', { scale: 2.6, opacity: 0, ease: 'power1.in', duration: .8 }, 0)
    .to('.banner__meta, .banner__scroll, .frame', { opacity: 0, ease: 'none', duration: .4 }, 0)
    .to({}, { duration: .12 });

  // заголовки: слова виїжджають знизу, лінія біля eyebrow малюється
  $$('[data-split]').forEach((el) => {
    const words = split(el);
    gsap.from(words, {
      yPercent: 120, rotate: 4, duration: 1, ease: 'power4.out', stagger: .05,
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  $$('.eyebrow').forEach((el) => {
    gsap.fromTo(el, { '--ln': 0, opacity: 0, x: -20 }, { '--ln': 1, opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  const rest = (sel) => $$(sel).filter((el) => !el.closest('.banner') && !el.matches('.eyebrow') && !el.closest('.steps, .atlas__grid, .direct, .trick'));
  rest('[data-rise]').forEach((el) => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: .9, ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 93%', once: true },
    });
  });

  // великі стрічки рухаються разом зі скролом
  $$('.mega').forEach((m) => {
    const track = $('.mega__track', m);
    const rev = m.classList.contains('mega--rev');
    gsap.fromTo(track, { xPercent: rev ? -30 : 0 }, { xPercent: rev ? 0 : -30, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: .4 } });
  });
  // нахил стрічок від швидкості скролу
  const skewers = $$('.mega, .ticker--cards');
  const skewTo = skewers.map((el) => gsap.quickTo(el, 'skewX', { duration: .5, ease: 'power3' }));
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-8, 8, self.getVelocity() / -260);
      skewTo.forEach((f) => f(v));
    },
  });

  // Рішення: кільце світиться і «приземляється», список виїжджає зліва, фото розкривається
  gsap.from('.halo-ring', { scale: 0, opacity: 0, rotate: -120, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#solutions', start: 'top 85%', once: true } });
  gsap.to('.halo-ring', { y: 120, ease: 'none', scrollTrigger: { trigger: '#solutions', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.from('.sol', { x: -90, opacity: 0, duration: 1, ease: 'power4.out', stagger: .1, scrollTrigger: { trigger: '.lab', start: 'top 82%', once: true } });
  gsap.fromTo('.lab__stage', { clipPath: 'inset(20% 20% 20% 20% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: '.lab', start: 'top 85%', end: 'top 30%', scrub: .6 } });
  gsap.fromTo('#labImg', { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.lab', start: 'top 85%', end: 'bottom 30%', scrub: .6 } });

  // Про нас: слова «загоряються» по черзі, факти випливають справа
  const statement = $('#statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('#statement .w');
    ScrollTrigger.create({
      trigger: statement, start: 'top 82%', end: 'bottom 45%',
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
      },
    });
    gsap.from(statement, { x: 120, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#about', start: 'top 80%', once: true } });
  }
  gsap.from('.facts', { x: '40%', opacity: 0, duration: 1.4, ease: 'power3.out', immediateRender: false, scrollTrigger: { trigger: '.facts', start: 'top 92%', once: true } });

  // Процес: золота лінія тягнеться через етапи й підсвічує кожен
  const steps = $('.steps');
  if (steps) {
    const lis = $$('li', steps);
    gsap.from(lis, { y: 80, opacity: 0, rotateX: -30, transformPerspective: 800, transformOrigin: '50% 0%', duration: 1.1, ease: 'power4.out', stagger: .12, scrollTrigger: { trigger: steps, start: 'top 85%', once: true } });
    ScrollTrigger.create({
      trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        steps.style.setProperty('--p', p.toFixed(3));
        const cols = innerWidth > 1100 ? lis.length : innerWidth > 860 ? 2 : 1;
        lis.forEach((li, i) => {
          const at = cols === 1 ? i / lis.length : (i % cols) / cols;
          li.classList.toggle('is-lit', p >= at + .02);
        });
      },
    });
  }
  gsap.from('.trick', { scale: .9, opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.trick', start: 'top 90%', once: true } });

  // Портфоліо: картки розкриваються з маски, фото «наближається»
  ScrollTrigger.batch('.case-card', {
    start: 'top 90%', once: true,
    onEnter: (batch) => {
      gsap.fromTo(batch, { clipPath: 'inset(16% 12% 16% 12% round 22px)', y: 90, opacity: 0 }, {
        clipPath: 'inset(0% 0% 0% 0% round 22px)', y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: .12,
        clearProps: 'clipPath',
      });
      gsap.fromTo(batch.map((c) => $('.case-card__media', c)), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: .12 });
    },
  });
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    const shown = $$('.case-card:not(.is-hidden)');
    gsap.fromTo(shown, { y: 40, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power3.out', stagger: .06 });
    ScrollTrigger.refresh();
  }));

  // Відгуки: картки падають у стрічку з легким поворотом
  gsap.from('.ticker--cards .quote', { y: 40, rotate: 4, opacity: 0, duration: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.ticker--cards', start: 'top 90%', once: true } });

  // Історії: колонки піднімаються по черзі, номери «друкуються»
  gsap.from('.atlas__grid article', { y: 110, opacity: 0, duration: 1.2, ease: 'power4.out', stagger: .16, scrollTrigger: { trigger: '.atlas__grid', start: 'top 85%', once: true } });

  // Новини: стрічка заїжджає справа
  gsap.from('#feed', { x: 220, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#news', start: 'top 75%', once: true } });

  // FAQ: питання виїжджають по одному
  gsap.from('.acc details', { x: 70, opacity: 0, duration: .9, ease: 'power3.out', stagger: .09, scrollTrigger: { trigger: '.acc', start: 'top 85%', once: true } });

  // Контакти: світло «розгоряється», форма повертається до глядача
  gsap.fromTo('.closer', { '--gs': .5 }, { '--gs': 1.25, ease: 'none', scrollTrigger: { trigger: '.closer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.form', { y: 90, rotateX: 18, opacity: 0, transformPerspective: 1000, transformOrigin: '50% 100%', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 92%', once: true } });
  gsap.from('.direct a', { y: 30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.direct', start: 'top 95%', once: true } });

  // футер
  gsap.from('.foot__top > *', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.foot', start: 'top 95%', once: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
