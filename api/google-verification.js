const BODY = 'google-site-verification: google6989cc14b2e2335d.html\n';

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.status(200).send(BODY);
};
