# King Kong Lab

Новий лендінг IT-агентства [King Kong Lab](https://kingkonglab.com): сайти, Telegram-боти, Mini Apps, трафік і UI/UX під ключ.

Чистий HTML + CSS + JS, без збірки.

## Запуск

```bash
python3 -m http.server 8080
```

Відкрити http://localhost:8080

## Деплой

Сайт на Vercel (статика + `api/lead` для заявок у Telegram).

У Vercel → Project → Settings → Environment Variables:

- `TELEGRAM_BOT_TOKEN` — токен бота від @BotFather
- `TELEGRAM_CHAT_ID` — `7955450438` (куди приходять заявки)

Локально: скопіюй `.env.example` у `.env`, заповни значення, запускай `npx vercel dev` (чисті URL без `.html` працюють лише через Vercel, не через `python -m http.server`).

GitHub Pages: лише статика, форма заявок без `/api/lead` не працюватиме.

Додатково: `404.html`, `site.webmanifest`, кеш і security-заголовки в `vercel.json`, редирект `kingkonglab.com` → `www`.
