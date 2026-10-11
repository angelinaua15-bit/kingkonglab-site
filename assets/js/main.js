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
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 4000);
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
  };
  burger?.addEventListener('click', () => {
    const on = !drawer.classList.contains('is-on');
    drawer.classList.toggle('is-on', on);
    burger.classList.toggle('is-on', on);
    burger.setAttribute('aria-expanded', String(on));
    drawer.setAttribute('aria-hidden', String(!on));
    document.body.style.overflow = on ? 'hidden' : '';
  });
  $$('#drawer a').forEach((a) => a.addEventListener('click', closeDrawer));

  const sections = ['solutions', 'about', 'work', 'faq', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$('.nav__links a');
  const setActive = () => {
    const y = scrollY + 140;
    let current = '';
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === `#${current}`));
    nav?.classList.toggle('is-solid', scrollY > 20);
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
    if (!labImg || labImg.src.includes(btn.dataset.img.split('/').pop())) return;
    labStage?.classList.add('is-swap');
    setTimeout(() => {
      labImg.src = btn.dataset.img;
      labImg.alt = btn.dataset.alt || '';
      labStage?.classList.remove('is-swap');
    }, 180);
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
    let x = 0, y = 0, rx = 0, ry = 0;
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
        el.style.transform = `translate(${dx * .18}px, ${dy * .22}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  const stage = $('#stage');
  const tilt = $('#stageTilt');
  if (stage && tilt && fine && !reduced) {
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
    });
    stage.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  const canvas = $('#heroFx');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w, h, nodes = [], run = true;
    const mouse = { x: -9999, y: -9999 };
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.floor((w * h) / 22000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        r: Math.random() * 1.6 + .5,
      }));
    };
    resize();
    addEventListener('resize', resize);
    canvas.parentElement.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    const frame = () => {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(39, 0, 238, ${(1 - d / 130) * .18})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(39, 0, 238, .45)';
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced) requestAnimationFrame(frame);
    };
    if (!reduced) frame();
  }

  const bootCommon = () => {
    $('#chat')?.classList.add('is-live');
  };

  if (!hasGsap || reduced) {
    document.documentElement.classList.add('no-anim');
    $('#loader')?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
    bootCommon();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');

  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const loader = $('#loader');
  const bar = $('#loaderBar');
  const num = $('#loaderNum');
  const loaderTl = gsap.timeline({
    onComplete: () => {
      loader?.classList.add('is-done');
      document.body.classList.remove('is-loading');
      intro();
    },
  });
  loaderTl.to({ n: 0 }, {
    n: 100, duration: 1.1, ease: 'power2.inOut',
    onUpdate() {
      const n = Math.round(this.targets()[0].n);
      if (bar) bar.style.width = n + '%';
      if (num) num.textContent = String(n).padStart(2, '0');
    },
  });

  function split(el) {
    const html = el.innerHTML;
    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    const walk = (node, frag) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const outer = document.createElement('span');
            outer.style.display = 'inline-block';
            outer.style.overflow = 'hidden';
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
    const lines = $$('.hero__title .line span');
    gsap.from(lines, { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: .08 });
    gsap.from('[data-rise]', { y: 24, opacity: 0, duration: .8, ease: 'power3.out', stagger: .06, delay: .25 });
    gsap.from('.stage__tilt > *', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .2 });
    bootCommon();
    if (window.gsap) {
      const bubbles = $$('#chat .bubble, #chat .chat__btns');
      gsap.from(bubbles, { opacity: 0, y: 10, duration: .45, stagger: .18, delay: .8 });
    }
  }

  $$('[data-split]').forEach((el) => {
    const words = split(el);
    gsap.from(words, {
      yPercent: 120, duration: .9, ease: 'power4.out', stagger: .03,
      scrollTrigger: { trigger: el, start: 'top 84%' },
    });
  });

  $$('[data-rise]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      y: 28, opacity: 0, duration: .75, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  const statement = $('#statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('#statement .w');
    ScrollTrigger.create({
      trigger: statement,
      start: 'top 75%',
      end: 'bottom 45%',
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
      },
    });
  }

  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const obj = { n: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(obj, {
        n: end, duration: 1.4, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.n); },
      }),
    });
  });
})();
