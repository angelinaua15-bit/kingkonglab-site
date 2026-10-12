(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ---------- i18n: UA (в HTML) / EN ---------- */
  const EN = {
    'nav.services': 'Services', 'nav.work': 'Portfolio', 'nav.approach': 'Approach', 'nav.stories': 'Stories',
    'nav.news': 'News', 'nav.contact': 'Contact', 'nav.cta': 'Discuss a project',
    'hero.tag': '−30% on your first project', 'hero.t1': 'Websites, bots', 'hero.t2': 'and Mini Apps', 'hero.t3': 'that sell',
    'hero.lead': 'We take on complex tasks and assemble website, bot, traffic and analytics into one system that brings clients.',
    'hero.cta1': 'Discuss a project', 'hero.cta2': 'See our work', 'hero.badge': 'projects launched',
    'svc.eyebrow': 'Services', 'svc.title': 'What we <em>do</em>',
    'svc.1': 'Websites', 'svc.1p': 'Landing pages, corporate, SEO', 'svc.1price': 'from $300',
    'svc.2': 'Bots & Mini Apps', 'svc.2p': 'Sales and service in Telegram', 'svc.2price': 'from $200',
    'svc.3': 'Traffic', 'svc.3p': 'Ads that bring leads', 'svc.3price': 'from $500',
    'svc.4': 'Design / UX', 'svc.4p': 'Style that converts', 'svc.4price': 'from $600',
    'about.eyebrow': 'About us', 'about.line': 'A small team that <em>delivers results</em> — from idea to first leads.',
    'about.f1': 'projects', 'about.f2': 'years of experience', 'about.f3': 'response time', 'about.f4': 'working languages',
    'about.f5': 'clients', 'about.f6': 'on request',
    'work.eyebrow': 'Portfolio', 'work.title': 'Live <em>projects</em>', 'work.all': 'All', 'work.web': 'Websites',
    'work.tWeb': 'Website', 'work.tBot': 'Telegram bot', 'work.users': 'active users', 'work.shop': 'catalog · cart · payment',
    'work.p1': 'Corporate website with 3D and animations.', 'work.p2': 'The agency flagship: style and UX.',
    'work.p3': 'Nutritionist bot: meal plans and client support.', 'work.p4': 'A full store inside Telegram.',
    'ap.eyebrow': 'How we work', 'ap.title': 'Complex projects are <em>our territory</em>',
    'ap.lead': 'CRM and payment integrations, bots with thousands of users, stores inside Telegram. We don’t start with design — we start with how money should flow from click to payment.',
    'ap.trickLabel': 'Our signature', 'ap.trick': 'A system, not a page. Website, bot, ads and analytics work as one loop — and you see where every client came from.',
    'ap.s1': 'Audit', 'ap.s1p': 'Numbers, funnel, where leads get lost. Scope and price are fixed before we start.',
    'ap.s2': 'Prototype', 'ap.s2p': 'Logic and screens before design. Big projects are split into stages with separate launches.',
    'ap.s3': 'Build & test', 'ap.s3p': 'Integrations, payments, load. You see progress at every stage.',
    'ap.s4': 'Launch & growth', 'ap.s4p': 'Analytics from day one, traffic and improvements to a live system.',
    'st.eyebrow': 'Stories', 'st.title': 'How it <em>really went</em>',
    'st.1tag': 'Telegram bot · nutrition', 'st.1h': 'Consultations that didn’t scale',
    'st.1p': 'The nutritionist handled clients manually in private messages. We moved meal plans and support into a bot — it grew to 5000+ active users without growing the team.',
    'st.2tag': 'Mini App · e-commerce', 'st.2h': 'A store where the buyers already are',
    'st.2p': 'The audience lived in Telegram, but sales went through chats. We built a Mini App with catalog, cart and payment — buyers order without leaving the messenger.',
    'st.3tag': 'Website + SEO · education', 'st.3h': 'An English school with no ad budget',
    'st.3p': 'They needed leads without constant ad spend. We built a search-optimised site with analytics — now 20–35 leads a month come from organic search.',
    'news.eyebrow': 'Content feed', 'news.title': 'News of the <em>future</em>', 'news.sub': 'Follow on Telegram',
    'news.lead': 'Tech, AI and digital novelties — fresh posts from our Telegram channel (in Ukrainian).', 'news.more': 'Show more',
    'faq.title': 'Short and <em>to the point</em>',
    'faq.q1': 'How much does a project cost?', 'faq.a1': 'Websites from $300, bots from $200. The exact price is fixed after the brief, before we start.',
    'faq.q2': 'How long does a launch take?', 'faq.a2': 'A landing page — from 10 days. A website + bot + analytics system — 3–6 weeks.',
    'faq.q3': 'How do payments work?', 'faq.a3': 'In full or by stages. Scope is fixed upfront, no surprises at the end.',
    'faq.q4': 'Do you work under NDA?', 'faq.a4': 'Yes. We publish a case only with your consent.',
    'ct.title': 'Shall we discuss <em>your project?</em>', 'ct.lead': 'We reply within 24 hours. Your first project is 30% off.',
    'ct.name': 'Your name', 'ct.phone': 'Phone or Telegram', 'ct.send': 'Send',
    'ct.note': 'By sending, you agree to the', 'ct.policy': 'privacy policy',
    'foot.privacy': 'Privacy policy',
    'pv.title': 'Privacy <em>policy</em>',
    'pv.1': 'We use the data you leave on the site (name, phone or Telegram) only to contact you about our services.',
    'pv.2': 'We don’t share it with third parties. The site may use cookies to work properly.',
    'pv.3': 'Questions about your data:', 'pv.back': '← Back to home',
    'msg.invalid': 'Please enter your name and a phone or Telegram', 'msg.ok': 'Request prepared — send the email',
  };
  const UA = { 'msg.invalid': 'Вкажіть ім\'я та телефон або Telegram', 'msg.ok': 'Заявку сформовано — надішліть лист' };
  const nodes = $$('[data-i18n], [data-i18n-html]');
  nodes.forEach((el) => {
    if (el.dataset.i18n) UA[el.dataset.i18n] = el.textContent;
    else UA[el.dataset.i18nHtml] = el.innerHTML;
  });
  let lang = new URLSearchParams(location.search).get('lang') || store.get('kk-lang') || 'uk';
  if (!['uk', 'en'].includes(lang)) lang = 'uk';
  const t = (k) => (lang === 'en' ? EN[k] : UA[k]) ?? UA[k] ?? k;
  const applyLang = (next, animate) => {
    lang = next;
    document.documentElement.lang = lang;
    store.set('kk-lang', lang);
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const swap = () => nodes.forEach((el) => {
      if (el.dataset.i18n) el.textContent = t(el.dataset.i18n);
      else el.innerHTML = t(el.dataset.i18nHtml);
    });
    if (animate && !reduced) {
      document.body.animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' });
      setTimeout(swap, 140);
    } else swap();
  };
  $$('.lang button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang, true); }));
  if (lang !== 'uk') applyLang(lang, false);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3400);
  };

  /* ---------- header: ховається вниз, з'являється вгору; індикатор активного пункту ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const drawer = $('#drawer');
  const ink = $('.nav__ink');
  const linkBox = $('.nav__links');
  const moveInk = (a) => {
    if (!ink || !linkBox) return;
    if (!a) { ink.style.opacity = '0'; return; }
    ink.style.opacity = '1';
    ink.style.width = a.offsetWidth + 'px';
    ink.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const setDrawer = (on) => {
    drawer?.classList.toggle('is-on', on);
    burger?.classList.toggle('is-on', on);
    burger?.setAttribute('aria-expanded', String(on));
    drawer?.setAttribute('aria-hidden', String(!on));
    document.body.style.overflow = on ? 'hidden' : '';
    nav?.classList.remove('is-hidden');
  };
  burger?.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-on')));
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

  const navLinks = $$('.nav__links a');
  const sections = navLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let lastY = scrollY;
  let current = null;
  const onScroll = () => {
    const y = scrollY;
    if (nav && !drawer?.classList.contains('is-on')) {
      nav.classList.toggle('is-solid', y > 16);
      nav.classList.toggle('is-hidden', y > 320 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    lastY = y;
    let id = null;
    sections.forEach((s) => { if (s.offsetTop <= y + 160) id = s.id; });
    if (id !== current) {
      current = id;
      navLinks.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === `#${id}`));
      moveInk(navLinks.find((a) => a.classList.contains('is-on')));
    }
    const bar = $('#scrollProgress');
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => moveInk(navLinks.find((a) => a.classList.contains('is-on'))));
  navLinks.forEach((a) => {
    a.addEventListener('mouseenter', () => moveInk(a));
    a.addEventListener('mouseleave', () => moveInk(navLinks.find((l) => l.classList.contains('is-on'))));
  });
  onScroll();

  /* ---------- факти «про нас»: безшовна стрічка справа наліво ---------- */
  const track = $('.facts__track');
  if (track) {
    [...track.children].forEach((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('[data-i18n]', c).forEach((el) => nodes.push(el));
      track.appendChild(c);
    });
  }

  /* ---------- портфоліо ---------- */
  $$('.case__shot img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => { if (!img.dataset.failed) { img.dataset.failed = '1'; img.src = img.dataset.fallback; img.style.paddingTop = '0'; } });
  });
  $$('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.filter').forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
      const cat = btn.dataset.filter;
      $$('.case').forEach((card) => card.classList.toggle('is-hidden', cat !== 'all' && card.dataset.cat !== cat));
    });
  });

  /* ---------- FAQ: відкритий лише один ---------- */
  const accs = $$('.acc details');
  accs.forEach((d) => d.addEventListener('toggle', () => { if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; }); }));

  /* ---------- контент-стрічка з Telegram-каналу ---------- */
  const feed = $('#feed');
  const more = $('#feedMore');
  if (feed) {
    const channel = feed.dataset.channel;
    let next = Number(feed.dataset.latest);
    const step = Number(feed.dataset.count) || 6;
    const addPost = (id) => {
      const box = document.createElement('div');
      box.className = 'post is-loading';
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://telegram.org/js/telegram-widget.js?22';
      s.dataset.telegramPost = `${channel}/${id}`;
      s.dataset.width = '100%';
      s.dataset.userpic = 'false';
      s.dataset.color = '1E3BFF';
      box.appendChild(s);
      feed.appendChild(box);
      const done = () => box.classList.remove('is-loading');
      new MutationObserver((m, obs) => {
        const f = box.querySelector('iframe');
        if (f) { f.addEventListener('load', done); setTimeout(done, 4000); obs.disconnect(); }
      }).observe(box, { childList: true, subtree: true });
    };
    const loadBatch = () => {
      for (let i = 0; i < step && next > 0; i += 1) addPost(next--);
      if (next <= 0 && more) more.hidden = true;
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { loadBatch(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(feed);
    more?.addEventListener('click', () => {
      const before = feed.children.length;
      loadBatch();
      feed.children[before]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  }

  /* ---------- форма ---------- */
  const form = $('#leadForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.company.value) return;
    const name = form.name.value.trim();
    const contact = form.phone.value.trim();
    let ok = true;
    [[form.name, name.length >= 2], [form.phone, contact.replace(/[^\w]/g, '').length >= 5]].forEach(([input, valid]) => {
      input.parentElement.classList.toggle('is-error', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { showToast(t('msg.invalid')); return; }
    const body = `Ім'я: ${name}\nКонтакт: ${contact}`;
    location.href = `mailto:kingkonglab2024@gmail.com?subject=${encodeURIComponent('Заявка з сайту — ' + name)}&body=${encodeURIComponent(body)}`;
    showToast(t('msg.ok'));
    form.reset();
  });

  /* ---------- анімації ---------- */
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (!hasGsap || reduced || !$('.hero')) { document.documentElement.classList.add('no-anim'); return; }
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero__title .line > span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .09, delay: .15 });
  gsap.from('.hero [data-rise]', { y: 24, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, delay: .35 });
  gsap.from('.hero__photo', { x: 60, opacity: 0, duration: 1.1, ease: 'power3.out', delay: .25 });
  gsap.to('.hero__photo > img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  $$('[data-split]').forEach((el) => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  $$('[data-rise]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      y: 24, opacity: 0, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
  // «Про нас»: рядок і факти випливають справа наліво
  gsap.from('.about__line', { x: 120, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.about', start: 'top 75%', once: true } });
  gsap.from('.facts', { x: '40%', opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.facts', start: 'top 90%', once: true } });
  // послуги, історії і кейси — з'являються по черзі справа
  ['.services .svc', '.stories .story', '.work .case'].forEach((sel) => {
    const items = $$(sel);
    if (!items.length) return;
    gsap.from(items, {
      x: 50, opacity: 0, duration: .8, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: items[0].parentElement, start: 'top 85%', once: true },
    });
  });
})();
