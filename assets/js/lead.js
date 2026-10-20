(() => {
  'use strict';

  const MAX = { name: 80, phone: 24, message: 2000 };

  const formatPhone = (raw) => {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('380')) d = d.slice(3);
    else if (d.startsWith('80')) d = d.slice(2);
    else if (d.startsWith('0')) d = d.slice(1);
    d = d.slice(0, 9);
    let out = '+380';
    if (d.length) out += ' ' + d.slice(0, 2);
    if (d.length > 2) out += ' ' + d.slice(2, 5);
    if (d.length > 5) out += ' ' + d.slice(5, 7);
    if (d.length > 7) out += ' ' + d.slice(7, 9);
    return out;
  };

  const collect = (form) => {
    const phoneEl = form.querySelector('#fPhone') || form.elements.phone;
    const checked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
    let service = form.dataset.service || checked('service').join(', ');
    if (!service) service = 'Головна';
    const pack = checked('pack').join(', ') || '—';
    return {
      name: (form.elements.name?.value || '').trim().slice(0, MAX.name),
      phone: (phoneEl?.value || '').trim().slice(0, MAX.phone),
      message: (form.elements.message?.value || '').trim().slice(0, MAX.message),
      service,
      pack,
      page: location.pathname + location.hash,
      pageTitle: document.title,
      company: (form.elements.company?.value || '').trim(),
    };
  };

  window.kkInitLeadForm = (form) => {
    if (!form || form.dataset.kkLeadReady) return;
    form.dataset.kkLeadReady = '1';
    const phoneEl = form.querySelector('#fPhone') || form.elements.phone;
    const nameEl = form.elements.name;
    const msgEl = form.elements.message;
    nameEl?.setAttribute('maxlength', String(MAX.name));
    msgEl?.setAttribute('maxlength', String(MAX.message));
    phoneEl?.setAttribute('maxlength', String(MAX.phone));
    phoneEl?.setAttribute('inputmode', 'tel');
    phoneEl?.setAttribute('autocomplete', 'tel');
    nameEl?.setAttribute('autocomplete', 'name');
    phoneEl?.addEventListener('focus', () => {
      if (!phoneEl.value.trim()) phoneEl.value = '+380 ';
    });
    phoneEl?.addEventListener('input', () => {
      const cur = phoneEl.value;
      phoneEl.value = formatPhone(cur);
    });
  };

  window.kkSubmitLead = async (form) => {
    const body = collect(form);
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl && setTimeout(() => ctrl.abort(), 15000);
    let res;
    try {
      res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl?.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok || !data.ok) {
      const err = new Error(data.error || 'send_failed');
      err.code = data.error;
      throw err;
    }
    return data;
  };
})();
