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
    const step = Number(feed.dataset.count) || 6;
    const addPost = (id) => {
      const box = document.createElement('div');
      box.className = 'post';
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://telegram.org/js/telegram-widget.js?22';
      sc.dataset.telegramPost = `${channel}/${id}`;
      sc.dataset.width = '100%';
      sc.dataset.userpic = 'false';
      sc.dataset.color = '2700EE';
      box.appendChild(sc);
      feed.appendChild(box);
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
      feed.children[before]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
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
        el.style.transform = `translate(${dx * .16}px, ${dy * .2}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    addEventListener('pointermove', (e) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    });
  }

  const kong = $('#kong');
  if (kong && !reduced) {
    const fire = () => {
      kong.classList.remove('is-hot');
      void kong.offsetWidth;
      kong.classList.add('is-hot');
    };
    if (fine) {
      kong.addEventListener('pointermove', (e) => {
        const r = kong.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        kong.style.setProperty('--rx', `${(-y * 16).toFixed(2)}deg`);
        kong.style.setProperty('--ry', `${(x * 20).toFixed(2)}deg`);
        kong.style.setProperty('--tx', `${(x * 14).toFixed(1)}px`);
        kong.style.setProperty('--ty', `${(y * 14).toFixed(1)}px`);
      });
      kong.addEventListener('pointerleave', () => {
        kong.style.setProperty('--rx', '0deg');
        kong.style.setProperty('--ry', '0deg');
        kong.style.setProperty('--tx', '0px');
        kong.style.setProperty('--ty', '0px');
      });
    }
    kong.addEventListener('click', fire);
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
  }

  const loader = $('#loader');
  const bar = $('#loaderBar');
  gsap.to({ n: 0 }, {
    n: 100, duration: .7, ease: 'power2.inOut',
    onUpdate() {
      if (bar) bar.style.width = Math.round(this.targets()[0].n) + '%';
    },
    onComplete() {
      loader?.classList.add('is-done');
      document.body.classList.remove('is-loading');
      intro();
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
    gsap.from('.banner__title .line span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .08 });
    gsap.from('.banner [data-rise], .banner__off', { y: 20, opacity: 0, duration: .75, ease: 'power3.out', stagger: .05, delay: .15 });
    gsap.from('.kong', { scale: .86, opacity: 0, duration: 1, ease: 'power3.out', delay: .15 });
  }

  $$('[data-split]').forEach((el) => {
    const words = split(el);
    gsap.from(words, {
      yPercent: 120, duration: .85, ease: 'power4.out', stagger: .03,
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  $$('[data-rise]').forEach((el) => {
    if (el.closest('.banner')) return;
    gsap.from(el, {
      y: 22, opacity: 0, duration: .7, ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 94%', once: true },
    });
  });

  // «Про нас»: текст і факти випливають справа наліво
  gsap.from('#about .statement', { x: 120, opacity: 0, duration: 1.1, ease: 'power3.out', immediateRender: false, scrollTrigger: { trigger: '#about', start: 'top 80%', once: true } });
  gsap.from('.facts', { x: '35%', opacity: 0, duration: 1.3, ease: 'power3.out', immediateRender: false, scrollTrigger: { trigger: '.facts', start: 'top 92%', once: true } });

  const statement = $('#statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('#statement .w');
    ScrollTrigger.create({
      trigger: statement,
      start: 'top 78%',
      end: 'bottom 48%',
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
      },
    });
  }
})();
