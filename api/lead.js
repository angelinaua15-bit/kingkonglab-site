const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const MAX = { name: 80, phone: 80, message: 2000, service: 120, pack: 120, page: 200, pageTitle: 160 };

const isValidPartnerContact = (raw) => {
  const c = String(raw || '').trim();
  if (c.length < 3) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return true;
  if (c.replace(/\D/g, '').length >= 10) return true;
  if (/t\.me\//i.test(c)) return true;
  if (/^@?[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(c)) return true;
  return c.length >= 5;
};
const hits = new Map();
const RATE = { windowMs: 60_000, max: 8 };

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const list = ['https://www.kingkonglab.com', 'https://kingkonglab.com'];
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) list.push(`https://${host.replace(/^https?:\/\//, '')}`);
  }
  if (list.includes(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol === 'https:' && hostname.endsWith('.vercel.app')) return true;
  } catch { /* ignore */ }
  return false;
};

const rateKey = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || 'unknown';
};

const rateLimit = (key) => {
  const now = Date.now();
  const row = hits.get(key) || { n: 0, t: now };
  if (now - row.t > RATE.windowMs) {
    row.n = 0;
    row.t = now;
  }
  row.n += 1;
  hits.set(key, row);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (now - v.t > RATE.windowMs) hits.delete(k);
    }
  }
  return row.n <= RATE.max;
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const origin = req.headers.origin || '';
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  if (!rateLimit(rateKey(req))) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  let data = req.body;
  if (!data || typeof data === 'string') {
    try { data = JSON.parse(data || '{}'); } catch { return res.status(400).json({ ok: false, error: 'invalid_json' }); }
  }

  if (data.kk_hp || data.company) return res.status(200).json({ ok: true });

  const name = String(data.name || '').trim().slice(0, MAX.name);
  const phone = String(data.phone || data.contact || '').trim().slice(0, MAX.phone);
  const message = String(data.message || '').trim().slice(0, MAX.message);
  const service = String(data.service || '—').trim().slice(0, MAX.service) || '—';
  const pack = String(data.pack || '—').trim().slice(0, MAX.pack) || '—';
  const page = String(data.page || '—').trim().slice(0, MAX.page) || '—';
  const pageTitle = String(data.pageTitle || '—').trim().slice(0, MAX.pageTitle) || '—';
  const isPartner = data.type === 'partner' || /партнер/i.test(service);

  if (name.length < 2) {
    return res.status(400).json({ ok: false, error: 'validation' });
  }
  if (isPartner) {
    if (!isValidPartnerContact(phone)) {
      return res.status(400).json({ ok: false, error: 'validation' });
    }
  } else if (phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ ok: false, error: 'validation' });
  }

  const text = isPartner
    ? [
      '<b>Партнерська заявка</b>',
      '',
      `<b>Імʼя:</b> ${esc(name)}`,
      `<b>Контакт:</b> ${esc(phone)}`,
      `<b>Напрям:</b> ${esc(pack)}`,
      `<b>Сторінка:</b> ${esc(page)}`,
      `<b>Заголовок:</b> ${esc(pageTitle)}`,
      '',
      '<b>Коментар:</b>',
      esc(message || '—'),
    ].join('\n')
    : [
      '<b>Нова заявка з сайту</b>',
      '',
      `<b>Імʼя:</b> ${esc(name)}`,
      `<b>Телефон:</b> ${esc(phone)}`,
      `<b>Послуга:</b> ${esc(service)}`,
      `<b>Формат:</b> ${esc(pack)}`,
      `<b>Сторінка:</b> ${esc(page)}`,
      `<b>Заголовок:</b> ${esc(pageTitle)}`,
      '',
      '<b>Задача:</b>',
      esc(message || '—'),
    ].join('\n');

  const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const payload = await tg.json().catch(() => ({}));
  if (!tg.ok || !payload.ok) {
    console.error('telegram_error', payload);
    return res.status(502).json({ ok: false, error: 'telegram_failed' });
  }

  return res.status(200).json({ ok: true });
};
