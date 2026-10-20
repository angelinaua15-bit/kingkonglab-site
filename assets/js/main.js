(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const FX = { sol: 0, light: document.documentElement.dataset.theme !== 'dark' }; // активна послуга + тема для частинок

  // ── світла / темна тема: перехід колом від кнопки ──
  const themeBtn = $('#themeToggle');
  const setTheme = (t) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    FX.light = t !== 'dark';
    try { localStorage.setItem('kk-theme', t); } catch (e) { /* приватний режим */ }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'dark' ? '#0B1450' : '#F4F6FD';
  };
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (document.startViewTransition && !reduced) {
      const vt = document.startViewTransition(() => setTheme(next));
      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
          { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => {});
    } else {
      document.documentElement.classList.add('theme-anim');
      setTheme(next);
      setTimeout(() => document.documentElement.classList.remove('theme-anim'), 700);
    }
  });

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
    if (!drawer || !burger) return;
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
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-on')) closeDrawer();
  });

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
  const solHref = (el) => el.getAttribute('href') || el.dataset.href || '';
  const activateSol = (btn) => {
    FX.sol = Math.max(0, sols.indexOf(btn));
    const more = $('#solMore');
    const href = solHref(btn);
    if (more && href) more.href = href;
    sols.forEach((s) => {
      const on = s === btn;
      s.classList.toggle('is-on', on);
      if (s.hasAttribute('aria-selected')) s.setAttribute('aria-selected', String(on));
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

  // портфоліо: скріншоти сайтів (assets/img/work, оновлює GitHub Action); якщо файлу нема — охайна заглушка
  $$('img[data-shot]').forEach((img) => {
    const ready = () => img.classList.add('is-ready');
    img.addEventListener('load', ready);
    img.addEventListener('error', () => img.remove());
    if (img.complete && img.naturalWidth) ready();
  });
  const work = $('.work');
  // телефон: портфоліо — горизонтальна карусель з лічильником
  const workBar = $('#workBar'), workIdx = $('#workIdx'), workTotal = $('#workTotal');
  const updWork = () => {
    if (!work) return;
    const cards = $$('.case-card', work).filter((c) => c.offsetParent !== null);
    if (workTotal) workTotal.textContent = cards.length;
    const max = work.scrollWidth - work.clientWidth;
    const p = max > 0 ? work.scrollLeft / max : 0;
    if (workBar) workBar.style.transform = `scaleX(${Math.max(.06, p)})`;
    const prev = $('#workPrev'), next = $('#workNext');
    if (prev) prev.disabled = work.scrollLeft < 8;
    if (next) next.disabled = work.scrollLeft > max - 8;
    if (workIdx && cards.length) {
      const left = work.getBoundingClientRect().left;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - left - 12); if (d < bd) { bd = d; best = i; } });
      workIdx.textContent = best + 1;
    }
  };
  work?.addEventListener('scroll', updWork, { passive: true });
  const stepWork = (dir) => {
    const card = $$('.case-card', work).find((c) => c.offsetParent !== null);
    if (!work || !card) return;
    work.scrollBy({ left: dir * (card.getBoundingClientRect().width + 12), behavior: 'smooth' });
  };
  $('#workPrev')?.addEventListener('click', () => stepWork(-1));
  $('#workNext')?.addEventListener('click', () => stepWork(1));
  addEventListener('resize', updWork);
  $$('.filter').forEach((b) => b.addEventListener('click', () => { if (work) work.scrollLeft = 0; setTimeout(updWork, 50); }));
  updWork();
  const workMore = $('#workMore');
  workMore?.addEventListener('click', () => {
    work?.classList.add('is-open');
    workMore.parentElement.hidden = true;
    window.ScrollTrigger?.refresh();
  });
  $$('.filter').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.filter !== 'all') { work?.classList.add('is-open'); if (workMore) workMore.parentElement.hidden = true; }
  }));

  // портфоліо: якщо живий скріншот не завантажився — стара картинка
  $('#labImg')?.addEventListener('error', (e) => { e.target.style.visibility = 'hidden'; });
  $('#labImg')?.addEventListener('load', (e) => { e.target.style.visibility = ''; });
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
        sc.onerror = () => {
          box.classList.remove('is-wait');
          const a = document.createElement('a');
          a.href = `https://t.me/${box.dataset.post}`;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = 'Відкрити пост у Telegram →';
          box.appendChild(a);
        };
        box.appendChild(sc);
        const done = () => box.classList.remove('is-wait');
        new MutationObserver((m, obs) => {
          const f = box.querySelector('iframe');
          if (f) { f.addEventListener('load', done); setTimeout(done, 5000); obs.disconnect(); }
        }).observe(box, { childList: true });
        setTimeout(() => {
          if (!box.querySelector('iframe') && !box.querySelector('a[href^="https://t.me/"]')) sc.onerror?.();
        }, 12000);
      });
    }, { root: mobile ? null : feed, rootMargin: mobile ? '300px 0px' : '0px 400px' });
    const addPost = (id) => {
      const box = document.createElement('div');
      box.className = 'post is-wait';
      box.dataset.post = `${channel}/${id}`;
      const tg = document.createElement('button');
      tg.type = 'button';
      tg.className = 'post__toggle';
      tg.textContent = 'Розгорнути ↓';
      tg.addEventListener('click', () => {
        const on = box.classList.toggle('is-open');
        tg.textContent = on ? 'Згорнути ↑' : 'Розгорнути ↓';
      });
      box.appendChild(tg);
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

  // «Обговорити проєкт» → одразу до форми: підсвічуємо її, на комп'ютері ставимо курсор у поле
  $$('a[href="#leadForm"]').forEach((a) => a.addEventListener('click', (ev) => {
    const f = $('#leadForm');
    if (!f) return;
    if (!window.Lenis || !fine) {
      ev.preventDefault();
      closeDrawer();
      const go = () => scrollTo({ top: f.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
      go(); setTimeout(go, 700); // друга корекція — якщо блоки вище ще доанімовувались
    }
    setTimeout(() => {
      f.classList.remove('is-flash'); void f.offsetWidth; f.classList.add('is-flash');
      if (fine) $('#fName')?.focus({ preventScroll: true });
    }, 900);
  }));
  const form = $('#leadForm');
  const phone = $('#fPhone');
  window.kkInitLeadForm?.(form);
  form?.addEventListener('submit', async (e) => {
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
    const status = $('#formStatus');
    if (!ok) {
      if (status) status.textContent = '';
      showToast('Вкажіть ім\'я та коректний телефон');
      return;
    }
    if (typeof window.kkSubmitLead !== 'function') {
      showToast('Помилка конфігурації форми. Напишіть у Telegram.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn?.setAttribute('aria-busy', 'true');
    if (btn) btn.disabled = true;
    if (status) status.textContent = 'Надсилаємо…';
    try {
      await window.kkSubmitLead(form);
      if (status) status.textContent = 'Дякуємо! Заявку надіслано — звʼяжемось протягом 24 год.';
      showToast('Заявку надіслано');
      form.reset();
    } catch (err) {
      const msg = err?.name === 'AbortError'
        ? 'Час вичерпано. Перевірте інтернет і спробуйте ще раз.'
        : 'Не вдалось надіслати. Спробуйте ще раз або напишіть у Telegram.';
      if (status) status.textContent = msg;
      showToast('Помилка відправки');
    } finally {
      if (btn) btn.disabled = false;
      btn?.removeAttribute('aria-busy');
    }
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
  const DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

  /* ───── КОСМОС: зоряне поле на всю сторінку ───── */
  const space = $('#space');
  if (space && !reduced) {
    const ctx = space.getContext('2d');
    const N = mobile ? 60 : 320;
    const COLS = ['255,255,255', '226,232,255', '255,214,150', '150,170,255'];
    const COLS_L = ['11,20,80', '47,75,255', '216,150,31', '90,110,200'];
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
      s.ci = (Math.random() * COLS.length) | 0;
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
      const pal = FX.light ? COLS_L : COLS, dim = FX.light ? .55 : 1;
      const cx = W * .5, cy = H * .5, f = Math.max(W, H) * .5;
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= .03) { reset(s, true); continue; }
        const sx = cx + (s.x / s.z) * f, sy = cy + (s.y / s.z) * f;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) { reset(s, true); continue; }
        const near = 1 - s.z;
        const a = Math.min(1, near * 1.4 + .1) * (.65 + .35 * Math.sin(now * .002 + s.tw)) * dim;
        const sc = pal[s.ci];
        const size = s.r * (.5 + near * 1.6);
        if (w > .05) {
          const px = cx + (s.x / (s.pz + w * .02)) * f, py = cy + (s.y / (s.pz + w * .02)) * f;
          ctx.strokeStyle = `rgba(${sc},${a})`;
          ctx.lineWidth = size;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${sc},${a})`;
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }
      }
    };
    requestAnimationFrame(tick);
  }

  /* ───── ПОЛЕ ЧАСТИНОК: один обʼєкт, що змінює форму від сцени до сцени (як на референсі) ─────
     hero — горила · Рішення — форма активної послуги · Про нас — планета · далі — зоряний пил · Контакти — горила знову */
  const hero = $('.banner');
  const canvas = $('#particles');
  if (!canvas || reduced || !canvas.getContext) document.documentElement.classList.add('no-canvas');

  if (canvas && !reduced && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const N = mobile ? 750 : 3200;
    let W = 0, H = 0;
    const resize = () => {
      W = innerWidth; H = innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    // форма → набір точок: малюємо на прихованому полотні й беремо непрозорі пікселі
    const SN = 220;
    const sample = (paint) => {
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
        if (d[(y * SN + x) * 4 + 3] > 90) {
          pts.push(x, y);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      const bx = (x0 + x1) / 2, by = (y0 + y1) / 2, bs = Math.max(x1 - x0, y1 - y0) || 1;
      const out = new Float32Array(N * 3);
      const m = pts.length / 2;
      for (let i = 0; i < N; i++) {
        if (!m) break;
        const j = ((Math.random() * m) | 0) * 2;
        out[i * 3] = (pts[j] + (Math.random() - .5) * .8 - bx) / bs;
        out[i * 3 + 1] = (pts[j + 1] + (Math.random() - .5) * .8 - by) / bs;
        out[i * 3 + 2] = (Math.random() - .5) * .14;
      }
      return out;
    };
    const rr = (o, x, y, w, h, r) => { o.beginPath(); if (o.roundRect) o.roundRect(x, y, w, h, r); else o.rect(x, y, w, h); o.stroke(); };
    const line = (o, ...p) => { o.beginPath(); o.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) o.lineTo(p[i], p[i + 1]); o.stroke(); };
    const SHAPES = {
      web: sample((o) => { // вікно браузера: сайт / додаток
        rr(o, 22, 42, 176, 136, 16); line(o, 22, 70, 198, 70);
        [40, 54, 68].forEach((x) => { o.beginPath(); o.arc(x, 56, 3.5, 0, 7); o.fill(); });
        line(o, 44, 94, 116, 94); line(o, 44, 112, 104, 112); line(o, 44, 130, 92, 130);
        rr(o, 44, 146, 50, 16, 8); rr(o, 128, 90, 52, 70, 8);
      }),
      plane: sample((o) => { // Telegram
        o.save(); o.translate(14, 18); o.scale(8, 8); o.lineWidth = .62;
        o.stroke(new Path2D('M21.4 3.2 2.9 10.4c-1.3.5-1.2 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.5zM8.6 13.2l9.9-6.3c.5-.3.9-.1.5.2l-8.4 7.6-.3 3.6-1.7-5.1z'));
        o.restore();
      }),
      chart: sample((o) => { // трафік: стовпчики + стрілка вгору
        line(o, 26, 188, 196, 188);
        [[40, 40], [80, 72], [120, 104], [160, 138]].forEach(([x, h]) => rr(o, x, 188 - h, 24, h, 5));
        line(o, 34, 128, 80, 100, 116, 110, 178, 40); line(o, 152, 42, 178, 40, 174, 66);
      }),
      gem: sample((o) => { // дизайн: діамант
        o.beginPath(); o.moveTo(70, 42); o.lineTo(150, 42); o.lineTo(188, 88); o.lineTo(110, 192); o.lineTo(32, 88); o.closePath(); o.stroke();
        line(o, 32, 88, 188, 88); line(o, 70, 42, 90, 88, 110, 192); line(o, 150, 42, 130, 88, 110, 192); line(o, 90, 88, 110, 42, 130, 88);
      }),
    };
    // планета: меридіани, паралелі, поверхня і кільце
    SHAPES.globe = (() => {
      const g = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let lat, lon, rad = .5, ring = false;
        if (r < .4) { lon = ((Math.random() * 12) | 0) / 12 * Math.PI * 2; lat = (Math.random() - .5) * Math.PI; }
        else if (r < .74) { lat = (((Math.random() * 7) | 0) - 3) * .38; lon = Math.random() * Math.PI * 2; }
        else if (r < .88) { lat = Math.asin(Math.random() * 2 - 1); lon = Math.random() * Math.PI * 2; }
        else { ring = true; lon = Math.random() * Math.PI * 2; rad = .7 + Math.random() * .06; lat = 0; }
        const x = Math.cos(lat) * Math.cos(lon) * rad;
        const y = ring ? (Math.random() - .5) * .01 : Math.sin(lat) * rad;
        const z = Math.cos(lat) * Math.sin(lon) * rad;
        g[i * 3] = x; g[i * 3 + 1] = -y; g[i * 3 + 2] = z;
      }
      return g;
    })();
    SHAPES.dust = (() => {
      const g = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { g[i * 3] = Math.random() - .5; g[i * 3 + 1] = (Math.random() - .5) * .75; g[i * 3 + 2] = (Math.random() - .5) * .5; }
      return g;
    })();
    const SOL = ['web', 'plane', 'chart', 'gem'];

    // частинки: колір (золото — головний), розмір, напрям вибуху
    const parts = [];
    for (let i = 0; i < N; i++) {
      const r = Math.random();
      const big = !mobile && Math.random() < .07;
      parts.push({
        ci: r < .5 ? 0 : r < .8 ? 1 : 2,
        a: .65 + Math.random() * .35,
        size: big ? 2.3 + Math.random() * 1.5 : 1 + Math.random() * 1.2,
        big,
        ex: Math.random() - .5, ey: Math.random() - .5,
        dist: .4 + Math.random() * 1.2,
        sx: Math.random(), sy: Math.random(),
        delay: Math.random() * 900, tw: Math.random() * 6.28,
        ox: 0, oy: 0,
      });
    }

    const scenes = [
      { el: $('#kong'), shape: 'gorilla', a: 1 },
      { el: $('#solAnchor'), shape: 'sol', a: 1 },
      { el: $('#aboutAnchor'), shape: 'globe', a: 1.25 },
      { el: null, shape: 'dust', a: .32 },
      { el: $('#contactAnchor'), shape: 'gorilla', a: 1 },
    ];
    const gates = [
      [$('#solutions'), .92, .6],
      [$('#about'), .92, .6],
      [$('#process'), .75, .5],
      [$('#contact'), .95, .55],
    ];
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const ease = (t) => t * t * (3 - 2 * t);

    let mouse = { x: -9999, y: -9999 }, mx = 0, my = 0, smx = 0, smy = 0;
    addEventListener('pointermove', (e) => {
      mouse = { x: e.clientX, y: e.clientY };
      mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse = { x: -9999, y: -9999 }; });

    let solCur = 0, solPrev = 0, solT = -9999;
    let stage = 0;
    let t0 = performance.now();
    const view = [];
    const project = (sc, i, now, out) => {
      const v = view[sc];
      let P = SHAPES[scenes[sc].shape];
      let u, w, z;
      if (scenes[sc].shape === 'sol') {
        const m = clamp01((now - solT) / 900), e = ease(m);
        const A = SHAPES[SOL[solPrev]], B = SHAPES[SOL[solCur]], j = i * 3;
        const burst = Math.sin(Math.PI * e) * .22 * parts[i].dist;
        u = A[j] + (B[j] - A[j]) * e + parts[i].ex * burst;
        w = A[j + 1] + (B[j + 1] - A[j + 1]) * e + parts[i].ey * burst;
        z = A[j + 2] + (B[j + 2] - A[j + 2]) * e;
      } else {
        const j = i * 3; u = P[j]; w = P[j + 1]; z = P[j + 2];
      }
      let x, y, zz;
      if (scenes[sc].shape === 'globe') {
        const cy = Math.cos(v.spin), sy = Math.sin(v.spin);
        const x1 = u * cy + z * sy, z1 = -u * sy + z * cy;
        const ct = Math.cos(.38 + smy * .3), st = Math.sin(.38 + smy * .3);
        x = x1; y = w * ct - z1 * st; zz = w * st + z1 * ct;
      } else if (scenes[sc].shape === 'dust') {
        x = u; y = w; zz = z;
      } else {
        x = u * v.cs + z * v.sn; y = w; zz = -u * v.sn + z * v.cs + w * smy * .3;
      }
      const k = 1 / (1 - zz * .55);
      out.x = v.cx + x * v.S * k;
      out.y = v.cy + y * v.S * k;
      out.k = k;
      out.back = scenes[sc].shape === 'globe' && zz < 0 ? .45 : 1;
    };

    const start = (img) => {
      SHAPES.gorilla = sample((o) => o.drawImage(img, 0, 0, SN, SN));
      t0 = performance.now();
      const A = {}, B = {};
      const draw = (now) => {
        requestAnimationFrame(draw);
        if (document.hidden) return;
        if (FX.sol !== solCur) { solPrev = solCur; solCur = FX.sol; solT = now; }
        smx += (mx - smx) * .05; smy += (my - smy) * .05;
        // де ми на сторінці → між якими сценами переходимо
        let s = 0;
        gates.forEach(([el, st, len]) => { if (el) s += clamp01((H * st - el.getBoundingClientRect().top) / (H * len)); });
        stage += (s - stage) * .14;
        const a = Math.min(3, Math.floor(stage));
        const f = clamp01(stage - a);
        const e = ease(f);
        // геометрія сцен (обʼєкти прикріплені до свого місця на сторінці)
        const rot = Math.sin(now * .00032) * .26 + smx * .6;
        [a, a + 1].forEach((sc) => {
          const el = scenes[sc].el;
          let cx = W / 2, cy = H / 2, S = Math.max(W, H) * 1.15;
          if (el) { const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; S = r.width * .92; }
          view[sc] = { cx, cy, S, cs: Math.cos(rot), sn: Math.sin(rot), spin: now * .00022 + smx * .5 };
        });
        const burstK = Math.sin(Math.PI * e);
        state.warpT = burstK * (a < 2 ? .85 : .35);
        const span = Math.max(W, H);
        const alA = scenes[a].a, alB = scenes[a + 1].a;
        const breathe = Math.sin(now * .0016);
        ctx.clearRect(0, 0, W, H);
        const PAL = FX.light ? ['206,138,20', '11,20,80', '47,75,255'] : ['255,200,112', '240,244,255', '120,148,255'];
        ctx.globalCompositeOperation = FX.light ? 'source-over' : 'lighter';
        for (let i = 0; i < N; i++) {
          const p = parts[i];
          project(a, i, now, A);
          let tx = A.x, ty = A.y, k = A.k, back = A.back;
          if (e > .001) {
            project(a + 1, i, now, B);
            tx += (B.x - A.x) * e; ty += (B.y - A.y) * e; k += (B.k - A.k) * e; back += (B.back - A.back) * e;
            const d = burstK * p.dist * span * (mobile ? .16 : .3);
            tx += p.ex * d; ty += p.ey * d;
          }
          ty += Math.sin(now * .0016 + p.tw) * 1.2 + breathe * .6;
          const dx = tx + p.ox - mouse.x, dy = ty + p.oy - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000) {
            const fr = (9000 - d2) / 9000 * 3, dl = Math.sqrt(d2) + .01;
            p.ox += (dx / dl) * fr; p.oy += (dy / dl) * fr;
          }
          p.ox *= .92; p.oy *= .92;
          tx += p.ox; ty += p.oy;
          const q = clamp01((now - t0 - p.delay) / 1700);
          const g = 1 - Math.pow(1 - q, 4);
          const x = p.sx * W + (tx - p.sx * W) * g;
          const y = p.sy * H + (ty - p.sy * H) * g;
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
          const tw = .72 + .28 * Math.sin(now * .003 + p.tw);
          const al = p.a * tw * (alA + (alB - alA) * e) * back * Math.min(1, .45 + k * .55) * (.25 + .75 * g);
          if (al < .02) continue;
          const sz = p.size * k * (1 + burstK * 1.6) * (FX.light ? 1.15 : 1);
          const pc = PAL[p.ci];
          ctx.fillStyle = `rgba(${pc},${al.toFixed(3)})`;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          if (p.big) {
            const gz = sz * 3.2;
            ctx.fillStyle = `rgba(${pc},${(al * (FX.light ? .08 : .12)).toFixed(3)})`;
            ctx.fillRect(x - gz / 2, y - gz / 2, gz, gz);
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      };
      requestAnimationFrame(draw);
      canvas.restart = () => { t0 = performance.now(); };
    };
    const img = new Image();
    img.onload = () => start(img);
    img.onerror = () => document.documentElement.classList.add('no-canvas');
    img.src = 'assets/img/logo-line.png';
  }

  if (!hasGsap || reduced) {
    document.documentElement.classList.add('no-anim');
    $('#loader')?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
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
      lenis.scrollTo(id === '#top' ? 0 : el, { offset: id === '#leadForm' ? -100 : -20, duration: 1.4 });
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
            outer.style.padding = '.04em .06em .18em';
            outer.style.margin = '0 -.06em -.18em';
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
      .from('.banner__scroll', { opacity: 0, duration: 1.2 }, .8)
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
  // hero: текст відлітає вгору, поки горила розсипається в наступну сцену
  gsap.timeline({ scrollTrigger: { trigger: '.banner', start: 'top top', end: 'bottom 20%', scrub: .5 } })
    .to('.banner__copy', { y: mobile ? -40 : -120, opacity: 0, ease: 'power2.in' }, 0)
    .to('.kong__halo', { scale: 2.2, opacity: 0, ease: 'power1.in' }, 0)
    .to('.banner__scroll, .frame', { opacity: 0, ease: 'none' }, 0);

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

  // великі стрічки: гортаються самі безкінечно, а скрол їх прискорює
  const megaLoops = $$('.mega').map((m) => {
    const track = $('.mega__track', m);
    const rev = m.classList.contains('mega--rev');
    return gsap.fromTo(track, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, ease: 'none', duration: mobile ? 22 : 28, repeat: -1 });
  });
  if (megaLoops.length) {
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 600);
        megaLoops.forEach((t) => gsap.to(t, { timeScale: boost, duration: .2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: .8 }) }));
      },
    });
  }
  // нахил стрічок від швидкості скролу
  const skewers = mobile ? [] : $$('.mega');
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
  gsap.from('.sol', { x: 90, opacity: 0, duration: 1, ease: 'power4.out', stagger: .1, scrollTrigger: { trigger: '.lab', start: 'top 82%', once: true } });
  gsap.from('.lab__thumb', { y: 60, opacity: 0, rotate: 4, duration: 1.2, ease: 'expo.out', delay: .4, scrollTrigger: { trigger: '.lab', start: 'top 70%', once: true } });

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
    gsap.from(statement, { x: -80, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#about', start: 'top 80%', once: true } });
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
  gsap.from('.ticker--cards .quote', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.ticker--cards', start: 'top 90%', once: true } });

  // Історії: колонки піднімаються по черзі, номери «друкуються»
  gsap.from('.atlas__grid article', { y: 110, opacity: 0, duration: 1.2, ease: 'power4.out', stagger: .16, scrollTrigger: { trigger: '.atlas__grid', start: 'top 85%', once: true } });

  // Новини: стрічка заїжджає справа
  gsap.from('#feed', { x: 220, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#news', start: 'top 75%', once: true } });

  // FAQ: питання виїжджають по одному
  gsap.from('.acc details', { x: 70, opacity: 0, duration: .9, ease: 'power3.out', stagger: .09, scrollTrigger: { trigger: '.acc', start: 'top 85%', once: true } });

  // Контакти: світло «розгоряється», форма повертається до глядача
  gsap.fromTo('.closer', { '--gs': .5 }, { '--gs': 1.25, ease: 'none', scrollTrigger: { trigger: '.closer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.form', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 92%', once: true } });
  gsap.from('.direct a', { y: 30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.direct', start: 'top 95%', once: true } });

  // футер
  gsap.from('.foot__top > *', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.foot', start: 'top 95%', once: true } });

  addEventListener('load', () => ScrollTrigger.refresh());

  const prefetch = () => {
    ['/services/web', '/services/bots', '/services/ads', '/services/design'].forEach((href) => {
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      document.head.appendChild(l);
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(prefetch, { timeout: 4000 });
  else setTimeout(prefetch, 2500);
})();
