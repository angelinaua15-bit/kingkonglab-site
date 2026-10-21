/** Google Search Console — exact URL must stay *.html (cleanUrls otherwise 308 → 404). */
const GOOGLE_VERIFY = 'google6989cc14b2e2335d.html';

export const config = {
  matcher: [`/${GOOGLE_VERIFY}`],
};

export default function middleware() {
  return new Response(`google-site-verification: ${GOOGLE_VERIFY}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
